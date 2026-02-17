export type AssetClass = 'Index' | 'Rohstoff' | 'Krypto' | 'Aktie' | 'FX'
export type TradeDirection = 'LONG' | 'SHORT'
export type TradeStatus = 'Aktiv' | 'Erfolgreich' | 'Ausgestoppt' | 'Ungültig' | 'Einstand'

export interface Trade {
  id: string
  trade_id: string | null
  datum_eroeffnung: string
  asset: string
  asset_klasse: AssetClass
  richtung: TradeDirection
  einstiegspreis: number
  stop_loss: number | null
  tp1: number | null
  tp2: number | null
  tp3: number | null
  tp4: number | null
  status: TradeStatus
  datum_schliessung: string | null
  ausstiegspreis: number | null
  bemerkungen: string | null
  created_at: string
  updated_at: string
}

export interface TradeWithPerformance extends Trade {
  performance_pct: number | null
  risiko_pct: number | null
  risk_reward: number | null
  haltedauer_tage: number
}

export type TradeFormData = {
  trade_id: string
  datum_eroeffnung: string
  asset: string
  asset_klasse: AssetClass
  richtung: TradeDirection
  einstiegspreis: number
  stop_loss: number | null
  tp1: number | null
  tp2: number | null
  tp3: number | null
  tp4: number | null
  status: TradeStatus
  datum_schliessung: string | null
  ausstiegspreis: number | null
  bemerkungen: string | null
}

export interface PerformanceKPIs {
  total_trades: number
  closed_trades: number
  win_rate: number
  avg_win_pct: number
  avg_loss_pct: number
  profit_factor: number
  best_trade_pct: number
  worst_trade_pct: number
  avg_holding_days: number
}

export interface MonthlyPerformance {
  month: string
  total_pct: number
  trade_count: number
  win_count: number
}

export interface AssetClassPerformance {
  asset_klasse: AssetClass
  trade_count: number
  win_count: number
  win_rate: number
  avg_pct: number
}
