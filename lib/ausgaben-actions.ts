'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidateTag, unstable_cache } from 'next/cache'

export interface Ausgabe {
  id: string
  nummer: number
  datum: string
  pdf_url: string
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
 */
export async function uploadAusgabe(formData: FormData): Promise<Ausgabe> {
  const file = formData.get('file') as File
  if (!file) throw new Error('Keine Datei ausgewählt')

  const datum = formData.get('datum') as string
  if (!datum) throw new Error('Kein Datum angegeben')

  const supabase = createAdminClient()

  // Upload PDF to Supabase Storage
  const random = Math.random().toString(36).slice(2, 8)
  const fileName = `${datum}-${random}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('ausgaben')
    .upload(fileName, file, { contentType: 'application/pdf', upsert: false })

  if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`)

  const { data: urlData } = supabase.storage
    .from('ausgaben')
    .getPublicUrl(fileName)

  const pdfUrl = urlData.publicUrl

  // Insert row into ausgaben table
  const { data, error: insertError } = await supabase
    .from('ausgaben')
    .insert([{ datum, pdf_url: pdfUrl }])
    .select('*')
    .single()

  if (insertError) {
    // Clean up uploaded file on insert failure
    await supabase.storage.from('ausgaben').remove([fileName])
    throw new Error(`Speichern fehlgeschlagen: ${insertError.message}`)
  }

  revalidateTag('ausgaben', 'max')
  return data as Ausgabe
}

/**
 * Admin-only: Delete a newsletter issue (storage + DB).
 */
export async function deleteAusgabe(id: string, pdfUrl: string): Promise<void> {
  const supabase = createAdminClient()

  // Extract file path from URL
  const match = pdfUrl.match(/ausgaben\/(.+)$/)
  if (match) {
    const { error } = await supabase.storage
      .from('ausgaben')
      .remove([match[1]])
    if (error) console.error('Failed to delete PDF:', error.message)
  }

  // Delete DB row
  const { error: deleteError } = await supabase
    .from('ausgaben')
    .delete()
    .eq('id', id)

  if (deleteError) throw new Error(`Löschen fehlgeschlagen: ${deleteError.message}`)

  revalidateTag('ausgaben', 'max')
}
