import { getTrades } from '@/lib/actions'
import {
  calculateKPIs,
  calculateMonthlyPerformance,
  calculateAssetClassPerformance,
  calculateEquityCurve,
} from '@/lib/calculations'
import { KPICards } from '@/components/trades/KPICards'
import { PerformanceChart } from '@/components/trades/PerformanceChart'
import { AssetClassChart } from '@/components/trades/AssetClassChart'
import { WinRateGauge } from '@/components/trades/WinRateGauge'
import { EquityCurveChart } from '@/components/trades/EquityCurveChart'
import { TradeDialog } from '@/components/trades/TradeDialog'
import { StatusBadge } from '@/components/trades/StatusBadge'
import { DirectionBadge } from '@/components/trades/DirectionBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatPercent, formatPrice } from '@/lib/formatters'
import { Plus, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import type { TradingProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ profiles?: string }>
}) {
  const params = await searchParams
  const profilesParam = params.profiles
  const selectedProfiles = profilesParam?.split(',') as TradingProfile[] | undefined

  let trades: Awaited<ReturnType<typeof getTrades>> = []
  let error: string | null = null

  try {
    trades = await getTrades(selectedProfiles)
  } catch (e: any) {
    error = e?.message ?? 'Fehler beim Laden der Trades'
  }

  const kpis = calculateKPIs(trades)
  const monthly = calculateMonthlyPerformance(trades)
  const byAssetClass = calculateAssetClassPerformance(trades)
  const equityCurve = calculateEquityCurve(trades)
  const activeTrades = trades.filter((t) => t.status === 'Aktiv')
  const recentClosedTrades = trades
    .filter((t) => t.status === 'Geschlossen')
    .slice(0, 5)

  const pfColor =
    kpis.profit_factor >= 1.5
      ? 'text-emerald-600'
      : kpis.profit_factor >= 1
      ? 'text-yellow-600'
      : 'text-rose-600'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance-Übersicht deines Trading-Journals
          </p>
        </div>
        <TradeDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Neuer Trade
            </Button>
          }
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} — Bitte Supabase-Credentials in <code>.env.local</code> prüfen.
        </div>
      )}

      {/* KPI Cards */}
      <KPICards kpis={kpis} />

      {/* Win Rate + Profit Factor + Equity Curve */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Win Rate Gauge */}
        <WinRateGauge kpis={kpis} />

        {/* Profit Factor card */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col gap-2 h-full justify-between">
              <p className="text-sm font-medium text-muted-foreground">Profit Factor</p>
              <div className="flex items-end gap-3 mt-2">
                <span className={`text-4xl font-bold tabular-nums ${pfColor}`}>
                  {kpis.profit_factor > 0 ? kpis.profit_factor.toFixed(2) : '–'}
                </span>
                {kpis.profit_factor > 0 &&
                  (kpis.profit_factor >= 1 ? (
                    <TrendingUp className="h-6 w-6 text-emerald-500 mb-1" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-rose-500 mb-1" />
                  ))}
              </div>
              <div className="space-y-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  Ø Gewinn{' '}
                  <span className="font-semibold text-emerald-600">
                    +{kpis.avg_win_pct.toFixed(2)} %
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Ø Verlust{' '}
                  <span className="font-semibold text-rose-600">
                    -{kpis.avg_loss_pct.toFixed(2)} %
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats summary */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Übersicht</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trades gesamt</span>
                <span className="font-semibold">{kpis.total_trades}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Geschlossen</span>
                <span className="font-semibold">{kpis.closed_trades}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bester Trade</span>
                <span className="font-semibold text-emerald-600">
                  +{kpis.best_trade_pct.toFixed(2)} %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Schlechtester</span>
                <span className="font-semibold text-rose-600">
                  {kpis.worst_trade_pct.toFixed(2)} %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ø Haltedauer</span>
                <span className="font-semibold">{kpis.avg_holding_days} Tage</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve — full width */}
      <EquityCurveChart data={equityCurve} />

      {/* Monthly Performance + Asset Class side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart data={monthly} />
        <AssetClassChart data={byAssetClass} />
      </div>

      {/* Active Trades */}
      {activeTrades.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Aktive Trades{' '}
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {activeTrades.length}
              </span>
            </CardTitle>
            <Link
              href="/trades"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Alle Trades
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {trade.trade_id && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {trade.trade_id}
                      </span>
                    )}
                    {trade.richtung && <DirectionBadge direction={trade.richtung} />}
                    <span className="font-medium truncate">{trade.asset}</span>
                    <span className="text-muted-foreground text-xs hidden sm:inline">
                      seit {formatDate(trade.datum_eroeffnung)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {trade.einstiegspreis !== null && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatPrice(trade.einstiegspreis)}
                      </span>
                    )}
                    <StatusBadge status={trade.status} />
                    {trade.risiko_pct !== null && (
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        Risk: {formatPercent(trade.risiko_pct, false)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Closed Trades */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Letzte Trades{' '}
            {recentClosedTrades.length > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {recentClosedTrades.length}
              </span>
            )}
          </CardTitle>
          <Link
            href="/trades"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Alle Trades
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentClosedTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Keine geschlossenen Trades
            </p>
          ) : (
            <div className="space-y-2">
              {recentClosedTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {trade.trade_id && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {trade.trade_id}
                      </span>
                    )}
                    <span className="font-medium truncate">{trade.asset}</span>
                    <span className="text-muted-foreground text-xs hidden sm:inline">
                      {formatDate(trade.datum_schliessung || trade.datum_eroeffnung)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {trade.performance_pct !== null && (
                      <span
                        className={`font-mono text-sm font-semibold ${
                          trade.performance_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {trade.performance_pct >= 0 ? '+' : ''}
                        {trade.performance_pct.toFixed(2)} %
                      </span>
                    )}
                    <StatusBadge status={trade.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
