import type {
  TradeWithPerformance,
  PerformanceKPIs,
  MonthlyPerformance,
  AssetClassPerformance,
} from './types'
import { getMonthLabel } from './formatters'

export function calculateKPIs(trades: TradeWithPerformance[]): PerformanceKPIs {
  const closed = trades.filter(
    (t) =>
      ['Erfolgreich', 'Ausgestoppt', 'Einstand'].includes(t.status) &&
      t.performance_pct !== null
  )
  const winners = closed.filter((t) => (t.performance_pct ?? 0) > 0)
  const losers = closed.filter((t) => (t.performance_pct ?? 0) < 0)

  const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0

  const avgWin =
    winners.length > 0
      ? winners.reduce((s, t) => s + (t.performance_pct ?? 0), 0) / winners.length
      : 0

  const avgLoss =
    losers.length > 0
      ? Math.abs(losers.reduce((s, t) => s + (t.performance_pct ?? 0), 0) / losers.length)
      : 0

  const perfValues = closed.map((t) => t.performance_pct ?? 0)

  return {
    total_trades: trades.length,
    closed_trades: closed.length,
    win_rate: Math.round(winRate * 10) / 10,
    avg_win_pct: Math.round(avgWin * 100) / 100,
    avg_loss_pct: Math.round(avgLoss * 100) / 100,
    profit_factor: avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : 0,
    best_trade_pct: perfValues.length > 0 ? Math.max(...perfValues) : 0,
    worst_trade_pct: perfValues.length > 0 ? Math.min(...perfValues) : 0,
    avg_holding_days:
      closed.length > 0
        ? Math.round(closed.reduce((s, t) => s + (t.haltedauer_tage ?? 0), 0) / closed.length)
        : 0,
  }
}

export function calculateMonthlyPerformance(
  trades: TradeWithPerformance[]
): MonthlyPerformance[] {
  const closed = trades.filter(
    (t) => t.datum_schliessung && t.performance_pct !== null
  )

  const byMonth: Record<string, MonthlyPerformance> = {}

  for (const trade of closed) {
    const key = trade.datum_schliessung!.slice(0, 7) // "2024-10"
    if (!byMonth[key]) {
      byMonth[key] = {
        month: getMonthLabel(trade.datum_schliessung!),
        total_pct: 0,
        trade_count: 0,
        win_count: 0,
      }
    }
    byMonth[key].total_pct += trade.performance_pct ?? 0
    byMonth[key].trade_count++
    if ((trade.performance_pct ?? 0) > 0) byMonth[key].win_count++
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ ...v, total_pct: Math.round(v.total_pct * 100) / 100 }))
}

export function calculateAssetClassPerformance(
  trades: TradeWithPerformance[]
): AssetClassPerformance[] {
  const closed = trades.filter(
    (t) =>
      ['Erfolgreich', 'Ausgestoppt', 'Einstand'].includes(t.status) &&
      t.performance_pct !== null
  )

  const byClass: Record<string, { sum: number; count: number; wins: number }> = {}

  for (const trade of closed) {
    const key = trade.asset_klasse
    if (!byClass[key]) byClass[key] = { sum: 0, count: 0, wins: 0 }
    byClass[key].sum += trade.performance_pct ?? 0
    byClass[key].count++
    if ((trade.performance_pct ?? 0) > 0) byClass[key].wins++
  }

  return Object.entries(byClass).map(([klasse, v]) => ({
    asset_klasse: klasse as AssetClassPerformance['asset_klasse'],
    trade_count: v.count,
    win_count: v.wins,
    win_rate: Math.round((v.wins / v.count) * 1000) / 10,
    avg_pct: Math.round((v.sum / v.count) * 100) / 100,
  }))
}
