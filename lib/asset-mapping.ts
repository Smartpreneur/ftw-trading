import type { AssetClass } from './types'

// ── Instrument catalog (for search/autocomplete) ──────────────

export interface Instrument {
  name: string           // Display: "Silver", "Nasdaq 100"
  symbol: string         // DB value: "Silver", "NAS100"
  asset_klasse: AssetClass
  api: string            // API symbol: "SI=F", "^NDX"
  type: 'yahoo' | 'twelve' | 'coingecko'
}

export const INSTRUMENTS: Instrument[] = [
  // Indices
  { name: 'Nasdaq 100', symbol: 'NAS100', asset_klasse: 'Index', api: '^NDX', type: 'yahoo' },
  { name: 'Dow Jones', symbol: 'US30', asset_klasse: 'Index', api: '^DJI', type: 'yahoo' },
  { name: 'S&P 500', symbol: 'US500', asset_klasse: 'Index', api: '^GSPC', type: 'yahoo' },
  { name: 'DAX 40', symbol: 'DE40', asset_klasse: 'Index', api: '^GDAXI', type: 'yahoo' },
  { name: 'FTSE 100', symbol: 'UK100', asset_klasse: 'Index', api: '^FTSE', type: 'yahoo' },
  { name: 'Nikkei 225', symbol: 'JP225', asset_klasse: 'Index', api: '^N225', type: 'yahoo' },

  // Forex
  { name: 'EUR/USD', symbol: 'EURUSD', asset_klasse: 'FX', api: 'EUR/USD', type: 'twelve' },
  { name: 'GBP/USD', symbol: 'GBPUSD', asset_klasse: 'FX', api: 'GBP/USD', type: 'twelve' },
  { name: 'USD/JPY', symbol: 'USDJPY', asset_klasse: 'FX', api: 'USD/JPY', type: 'twelve' },
  { name: 'AUD/USD', symbol: 'AUDUSD', asset_klasse: 'FX', api: 'AUD/USD', type: 'twelve' },
  { name: 'USD/CAD', symbol: 'USDCAD', asset_klasse: 'FX', api: 'USD/CAD', type: 'twelve' },
  { name: 'USD/CHF', symbol: 'USDCHF', asset_klasse: 'FX', api: 'USD/CHF', type: 'twelve' },

  // Commodities
  { name: 'Gold', symbol: 'Gold', asset_klasse: 'Rohstoff', api: 'XAU/USD', type: 'twelve' },
  { name: 'Silver', symbol: 'Silver', asset_klasse: 'Rohstoff', api: 'SI=F', type: 'yahoo' },
  { name: 'Öl (WTI)', symbol: 'OIL', asset_klasse: 'Rohstoff', api: 'WTI/USD', type: 'twelve' },
  { name: 'Brent', symbol: 'Brent', asset_klasse: 'Rohstoff', api: 'BRENT/USD', type: 'twelve' },

  // Crypto
  { name: 'Bitcoin', symbol: 'BTC', asset_klasse: 'Krypto', api: 'bitcoin', type: 'coingecko' },
  { name: 'Ethereum', symbol: 'ETH', asset_klasse: 'Krypto', api: 'ethereum', type: 'coingecko' },
  { name: 'Solana', symbol: 'SOL', asset_klasse: 'Krypto', api: 'solana', type: 'coingecko' },
  { name: 'Ripple (XRP)', symbol: 'XRP', asset_klasse: 'Krypto', api: 'ripple', type: 'coingecko' },

  // Stocks
  { name: 'Amazon', symbol: 'Amazon', asset_klasse: 'Aktie', api: 'AMZN', type: 'yahoo' },
  { name: 'SAP', symbol: 'SAP', asset_klasse: 'Aktie', api: 'SAP.DE', type: 'yahoo' },
  { name: 'DaVita', symbol: 'DaVita', asset_klasse: 'Aktie', api: 'DVA', type: 'yahoo' },
  { name: 'Fortinet', symbol: 'Fortinet', asset_klasse: 'Aktie', api: 'FTNT', type: 'yahoo' },
  { name: 'LVMH', symbol: 'LVMH', asset_klasse: 'Aktie', api: 'MC.PA', type: 'yahoo' },
  { name: 'Microsoft', symbol: 'Microsoft', asset_klasse: 'Aktie', api: 'MSFT', type: 'yahoo' },
  { name: 'Coinbase', symbol: 'Coinbase', asset_klasse: 'Aktie', api: 'COIN', type: 'yahoo' },
]

// ── Legacy symbol map (for existing trades) ───────────────────

// Maps trading symbols to API symbols for price fetching
export const ASSET_SYMBOL_MAP: Record<string, { api: string; type: 'twelve' | 'coingecko' | 'yahoo' }> = {
  // Indices (Yahoo Finance - free)
  'NAS100': { api: '^NDX', type: 'yahoo' },
  'US30': { api: '^DJI', type: 'yahoo' },
  'US500': { api: '^GSPC', type: 'yahoo' },
  'DE40': { api: '^GDAXI', type: 'yahoo' },
  'UK100': { api: '^FTSE', type: 'yahoo' },
  'JP225': { api: '^N225', type: 'yahoo' },

  // Forex (Twelve Data)
  'EURUSD': { api: 'EUR/USD', type: 'twelve' },
  'GBPUSD': { api: 'GBP/USD', type: 'twelve' },
  'USDJPY': { api: 'USD/JPY', type: 'twelve' },
  'AUDUSD': { api: 'AUD/USD', type: 'twelve' },
  'USDCAD': { api: 'USD/CAD', type: 'twelve' },
  'USDCHF': { api: 'USD/CHF', type: 'twelve' },

  // Commodities (Twelve Data)
  'XAUUSD': { api: 'XAU/USD', type: 'twelve' },
  'GOLD': { api: 'XAU/USD', type: 'twelve' },
  'SILVER': { api: 'SI=F', type: 'yahoo' },
  'XAGUSD': { api: 'SI=F', type: 'yahoo' },
  'OIL': { api: 'WTI/USD', type: 'twelve' },
  'BRENT': { api: 'BRENT/USD', type: 'twelve' },

  // Crypto (CoinGecko)
  'BTC': { api: 'bitcoin', type: 'coingecko' },
  'BTCUSD': { api: 'bitcoin', type: 'coingecko' },
  'ETH': { api: 'ethereum', type: 'coingecko' },
  'ETHUSD': { api: 'ethereum', type: 'coingecko' },
  'SOL': { api: 'solana', type: 'coingecko' },
  'SOLUSD': { api: 'solana', type: 'coingecko' },
  'XRP': { api: 'ripple', type: 'coingecko' },
  'XRPUSD': { api: 'ripple', type: 'coingecko' },

  // Stocks (Yahoo Finance - free)
  'AMAZON': { api: 'AMZN', type: 'yahoo' },
  'AMZN': { api: 'AMZN', type: 'yahoo' },
  'SAP': { api: 'SAP.DE', type: 'yahoo' },
  'DAVITA': { api: 'DVA', type: 'yahoo' },
  'DVA': { api: 'DVA', type: 'yahoo' },
  'FORTINET': { api: 'FTNT', type: 'yahoo' },
  'FTNT': { api: 'FTNT', type: 'yahoo' },
  'LVMH': { api: 'MC.PA', type: 'yahoo' },
  'MICROSOFT': { api: 'MSFT', type: 'yahoo' },
  'MSFT': { api: 'MSFT', type: 'yahoo' },
  'COINBASE': { api: 'COIN', type: 'yahoo' },
  'COIN': { api: 'COIN', type: 'yahoo' },
}

// ISIN to Ticker mapping (common stocks)
export const ISIN_TO_TICKER: Record<string, string> = {
  'US0378331005': 'AAPL',  // Apple
  'US5949181045': 'MSFT',  // Microsoft
  'US02079K3059': 'GOOGL', // Alphabet
  'US0231351067': 'AMZN',  // Amazon
  'US88160R1014': 'TSLA',  // Tesla
  'US0846707026': 'BRK.B', // Berkshire Hathaway
  'US67066G1040': 'NVDA',  // Nvidia
  'US30303M1027': 'META',  // Meta
  // Add more as needed
}

export function getApiSymbol(tradingSymbol: string): { api: string; type: 'twelve' | 'coingecko' | 'yahoo' } | null {
  const normalized = tradingSymbol.toUpperCase().replace(/\s+/g, '')

  // Check if it's an ISIN
  if (/^[A-Z]{2}[A-Z0-9]{10}$/.test(normalized)) {
    const ticker = ISIN_TO_TICKER[normalized]
    if (ticker) {
      return { api: ticker, type: 'yahoo' }
    }
  }

  // Check legacy static map
  if (ASSET_SYMBOL_MAP[normalized]) {
    return ASSET_SYMBOL_MAP[normalized]
  }

  // Check INSTRUMENTS catalog (by symbol or name)
  const inst = INSTRUMENTS.find(
    (i) => i.symbol.toUpperCase() === normalized || i.name.toUpperCase() === normalized
  )
  if (inst) {
    return { api: inst.api, type: inst.type }
  }

  // Fallback: treat unknown symbols as Yahoo Finance tickers
  // This enables dynamically-added instruments from Yahoo search
  if (/^[A-Z0-9.^=/-]+$/i.test(tradingSymbol.trim())) {
    return { api: tradingSymbol.trim(), type: 'yahoo' }
  }

  return null
}
