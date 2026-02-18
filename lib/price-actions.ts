'use server'

import { createClient } from '@/lib/supabase/server'
import { getApiSymbol } from './asset-mapping'
import type { ActiveTradePrice } from './types'

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || ''
const PRICE_CACHE_MINUTES = 5 // Only update if older than 5 minutes

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

// Update all active trade prices
export async function updateAllActiveTradePrices(): Promise<{ updated: number; errors: number }> {
  const supabase = await createClient()

  // Get all active trades
  const { data: activeTrades, error: tradesError } = await supabase
    .from('trades')
    .select('id, asset')
    .eq('status', 'Aktiv')

  if (tradesError || !activeTrades) {
    console.error('Error fetching active trades:', tradesError)
    return { updated: 0, errors: 0 }
  }

  let updated = 0
  let errors = 0

  // Update prices for each active trade
  for (const trade of activeTrades) {
    const price = await updateAssetPrice(trade.id, trade.asset)
    if (price !== null) {
      updated++
    } else {
      errors++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
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

// Manual refresh - always updates
export async function refreshActiveTradePrices(): Promise<{ updated: number; errors: number }> {
  return await updateAllActiveTradePrices()
}
