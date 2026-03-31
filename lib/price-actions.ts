'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidateTag, unstable_cache } from 'next/cache'
import { getApiSymbol } from './asset-mapping'
import type { ActiveTradePrice, TradeDirection } from './types'

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || ''
const PRICE_CACHE_MINUTES = 15 // Only update if older than 15 minutes
const OHLC_LOOKBACK_DAYS = 14 // How many days back to check for TP/SL hits


/** Calculate weighted performance from all closes of a trade */
async function calcPerformanceFromCloses(
  supabase: ReturnType<typeof createAdminClient>,
  tradeId: string,
  einstiegspreis: number | null,
  richtung: TradeDirection | null
): Promise<number | null> {
  if (!einstiegspreis || !richtung) return null
  const { data: closes } = await supabase
    .from('trade_closes')
    .select('ausstiegspreis, anteil')
    .eq('trade_fk', tradeId)
  const valid = (closes ?? []).filter(c => c.ausstiegspreis != null && c.anteil != null)
  if (valid.length === 0) return null
  const totalAnteil = valid.reduce((s, c) => s + c.anteil!, 0)
  if (totalAnteil <= 0) return null
  const weighted = valid.reduce((sum, c) => {
    const perf =
      richtung === 'LONG'
        ? ((c.ausstiegspreis! - einstiegspreis) / einstiegspreis) * 100
        : ((einstiegspreis - c.ausstiegspreis!) / einstiegspreis) * 100
    return sum + perf * c.anteil!
  }, 0)
  return Math.round((weighted / totalAnteil) * 100) / 100
}

interface DailyOHLC {
  date: string // "2026-03-03"
  high: number
  low: number
}

interface IntradayCandle {
  timestamp: number // Unix seconds
  high: number
  low: number
}

// ── Current price fetchers ──────────────────────────────────────

interface PriceResult {
  price: number | null
  currency: string | null
}

// Fetch price from Twelve Data API
async function fetchTwelveDataPrice(symbol: string): Promise<PriceResult> {
  if (!TWELVE_DATA_API_KEY) {
    console.warn('TWELVE_DATA_API_KEY not configured')
    return { price: null, currency: null }
  }

  try {
    const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.price) {
      return { price: parseFloat(data.price), currency: 'USD' }
    }
    return { price: null, currency: null }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return { price: null, currency: null }
  }
}

// Fetch price from CoinGecko API (free, no key needed)
async function fetchCoinGeckoPrice(coinId: string): Promise<PriceResult> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    const response = await fetch(url)
    const data = await response.json()

    if (data[coinId]?.usd) {
      return { price: data[coinId].usd, currency: 'USD' }
    }
    return { price: null, currency: null }
  } catch (error) {
    console.error(`Error fetching price for ${coinId}:`, error)
    return { price: null, currency: null }
  }
}

// Fetch price from Yahoo Finance API (free, no key needed)
async function fetchYahooFinancePrice(symbol: string): Promise<PriceResult> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    const response = await fetch(url)
    const data = await response.json()

    const meta = data?.chart?.result?.[0]?.meta
    const price = meta?.regularMarketPrice
    const currency = meta?.currency ?? null
    if (price && typeof price === 'number') {
      return { price, currency }
    }
    return { price: null, currency: null }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return { price: null, currency: null }
  }
}

// ── Daily OHLC fetchers (for historical TP/SL detection) ──────

async function fetchYahooFinanceOHLC(symbol: string, days: number = OHLC_LOOKBACK_DAYS): Promise<DailyOHLC[]> {
  try {
    const period2 = Math.floor(Date.now() / 1000)
    const period1 = period2 - days * 24 * 60 * 60
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${period1}&period2=${period2}`
    const response = await fetch(url)
    const data = await response.json()

    const result = data?.chart?.result?.[0]
    if (!result?.timestamp) return []

    const timestamps: number[] = result.timestamp
    const highs: (number | null)[] = result.indicators?.quote?.[0]?.high || []
    const lows: (number | null)[] = result.indicators?.quote?.[0]?.low || []

    const ohlc: DailyOHLC[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (highs[i] != null && lows[i] != null) {
        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
        ohlc.push({ date, high: highs[i]!, low: lows[i]! })
      }
    }

    return ohlc.sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error(`Error fetching Yahoo OHLC for ${symbol}:`, error)
    return []
  }
}

async function fetchTwelveDataOHLC(symbol: string, days: number = OHLC_LOOKBACK_DAYS): Promise<DailyOHLC[]> {
  if (!TWELVE_DATA_API_KEY) return []
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${days}&apikey=${TWELVE_DATA_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.values || !Array.isArray(data.values)) return []

    return data.values
      .map((v: { datetime: string; high: string; low: string }) => ({
        date: v.datetime.split(' ')[0],
        high: parseFloat(v.high),
        low: parseFloat(v.low),
      }))
      .filter((d: DailyOHLC) => !isNaN(d.high) && !isNaN(d.low))
      .sort((a: DailyOHLC, b: DailyOHLC) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error(`Error fetching Twelve Data OHLC for ${symbol}:`, error)
    return []
  }
}

async function fetchCoinGeckoOHLC(coinId: string, days: number = OHLC_LOOKBACK_DAYS): Promise<DailyOHLC[]> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
    const response = await fetch(url)
    const data = await response.json()

    if (!Array.isArray(data)) return []

    // CoinGecko OHLC returns [timestamp, open, high, low, close] arrays
    // Group by date to get daily high/low
    const byDate: Record<string, { high: number; low: number }> = {}
    for (const candle of data) {
      const [ts, , high, low] = candle as [number, number, number, number, number]
      const date = new Date(ts).toISOString().split('T')[0]
      if (!byDate[date]) {
        byDate[date] = { high, low }
      } else {
        byDate[date].high = Math.max(byDate[date].high, high)
        byDate[date].low = Math.min(byDate[date].low, low)
      }
    }

    return Object.entries(byDate)
      .map(([date, { high, low }]) => ({ date, high, low }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error(`Error fetching CoinGecko OHLC for ${coinId}:`, error)
    return []
  }
}

// Fetch OHLC data based on API type
// ── Intraday candles for same-day TP/SL detection ──────
// Only used on the reference day (trade creation or TP/SL modification day)
// to determine if TP/SL was hit AFTER the trade was created/modified.

async function fetchYahooIntradayCandles(symbol: string): Promise<IntradayCandle[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=15m&range=1d`
    const response = await fetch(url)
    const data = await response.json()

    const result = data?.chart?.result?.[0]
    if (!result?.timestamp) return []

    const timestamps: number[] = result.timestamp
    const highs: (number | null)[] = result.indicators?.quote?.[0]?.high || []
    const lows: (number | null)[] = result.indicators?.quote?.[0]?.low || []

    const candles: IntradayCandle[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (highs[i] != null && lows[i] != null) {
        candles.push({ timestamp: timestamps[i], high: highs[i]!, low: lows[i]! })
      }
    }
    return candles.sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error(`Error fetching Yahoo intraday for ${symbol}:`, error)
    return []
  }
}

async function fetchTwelveDataIntradayCandles(symbol: string): Promise<IntradayCandle[]> {
  if (!TWELVE_DATA_API_KEY) return []
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=15min&outputsize=30&apikey=${TWELVE_DATA_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.values || !Array.isArray(data.values)) return []

    return data.values
      .map((v: { datetime: string; high: string; low: string }) => ({
        timestamp: Math.floor(new Date(v.datetime).getTime() / 1000),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
      }))
      .filter((c: IntradayCandle) => !isNaN(c.high) && !isNaN(c.low))
      .sort((a: IntradayCandle, b: IntradayCandle) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error(`Error fetching Twelve Data intraday for ${symbol}:`, error)
    return []
  }
}

async function fetchCoinGeckoIntradayCandles(coinId: string): Promise<IntradayCandle[]> {
  try {
    // CoinGecko with days=1 returns 30-min OHLC candles
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=1`
    const response = await fetch(url)
    const data = await response.json()

    if (!Array.isArray(data)) return []

    return data
      .map((c: [number, number, number, number, number]) => ({
        timestamp: Math.floor(c[0] / 1000),
        high: c[2],
        low: c[3],
      }))
      .sort((a: IntradayCandle, b: IntradayCandle) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error(`Error fetching CoinGecko intraday for ${coinId}:`, error)
    return []
  }
}

async function fetchIntradayCandles(mapping: { api: string; type: 'twelve' | 'coingecko' | 'yahoo' }): Promise<IntradayCandle[]> {
  if (mapping.type === 'yahoo') return fetchYahooIntradayCandles(mapping.api)
  if (mapping.type === 'twelve') return fetchTwelveDataIntradayCandles(mapping.api)
  if (mapping.type === 'coingecko') return fetchCoinGeckoIntradayCandles(mapping.api)
  return []
}

// Calculate high/low from intraday candles that occurred AFTER a given timestamp
function getIntradayHighLowAfter(
  candles: IntradayCandle[],
  afterTimestamp: number
): { high: number; low: number } | null {
  const filtered = candles.filter(c => c.timestamp > afterTimestamp)
  if (filtered.length === 0) return null

  return {
    high: Math.max(...filtered.map(c => c.high)),
    low: Math.min(...filtered.map(c => c.low)),
  }
}

async function fetchOHLCData(mapping: { api: string; type: 'twelve' | 'coingecko' | 'yahoo' }): Promise<DailyOHLC[]> {
  if (mapping.type === 'yahoo') return fetchYahooFinanceOHLC(mapping.api)
  if (mapping.type === 'twelve') return fetchTwelveDataOHLC(mapping.api)
  if (mapping.type === 'coingecko') return fetchCoinGeckoOHLC(mapping.api)
  return []
}

// Get or update price for a single asset
export async function updateAssetPrice(tradeId: string, asset: string): Promise<number | null> {
  const supabase = createAdminClient()

  // Get API symbol mapping
  const mapping = getApiSymbol(asset)
  if (!mapping) {
    console.warn(`No API mapping found for asset: ${asset}`)
    return null
  }

  // Fetch price from appropriate API
  let result: PriceResult = { price: null, currency: null }
  if (mapping.type === 'twelve') {
    result = await fetchTwelveDataPrice(mapping.api)
  } else if (mapping.type === 'coingecko') {
    result = await fetchCoinGeckoPrice(mapping.api)
  } else if (mapping.type === 'yahoo') {
    result = await fetchYahooFinancePrice(mapping.api)
  }

  if (result.price === null) {
    return null
  }

  // Update or insert into database
  const { error } = await supabase
    .from('active_trade_prices')
    .upsert({
      trade_id: tradeId,
      asset: asset,
      current_price: result.price,
      ...(result.currency ? { currency: result.currency } : {}),
    }, {
      onConflict: 'trade_id',
    })

  if (error) {
    console.error('Error updating price in database:', error)
    return null
  }

  // Also store currency on the trade itself for display after closing
  if (result.currency) {
    await supabase.from('trades').update({ currency: result.currency }).eq('id', tradeId)
  }

  return result.price
}

// Check TP/SL levels using daily High/Low data with historical lookback.
// Finds the FIRST day a level was breached and records that date.
//
// Reference-date logic:
// - For days AFTER the reference date: use daily OHLC high/low directly.
// - For the reference day itself (creation or TP/SL modification day):
//   fetch 15-min intraday candles and only check candles AFTER the exact
//   time of creation/modification. This prevents false triggers from price
//   movements that happened BEFORE the trade was set up.
// - If no intraday data is available, fall back to the live current price.
async function checkAndUpdateTPSL(
  trade: {
    id: string
    richtung: TradeDirection | null
    datum_eroeffnung: string
    created_at: string
    einstiegspreis: number | null
    tp1: number | null
    tp2: number | null
    tp3: number | null
    tp4: number | null
    stop_loss: number | null
    tp1_erreicht_am: string | null
    tp2_erreicht_am: string | null
    tp3_erreicht_am: string | null
    tp4_erreicht_am: string | null
    sl_erreicht_am: string | null
    tp_sl_geaendert_am: string | null
    tp1_gewichtung: number | null
    tp2_gewichtung: number | null
    tp3_gewichtung: number | null
    tp4_gewichtung: number | null
    asset?: string
  },
  ohlcData: DailyOHLC[],
  currentPrice?: number
): Promise<boolean> {
  if (!trade.richtung || ohlcData.length === 0) return false

  // Determine the reference date and full timestamp
  const referenceTimestamp = trade.tp_sl_geaendert_am ?? trade.created_at
  const referenceDate = referenceTimestamp.split('T')[0]
  const referenceUnix = Math.floor(new Date(referenceTimestamp).getTime() / 1000)
  const openDate = trade.datum_eroeffnung.split('T')[0]
  const createdDate = trade.created_at.split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const updates: Record<string, string> = {}

  // For the reference day (if it's today), fetch intraday candles to get
  // accurate high/low AFTER the trade creation/modification time
  let intradayHighLow: { high: number; low: number } | null = null
  const referenceDayNeedsIntraday = ohlcData.some(d => d.date === referenceDate)

  if (referenceDayNeedsIntraday && referenceDate === today && trade.asset) {
    const mapping = getApiSymbol(trade.asset)
    if (mapping) {
      const candles = await fetchIntradayCandles(mapping)
      intradayHighLow = getIntradayHighLowAfter(candles, referenceUnix)
    }
  }

  // Track which TPs are newly hit (for auto-close creation)
  const newlyHitTPs: { typ: 'TP1' | 'TP2' | 'TP3' | 'TP4'; level: number; datum: string; gewichtung: number | null; nummer: number }[] = []

  // Walk through each day chronologically to find the FIRST hit date
  for (const day of ohlcData) {
    // Skip days before the trade was opened
    if (day.date < openDate) continue

    // Determine if this day needs special handling
    const isReferenceDay = day.date <= referenceDate
    const isCreationDay = day.date === createdDate && createdDate > openDate

    if (isReferenceDay || isCreationDay) {
      // For the reference/creation day: only proceed if we have intraday data
      // or a live current price to check against
      if (day.date === today && intradayHighLow) {
        // Use intraday high/low filtered to AFTER the reference time — this is the most accurate
      } else if (day.date === today && currentPrice != null) {
        // Fallback: use live price (less accurate, misses intraday spikes)
      } else {
        // Historical reference day with no intraday data — skip entirely
        continue
      }
    }

    // Use 16:00 UTC as approximate market close time for the timestamp
    const hitTimestamp = `${day.date}T16:00:00+00:00`

    // Determine effective high/low for this day
    let effectiveHigh: number
    let effectiveLow: number

    if ((isReferenceDay || isCreationDay) && day.date === today && intradayHighLow) {
      // Best case: intraday data after the reference timestamp
      effectiveHigh = intradayHighLow.high
      effectiveLow = intradayHighLow.low
    } else if ((isReferenceDay || isCreationDay) && day.date === today && currentPrice != null) {
      // Fallback: only the current live price (can miss intermediate spikes)
      effectiveHigh = currentPrice
      effectiveLow = currentPrice
    } else {
      // Normal day: use full daily OHLC
      effectiveHigh = day.high
      effectiveLow = day.low
    }

    // Check TPs: LONG → high >= TP, SHORT → low <= TP
    const tpChecks = [
      { key: 'tp1_erreicht_am', typ: 'TP1' as const, level: trade.tp1, alreadyHit: trade.tp1_erreicht_am, gewichtung: trade.tp1_gewichtung, nummer: 1 },
      { key: 'tp2_erreicht_am', typ: 'TP2' as const, level: trade.tp2, alreadyHit: trade.tp2_erreicht_am, gewichtung: trade.tp2_gewichtung, nummer: 2 },
      { key: 'tp3_erreicht_am', typ: 'TP3' as const, level: trade.tp3, alreadyHit: trade.tp3_erreicht_am, gewichtung: trade.tp3_gewichtung, nummer: 3 },
      { key: 'tp4_erreicht_am', typ: 'TP4' as const, level: trade.tp4, alreadyHit: trade.tp4_erreicht_am, gewichtung: trade.tp4_gewichtung, nummer: 4 },
    ]

    for (const tp of tpChecks) {
      if (!tp.level || tp.alreadyHit || updates[tp.key]) continue

      const hit = trade.richtung === 'LONG'
        ? effectiveHigh >= tp.level
        : effectiveLow <= tp.level

      if (hit) {
        updates[tp.key] = hitTimestamp
        newlyHitTPs.push({ typ: tp.typ, level: tp.level, datum: day.date, gewichtung: tp.gewichtung, nummer: tp.nummer })
      }
    }

    // Check SL: LONG → low <= SL, SHORT → high >= SL
    if (trade.stop_loss && !trade.sl_erreicht_am && !updates.sl_erreicht_am) {
      const slHit = trade.richtung === 'LONG'
        ? effectiveLow <= trade.stop_loss
        : effectiveHigh >= trade.stop_loss

      if (slHit) {
        updates.sl_erreicht_am = hitTimestamp
      }
    }
  }

  // Only write to DB if something changed
  if (Object.keys(updates).length === 0) return false

  const supabase = createAdminClient()

  // Update TP/SL timestamps on trade
  await supabase
    .from('trades')
    .update(updates)
    .eq('id', trade.id)

  // Auto-create trade_close entries for newly hit TPs.
  // Uses insert with conflict handling — the unique partial index
  // (trade_fk, typ) WHERE typ IN ('TP1','TP2','TP3','TP4','SL')
  // prevents duplicates even under concurrent requests.
  for (const tp of newlyHitTPs) {
    const { error: insertErr } = await supabase
      .from('trade_closes')
      .insert({
        trade_fk: trade.id,
        nummer: tp.nummer,
        typ: tp.typ,
        datum: tp.datum,
        ausstiegspreis: tp.level,
        anteil: tp.gewichtung ?? 0.25,
      })

    // Ignore unique constraint violation (concurrent request already inserted)
    if (insertErr && !insertErr.code?.startsWith('23505')) {
      console.error(`Error inserting ${tp.typ} close for trade ${trade.id}:`, insertErr)
    }
  }

  // Determine if SL was hit (newly or already)
  const slHit = !!(trade.sl_erreicht_am || updates.sl_erreicht_am)

  // Determine if ALL defined TPs have been hit (combining existing + new hits)
  const definedTPs = [
    { level: trade.tp1, hit: !!(trade.tp1_erreicht_am || updates.tp1_erreicht_am) },
    { level: trade.tp2, hit: !!(trade.tp2_erreicht_am || updates.tp2_erreicht_am) },
    { level: trade.tp3, hit: !!(trade.tp3_erreicht_am || updates.tp3_erreicht_am) },
    { level: trade.tp4, hit: !!(trade.tp4_erreicht_am || updates.tp4_erreicht_am) },
  ].filter(tp => tp.level !== null)

  const allTPsHit = definedTPs.length > 0 && definedTPs.every(tp => tp.hit)

  // Auto-close trade when all TPs hit or SL hit
  if (allTPsHit || slHit) {
    // Find the latest hit date for datum_schliessung
    const hitDates: string[] = []
    for (const key of ['tp1_erreicht_am', 'tp2_erreicht_am', 'tp3_erreicht_am', 'tp4_erreicht_am', 'sl_erreicht_am']) {
      const val = updates[key] || (trade as Record<string, unknown>)[key]
      if (typeof val === 'string') hitDates.push(val.split('T')[0])
    }
    const latestDate = hitDates.sort().pop() ?? new Date().toISOString().split('T')[0]

    if (slHit) {
      // SL hit → close as Ausgestoppt, create SL close entry if not exists
      // Calculate remaining anteil: 1 - sum of existing TP closes
      const { data: existingCloses } = await supabase
        .from('trade_closes')
        .select('anteil, typ')
        .eq('trade_fk', trade.id)

      const hasSL = (existingCloses ?? []).some(c => c.typ === 'SL')
      if (!hasSL) {
        const usedAnteil = (existingCloses ?? []).reduce((sum, c) => sum + (c.anteil ?? 0), 0)
        const remainingAnteil = Math.max(0, 1 - usedAnteil)

        if (remainingAnteil > 0) {
          const { error: slErr } = await supabase
            .from('trade_closes')
            .insert({
              trade_fk: trade.id,
              typ: 'SL',
              datum: latestDate,
              ausstiegspreis: trade.stop_loss,
              anteil: parseFloat(remainingAnteil.toFixed(4)),
            })

          // Ignore unique constraint violation (concurrent request already inserted)
          if (slErr && !slErr.code?.startsWith('23505')) {
            console.error(`Error inserting SL close for trade ${trade.id}:`, slErr)
          }
        }
      }

      // Recalculate performance from all closes and persist
      const perfPct = await calcPerformanceFromCloses(supabase, trade.id, trade.einstiegspreis, trade.richtung)
      await supabase
        .from('trades')
        .update({ status: 'Ausgestoppt', datum_schliessung: latestDate, performance_pct: perfPct })
        .eq('id', trade.id)
    } else if (allTPsHit) {
      // All TPs hit → close as Geschlossen
      const perfPct = await calcPerformanceFromCloses(supabase, trade.id, trade.einstiegspreis, trade.richtung)
      await supabase
        .from('trades')
        .update({ status: 'Geschlossen', datum_schliessung: latestDate, performance_pct: perfPct })
        .eq('id', trade.id)
    }
  }

  return true
}

// Check entry-point levels: detect when planned entry prices are reached.
// Mirrors the TP/SL detection logic including intraday candle checks.
// Each entry uses its own created_at as the reference timestamp, so entries
// added to an existing trade are only triggered by price moves AFTER they were created.
async function checkAndUpdateEntries(
  trade: {
    id: string
    richtung: 'LONG' | 'SHORT' | null
    datum_eroeffnung: string
    created_at: string
    status: string
    asset?: string
  },
  entries: Array<{ id: string; nummer: number; preis: number; anteil: number; erreicht_am: string | null; created_at?: string }>,
  ohlcData: DailyOHLC[],
  currentPrice?: number
): Promise<boolean> {
  if (!trade.richtung || ohlcData.length === 0) return false

  const pending = entries.filter(e => !e.erreicht_am)
  if (pending.length === 0) return false

  const openDate = trade.datum_eroeffnung.split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const supabase = createAdminClient()
  let changed = false

  // Pre-fetch intraday candles once if any pending entry was created today
  let intradayCandles: IntradayCandle[] | null = null
  const needsIntraday = pending.some(e => {
    const entryCreatedDate = (e.created_at ?? trade.created_at).split('T')[0]
    return entryCreatedDate === today
  })
  if (needsIntraday && trade.asset) {
    const mapping = getApiSymbol(trade.asset)
    if (mapping) {
      intradayCandles = await fetchIntradayCandles(mapping)
    }
  }

  for (const entry of pending) {
    if (entry.erreicht_am) continue

    // Each entry has its own reference date (when it was created)
    const entryRefTimestamp = entry.created_at ?? trade.created_at
    const entryRefDate = entryRefTimestamp.split('T')[0]
    const entryRefUnix = Math.floor(new Date(entryRefTimestamp).getTime() / 1000)

    for (const day of ohlcData) {
      if (day.date < openDate) continue
      if (day.date <= openDate) continue // skip trade opening day itself

      // Determine if this day is the entry's reference day (creation day)
      const isEntryRefDay = day.date <= entryRefDate

      if (isEntryRefDay) {
        // For the entry's creation day: only proceed with intraday data or live price
        if (day.date === today && intradayCandles && intradayCandles.length > 0) {
          // Use intraday candles filtered to AFTER entry creation
        } else if (day.date === today && currentPrice != null) {
          // Fallback: use live price
        } else {
          // Historical reference day with no intraday data — skip
          continue
        }
      }

      // Determine effective high/low
      let effectiveHigh: number
      let effectiveLow: number

      if (isEntryRefDay && day.date === today && intradayCandles && intradayCandles.length > 0) {
        const filtered = getIntradayHighLowAfter(intradayCandles, entryRefUnix)
        if (!filtered) continue // no candles after entry creation
        effectiveHigh = filtered.high
        effectiveLow = filtered.low
      } else if (isEntryRefDay && day.date === today && currentPrice != null) {
        effectiveHigh = currentPrice
        effectiveLow = currentPrice
      } else {
        effectiveHigh = day.high
        effectiveLow = day.low
      }

      // LONG: buy triggered when price dips to or below entry level
      // SHORT: sell triggered when price rises to or above entry level
      const hit = trade.richtung === 'LONG'
        ? effectiveLow <= entry.preis
        : effectiveHigh >= entry.preis

      if (hit) {
        const hitTimestamp = `${day.date}T16:00:00+00:00`
        await supabase
          .from('trade_entries')
          .update({ erreicht_am: hitTimestamp, datum: day.date })
          .eq('id', entry.id)

        entry.erreicht_am = hitTimestamp
        changed = true
        break // entry is hit, move to next entry
      }
    }
  }

  if (!changed) return false

  // Recalculate blended einstiegspreis from triggered entries
  const triggered = entries.filter(e => e.erreicht_am)
  const totalAnteil = triggered.reduce((s, e) => s + e.anteil, 0)
  if (totalAnteil > 0) {
    const blended = triggered.reduce((s, e) => s + e.preis * (e.anteil / totalAnteil), 0)
    await supabase
      .from('trades')
      .update({ einstiegspreis: Math.round(blended * 100000) / 100000 })
      .eq('id', trade.id)

    // Recalc performance from closes
    const perfPct = await calcPerformanceFromCloses(supabase, trade.id,
      Math.round(blended * 100000) / 100000, trade.richtung)
    if (perfPct !== null) {
      await supabase.from('trades').update({ performance_pct: perfPct }).eq('id', trade.id)
    }
  }

  return true
}

// Update all active trade prices + check TP/SL levels using daily High/Low
export async function updateAllActiveTradePrices(): Promise<{ updated: number; errors: number; failedAssets: string[] }> {
  const supabase = createAdminClient()

  // Get active trades only — Entwurf trades are NOT monitored
  const { data: activeTrades, error: tradesError } = await supabase
    .from('trades')
    .select('id, asset, status, datum_eroeffnung, created_at, einstiegspreis, richtung, tp1, tp2, tp3, tp4, stop_loss, tp1_erreicht_am, tp2_erreicht_am, tp3_erreicht_am, tp4_erreicht_am, sl_erreicht_am, tp_sl_geaendert_am, tp1_gewichtung, tp2_gewichtung, tp3_gewichtung, tp4_gewichtung, manuell_getrackt, entries:trade_entries(id, nummer, preis, anteil, erreicht_am, created_at)')
    .eq('status', 'Aktiv')

  if (tradesError || !activeTrades) {
    console.error('Error fetching active trades:', tradesError)
    return { updated: 0, errors: 0, failedAssets: [] }
  }

  let updated = 0
  let errors = 0
  let tpSlChanged = false
  const failedAssets: string[] = []

  // Group trades by asset to avoid duplicate API calls
  const byAsset = new Map<string, typeof activeTrades>()
  for (const trade of activeTrades) {
    const list = byAsset.get(trade.asset) || []
    list.push(trade)
    byAsset.set(trade.asset, list)
  }

  for (const [asset, assetTrades] of byAsset) {
    const mapping = getApiSymbol(asset)
    if (!mapping) {
      console.warn(`No API mapping for asset: "${asset}"`)
      errors += assetTrades.length
      if (!failedAssets.includes(asset)) failedAssets.push(asset)
      continue
    }

    // Fetch current price (for display in active trades table)
    let priceResult: PriceResult = { price: null, currency: null }
    if (mapping.type === 'twelve') {
      priceResult = await fetchTwelveDataPrice(mapping.api)
    } else if (mapping.type === 'coingecko') {
      priceResult = await fetchCoinGeckoPrice(mapping.api)
    } else if (mapping.type === 'yahoo') {
      priceResult = await fetchYahooFinancePrice(mapping.api)
    }

    const price = priceResult.price
    const currency = priceResult.currency

    if (price === null) {
      console.warn(`Price fetch failed for asset: "${asset}" (api: ${mapping.api}, type: ${mapping.type})`)
    }

    // Fetch daily OHLC history for TP/SL detection
    const ohlcData = await fetchOHLCData(mapping)

    for (const trade of assetTrades) {
      const tradeEntries = (trade as any).entries ?? []

      // Check entry-point triggers for active trades with entries
      if (!trade.manuell_getrackt && tradeEntries.length > 0 && ohlcData.length > 0) {
        const entryChanged = await checkAndUpdateEntries(trade, tradeEntries, ohlcData, price ?? undefined)
        if (entryChanged) tpSlChanged = true
      }

      if (price !== null) {
        // Update current price in DB
        const { error: upsertError } = await supabase
          .from('active_trade_prices')
          .upsert({
            trade_id: trade.id,
            asset: trade.asset,
            current_price: price,
            ...(currency ? { currency } : {}),
          }, { onConflict: 'trade_id' })
        if (upsertError) {
          console.error(`DB upsert failed for ${asset}:`, upsertError)
          errors++
          if (!failedAssets.includes(asset)) failedAssets.push(`${asset} (DB-Fehler)`)
        } else {
          updated++
          // Store currency on trade for display after closing
          if (currency) {
            await supabase.from('trades').update({ currency }).eq('id', trade.id)
          }
        }
      } else {
        errors++
        if (!failedAssets.includes(asset)) failedAssets.push(asset)
      }

      // Check TP/SL with daily High/Low data (skip manually tracked, only for active trades)
      if (!trade.manuell_getrackt && ohlcData.length > 0) {
        const changed = await checkAndUpdateTPSL(trade, ohlcData, price ?? undefined)
        if (changed) tpSlChanged = true
      }
    }

    // Delay between different assets to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Invalidate caches after update
  if (updated > 0) {
    revalidateTag('prices', 'max')
  }
  if (tpSlChanged) {
    revalidateTag('trades', 'max')
  }

  return { updated, errors, failedAssets }
}

/**
 * Immediately fetches price + runs TP/SL detection for a single active trade.
 * Called right after creating or activating a trade so the price shows up instantly.
 */
export async function refreshActiveTrade(tradeId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: trade } = await supabase
    .from('trades')
    .select('id, asset, status, datum_eroeffnung, created_at, einstiegspreis, richtung, tp1, tp2, tp3, tp4, stop_loss, tp1_erreicht_am, tp2_erreicht_am, tp3_erreicht_am, tp4_erreicht_am, sl_erreicht_am, tp_sl_geaendert_am, tp1_gewichtung, tp2_gewichtung, tp3_gewichtung, tp4_gewichtung, manuell_getrackt, entries:trade_entries(id, nummer, preis, anteil, erreicht_am, created_at)')
    .eq('id', tradeId)
    .eq('status', 'Aktiv')
    .single()

  if (!trade) return

  const mapping = getApiSymbol(trade.asset)
  if (!mapping) {
    console.warn(`refreshActiveTrade: no API mapping for asset "${trade.asset}"`)
    return
  }

  // Fetch current price
  let priceResult: PriceResult = { price: null, currency: null }
  if (mapping.type === 'twelve') priceResult = await fetchTwelveDataPrice(mapping.api)
  else if (mapping.type === 'coingecko') priceResult = await fetchCoinGeckoPrice(mapping.api)
  else if (mapping.type === 'yahoo') priceResult = await fetchYahooFinancePrice(mapping.api)

  const { price, currency } = priceResult

  if (price !== null) {
    await supabase.from('active_trade_prices').upsert({
      trade_id: trade.id,
      asset: trade.asset,
      current_price: price,
      ...(currency ? { currency } : {}),
    }, { onConflict: 'trade_id' })
    if (currency) {
      await supabase.from('trades').update({ currency }).eq('id', trade.id)
    }
    revalidateTag('prices', 'max')
  }

  // Run TP/SL + entry detection with OHLC history
  if (!trade.manuell_getrackt) {
    const ohlcData = await fetchOHLCData(mapping)
    if (ohlcData.length > 0) {
      // For retroactively entered trades (opening date is before creation date),
      // override created_at with datum_eroeffnung so the TP/SL check scans OHLC data
      // from the actual opening day — not just from today.
      // Without this, checkAndUpdateTPSL treats all days up to created_at as the
      // "reference period" and skips them, missing any hits between open and now.
      const openDateStr = trade.datum_eroeffnung.split('T')[0]
      const createdDateStr = trade.created_at.split('T')[0]
      const isRetroactive = openDateStr < createdDateStr
      const tradeForCheck = isRetroactive
        ? { ...trade, created_at: trade.datum_eroeffnung + 'T00:00:00.000Z', tp_sl_geaendert_am: null }
        : trade

      const tradeEntries = (trade as any).entries ?? []
      if (tradeEntries.length > 0) {
        await checkAndUpdateEntries(tradeForCheck as typeof trade, tradeEntries, ohlcData, price ?? undefined)
      }
      const changed = await checkAndUpdateTPSL(tradeForCheck as typeof trade, ohlcData, price ?? undefined)
      if (changed) revalidateTag('trades', 'max')
    }
  }
}

// Get current prices for active trades (only fetch if cache is stale)
export async function getActiveTradePrices(): Promise<ActiveTradePrice[]> {
  const supabase = createAdminClient()

  // Check if we need to update prices (if any are older than PRICE_CACHE_MINUTES)
  const cacheThreshold = new Date(Date.now() - PRICE_CACHE_MINUTES * 60 * 1000).toISOString()

  const { data: stalePrices } = await supabase
    .from('active_trade_prices')
    .select('id')
    .lt('updated_at', cacheThreshold)
    .limit(1)

  // If we have stale prices, update all
  if (stalePrices && stalePrices.length > 0) {
    await updateAllActiveTradePrices()
  }

  // Return all active trade prices
  const { data, error } = await supabase
    .from('active_trade_prices')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching active trade prices:', error)
    return []
  }

  return (data as ActiveTradePrice[]) ?? []
}

/**
 * Background trigger: checks if prices are stale (>15 min), updates only if needed.
 * Designed to be called via after() in server components — non-blocking, fire-and-forget.
 */
export async function triggerPriceRefreshIfStale(): Promise<void> {
  const supabase = createAdminClient()
  const threshold = new Date(Date.now() - PRICE_CACHE_MINUTES * 60 * 1000).toISOString()

  // Check for stale entries
  const { data: stale } = await supabase
    .from('active_trade_prices')
    .select('id')
    .lt('updated_at', threshold)
    .limit(1)

  const hasStale = stale && stale.length > 0

  // Check for active trades that have no price entry at all (e.g. newly created trades)
  const { data: activeTrades } = await supabase
    .from('trades')
    .select('id')
    .eq('status', 'Aktiv')

  const { data: existingPrices } = await supabase
    .from('active_trade_prices')
    .select('trade_id')

  const priceIds = new Set((existingPrices ?? []).map(p => p.trade_id))
  const hasOrphan = (activeTrades ?? []).some(t => !priceIds.has(t.id))

  if (!hasStale && !hasOrphan) return

  await updateAllActiveTradePrices()
}

// Manual refresh - always updates, then invalidates the read cache
export async function refreshActiveTradePrices(): Promise<{ updated: number; errors: number; failedAssets: string[] }> {
  const result = await updateAllActiveTradePrices()
  revalidateTag('prices', 'max')
  return result
}

/**
 * Read-only cached fetch of active trade prices.
 * Cached for 15 minutes — never triggers external API calls.
 * Invalidated by refreshActiveTradePrices() or revalidateTag('prices').
 */
export async function getCachedActivePrices(): Promise<ActiveTradePrice[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('active_trade_prices')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) {
        console.error('Error fetching active trade prices:', error)
        return []
      }
      return (data as ActiveTradePrice[]) ?? []
    },
    ['prices', 'all'],
    { revalidate: 900, tags: ['prices'] }
  )()
}

// Fetch current price for a specific instrument (used by setup form)
export async function fetchInstrumentPrice(
  apiSymbol: string,
  type: 'yahoo' | 'twelve' | 'coingecko'
): Promise<{ price: number | null; currency: string | null }> {
  let result: PriceResult = { price: null, currency: null }
  if (type === 'yahoo') result = await fetchYahooFinancePrice(apiSymbol)
  else if (type === 'twelve') result = await fetchTwelveDataPrice(apiSymbol)
  else if (type === 'coingecko') result = await fetchCoinGeckoPrice(apiSymbol)
  return result
}

// ── Live instrument search via Yahoo Finance ──────────────────

interface YahooSearchQuote {
  symbol: string
  shortname?: string
  longname?: string
  quoteType: string
  exchDisp?: string
  isYahooFinance: boolean
}

function mapQuoteTypeToAssetClass(quoteType: string): 'Index' | 'Rohstoff' | 'Krypto' | 'Aktie' | 'FX' {
  switch (quoteType) {
    case 'INDEX': return 'Index'
    case 'CRYPTOCURRENCY': return 'Krypto'
    case 'CURRENCY': return 'FX'
    case 'FUTURE':
    case 'COMMODITY': return 'Rohstoff'
    default: return 'Aktie' // EQUITY, ETF, MUTUALFUND etc.
  }
}

export async function searchInstruments(query: string): Promise<{
  name: string
  symbol: string
  asset_klasse: 'Index' | 'Rohstoff' | 'Krypto' | 'Aktie' | 'FX'
  api: string
  type: 'yahoo' | 'twelve' | 'coingecko'
  exchange?: string
}[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query.trim())}&quotesCount=8&newsCount=0&enableFuzzyQuery=true`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.quotes || !Array.isArray(data.quotes)) return []

    return (data.quotes as YahooSearchQuote[])
      .filter((q) => q.isYahooFinance)
      .map((q) => ({
        name: q.shortname || q.longname || q.symbol,
        symbol: q.symbol,
        asset_klasse: mapQuoteTypeToAssetClass(q.quoteType),
        api: q.symbol,
        type: 'yahoo' as const,
        exchange: q.exchDisp,
      }))
  } catch (error) {
    console.error('Yahoo Finance search error:', error)
    return []
  }
}

// ── TradingView Symbol Search ──────────────────────────────────

export async function searchTradingView(query: string): Promise<{
  symbol: string       // e.g. "GOLD"
  exchange: string     // e.g. "TVC"
  fullSymbol: string   // e.g. "TVC:GOLD"
  description: string
  type: string
  url: string          // TradingView chart URL
}[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const url = `https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(query.trim())}&hl=0&exchange=&lang=de&type=&domain=production`
    const response = await fetch(url, {
      headers: {
        'Origin': 'https://www.tradingview.com',
        'Referer': 'https://www.tradingview.com/',
      },
    })
    const data = await response.json()

    if (!Array.isArray(data)) return []

    return data.slice(0, 8).map((r: { symbol: string; exchange: string; description: string; type: string; prefix?: string }) => {
      const exchange = r.prefix || r.exchange
      const fullSymbol = `${exchange}:${r.symbol}`
      return {
        symbol: r.symbol,
        exchange,
        fullSymbol,
        description: r.description.replace(/<\/?em>/g, ''),
        type: r.type,
        url: `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(fullSymbol)}`,
      }
    })
  } catch (error) {
    console.error('TradingView search error:', error)
    return []
  }
}
