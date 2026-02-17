'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Trade, TradeFormData, TradeWithPerformance, TradingProfile } from './types'

function enrichTrade(trade: Trade): TradeWithPerformance {
  let performance_pct: number | null = null
  let risiko_pct: number | null = null
  let risk_reward: number | null = null

  // Performance - calculate from prices if available, otherwise parse from bemerkungen
  if (trade.ausstiegspreis !== null && trade.ausstiegspreis !== undefined && trade.einstiegspreis !== null && trade.einstiegspreis !== undefined && trade.richtung !== null) {
    const raw =
      trade.richtung === 'LONG'
        ? ((trade.ausstiegspreis - trade.einstiegspreis) / trade.einstiegspreis) * 100
        : ((trade.einstiegspreis - trade.ausstiegspreis) / trade.einstiegspreis) * 100
    performance_pct = Math.round(raw * 100) / 100
  } else if (trade.bemerkungen) {
    // Parse performance from bemerkungen field (format: "Performance: -4,631 %")
    const perfMatch = trade.bemerkungen.match(/Performance:\s*(-?[\d,]+)\s*%/)
    if (perfMatch) {
      const perfStr = perfMatch[1].replace(',', '.')
      const perfValue = parseFloat(perfStr)
      if (!isNaN(perfValue)) {
        performance_pct = Math.round(perfValue * 100) / 100
      }
    }
  }

  // Risk % - only calculate if we have einstiegspreis, stop_loss, and richtung
  if (trade.stop_loss !== null && trade.stop_loss !== undefined && trade.einstiegspreis !== null && trade.einstiegspreis !== undefined && trade.richtung !== null) {
    const rawRisk =
      trade.richtung === 'LONG'
        ? ((trade.einstiegspreis - trade.stop_loss) / trade.einstiegspreis) * 100
        : ((trade.stop_loss - trade.einstiegspreis) / trade.einstiegspreis) * 100
    risiko_pct = Math.round(Math.abs(rawRisk) * 100) / 100

    // Risk/Reward
    const tp = trade.tp1 ?? trade.tp2 ?? trade.tp3 ?? trade.tp4
    if (tp !== null && tp !== undefined && risiko_pct > 0) {
      const rawReward =
        trade.richtung === 'LONG'
          ? ((tp - trade.einstiegspreis) / trade.einstiegspreis) * 100
          : ((trade.einstiegspreis - tp) / trade.einstiegspreis) * 100
      risk_reward = Math.round((Math.abs(rawReward) / risiko_pct) * 100) / 100
    }
  }

  // Holding days
  const start = parseISO(trade.datum_eroeffnung)
  const end = trade.datum_schliessung ? parseISO(trade.datum_schliessung) : new Date()
  const haltedauer_tage = Math.max(0, differenceInCalendarDays(end, start))

  return { ...trade, performance_pct, risiko_pct, risk_reward, haltedauer_tage }
}

export async function getTrades(profiles?: TradingProfile[]): Promise<TradeWithPerformance[]> {
  const supabase = await createClient()
  let query = supabase
    .from('trades')
    .select('*')
    .order('datum_eroeffnung', { ascending: false })

  // Filter by profiles if specified
  if (profiles && profiles.length > 0) {
    query = query.in('profil', profiles)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return ((data as Trade[]) ?? []).map(enrichTrade)
}

export async function createTrade(formData: TradeFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trades').insert([formData])
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/trades')
}

export async function updateTrade(id: string, formData: TradeFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trades').update(formData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/trades')
}

export async function deleteTrade(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trades').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/trades')
}
