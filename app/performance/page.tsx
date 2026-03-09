import type { Metadata } from 'next'
import { getTrades } from '@/lib/actions'
import { getSetups } from '@/lib/setup-actions'
import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'

export const metadata: Metadata = {
  title: 'Performance-Übersicht | FTW Trading',
  description: 'Persönliches Trading-Tagebuch mit Performance-Analyse',
}
import { getActiveTradePrices } from '@/lib/price-actions'
import {
  calculateKPIs,
  calculateMonthlyPerformance,
  calculateAssetClassPerformance,
} from '@/lib/calculations'
import { PerformanceChart } from '@/components/trades/PerformanceChart'
import { AssetClassChart } from '@/components/trades/AssetClassChart'
import { WinRateGauge } from '@/components/trades/WinRateGauge'
import { DirectionBadge } from '@/components/trades/DirectionBadge'
import { RefreshPricesButton } from '@/components/trades/RefreshPricesButton'
import { ActiveTradesTable } from '@/components/trades/ActiveTradesTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatPrice } from '@/lib/formatters'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { TradingProfile } from '@/lib/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ profiles?: string }>
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  const params = await searchParams
  const profilesParam = params.profiles
  const selectedProfiles = profilesParam?.split(',') as TradingProfile[] | undefined
  const tradesHref = profilesParam ? `/trades?profiles=${profilesParam}` : '/trades'

  let trades: Awaited<ReturnType<typeof getTrades>> = []
  let error: string | null = null

  try {
    trades = await getTrades(selectedProfiles)
  } catch (e: any) {
    error = e?.message ?? 'Fehler beim Laden der Trades'
  }

  // Fetch live prices for active trades
  const activePrices = await getActiveTradePrices()

  // Fetch active setups
  let activeSetups: Awaited<ReturnType<typeof getSetups>> = []
  try {
    const allSetups = await getSetups(selectedProfiles)
    activeSetups = allSetups.filter(s => s.status === 'Aktiv')
  } catch {
    // silently ignore
  }

  // SL-hit trades are effectively closed → don't show in active
  const allAktiv = trades.filter((t) => t.status === 'Aktiv')
  const activeTrades = allAktiv.filter((t) => !t.sl_erreicht_am)

  // Generate virtual close entries from TP hits and SL hits
  const partialCloseEntries: typeof trades = []
  const partialCloseLabels = new Map<string, string>()

  function calcHoldingDays(openDate: string, closeIso: string) {
    const close = closeIso.split('T')[0]
    return Math.max(1, Math.round(
      (new Date(close).getTime() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24)
    ))
  }

  for (const trade of allAktiv) {
    if (!trade.einstiegspreis || !trade.richtung) continue

    // TP partial close entries
    const tpLevels = [
      { key: 'tp1', level: trade.tp1, hitAt: trade.tp1_erreicht_am, label: 'TP1' },
      { key: 'tp2', level: trade.tp2, hitAt: trade.tp2_erreicht_am, label: 'TP2' },
      { key: 'tp3', level: trade.tp3, hitAt: trade.tp3_erreicht_am, label: 'TP3' },
      { key: 'tp4', level: trade.tp4, hitAt: trade.tp4_erreicht_am, label: 'TP4' },
    ]

    for (const tp of tpLevels) {
      if (!tp.level || !tp.hitAt) continue

      const perfRaw =
        trade.richtung === 'LONG'
          ? ((tp.level - trade.einstiegspreis) / trade.einstiegspreis) * 100
          : ((trade.einstiegspreis - tp.level) / trade.einstiegspreis) * 100

      const virtualId = `${trade.id}-${tp.key}`
      partialCloseLabels.set(virtualId, `(${tp.label})`)

      partialCloseEntries.push({
        ...trade,
        id: virtualId,
        ausstiegspreis: tp.level,
        datum_schliessung: tp.hitAt.split('T')[0],
        performance_pct: Math.round(perfRaw * 100) / 100,
        status: 'Erfolgreich',
        haltedauer_tage: calcHoldingDays(trade.datum_eroeffnung, tp.hitAt),
      })
    }

    // SL close entry – entire remaining position closed
    if (trade.sl_erreicht_am && trade.stop_loss) {
      const slPerfRaw =
        trade.richtung === 'LONG'
          ? ((trade.stop_loss - trade.einstiegspreis) / trade.einstiegspreis) * 100
          : ((trade.einstiegspreis - trade.stop_loss) / trade.einstiegspreis) * 100

      const virtualId = `${trade.id}-sl`
      partialCloseLabels.set(virtualId, '(SL)')

      partialCloseEntries.push({
        ...trade,
        id: virtualId,
        ausstiegspreis: trade.stop_loss,
        datum_schliessung: trade.sl_erreicht_am.split('T')[0],
        performance_pct: Math.round(slPerfRaw * 100) / 100,
        status: 'Ausgestoppt',
        haltedauer_tage: calcHoldingDays(trade.datum_eroeffnung, trade.sl_erreicht_am),
      })
    }
  }

  // Include partial close entries in KPI calculations
  const tradesWithPartials = [...trades, ...partialCloseEntries]
  const kpis = calculateKPIs(tradesWithPartials)
  const monthly = calculateMonthlyPerformance(tradesWithPartials)
  const byAssetClass = calculateAssetClassPerformance(tradesWithPartials)

  const recentClosedTrades = [
    ...trades.filter((t) => t.status !== 'Aktiv'),
    ...partialCloseEntries,
  ]
    .sort((a, b) => {
      const dateA = a.datum_schliessung || a.datum_eroeffnung
      const dateB = b.datum_schliessung || b.datum_eroeffnung
      return dateB.localeCompare(dateA)
    })
    .slice(0, 15)

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
          <h1 className="text-2xl font-bold tracking-tight">Performance-Übersicht</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fugmanns Trading Woche
          </p>
        </div>
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
                <span className="font-semibold">
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

      {/* Active Trades (includes active setups) */}
      {(activeTrades.length > 0 || activeSetups.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Aktive Trades{' '}
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {activeTrades.length + activeSetups.length}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <RefreshPricesButton />
              <Link
                href={tradesHref}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Alle Trades
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <ActiveTradesTable
              trades={activeTrades}
              setups={activeSetups}
              activePrices={activePrices}
            />
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
            href={tradesHref}
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
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-16">ID</TableHead>
                  <TableHead>Basiswert</TableHead>
                  <TableHead className="w-14 text-right">Gew.</TableHead>
                  <TableHead>L/S</TableHead>
                  <TableHead>Eröffnung</TableHead>
                  <TableHead>Schließung</TableHead>
                  <TableHead className="text-right">Einstieg</TableHead>
                  <TableHead className="text-right">Ausstieg</TableHead>
                  <TableHead className="text-right">G/V</TableHead>
                  <TableHead className="text-right pr-6">Tage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentClosedTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {trade.trade_id ? trade.trade_id.replace(/^T-0*/, '') : '—'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{trade.asset}</span>
                        {partialCloseLabels.has(trade.id) && (
                          <span className={cn(
                            "ml-1.5 text-[10px] font-semibold",
                            partialCloseLabels.get(trade.id) === '(SL)' ? 'text-rose-600' : 'text-emerald-600'
                          )}>
                            {partialCloseLabels.get(trade.id)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {Math.round(trade.gewichtung * 100)}%
                    </TableCell>
                    <TableCell>
                      {trade.richtung && <DirectionBadge direction={trade.richtung} />}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(trade.datum_eroeffnung)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {trade.datum_schliessung ? formatDate(trade.datum_schliessung) : '—'}
                      </span>
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
                          className={cn(
                            "font-mono text-sm font-semibold",
                            trade.performance_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          )}
                        >
                          {trade.performance_pct >= 0 ? '+' : ''}
                          {trade.performance_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span className="text-sm text-muted-foreground">
                        {trade.haltedauer_tage === 0
                          ? '< 1'
                          : `${trade.haltedauer_tage}`}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
