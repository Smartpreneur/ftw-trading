export type AssetClass = 'Index' | 'Rohstoff' | 'Krypto' | 'Aktie' | 'FX'
export type TradeDirection = 'LONG' | 'SHORT'
export type TradeStatus =
  | 'Entwurf'
  | 'Aktiv'
  | 'Geschlossen'
  | 'Ausgestoppt'
  | 'Ungültig'
export type TradeCloseTyp = 'TP1' | 'TP2' | 'TP3' | 'TP4' | 'SL' | 'Manuell'
export type TradingProfile = 'MB' | 'SJ'

export interface TradeNote {
  id: string
  trade_fk: string
  datum: string
  text: string
  created_at: string
}

export interface TradeClose {
  id: string
  trade_fk: string
  nummer: number | null
  typ: TradeCloseTyp | null
  datum: string
  ausstiegspreis: number | null
  anteil: number | null
  bemerkungen: string | null
  created_at: string
}

export interface TradeEntry {
  id: string
  trade_fk: string
  nummer: number
  preis: number
  anteil: number
  datum: string | null
  erreicht_am: string | null
  bemerkungen: string | null
  created_at: string
}

export type TradeEntryFormData = {
  trade_fk: string
  nummer?: number
  preis: number
  anteil: number
  bemerkungen?: string | null
}

export interface Trade {
  id: string
  trade_id: number
  trade_id_legacy: string | null
  datum_eroeffnung: string
  asset: string
  asset_name: string | null
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
  tp1_erreicht_am: string | null
  tp2_erreicht_am: string | null
  tp3_erreicht_am: string | null
  tp4_erreicht_am: string | null
  sl_erreicht_am: string | null
  tp_sl_geaendert_am: string | null
  stop_loss_vorher: number | null
  tp1_vorher: number | null
  tp2_vorher: number | null
  tp3_vorher: number | null
  tp4_vorher: number | null
  manuell_getrackt: boolean
  gewichtung: number
  tp1_gewichtung: number | null
  tp2_gewichtung: number | null
  tp3_gewichtung: number | null
  tp4_gewichtung: number | null
  // Setup-specific fields (nullable for active trades)
  aktueller_kurs: number | null
  risiko_reward_min: number | null
  risiko_reward_max: number | null
  zeiteinheit: string | null
  dauer_erwartung: string | null
  chart_bild_url: string | null
  currency: string | null
  performance_pct: number | null
  created_at: string
  updated_at: string
  analyse_text: string | null
  tradingview_symbol: string | null
  eilmeldung_sent_at: string | null
  published_at: string | null
  closes: TradeClose[]
  notes: TradeNote[]
  entries: TradeEntry[]
}

export interface TradeWithPerformance extends Trade {
  performance_pct: number | null
  risiko_pct: number | null
  risk_reward: number | null
  haltedauer_tage: number
  /** Effective close date: max(close.datum) if closes exist, else datum_schliessung */
  effective_datum_schliessung: string | null
  /** Effective exit price: weighted avg of closes if closes exist, else ausstiegspreis */
  effective_ausstiegspreis: number | null
}

export type TradeFormData = {
  datum_eroeffnung: string
  asset: string
  asset_name?: string | null
  asset_klasse: AssetClass
  richtung: TradeDirection | null
  einstiegspreis: number | null
  stop_loss: number | null
  tp1: number | null
  tp2: number | null
  tp3: number | null
  tp4: number | null
  status: TradeStatus
  bemerkungen: string | null
  profil: TradingProfile
  manuell_getrackt?: boolean
  tp1_erreicht_am?: string | null
  tp2_erreicht_am?: string | null
  tp3_erreicht_am?: string | null
  tp4_erreicht_am?: string | null
  sl_erreicht_am?: string | null
  tp_sl_geaendert_am?: string | null
  gewichtung?: number
  tp1_gewichtung?: number | null
  tp2_gewichtung?: number | null
  tp3_gewichtung?: number | null
  tp4_gewichtung?: number | null
  aktueller_kurs?: number | null
  risiko_reward_min?: number | null
  risiko_reward_max?: number | null
  zeiteinheit?: string | null
  dauer_erwartung?: string | null
  chart_bild_url?: string | null
}

export type TradeCloseFormData = {
  trade_fk: string
  nummer?: number | null
  typ: TradeCloseTyp
  datum: string
  ausstiegspreis: number | null
  anteil: number
  bemerkungen?: string | null
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
  avg_pct: number
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
  asset_name: string | null
  richtung: TradeDirection
  trade_pct: number
  gewichtung: number
}

export interface ActiveTradePrice {
  id: string
  trade_id: string
  asset: string
  current_price: number
  currency: string | null
  updated_at: string
  created_at: string
}

export interface TradeWithPrice extends TradeWithPerformance {
  current_price: number | null
  price_updated_at: string | null
  unrealized_pct: number | null
}
