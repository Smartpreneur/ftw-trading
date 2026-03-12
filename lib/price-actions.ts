'use server'

import { createClient, createCacheClient } from '@/lib/supabase/server'
import { revalidateTag, unstable_cache } from 'next/cache'
import { getApiSymbol } from './asset-mapping'
import type { ActiveTradePrice, TradeDirection } from './types'

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || ''
const PRICE_CACHE_MINUTES = 15 // Only update if older than 15 minutes
const OHLC_LOOKBACK_DAYS = 14 // How many days back to check for TP/SL hits

interface DailyOHLC {
  date: string // "2026-03-03"
  high: number
  low: number
}

// ── Current price fetchers ──────────────────────────────────────

// Fetch price from Twelve Data API
async function fetchTwelveDataPrice(symbol: string): Promise<number | null> {
  if (!TWELVE_DATA_API_KEY) {
    console.warn('TWELVE_DATA_API_KEY not configured')
    return null
  }

  try {
    const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.price) {
      return parseFloat(data.price)
    }
    return null
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
  }
}

// Fetch price from CoinGecko API (free, no key needed)
async function fetchCoinGeckoPrice(coinId: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    const response = await fetch(url)
    const data = await response.json()

    if (data[coinId]?.usd) {
      return data[coinId].usd
    }
    return null
  } catch (error) {
    console.error(`Error fetching price for ${coinId}:`, error)
    return null
  }
}

// Fetch price from Yahoo Finance API (free, no key needed)
async function fetchYahooFinancePrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    const response = await fetch(url)
    const data = await response.json()

    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (price && typeof price === 'number') {
      return price
    }
    return null
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
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
async function fetchOHLCData(mapping: { api: string; type: 'twelve' | 'coingecko' | 'yahoo' }): Promise<DailyOHLC[]> {
  if (mapping.type === 'yahoo') return fetchYahooFinanceOHLC(mapping.api)
  if (mapping.type === 'twelve') return fetchTwelveDataOHLC(mapping.api)
  if (mapping.type === 'coingecko') return fetchCoinGeckoOHLC(mapping.api)
  return []
}

// Get or update price for a single asset
export async function updateAssetPrice(tradeId: string, asset: string): Promise<number | null> {
  const supabase = await createClient()

  // Get API symbol mapping
  const mapping = getApiSymbol(asset)
  if (!mapping) {
    console.warn(`No API mapping found for asset: ${asset}`)
    return null
  }

  // Fetch price from appropriate API
  let price: number | null = null
  if (mapping.type === 'twelve') {
    price = await fetchTwelveDataPrice(mapping.api)
  } else if (mapping.type === 'coingecko') {
    price = await fetchCoinGeckoPrice(mapping.api)
  } else if (mapping.type === 'yahoo') {
    price = await fetchYahooFinancePrice(mapping.api)
  }

  if (price === null) {
    return null
  }

  // Update or insert into database
  const { error } = await supabase
    .from('active_trade_prices')
    .upsert({
      trade_id: tradeId,
      asset: asset,
      current_price: price,
    }, {
      onConflict: 'trade_id',
    })

  if (error) {
    console.error('Error updating price in database:', error)
    return null
  }

  return price
}

// Check TP/SL levels using daily High/Low data with historical lookback.
// Finds the FIRST day a level was breached and records that date.
//
// Reference-date logic:
// - If tp_sl_geaendert_am is set (TP/SL were modified after entry), only check
//   OHLC data from AFTER that date (the modification day itself is skipped,
//   because we don't know the exact time of the change vs. the daily high/low).
// - If tp_sl_geaendert_am is null, fall back to datum_eroeffnung.
// - The reference day itself is always skipped to avoid false positives
//   (on entry day: we don't know if the extreme happened before or after entry;
//   on modification day: same reasoning for TP/SL changes).
async function checkAndUpdateTPSL(
  trade: {
    id: string
    richtung: TradeDirection | null
    datum_eroeffnung: string
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
  },
  ohlcData: DailyOHLC[]
): Promise<boolean> {
  if (!trade.richtung || ohlcData.length === 0) return false

  // Determine the reference date: use TP/SL modification date if available,
  // otherwise fall back to trade entry date
  const referenceDate = (trade.tp_sl_geaendert_am ?? trade.datum_eroeffnung).split('T')[0]
  const openDate = trade.datum_eroeffnung.split('T')[0]
  const updates: Record<string, string> = {}

  // Walk through each day chronologically to find the FIRST hit date
  for (const day of ohlcData) {
    // Skip days before the trade was opened
    if (day.date < openDate) continue

    // Skip the reference day itself (entry day or TP/SL modification day)
    // because we don't know the exact intraday timing
    if (day.date <= referenceDate) continue

    // Use 16:00 UTC as approximate market close time for the timestamp
    const hitTimestamp = `${day.date}T16:00:00+00:00`

    // Check TPs: LONG → high >= TP, SHORT → low <= TP
    const tpChecks = [
      { key: 'tp1_erreicht_am', level: trade.tp1, alreadyHit: trade.tp1_erreicht_am },
      { key: 'tp2_erreicht_am', level: trade.tp2, alreadyHit: trade.tp2_erreicht_am },
      { key: 'tp3_erreicht_am', level: trade.tp3, alreadyHit: trade.tp3_erreicht_am },
      { key: 'tp4_erreicht_am', level: trade.tp4, alreadyHit: trade.tp4_erreicht_am },
    ]

    for (const tp of tpChecks) {
      if (!tp.level || tp.alreadyHit || updates[tp.key]) continue

      const hit = trade.richtung === 'LONG'
        ? day.high >= tp.level
        : day.low <= tp.level

      if (hit) {
        updates[tp.key] = hitTimestamp
      }
    }

    // Check SL: LONG → low <= SL, SHORT → high >= SL
    if (trade.stop_loss && !trade.sl_erreicht_am && !updates.sl_erreicht_am) {
      const slHit = trade.richtung === 'LONG'
        ? day.low <= trade.stop_loss
        : day.high >= trade.stop_loss

      if (slHit) {
        updates.sl_erreicht_am = hitTimestamp
      }
    }
  }

  // Only write to DB if something changed
  if (Object.keys(updates).length > 0) {
    const supabase = createCacheClient()
    await supabase
      .from('trades')
      .update(updates)
      .eq('id', trade.id)
    return true
  }
  return false
}

// Update all active trade prices + check TP/SL levels using daily High/Low
export async function updateAllActiveTradePrices(): Promise<{ updated: number; errors: number }> {
  const supabase = createCacheClient()

  // Get all active trades with TP/SL levels and existing hit timestamps
  const { data: activeTrades, error: tradesError } = await supabase
    .from('trades')
    .select('id, asset, datum_eroeffnung, richtung, tp1, tp2, tp3, tp4, stop_loss, tp1_erreicht_am, tp2_erreicht_am, tp3_erreicht_am, tp4_erreicht_am, sl_erreicht_am, tp_sl_geaendert_am, manuell_getrackt')
    .eq('status', 'Aktiv')

  if (tradesError || !activeTrades) {
    console.error('Error fetching active trades:', tradesError)
    return { updated: 0, errors: 0 }
  }

  let updated = 0
  let errors = 0
  let tpSlChanged = false

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
      console.warn(`No API mapping for: ${asset}`)
      errors += assetTrades.length
      continue
    }

    // Fetch current price (for display in active trades table)
    let price: number | null = null
    if (mapping.type === 'twelve') {
      price = await fetchTwelveDataPrice(mapping.api)
    } else if (mapping.type === 'coingecko') {
      price = await fetchCoinGeckoPrice(mapping.api)
    } else if (mapping.type === 'yahoo') {
      price = await fetchYahooFinancePrice(mapping.api)
    }

    // Fetch daily OHLC history for TP/SL detection
    const ohlcData = await fetchOHLCData(mapping)

    for (const trade of assetTrades) {
      if (price !== null) {
        // Update current price in DB
        await supabase
          .from('active_trade_prices')
          .upsert({
            trade_id: trade.id,
            asset: trade.asset,
            current_price: price,
          }, { onConflict: 'trade_id' })
        updated++
      } else {
        errors++
      }

      // Check TP/SL with daily High/Low data (skip manually tracked)
      if (!trade.manuell_getrackt && ohlcData.length > 0) {
        const changed = await checkAndUpdateTPSL(trade, ohlcData)
        if (changed) tpSlChanged = true
      }
    }

    // Delay between different assets to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Invalidate caches after update
  if (updated > 0) {
    revalidateTag('prices', 'max') // always refresh price cache after updates
  }
  if (tpSlChanged) {
    revalidateTag('trades', 'max') // refresh trades cache if TP/SL timestamps changed
  }

  return { updated, errors }
}

// Get current prices for active trades (only fetch if cache is stale)
export async function getActiveTradePrices(): Promise<ActiveTradePrice[]> {
  const supabase = await createClient()

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
  const supabase = createCacheClient()
  const threshold = new Date(Date.now() - PRICE_CACHE_MINUTES * 60 * 1000).toISOString()

  const { data: stale } = await supabase
    .from('active_trade_prices')
    .select('id')
    .lt('updated_at', threshold)
    .limit(1)

  if (!stale || stale.length === 0) return

  await updateAllActiveTradePrices()
}

// Manual refresh - always updates, then invalidates the read cache
export async function refreshActiveTradePrices(): Promise<{ updated: number; errors: number }> {
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
      const supabase = createCacheClient()
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
): Promise<number | null> {
  if (type === 'yahoo') return fetchYahooFinancePrice(apiSymbol)
  if (type === 'twelve') return fetchTwelveDataPrice(apiSymbol)
  if (type === 'coingecko') return fetchCoinGeckoPrice(apiSymbol)
  return null
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
