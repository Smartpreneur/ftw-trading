'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TradeSetup, SetupFormData, TradingProfile } from './types'

export async function uploadChartImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  if (!file) throw new Error('Keine Datei ausgewählt')

  const supabase = await createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `setups/${fileName}`

  const { error } = await supabase.storage
    .from('chart-images')
    .upload(filePath, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload fehlgeschlagen: ${error.message}`)

  const { data: urlData } = supabase.storage
    .from('chart-images')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function deleteChartImage(url: string): Promise<void> {
  const supabase = await createClient()
  const match = url.match(/chart-images\/(.+)$/)
  if (!match) return
  const { error } = await supabase.storage
    .from('chart-images')
    .remove([match[1]])
  if (error) console.error('Failed to delete image:', error.message)
}

export async function getSetups(profiles?: TradingProfile[]): Promise<TradeSetup[]> {
  const supabase = await createClient()
  let query = supabase
    .from('trade_setups')
    .select('*')
    .order('datum', { ascending: false })

  // Filter by profiles if specified
  if (profiles && profiles.length > 0) {
    query = query.in('profil', profiles)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data as TradeSetup[]) ?? []
}

export async function createSetup(formData: SetupFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').insert([formData])
  if (error) throw new Error(error.message)
  revalidatePath('/setups')
}

export async function updateSetup(id: string, formData: SetupFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').update(formData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/setups')
}

export async function deleteSetup(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/setups')
}
