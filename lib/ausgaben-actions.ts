'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidateTag, unstable_cache } from 'next/cache'

export interface Ausgabe {
  id: string
  nummer: number
  datum: string
  pdf_url: string
  thumbnail_url: string | null
  created_at: string
}

/**
 * Fetches all newsletter issues ordered by date DESC, cached for 1 hour.
 * Cache is invalidated on any admin write via revalidateTag('ausgaben').
 */
export async function getAusgaben(): Promise<Ausgabe[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('ausgaben')
        .select('*')
        .order('datum', { ascending: false })
      if (error) {
        console.error('Error fetching ausgaben:', error)
        return []
      }
      return (data as Ausgabe[]) ?? []
    },
    ['ausgaben', 'all'],
    { revalidate: 3600, tags: ['ausgaben'] }
  )()
}

/**
 * Admin-only: Upload a PDF and create a new newsletter issue.
 * Accepts optional 'thumbnail' (WebP blob) in FormData.
 */
export async function uploadAusgabe(formData: FormData): Promise<Ausgabe> {
  const file = formData.get('file') as File
  if (!file) throw new Error('Keine Datei ausgewählt')

  const datum = formData.get('datum') as string
  if (!datum) throw new Error('Kein Datum angegeben')

  const supabase = createAdminClient()

  const random = Math.random().toString(36).slice(2, 8)

  // Upload PDF to Supabase Storage
  const pdfName = `${datum}-${random}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('ausgaben')
    .upload(pdfName, file, { contentType: 'application/pdf', upsert: false })

  if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`)

  const { data: pdfUrlData } = supabase.storage
    .from('ausgaben')
    .getPublicUrl(pdfName)
  const pdfUrl = pdfUrlData.publicUrl

  // Upload thumbnail if provided
  let thumbnailUrl: string | null = null
  const thumbnail = formData.get('thumbnail') as File | null
  if (thumbnail && thumbnail.size > 0) {
    const thumbName = `thumbnails/${datum}-${random}.webp`
    const { error: thumbError } = await supabase.storage
      .from('ausgaben')
      .upload(thumbName, thumbnail, { contentType: 'image/webp', upsert: false })
    if (!thumbError) {
      const { data: thumbUrlData } = supabase.storage
        .from('ausgaben')
        .getPublicUrl(thumbName)
      thumbnailUrl = thumbUrlData.publicUrl
    }
  }

  // Insert row into ausgaben table
  const { data, error: insertError } = await supabase
    .from('ausgaben')
    .insert([{ datum, pdf_url: pdfUrl, thumbnail_url: thumbnailUrl }])
    .select('*')
    .single()

  if (insertError) {
    // Clean up uploaded files on insert failure
    const filesToRemove = [pdfName]
    if (thumbnailUrl) filesToRemove.push(`thumbnails/${datum}-${random}.webp`)
    await supabase.storage.from('ausgaben').remove(filesToRemove)
    throw new Error(`Speichern fehlgeschlagen: ${insertError.message}`)
  }

  revalidateTag('ausgaben', 'max')
  return data as Ausgabe
}

/**
 * Admin-only: Delete a newsletter issue (PDF + thumbnail + DB).
 */
export async function deleteAusgabe(id: string, pdfUrl: string, thumbnailUrl?: string | null): Promise<void> {
  const supabase = createAdminClient()

  const filesToRemove: string[] = []

  // Extract PDF path from URL
  const pdfMatch = pdfUrl.match(/ausgaben\/(.+)$/)
  if (pdfMatch) filesToRemove.push(pdfMatch[1])

  // Extract thumbnail path from URL
  if (thumbnailUrl) {
    const thumbMatch = thumbnailUrl.match(/ausgaben\/(.+)$/)
    if (thumbMatch) filesToRemove.push(thumbMatch[1])
  }

  if (filesToRemove.length > 0) {
    const { error } = await supabase.storage.from('ausgaben').remove(filesToRemove)
    if (error) console.error('Failed to delete files:', error.message)
  }

  // Delete DB row
  const { error: deleteError } = await supabase
    .from('ausgaben')
    .delete()
    .eq('id', id)

  if (deleteError) throw new Error(`Löschen fehlgeschlagen: ${deleteError.message}`)

  revalidateTag('ausgaben', 'max')
}
