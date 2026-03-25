import type { AssetClass, TradeDirection, TradeStatus, TradingProfile } from './types'

export const ASSET_CLASSES: AssetClass[] = ['Index', 'Rohstoff', 'Krypto', 'Aktie', 'FX']

export const TRADE_DIRECTIONS: TradeDirection[] = ['LONG', 'SHORT']

export const TRADING_PROFILES: TradingProfile[] = ['MB', 'SJ']

export const TRADER_NAMES: Record<string, string> = {
  SJ: 'Stefan Jäger',
  MB: 'Michael Borgmann',
}

export const TRADE_STATUSES: TradeStatus[] = [
  'Entwurf',
  'Aktiv',
  'Geschlossen',
  'Ausgestoppt',
  'Ungültig',
  'Gelöscht',
]

/** Statuses shown in the trade list filter — excludes setup/pre-active statuses */
export const TRADE_LIST_STATUSES: TradeStatus[] = [
  'Aktiv',
  'Geschlossen',
  'Ausgestoppt',
  'Ungültig',
]

export const STATUS_COLORS: Record<TradeStatus, string> = {
  Entwurf: 'bg-gray-100 text-gray-500',
  Aktiv: 'bg-blue-100 text-blue-800',
  Geschlossen: 'bg-emerald-100 text-emerald-800',
  Ausgestoppt: 'bg-red-100 text-red-800',
  'Ungültig': 'bg-gray-100 text-gray-600',
  'Gelöscht': 'bg-gray-100 text-gray-400',
}

export const DIRECTION_COLORS: Record<TradeDirection, string> = {
  LONG: 'bg-emerald-100 text-emerald-800',
  SHORT: 'bg-rose-100 text-rose-800',
}

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  Index: '#6366f1',
  Rohstoff: '#f59e0b',
  Krypto: '#8b5cf6',
  Aktie: '#10b981',
  FX: '#3b82f6',
}

/** Known data delay per API source (in minutes). */
export const PRICE_API_DATA_DELAY_MINUTES: Record<'yahoo' | 'twelve' | 'coingecko', number> = {
  yahoo: 15,
  twelve: 0,
  coingecko: 2,
}
