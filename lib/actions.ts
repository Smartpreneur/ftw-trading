'use server'

import { createClient, createCacheClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Trade, TradeClose, TradeCloseFormData, TradeFormData, TradeNote, TradeWithPerformance, TradingProfile } from './types'

function enrichTrade(trade: Trade): TradeWithPerformance {
  let performance_pct: number | null = null
  let risiko_pct: number | null = null
  let risk_reward: number | null = null

  const closes: TradeClose[] = trade.closes ?? []

  // Performance — prefer calculated from trade_closes
  const closesWithData = closes.filter(
    c => c.ausstiegspreis != null && c.anteil != null
  )
  if (closesWithData.length > 0 && trade.einstiegspreis != null && trade.richtung != null) {
    const weighted = closesWithData.reduce((sum, c) => {
      const perf =
        trade.richtung === 'LONG'
          ? ((c.ausstiegspreis! - trade.einstiegspreis!) / trade.einstiegspreis!) * 100
          : ((trade.einstiegspreis! - c.ausstiegspreis!) / trade.einstiegspreis!) * 100
      return sum + perf * c.anteil!
    }, 0)
    performance_pct = Math.round(weighted * 100) / 100
  } else if (trade.ausstiegspreis != null && trade.einstiegspreis != null && trade.richtung != null) {
    // Fallback: legacy ausstiegspreis column (pre-migration data)
    const raw =
      trade.richtung === 'LONG'
        ? ((trade.ausstiegspreis - trade.einstiegspreis) / trade.einstiegspreis) * 100
        : ((trade.einstiegspreis - trade.ausstiegspreis) / trade.einstiegspreis) * 100
    performance_pct = Math.round(raw * 100) / 100
  } else if (trade.bemerkungen) {
    // Last resort: parse from bemerkungen text
    const perfMatch = trade.bemerkungen.match(/Performance:\s*([+-]?[\d,]+)\s*%/)
    if (perfMatch) {
      const perfValue = parseFloat(perfMatch[1].replace(',', '.'))
      if (!isNaN(perfValue)) {
        performance_pct = Math.round(perfValue * 100) / 100
      }
    }
  }

  // Risk % — only calculate if we have einstiegspreis, stop_loss, and richtung
  if (
    trade.stop_loss != null &&
    trade.einstiegspreis != null &&
    trade.richtung != null
  ) {
    const rawRisk =
      trade.richtung === 'LONG'
        ? ((trade.einstiegspreis - trade.stop_loss) / trade.einstiegspreis) * 100
        : ((trade.stop_loss - trade.einstiegspreis) / trade.einstiegspreis) * 100
    risiko_pct = Math.round(Math.abs(rawRisk) * 100) / 100

    // Risk/Reward
    const tp = trade.tp1 ?? trade.tp2 ?? trade.tp3 ?? trade.tp4
    if (tp != null && risiko_pct > 0) {
      const rawReward =
        trade.richtung === 'LONG'
          ? ((tp - trade.einstiegspreis) / trade.einstiegspreis) * 100
          : ((trade.einstiegspreis - tp) / trade.einstiegspreis) * 100
      risk_reward = Math.round((Math.abs(rawReward) / risiko_pct) * 100) / 100
    }
  }

  // Effective close date: use latest close datum, fall back to datum_schliessung
  const effectiveCloseDatum =
    closes.length > 0
      ? closes.reduce((latest, c) => (c.datum > latest ? c.datum : latest), closes[0].datum)
      : trade.datum_schliessung

  // Holding days — closed same-day trades count as 1 day
  const start = parseISO(trade.datum_eroeffnung)
  const end = effectiveCloseDatum ? parseISO(effectiveCloseDatum) : new Date()
  const diffDays = differenceInCalendarDays(end, start)
  const haltedauer_tage = effectiveCloseDatum
    ? Math.max(1, diffDays)
    : Math.max(0, diffDays)

  // Effective exit price: weighted avg of closes (for display), else legacy ausstiegspreis
  let effective_ausstiegspreis: number | null = trade.ausstiegspreis
  if (closesWithData.length > 0 && trade.einstiegspreis != null) {
    const totalAnteil = closesWithData.reduce((s, c) => s + c.anteil!, 0)
    if (totalAnteil > 0) {
      effective_ausstiegspreis = closesWithData.reduce(
        (s, c) => s + c.ausstiegspreis! * (c.anteil! / totalAnteil), 0
      )
      effective_ausstiegspreis = Math.round(effective_ausstiegspreis * 100000) / 100000
    }
  }

  return {
    ...trade,
    performance_pct,
    risiko_pct,
    risk_reward,
    haltedauer_tage,
    effective_datum_schliessung: effectiveCloseDatum ?? null,
    effective_ausstiegspreis,
  }
}

export async function getTrades(profiles?: TradingProfile[]): Promise<TradeWithPerformance[]> {
  const supabase = await createClient()
  let query = supabase
    .from('trades')
    .select('*, closes:trade_closes(*), notes:trade_notes(*)')
    .order('datum_eroeffnung', { ascending: false })

  if (profiles && profiles.length > 0) {
    query = query.in('profil', profiles)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return ((data as Trade[]) ?? []).map(enrichTrade)
}

/**
 * Fetches ALL trades once (with closes) and caches for 24 hours.
 * Cache is invalidated on any admin write via revalidateTag('trades').
 */
export async function getCachedTrades() {
  return unstable_cache(
    async () => {
      const supabase = createCacheClient()
      const { data, error } = await supabase
        .from('trades')
        .select('*, closes:trade_closes(*), notes:trade_notes(*)')
        .order('datum_eroeffnung', { ascending: false })
      if (error) throw new Error(error.message)
      return ((data as Trade[]) ?? []).map(enrichTrade)
    },
    ['trades', 'all'],
    { revalidate: 86400, tags: ['trades'] }
  )()
}

export async function createTrade(formData: TradeFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trades').insert([formData])
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

export async function updateTrade(id: string, formData: Partial<TradeFormData>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trades').update(formData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

export async function deleteTrade(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trades').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

// ── Trade Close CRUD ────────────────────────────────────────────

export async function createTradeClose(data: TradeCloseFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_closes').insert([data])
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/trades')
}

export async function updateTradeClose(
  closeId: string,
  data: Partial<TradeCloseFormData>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_closes').update(data).eq('id', closeId)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/trades')
}

export async function deleteTradeClose(closeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_closes').delete().eq('id', closeId)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/trades')
}

// ── Trade Notes CRUD ────────────────────────────────────────────

export async function createTradeNote(data: { trade_fk: string; datum: string; text: string }): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_notes').insert([data])
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/trades')
}

export async function deleteTradeNote(noteId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_notes').delete().eq('id', noteId)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/trades')
}

// ── Chart Image Storage ────────────────────────────────────────

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
