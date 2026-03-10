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
} from '@/lib/calculations'
import { PerformanceChart } from '@/components/trades/PerformanceChart'
import { WinLossChart } from '@/components/trades/WinLossChart'
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
import { getCurrencySymbol } from '@/lib/asset-mapping'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Suspense } from 'react'
import { ProfileTabs } from '@/components/performance/ProfileTabs'
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
  // Default to "Gesamt" profiles (MB3 + SJ + SJ2) if none specified
  const selectedProfiles: TradingProfile[] = profilesParam
    ? (profilesParam.split(',') as TradingProfile[])
    : ['MB3', 'SJ', 'SJ2']
  const tradesHref = `/trades?profiles=${selectedProfiles.join(',')}`

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

  // SL-hit or fully-TP-reached trades are effectively closed → don't show in active
  const allAktiv = trades.filter((t) => t.status === 'Aktiv')
  const activeTrades = allAktiv.filter((t) => {
    if (t.sl_erreicht_am) return false
    // Check if all defined TPs are reached
    const definedTPs = [
      { level: t.tp1, hit: t.tp1_erreicht_am },
      { level: t.tp2, hit: t.tp2_erreicht_am },
      { level: t.tp3, hit: t.tp3_erreicht_am },
      { level: t.tp4, hit: t.tp4_erreicht_am },
    ].filter((tp) => tp.level != null)
    if (definedTPs.length > 0 && definedTPs.every((tp) => tp.hit)) return false
    return true
  })

  // Generate virtual close entries from TP hits and SL hits (all trades, not just active)
  const partialCloseEntries: typeof trades = []
  const partialCloseLabels = new Map<string, string>()
  const replacedTradeIds = new Set<string>()

  function calcHoldingDays(openDate: string, closeIso: string) {
    const close = closeIso.split('T')[0]
    return Math.max(1, Math.round(
      (new Date(close).getTime() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24)
    ))
  }

  for (const trade of trades) {
    if (!trade.einstiegspreis || !trade.richtung) continue

    // Trades with explicit partial weight (< 1) already represent partial positions
    // (e.g. DAX tranches: 50% at TP1, 25% at TP2, 25% at TP3).
    // Don't split them further into virtual entries.
    if (trade.gewichtung < 1) continue

    // TP partial close entries
    const tpLevels = [
      { key: 'tp1', level: trade.tp1, hitAt: trade.tp1_erreicht_am, label: 'TP1' },
      { key: 'tp2', level: trade.tp2, hitAt: trade.tp2_erreicht_am, label: 'TP2' },
      { key: 'tp3', level: trade.tp3, hitAt: trade.tp3_erreicht_am, label: 'TP3' },
      { key: 'tp4', level: trade.tp4, hitAt: trade.tp4_erreicht_am, label: 'TP4' },
    ]

    const hasAnyHit = tpLevels.some((tp) => tp.level && tp.hitAt) || (trade.sl_erreicht_am && trade.stop_loss)
    if (!hasAnyHit) continue

    replacedTradeIds.add(trade.id)

    // Distribute gewichtung evenly across defined TPs
    const definedTPCount = tpLevels.filter((tp) => tp.level != null).length
    const tpWeight = definedTPCount > 0
      ? Math.round((trade.gewichtung / definedTPCount) * 100) / 100
      : trade.gewichtung

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
        gewichtung: tpWeight,
        ausstiegspreis: tp.level,
        datum_schliessung: tp.hitAt.split('T')[0],
        performance_pct: Math.round(perfRaw * 100) / 100,
        status: 'Erfolgreich',
        haltedauer_tage: calcHoldingDays(trade.datum_eroeffnung, tp.hitAt),
      })
    }

    // SL close entry – remaining position after TP hits
    if (trade.sl_erreicht_am && trade.stop_loss) {
      const slPerfRaw =
        trade.richtung === 'LONG'
          ? ((trade.stop_loss - trade.einstiegspreis) / trade.einstiegspreis) * 100
          : ((trade.einstiegspreis - trade.stop_loss) / trade.einstiegspreis) * 100

      // SL weight = total weight minus weight of TPs already hit
      const hitsCount = tpLevels.filter((tp) => tp.level && tp.hitAt).length
      const slWeight = definedTPCount > 0
        ? Math.round(((definedTPCount - hitsCount) / definedTPCount) * trade.gewichtung * 100) / 100
        : trade.gewichtung

      const virtualId = `${trade.id}-sl`
      partialCloseLabels.set(virtualId, '(SL)')

      partialCloseEntries.push({
        ...trade,
        id: virtualId,
        gewichtung: slWeight,
        ausstiegspreis: trade.stop_loss,
        datum_schliessung: trade.sl_erreicht_am.split('T')[0],
        performance_pct: Math.round(slPerfRaw * 100) / 100,
        status: 'Ausgestoppt',
        haltedauer_tage: calcHoldingDays(trade.datum_eroeffnung, trade.sl_erreicht_am),
      })
    }
  }

  // Partial-weight active trades that are effectively closed (all TPs or SL hit)
  // These need to appear in "Letzte Trades" even though status is still 'Aktiv'
  const effectivelyClosedPartials: typeof trades = []
  for (const trade of trades) {
    if (trade.gewichtung >= 1 || trade.status !== 'Aktiv') continue
    if (!trade.einstiegspreis || !trade.richtung) continue

    const isSLHit = !!trade.sl_erreicht_am
    const definedTPs = [
      { level: trade.tp1, hit: trade.tp1_erreicht_am, label: 'TP1' },
      { level: trade.tp2, hit: trade.tp2_erreicht_am, label: 'TP2' },
      { level: trade.tp3, hit: trade.tp3_erreicht_am, label: 'TP3' },
      { level: trade.tp4, hit: trade.tp4_erreicht_am, label: 'TP4' },
    ].filter((tp) => tp.level != null)
    const allTPsHit = definedTPs.length > 0 && definedTPs.every((tp) => tp.hit)

    if (!isSLHit && !allTPsHit) continue

    // Determine highest reached TP for label and exit price
    const highestHitTP = [...definedTPs].reverse().find((tp) => tp.hit)
    if (highestHitTP) {
      partialCloseLabels.set(trade.id, `(${highestHitTP.label})`)
    } else if (isSLHit) {
      partialCloseLabels.set(trade.id, '(SL)')
    }

    // Compute performance from highest TP or SL
    const exitPrice = isSLHit && !allTPsHit
      ? trade.stop_loss
      : highestHitTP?.level ?? trade.ausstiegspreis
    let perfPct = trade.performance_pct
    if (perfPct === null && exitPrice && trade.einstiegspreis) {
      const raw = trade.richtung === 'LONG'
        ? ((exitPrice - trade.einstiegspreis) / trade.einstiegspreis) * 100
        : ((trade.einstiegspreis - exitPrice) / trade.einstiegspreis) * 100
      perfPct = Math.round(raw * 100) / 100
    }

    const hitDate = isSLHit && !allTPsHit
      ? trade.sl_erreicht_am!
      : highestHitTP?.hit ?? trade.datum_eroeffnung

    effectivelyClosedPartials.push({
      ...trade,
      ausstiegspreis: exitPrice,
      performance_pct: perfPct,
      datum_schliessung: hitDate.split('T')[0],
      haltedauer_tage: calcHoldingDays(trade.datum_eroeffnung, hitDate),
    })
  }

  // Add TP/SL labels for closed trades that weren't split into virtual entries
  // (e.g. older trades without auto-detection timestamps, or closed partial-weight trades)
  for (const trade of trades) {
    if (replacedTradeIds.has(trade.id)) continue
    if (partialCloseLabels.has(trade.id)) continue
    if (!trade.einstiegspreis || !trade.richtung) continue

    // Check TP hit timestamps first
    const tps = [
      { level: trade.tp1, hit: trade.tp1_erreicht_am, label: 'TP1' },
      { level: trade.tp2, hit: trade.tp2_erreicht_am, label: 'TP2' },
      { level: trade.tp3, hit: trade.tp3_erreicht_am, label: 'TP3' },
      { level: trade.tp4, hit: trade.tp4_erreicht_am, label: 'TP4' },
    ]
    const highestHitTP = [...tps].filter(tp => tp.level != null && tp.hit).pop()
    if (highestHitTP) {
      partialCloseLabels.set(trade.id, `(${highestHitTP.label})`)
      continue
    }

    // SL hit timestamp
    if (trade.sl_erreicht_am) {
      partialCloseLabels.set(trade.id, '(SL)')
      continue
    }

    // For closed trades without timestamps, derive label from status + exit price
    if (trade.status === 'Ausgestoppt') {
      partialCloseLabels.set(trade.id, '(SL)')
      continue
    }
    if (trade.status === 'Erfolgreich' && trade.ausstiegspreis) {
      // Match exit price to closest TP level (within 0.5% tolerance)
      for (const tp of [...tps].reverse()) {
        if (tp.level != null && Math.abs(trade.ausstiegspreis - tp.level) / tp.level < 0.005) {
          partialCloseLabels.set(trade.id, `(${tp.label})`)
          break
        }
      }
    }
  }

  // KPI calculations: replace original trades that have virtual entries to avoid double-counting
  const tradesWithPartials = [
    ...trades.filter((t) => !replacedTradeIds.has(t.id)),
    ...partialCloseEntries,
    ...effectivelyClosedPartials,
  ]
  const kpis = calculateKPIs(tradesWithPartials)
  const monthly = calculateMonthlyPerformance(tradesWithPartials)

  const RECENT_TRADES_CUTOFF = '2026-01-01'

  const recentClosedTrades = [
    ...trades.filter((t) => t.status !== 'Aktiv' && !replacedTradeIds.has(t.id)),
    ...partialCloseEntries,
    ...effectivelyClosedPartials,
  ]
    .filter((t) => {
      const closeDate = t.datum_schliessung || t.datum_eroeffnung
      return closeDate >= RECENT_TRADES_CUTOFF
    })
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance-Übersicht</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fugmanns Trading Woche
          </p>
        </div>
        <Suspense fallback={<div className="h-9 w-64 bg-muted animate-pulse rounded-lg" />}>
          <ProfileTabs />
        </Suspense>
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
        <WinLossChart data={monthly} />
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
            <span className="text-xs font-normal text-muted-foreground">ab Jan 2026</span>
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
                        {trade.einstiegspreis
                          ? `${getCurrencySymbol(trade.asset, trade.asset_klasse)}${formatPrice(trade.einstiegspreis)}`
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.ausstiegspreis
                          ? `${getCurrencySymbol(trade.asset, trade.asset_klasse)}${formatPrice(trade.ausstiegspreis)}`
                          : '—'}
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
