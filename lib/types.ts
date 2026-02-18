export type AssetClass = 'Index' | 'Rohstoff' | 'Krypto' | 'Aktie' | 'FX'
export type TradeDirection = 'LONG' | 'SHORT'
export type TradeStatus = 'Aktiv' | 'Erfolgreich' | 'Ausgestoppt' | 'Ungültig' | 'Einstand' | 'Geschlossen'
export type SetupStatus = 'Aktiv' | 'Getriggert' | 'Abgelaufen'
export type TradingProfile = 'MB' | 'SJ'

export interface Trade {
  id: string
  trade_id: string | null
  datum_eroeffnung: string
  asset: string
  asset_klasse: AssetClass
  richtung: TradeDirection | null
  einstiegspreis: number | null
  stop_loss: number | null
  tp1: number | null
  tp2: number | null
  tp3: number | null
  tp4: number | null
  status: TradeStatus
  datum_schliessung: string | null
  ausstiegspreis: number | null
  bemerkungen: string | null
  profil: TradingProfile
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
  richtung: TradeDirection | null
  einstiegspreis: number | null
  stop_loss: number | null
  tp1: number | null
  tp2: number | null
  tp3: number | null
  tp4: number | null
  status: TradeStatus
  datum_schliessung: string | null
  ausstiegspreis: number | null
  bemerkungen: string | null
  profil: TradingProfile
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

export interface EquityCurvePoint {
  date: string
  cumulative_pct: number
  asset: string
  richtung: TradeDirection
  trade_pct: number
}

export interface TradeSetup {
  id: string
  asset: string
  asset_klasse: AssetClass
  datum: string
  aktueller_kurs: number
  richtung: TradeDirection
  einstieg_von: number
  einstieg_bis: number
  stop_loss: number
  tp1: number
  tp2: number | null
  tp3: number | null
  tp4: number | null
  risiko_reward_min: number
  risiko_reward_max: number
  zeiteinheit: string
  dauer_erwartung: string | null
  status: SetupStatus
  bemerkungen: string | null
  chart_bild_url: string | null
  profil: TradingProfile
  created_at: string
  updated_at: string
}

export type SetupFormData = {
  asset: string
  asset_klasse: AssetClass
  datum: string
  aktueller_kurs: number
  richtung: TradeDirection
  einstieg_von: number
  einstieg_bis: number
  stop_loss: number
  tp1: number
  tp2: number | null
  tp3: number | null
  tp4: number | null
  risiko_reward_min: number
  risiko_reward_max: number
  zeiteinheit: string
  dauer_erwartung: string | null
  status: SetupStatus
  bemerkungen: string | null
  chart_bild_url: string | null
  profil: TradingProfile
}
