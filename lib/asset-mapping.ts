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
  'SILVER': { api: 'XAG/USD', type: 'twelve' },
  'XAGUSD': { api: 'XAG/USD', type: 'twelve' },
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
  'SAP': { api: 'SAP', type: 'yahoo' },
  'DAVITA': { api: 'DVA', type: 'yahoo' },
  'DVA': { api: 'DVA', type: 'yahoo' },
  'FORTINET': { api: 'FTNT', type: 'yahoo' },
  'FTNT': { api: 'FTNT', type: 'yahoo' },
  'LVMH': { api: 'MC.PA', type: 'yahoo' },
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

  return ASSET_SYMBOL_MAP[normalized] || null
}
