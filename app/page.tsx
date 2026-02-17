import { getTrades } from '@/lib/actions'
import { calculateKPIs, calculateMonthlyPerformance, calculateAssetClassPerformance } from '@/lib/calculations'
import { KPICards } from '@/components/trades/KPICards'
import { PerformanceChart } from '@/components/trades/PerformanceChart'
import { AssetClassChart } from '@/components/trades/AssetClassChart'
import { TradeDialog } from '@/components/trades/TradeDialog'
import { StatusBadge } from '@/components/trades/StatusBadge'
import { DirectionBadge } from '@/components/trades/DirectionBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatPercent, formatPrice } from '@/lib/formatters'
import { Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let trades: Awaited<ReturnType<typeof getTrades>> = []
  let error: string | null = null

  try {
    trades = await getTrades()
  } catch (e: any) {
    error = e?.message ?? 'Fehler beim Laden der Trades'
  }

  const kpis = calculateKPIs(trades)
  const monthly = calculateMonthlyPerformance(trades)
  const byAssetClass = calculateAssetClassPerformance(trades)
  const activeTrades = trades.filter((t) => t.status === 'Aktiv')

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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart data={monthly} />
        <AssetClassChart data={byAssetClass} />
      </div>

      {/* Active Trades */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Aktive Trades{' '}
            {activeTrades.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {activeTrades.length}
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
          {activeTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Keine aktiven Trades
            </p>
          ) : (
            <div className="space-y-2">
              {activeTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DirectionBadge direction={trade.richtung} />
                    <span className="font-medium truncate">{trade.asset}</span>
                    <span className="text-muted-foreground text-xs hidden sm:inline">
                      seit {formatDate(trade.datum_eroeffnung)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatPrice(trade.einstiegspreis)}
                    </span>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
