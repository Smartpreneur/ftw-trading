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
  'Setup',
  'Ausstehend',
  'Aktiv',
  'Geschlossen',
  'Ausgestoppt',
  'Ungültig',
  'Einstand',
]

export const STATUS_COLORS: Record<TradeStatus, string> = {
  Entwurf: 'bg-gray-100 text-gray-500',
  Setup: 'bg-violet-100 text-violet-800',
  Ausstehend: 'bg-yellow-100 text-yellow-800',
  Aktiv: 'bg-blue-100 text-blue-800',
  Geschlossen: 'bg-emerald-100 text-emerald-800',
  Ausgestoppt: 'bg-red-100 text-red-800',
  'Ungültig': 'bg-gray-100 text-gray-600',
  Einstand: 'bg-amber-100 text-amber-800',
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
