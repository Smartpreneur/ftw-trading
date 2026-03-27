import type {
  TradeWithPerformance,
  PerformanceKPIs,
  MonthlyPerformance,
  AssetClassPerformance,
  EquityCurvePoint,
} from './types'
import { getMonthLabel } from './formatters'

export function calculateKPIs(trades: TradeWithPerformance[]): PerformanceKPIs {
  // All non-active trades count as closed (for display)
  const closed = trades.filter((t) => t.status !== 'Aktiv')
  // Only trades with performance data for rate calculations
  const evaluated = closed.filter((t) => t.performance_pct !== null)
  const winners = evaluated.filter((t) => (t.performance_pct ?? 0) > 0)
  const losers = evaluated.filter((t) => (t.performance_pct ?? 0) < 0)

  const winRate = evaluated.length > 0 ? (winners.length / evaluated.length) * 100 : 0

  const totalWinWeight = winners.reduce((s, t) => s + (t.gewichtung ?? 1), 0)
  const avgWin =
    totalWinWeight > 0
      ? winners.reduce((s, t) => s + (t.performance_pct ?? 0) * (t.gewichtung ?? 1), 0) / totalWinWeight
      : 0

  const totalLossWeight = losers.reduce((s, t) => s + (t.gewichtung ?? 1), 0)
  const avgLoss =
    totalLossWeight > 0
      ? Math.abs(losers.reduce((s, t) => s + (t.performance_pct ?? 0) * (t.gewichtung ?? 1), 0) / totalLossWeight)
      : 0

  const perfValues = evaluated.map((t) => t.performance_pct ?? 0)

  return {
    total_trades: trades.length,
    closed_trades: closed.length,
    wins: winners.length,
    losses: losers.length,
    win_rate: Math.round(winRate * 10) / 10,
    avg_win_pct: Math.round(avgWin * 100) / 100,
    avg_loss_pct: Math.round(avgLoss * 100) / 100,
    // Profit Factor = Ø Gewinn / Ø Verlust — directly matches the displayed values
    profit_factor: avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : 0,
    best_trade_pct: perfValues.length > 0 ? Math.max(...perfValues) : 0,
    worst_trade_pct: perfValues.length > 0 ? Math.min(...perfValues) : 0,
    avg_holding_days:
      evaluated.length > 0
        ? Math.round(evaluated.reduce((s, t) => s + (t.haltedauer_tage ?? 0), 0) / evaluated.length)
        : 0,
  }
}

export function calculateMonthlyPerformance(
  trades: TradeWithPerformance[]
): MonthlyPerformance[] {
  const closed = trades.filter(
    (t) => t.status !== 'Aktiv' && t.performance_pct !== null
  )

  const byMonth: Record<string, { month: string; sum: number; totalWeight: number; count: number; wins: number }> = {}

  for (const trade of closed) {
    // Use closing date if available, otherwise use opening date
    const dateToUse = trade.datum_schliessung || trade.datum_eroeffnung
    const key = dateToUse.slice(0, 7) // "2024-10"
    if (!byMonth[key]) {
      byMonth[key] = {
        month: getMonthLabel(dateToUse),
        sum: 0,
        totalWeight: 0,
        count: 0,
        wins: 0,
      }
    }
    const w = trade.gewichtung ?? 1
    byMonth[key].sum += (trade.performance_pct ?? 0) * w
    byMonth[key].totalWeight += w
    byMonth[key].count++
    if ((trade.performance_pct ?? 0) > 0) byMonth[key].wins++
  }

  // Fill in all months between first and last (including months with no trades)
  const keys = Object.keys(byMonth).sort()
  if (keys.length > 0) {
    const [startY, startM] = keys[0].split('-').map(Number)
    const [endY, endM] = keys[keys.length - 1].split('-').map(Number)
    let y = startY, m = startM
    while (y < endY || (y === endY && m <= endM)) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      if (!byMonth[key]) {
        byMonth[key] = {
          month: getMonthLabel(`${key}-01`),
          sum: 0,
          totalWeight: 0,
          count: 0,
          wins: 0,
        }
      }
      m++
      if (m > 12) { m = 1; y++ }
    }
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      month: v.month,
      avg_pct: v.totalWeight > 0 ? Math.round((v.sum / v.totalWeight) * 100) / 100 : 0,
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

  const byClass: Record<string, { sum: number; totalWeight: number; count: number; wins: number }> = {}

  for (const trade of closed) {
    const key = trade.asset_klasse
    if (!byClass[key]) byClass[key] = { sum: 0, totalWeight: 0, count: 0, wins: 0 }
    const w = trade.gewichtung ?? 1
    byClass[key].sum += (trade.performance_pct ?? 0) * w
    byClass[key].totalWeight += w
    byClass[key].count++
    if ((trade.performance_pct ?? 0) > 0) byClass[key].wins++
  }

  return Object.entries(byClass).map(([klasse, v]) => ({
    asset_klasse: klasse as AssetClassPerformance['asset_klasse'],
    trade_count: v.count,
    win_count: v.wins,
    win_rate: Math.round((v.wins / v.count) * 1000) / 10,
    avg_pct: v.totalWeight > 0 ? Math.round((v.sum / v.totalWeight) * 100) / 100 : 0,
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

  // Base position size: 10% of depot, scaled by trade weight
  const basePositionSize = 0.1
  let depotValue = 100 // Start with 100%

  return closed.map((t) => {
    const tradeReturn = (t.performance_pct ?? 0) / 100
    const weight = t.gewichtung ?? 1
    depotValue = depotValue * (1 + weight * basePositionSize * tradeReturn)
    const cumulativePct = depotValue - 100

    const date = t.displayDate
    const [y, m, d] = date.split('-')
    return {
      date: `${d}.${m}.${y.slice(2)}`,
      cumulative_pct: Math.round(cumulativePct * 100) / 100,
      asset: t.asset,
      asset_name: t.asset_name,
      richtung: t.richtung ?? 'LONG',
      trade_pct: t.performance_pct ?? 0,
      gewichtung: weight,
    }
  })
}
