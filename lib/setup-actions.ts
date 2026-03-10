'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import type { TradeSetup, SetupFormData, TradingProfile, TradeFormData } from './types'

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

/** Cached wrapper – varies by profile combination, invalidated via revalidateTag('setups', 'max') */
export async function getCachedSetups(profiles?: TradingProfile[]) {
  const profileKey = profiles ? [...profiles].sort().join(',') : 'all'
  return unstable_cache(
    () => getSetups(profiles),
    ['setups', profileKey],
    { revalidate: 900, tags: ['setups'] }
  )()
}

export async function createSetup(formData: SetupFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').insert([formData])
  if (error) throw new Error(error.message)
  revalidateTag('setups', 'max')
  revalidatePath('/setups')
}

export async function updateSetup(id: string, formData: SetupFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').update(formData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('setups', 'max')
  revalidatePath('/setups')
}

export async function deleteSetup(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('setups', 'max')
  revalidatePath('/setups')
}

// Convert a setup to an active trade
export async function convertSetupToTrade(setupId: string, einstiegspreis: number): Promise<void> {
  const supabase = await createClient()

  // Fetch the setup
  const { data: setup, error: fetchError } = await supabase
    .from('trade_setups')
    .select('*')
    .eq('id', setupId)
    .single()

  if (fetchError || !setup) throw new Error('Setup nicht gefunden')

  // Generate next trade_id
  const { data: lastTrade } = await supabase
    .from('trades')
    .select('trade_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextTradeNum = 1
  if (lastTrade?.trade_id) {
    const match = lastTrade.trade_id.match(/T-(\d+)/)
    if (match) nextTradeNum = parseInt(match[1], 10) + 1
  }
  const tradeId = `T-${nextTradeNum.toString().padStart(4, '0')}`

  // Create the trade from setup data
  const tradeData: TradeFormData = {
    trade_id: tradeId,
    datum_eroeffnung: new Date().toISOString().split('T')[0],
    asset: setup.asset,
    asset_klasse: setup.asset_klasse,
    richtung: setup.richtung,
    einstiegspreis,
    stop_loss: setup.stop_loss,
    tp1: setup.tp1,
    tp2: setup.tp2,
    tp3: setup.tp3,
    tp4: setup.tp4,
    status: 'Aktiv',
    datum_schliessung: null,
    ausstiegspreis: null,
    bemerkungen: setup.bemerkungen,
    profil: setup.profil,
    gewichtung: 1.0,
  }

  const { error: insertError } = await supabase.from('trades').insert([tradeData])
  if (insertError) throw new Error(insertError.message)

  // Update setup status to "Getriggert"
  await supabase
    .from('trade_setups')
    .update({ status: 'Getriggert' })
    .eq('id', setupId)

  revalidateTag('trades', 'max')
  revalidateTag('setups', 'max')
  revalidatePath('/setups')
  revalidatePath('/trades')
  revalidatePath('/performance')
}
