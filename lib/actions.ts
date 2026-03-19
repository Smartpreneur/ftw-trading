'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Trade, TradeClose, TradeCloseFormData, TradeFormData, TradeNote, TradeWithPerformance, TradingProfile } from './types'

function enrichTrade(trade: Trade): TradeWithPerformance {
  let performance_pct: number | null = null
  let risiko_pct: number | null = null
  let risk_reward: number | null = null

  const closes: TradeClose[] = trade.closes ?? []

  // Performance — priority: 1) trade_closes, 2) DB column, 3) legacy ausstiegspreis, 4) bemerkungen
  const closesWithData = closes.filter(
    c => c.ausstiegspreis != null && c.anteil != null
  )
  if (closesWithData.length > 0 && trade.einstiegspreis != null && trade.richtung != null) {
    const totalAnteil = closesWithData.reduce((s, c) => s + c.anteil!, 0)
    const weighted = closesWithData.reduce((sum, c) => {
      const perf =
        trade.richtung === 'LONG'
          ? ((c.ausstiegspreis! - trade.einstiegspreis!) / trade.einstiegspreis!) * 100
          : ((trade.einstiegspreis! - c.ausstiegspreis!) / trade.einstiegspreis!) * 100
      return sum + perf * c.anteil!
    }, 0)
    performance_pct = totalAnteil > 0
      ? Math.round((weighted / totalAnteil) * 100) / 100
      : null
  } else if (trade.performance_pct != null) {
    // Stored value in DB (backfilled from bemerkungen or previous calculations)
    performance_pct = trade.performance_pct
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
  // For active trades, don't show a close date — partial closes are visible in Teilschließungen view
  const isActive = trade.status === 'Aktiv'
  const effectiveCloseDatum = isActive
    ? null
    : closes.length > 0
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
  // For active trades, don't show an exit price — partial closes are visible in Teilschließungen view
  let effective_ausstiegspreis: number | null = isActive ? null : trade.ausstiegspreis
  if (!isActive && closesWithData.length > 0 && trade.einstiegspreis != null) {
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
  const supabase = createAdminClient()
  let query = supabase
    .from('trades')
    .select('*, closes:trade_closes(*), notes:trade_notes(*), entries:trade_entries(*)')
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
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('trades')
        .select('*, closes:trade_closes(*), notes:trade_notes(*), entries:trade_entries(*)')
        .order('datum_eroeffnung', { ascending: false })
      if (error) throw new Error(error.message)
      return ((data as Trade[]) ?? []).map(enrichTrade)
    },
    ['trades', 'all'],
    { revalidate: 86400, tags: ['trades'] }
  )()
}

export async function createTrade(formData: TradeFormData): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('trades').insert([formData]).select('id').single()
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidateTag('prices', 'max')
  revalidatePath('/')
  revalidatePath('/performance')
  revalidatePath('/trades')
  revalidatePath('/setups')
  return data.id
}

export async function updateTrade(id: string, formData: Partial<TradeFormData>): Promise<void> {
  const supabase = createAdminClient()

  // Track previous TP/SL values when levels change
  const tpSlFields = ['tp1', 'tp2', 'tp3', 'tp4', 'stop_loss'] as const
  const hasTpSlUpdate = tpSlFields.some((f) => f in formData)

  if (hasTpSlUpdate) {
    const { data: current } = await supabase
      .from('trades')
      .select('tp1, tp2, tp3, tp4, stop_loss')
      .eq('id', id)
      .single()

    if (current) {
      const vorher: Record<string, number | null> = {}
      for (const field of tpSlFields) {
        if (!(field in formData)) continue
        const oldVal = current[field] ?? null
        const newVal = (formData as Record<string, unknown>)[field] ?? null
        if (oldVal !== newVal && oldVal !== null) {
          vorher[`${field}_vorher`] = oldVal
        }
      }
      if (Object.keys(vorher).length > 0) {
        Object.assign(formData, vorher)
      }
    }
  }

  const { error } = await supabase.from('trades').update(formData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidateTag('prices', 'max')
  revalidatePath('/')
  revalidatePath('/performance')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

export async function deleteTrade(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('trades').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidateTag('prices', 'max')
  revalidatePath('/')
  revalidatePath('/performance')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

// ── Trade Close CRUD ────────────────────────────────────────────

/** Recalculate and persist performance_pct on the parent trade after close changes */
async function recalcTradePerformance(tradeId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: trade } = await supabase
    .from('trades')
    .select('einstiegspreis, richtung')
    .eq('id', tradeId)
    .single()
  if (!trade?.einstiegspreis || !trade?.richtung) return

  const { data: closes } = await supabase
    .from('trade_closes')
    .select('ausstiegspreis, anteil')
    .eq('trade_fk', tradeId)
  const valid = (closes ?? []).filter(c => c.ausstiegspreis != null && c.anteil != null)
  if (valid.length === 0) return

  const totalAnteil = valid.reduce((s, c) => s + c.anteil!, 0)
  const weighted = valid.reduce((sum, c) => {
    const perf =
      trade.richtung === 'LONG'
        ? ((c.ausstiegspreis! - trade.einstiegspreis!) / trade.einstiegspreis!) * 100
        : ((trade.einstiegspreis! - c.ausstiegspreis!) / trade.einstiegspreis!) * 100
    return sum + perf * c.anteil!
  }, 0)
  const avgPerf = totalAnteil > 0 ? Math.round((weighted / totalAnteil) * 100) / 100 : null

  await supabase
    .from('trades')
    .update({ performance_pct: avgPerf })
    .eq('id', tradeId)
}

export async function createTradeClose(data: TradeCloseFormData): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('trade_closes').insert([data])
  if (error) throw new Error(error.message)
  await recalcTradePerformance(data.trade_fk)
  revalidateTag('trades', 'max')
  revalidateTag('prices', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
}

export async function updateTradeClose(
  closeId: string,
  data: Partial<TradeCloseFormData>
): Promise<void> {
  const supabase = createAdminClient()
  // Get trade_fk before update
  const { data: existing } = await supabase
    .from('trade_closes')
    .select('trade_fk')
    .eq('id', closeId)
    .single()
  const { error } = await supabase.from('trade_closes').update(data).eq('id', closeId)
  if (error) throw new Error(error.message)
  if (existing?.trade_fk) await recalcTradePerformance(existing.trade_fk)
  revalidateTag('trades', 'max')
  revalidateTag('prices', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
}

export async function deleteTradeClose(closeId: string): Promise<void> {
  const supabase = createAdminClient()
  // Get trade_fk before delete
  const { data: existing } = await supabase
    .from('trade_closes')
    .select('trade_fk')
    .eq('id', closeId)
    .single()
  const { error } = await supabase.from('trade_closes').delete().eq('id', closeId)
  if (error) throw new Error(error.message)
  if (existing?.trade_fk) await recalcTradePerformance(existing.trade_fk)
  revalidateTag('trades', 'max')
  revalidateTag('prices', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
}

// ── Trade Notes CRUD ────────────────────────────────────────────

export async function createTradeNote(data: { trade_fk: string; datum: string; text: string }): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('trade_notes').insert([data])
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
}

export async function deleteTradeNote(noteId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('trade_notes').delete().eq('id', noteId)
  if (error) throw new Error(error.message)
  revalidateTag('trades', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
}

// ── Trade Entries CRUD ──────────────────────────────────────────

/** Recalculate the blended einstiegspreis from triggered entries */
async function recalcBlendedEinstiegspreis(tradeId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: entries } = await supabase
    .from('trade_entries')
    .select('preis, anteil, erreicht_am')
    .eq('trade_fk', tradeId)

  const triggered = (entries ?? []).filter(e => e.erreicht_am != null)
  if (triggered.length === 0) return

  const totalAnteil = triggered.reduce((s, e) => s + e.anteil, 0)
  if (totalAnteil <= 0) return

  const blended = triggered.reduce((s, e) => s + e.preis * (e.anteil / totalAnteil), 0)
  await supabase
    .from('trades')
    .update({ einstiegspreis: Math.round(blended * 100000) / 100000 })
    .eq('id', tradeId)

  await recalcTradePerformance(tradeId)
}

export async function createTradeEntry(data: import('./types').TradeEntryFormData): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('trade_entries').insert([data])
  if (error) throw new Error(error.message)
  await recalcBlendedEinstiegspreis(data.trade_fk)
  revalidateTag('trades', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

export async function updateTradeEntry(entryId: string, data: Partial<import('./types').TradeEntryFormData>): Promise<void> {
  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('trade_entries')
    .select('trade_fk')
    .eq('id', entryId)
    .single()
  const { error } = await supabase.from('trade_entries').update(data).eq('id', entryId)
  if (error) throw new Error(error.message)
  if (existing?.trade_fk) await recalcBlendedEinstiegspreis(existing.trade_fk)
  revalidateTag('trades', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

export async function deleteTradeEntry(entryId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('trade_entries')
    .select('trade_fk')
    .eq('id', entryId)
    .single()
  const { error } = await supabase.from('trade_entries').delete().eq('id', entryId)
  if (error) throw new Error(error.message)
  if (existing?.trade_fk) await recalcBlendedEinstiegspreis(existing.trade_fk)
  revalidateTag('trades', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

/** Bulk-save entries for a trade: deletes existing, inserts new ones */
export async function saveTradeEntries(tradeFk: string, entries: Array<{ preis: number; anteil: number }>): Promise<void> {
  const supabase = createAdminClient()
  // Delete existing entries
  const { error: delError } = await supabase.from('trade_entries').delete().eq('trade_fk', tradeFk)
  if (delError) {
    console.error('Error deleting trade entries:', delError)
    throw new Error(`Fehler beim Löschen der Einstiegspunkte: ${delError.message}`)
  }
  // Insert new ones
  if (entries.length > 0) {
    const rows = entries.map((e, i) => ({
      trade_fk: tradeFk,
      nummer: i + 1,
      preis: e.preis,
      anteil: e.anteil,
    }))
    const { error } = await supabase.from('trade_entries').insert(rows)
    if (error) {
      console.error('Error inserting trade entries:', error)
      throw new Error(`Fehler beim Speichern der Einstiegspunkte: ${error.message}`)
    }
  }
  // Recalc blended price if any entries are already triggered
  await recalcBlendedEinstiegspreis(tradeFk)
  revalidateTag('trades', 'max')
  revalidatePath('/performance')
  revalidatePath('/trades')
  revalidatePath('/setups')
}

// ── Chart Image Storage ────────────────────────────────────────

export async function uploadChartImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  if (!file) throw new Error('Keine Datei ausgewählt')

  const supabase = createAdminClient()
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

// ── Page view tracking (referrer monitoring for iframe embeds) ──

export async function trackPageView(path: string, referrer: string | null, sessionId: string | null = null): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('page_views').insert({
      path,
      referrer: referrer || null,
      session_id: sessionId || null,
    })
  } catch {
    // Non-critical — never block page rendering
  }
}

export async function deleteChartImage(url: string): Promise<void> {
  const supabase = createAdminClient()
  const match = url.match(/chart-images\/(.+)$/)
  if (!match) return
  const { error } = await supabase.storage
    .from('chart-images')
    .remove([match[1]])
  if (error) console.error('Failed to delete image:', error.message)
}
