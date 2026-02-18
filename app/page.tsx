import { getTrades } from '@/lib/actions'
import { getActiveTradePrices } from '@/lib/price-actions'
import {
  calculateKPIs,
  calculateMonthlyPerformance,
  calculateAssetClassPerformance,
} from '@/lib/calculations'
import { PerformanceChart } from '@/components/trades/PerformanceChart'
import { AssetClassChart } from '@/components/trades/AssetClassChart'
import { WinRateGauge } from '@/components/trades/WinRateGauge'
import { TradeDialog } from '@/components/trades/TradeDialog'
import { StatusBadge } from '@/components/trades/StatusBadge'
import { DirectionBadge } from '@/components/trades/DirectionBadge'
import { RefreshPricesButton } from '@/components/trades/RefreshPricesButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

  // Fetch live prices for active trades
  const activePrices = await getActiveTradePrices()
  const priceMap = new Map(activePrices.map(p => [p.trade_id, p]))

  const kpis = calculateKPIs(trades)
  const monthly = calculateMonthlyPerformance(trades)
  const byAssetClass = calculateAssetClassPerformance(trades)
  const activeTrades = trades.filter((t) => t.status === 'Aktiv')
  const recentClosedTrades = trades
    .filter((t) => t.status !== 'Aktiv')
    .sort((a, b) => {
      const dateA = a.datum_schliessung || a.datum_eroeffnung
      const dateB = b.datum_schliessung || b.datum_eroeffnung
      return dateB.localeCompare(dateA) // Descending order (newest first)
    })
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

      {/* Win Rate + Profit Factor + Equity Curve */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Win Rate Gauge */}
        <WinRateGauge kpis={kpis} />

        {/* Profit Factor card */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col gap-2 h-full justify-between">
              <p className="text-sm font-bold text-foreground">Profit Factor</p>
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
            <p className="text-sm font-bold text-foreground mb-3">Übersicht</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trades gesamt</span>
                <span className="font-semibold">{kpis.total_trades}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Offene Trades</span>
                <span className="font-semibold">{activeTrades.length}</span>
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
                <span className="text-muted-foreground">Schlechtester Trade</span>
                <span className="font-semibold text-rose-600">
                  {kpis.worst_trade_pct.toFixed(2)} %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ø Haltedauer</span>
                <span className="font-semibold">–</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="flex items-center gap-2">
              <RefreshPricesButton />
              <Link
                href="/trades"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Alle Trades
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">ID</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Basiswert</TableHead>
                  <TableHead>Long/Short</TableHead>
                  <TableHead className="text-right">Einstiegskurs</TableHead>
                  <TableHead className="text-right">Aktueller Kurs</TableHead>
                  <TableHead className="text-right">G/V in %</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">TP1</TableHead>
                  <TableHead className="text-right">TP2</TableHead>
                  <TableHead className="text-right">TP3</TableHead>
                  <TableHead className="text-right">TP4</TableHead>
                  <TableHead className="pr-6">Bemerkung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTrades.map((trade) => {
                  const priceData = priceMap.get(trade.id)
                  const currentPrice = priceData?.current_price
                  const entryPrice = trade.einstiegspreis

                  // Calculate unrealized P&L
                  let unrealizedPct: number | null = null
                  if (currentPrice && entryPrice && trade.richtung) {
                    if (trade.richtung === 'LONG') {
                      unrealizedPct = ((currentPrice - entryPrice) / entryPrice) * 100
                    } else {
                      unrealizedPct = ((entryPrice - currentPrice) / entryPrice) * 100
                    }
                  }

                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="pl-6">
                        <span className="font-mono text-xs text-muted-foreground">
                          {trade.trade_id ? trade.trade_id.replace(/^T-0*/, '') : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(trade.datum_eroeffnung)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{trade.asset}</span>
                      </TableCell>
                      <TableCell>
                        {trade.richtung && <DirectionBadge direction={trade.richtung} />}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          {entryPrice ? formatPrice(entryPrice) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          {currentPrice ? formatPrice(currentPrice) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {unrealizedPct !== null ? (
                          <span
                            className={`font-mono text-sm font-semibold ${
                              unrealizedPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {unrealizedPct >= 0 ? '+' : ''}
                            {unrealizedPct.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          {trade.stop_loss ? formatPrice(trade.stop_loss) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          {trade.tp1 ? formatPrice(trade.tp1) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          {trade.tp2 ? formatPrice(trade.tp2) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          {trade.tp3 ? formatPrice(trade.tp3) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">
                          {trade.tp4 ? formatPrice(trade.tp4) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 max-w-[150px]">
                        <span
                          className="text-sm text-muted-foreground truncate block cursor-help"
                          title={trade.bemerkungen || undefined}
                        >
                          {trade.bemerkungen || '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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
        <CardContent className="px-0">
          {recentClosedTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Keine geschlossenen Trades
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">ID</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Basiswert</TableHead>
                  <TableHead>Long/Short</TableHead>
                  <TableHead className="text-right">Einstiegskurs</TableHead>
                  <TableHead className="text-right">Ausstiegskurs</TableHead>
                  <TableHead className="text-right">G/V in %</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">TP1</TableHead>
                  <TableHead className="text-right">TP2</TableHead>
                  <TableHead className="text-right">TP3</TableHead>
                  <TableHead className="text-right pr-6">TP4</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentClosedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="pl-6">
                      <span className="font-mono text-xs text-muted-foreground">
                        {trade.trade_id ? trade.trade_id.replace(/^T-0*/, '') : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(trade.datum_schliessung || trade.datum_eroeffnung)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{trade.asset}</span>
                    </TableCell>
                    <TableCell>
                      {trade.richtung && <DirectionBadge direction={trade.richtung} />}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.einstiegspreis ? formatPrice(trade.einstiegspreis) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.ausstiegspreis ? formatPrice(trade.ausstiegspreis) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.performance_pct !== null ? (
                        <span
                          className={`font-mono text-sm font-semibold ${
                            trade.performance_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {trade.performance_pct >= 0 ? '+' : ''}
                          {trade.performance_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.stop_loss ? formatPrice(trade.stop_loss) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.tp1 ? formatPrice(trade.tp1) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.tp2 ? formatPrice(trade.tp2) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.tp3 ? formatPrice(trade.tp3) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span className="font-mono text-sm">
                        {trade.tp4 ? formatPrice(trade.tp4) : '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
