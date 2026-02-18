import type {
  TradeWithPerformance,
  PerformanceKPIs,
  MonthlyPerformance,
  AssetClassPerformance,
  EquityCurvePoint,
} from './types'
import { getMonthLabel } from './formatters'

export function calculateKPIs(trades: TradeWithPerformance[]): PerformanceKPIs {
  const closed = trades.filter(
    (t) =>
      t.status !== 'Aktiv' &&
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
    (t) => t.status !== 'Aktiv' && t.performance_pct !== null
  )

  const byMonth: Record<string, { month: string; sum: number; count: number; wins: number }> = {}

  for (const trade of closed) {
    // Use closing date if available, otherwise use opening date
    const dateToUse = trade.datum_schliessung || trade.datum_eroeffnung
    const key = dateToUse.slice(0, 7) // "2024-10"
    if (!byMonth[key]) {
      byMonth[key] = {
        month: getMonthLabel(dateToUse),
        sum: 0,
        count: 0,
        wins: 0,
      }
    }
    byMonth[key].sum += trade.performance_pct ?? 0
    byMonth[key].count++
    if ((trade.performance_pct ?? 0) > 0) byMonth[key].wins++
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      month: v.month,
      avg_pct: Math.round((v.sum / v.count) * 100) / 100,
      trade_count: v.count,
      win_count: v.wins,
    }))
}

export function calculateAssetClassPerformance(
  trades: TradeWithPerformance[]
): AssetClassPerformance[] {
  const closed = trades.filter(
    (t) =>
      t.status !== 'Aktiv' &&
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

export function calculateEquityCurve(
  trades: TradeWithPerformance[]
): EquityCurvePoint[] {
  const closed = trades
    .filter((t) => t.status !== 'Aktiv' && t.performance_pct !== null)
    .map((t) => ({
      ...t,
      // Use closing date if available, otherwise use opening date
      displayDate: t.datum_schliessung || t.datum_eroeffnung
    }))
    .sort((a, b) => a.displayDate.localeCompare(b.displayDate))

  // Equal weighting: assume each trade uses 10% of depot
  const positionSize = 0.1
  let depotValue = 100 // Start with 100%

  return closed.map((t) => {
    // Apply trade performance to the position size
    const tradeReturn = (t.performance_pct ?? 0) / 100
    depotValue = depotValue * (1 + positionSize * tradeReturn)
    const cumulativePct = depotValue - 100

    const date = t.displayDate
    const [y, m, d] = date.split('-')
    return {
      date: `${d}.${m}.${y.slice(2)}`,
      cumulative_pct: Math.round(cumulativePct * 100) / 100,
      asset: t.asset,
      richtung: t.richtung,
      trade_pct: t.performance_pct ?? 0,
    }
  })
}
