import type { Metadata } from 'next'
import { after } from 'next/server'
import { getCachedTrades } from '@/lib/actions'
import { getCachedActivePrices, triggerPriceRefreshIfStale } from '@/lib/price-actions'
import { checkAdmin, checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'
import {
  calculateKPIs,
  calculateMonthlyPerformance,
} from '@/lib/calculations'
import { PerformanceChart } from '@/components/trades/PerformanceChart'
import { WinLossChart } from '@/components/trades/WinLossChart'
import { WinRateGauge } from '@/components/trades/WinRateGauge'
import { RefreshPricesButton } from '@/components/trades/RefreshPricesButton'
import { ActiveTradesTable } from '@/components/trades/ActiveTradesTable'
import { RecentTradesSection } from '@/components/trades/RecentTradesSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Suspense } from 'react'
import { ProfileTabs } from '@/components/performance/ProfileTabs'
import { resolveTab } from '@/lib/profile-tabs'

export const metadata: Metadata = {
  title: 'Performance-Übersicht | FTW Trading',
  description: 'Persönliches Trading-Tagebuch mit Performance-Analyse',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; token?: string }>
}) {
  const params = await searchParams
  const isAuthed = await checkAuth(params.token)
  if (!isAuthed) return <PasswordGate />

  const isAdmin = await checkAdmin()
  const tabConfig = resolveTab(params.tab, isAdmin)

  let allTrades: Awaited<ReturnType<typeof getCachedTrades>> = []
  let activePrices: Awaited<ReturnType<typeof getCachedActivePrices>> = []
  let error: string | null = null

  // Single cached fetch for all trades + cached prices — both served from memory when warm
  try {
    ;[allTrades, activePrices] = await Promise.all([
      getCachedTrades(),
      getCachedActivePrices(),
    ])
  } catch (e: any) {
    error = e?.message ?? 'Fehler beim Laden der Daten'
  }

  // After response is sent: check if prices are stale and update in background (fire-and-forget)
  // Runs at most once per 15 minutes per visitor — never blocks the page render
  after(() => triggerPriceRefreshIfStale())

  // Filter in-memory by tab profiles (no DB round-trip)
  const kpiProfileSet = new Set(tabConfig.kpiProfiles)
  const listProfileSet = new Set(tabConfig.listProfiles)
  const SETUP_STATUSES = ['Entwurf', 'Setup', 'Ausstehend']
  const kpiTrades = allTrades.filter((t) => kpiProfileSet.has(t.profil) && !SETUP_STATUSES.includes(t.status))
  const listTrades = allTrades.filter((t) => listProfileSet.has(t.profil) && !SETUP_STATUSES.includes(t.status))

  // SL-hit or fully-TP-reached trades are effectively closed → don't show in active
  const allAktiv = listTrades.filter((t) => t.status === 'Aktiv')
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

  // Aggregate unrealized P&L across active trades with known prices
  const activePriceMap = new Map(activePrices.map((p) => [p.trade_id, p.current_price]))
  let totalUnrealizedPct = 0
  let pricedCount = 0
  for (const trade of activeTrades) {
    const currentPrice = activePriceMap.get(trade.id)
    if (!currentPrice || !trade.einstiegspreis || !trade.richtung) continue
    const pct = trade.richtung === 'LONG'
      ? (currentPrice - trade.einstiegspreis) / trade.einstiegspreis * 100
      : (trade.einstiegspreis - currentPrice) / trade.einstiegspreis * 100
    totalUnrealizedPct += pct
    pricedCount++
  }
  const avgUnrealizedPct = pricedCount > 0 ? totalUnrealizedPct / pricedCount : null

  // Labels for display (e.g. "(TP1)", "(SL)") keyed by entry id
  const partialCloseLabels = new Map<string, string>()

  function calcHoldingDays(openDate: string, closeIso: string) {
    const close = closeIso.split('T')[0]
    return Math.max(1, Math.round(
      (new Date(close).getTime() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24)
    ))
  }

  // Helper: build a display/KPI entry from a single trade_close row
  function makeCloseEntry(
    trade: (typeof kpiTrades)[number],
    close: { id: string; ausstiegspreis: number | null; anteil: number | null; datum: string; typ: string | null; nummer: number | null },
    idPrefix: string
  ) {
    const perfRaw = trade.richtung === 'LONG'
      ? ((close.ausstiegspreis! - trade.einstiegspreis!) / trade.einstiegspreis!) * 100
      : ((trade.einstiegspreis! - close.ausstiegspreis!) / trade.einstiegspreis!) * 100
    return {
      ...trade,
      id: `${trade.id}-${idPrefix}-${close.id}`,
      gewichtung: Math.round(close.anteil! * trade.gewichtung * 100) / 100,
      ausstiegspreis: close.ausstiegspreis,
      datum_schliessung: close.datum,
      effective_datum_schliessung: close.datum,
      effective_ausstiegspreis: close.ausstiegspreis,
      performance_pct: Math.round(perfRaw * 100) / 100,
      haltedauer_tage: calcHoldingDays(trade.datum_eroeffnung, close.datum),
    }
  }

  // KPI: realized partial closes on ACTIVE trades count toward monthly performance
  const kpiReplacedIds = new Set<string>()
  const kpiCloseEntries: typeof kpiTrades = []

  for (const trade of kpiTrades) {
    if (trade.status !== 'Aktiv' || !trade.einstiegspreis || !trade.richtung) continue
    const closesWithData = (trade.closes ?? []).filter(
      (c) => c.ausstiegspreis != null && c.anteil != null
    )
    if (closesWithData.length === 0) continue
    kpiReplacedIds.add(trade.id)
    const sorted = [...closesWithData].sort((a, b) => (a.nummer ?? 0) - (b.nummer ?? 0))
    for (const close of sorted) {
      const entry = makeCloseEntry(trade, close, 'kpi')
      if (close.typ) partialCloseLabels.set(entry.id, `(${close.typ})`)
      kpiCloseEntries.push({ ...entry, status: 'Geschlossen' })
    }
  }

  // Display: expand trades with 2+ closes into individual rows in "Letzte Trades"
  const closesExpandedIds = new Set<string>()
  const closesExpandedEntries: typeof listTrades = []

  for (const trade of listTrades) {
    if (!trade.einstiegspreis || !trade.richtung) continue
    const closesWithData = (trade.closes ?? []).filter(
      (c) => c.ausstiegspreis != null && c.anteil != null
    )
    if (closesWithData.length < 2) continue
    closesExpandedIds.add(trade.id)
    const sorted = [...closesWithData].sort((a, b) => (a.nummer ?? 0) - (b.nummer ?? 0))
    for (const close of sorted) {
      const entry = makeCloseEntry(trade, close, 'close')
      if (close.typ) partialCloseLabels.set(entry.id, `(${close.typ})`)
      closesExpandedEntries.push(entry)
    }
  }

  // Labels for single-close trades (show close type next to asset name)
  for (const trade of listTrades) {
    if (closesExpandedIds.has(trade.id) || partialCloseLabels.has(trade.id)) continue
    const closes = (trade.closes ?? []).filter(c => c.ausstiegspreis != null && c.anteil != null)
    if (closes.length === 1 && closes[0].typ) {
      partialCloseLabels.set(trade.id, `(${closes[0].typ})`)
    }
  }

  // KPI calculations: closed trades (enrichTrade gives correct weighted perf) +
  // realized close entries from active trades
  const tradesForKpi = [
    ...kpiTrades.filter((t) => !kpiReplacedIds.has(t.id) && t.status !== 'Ungültig'),
    ...kpiCloseEntries,
  ]
  const kpis = calculateKPIs(tradesForKpi)
  const monthly = calculateMonthlyPerformance(tradesForKpi)

  // Trade-Ideen counts (original trades only, excluding Ungültig)
  const tradeIdeen = kpiTrades.filter((t) => t.status !== 'Ungültig')
  const tradeIdeenGesamt = tradeIdeen.length
  const tradeIdeenGeschlossen = tradeIdeen.filter((t) => t.status !== 'Aktiv').length
  const tradeIdeenOffen = tradeIdeen.filter((t) => t.status === 'Aktiv').length

  const RECENT_TRADES_CUTOFF = '2026-01-01'

  // Recent trades list: only list-profile trades from 2026+ with known performance
  const recentClosedTrades = [
    ...listTrades.filter(
      (t) => t.status !== 'Aktiv' && !closesExpandedIds.has(t.id)
    ),
    ...closesExpandedEntries,
  ]
    .filter((t) => {
      const closeDate = t.effective_datum_schliessung || t.datum_schliessung || t.datum_eroeffnung
      return closeDate >= RECENT_TRADES_CUTOFF
    })
    .sort((a, b) => {
      const dateA = a.effective_datum_schliessung || a.datum_schliessung || a.datum_eroeffnung
      const dateB = b.effective_datum_schliessung || b.datum_schliessung || b.datum_eroeffnung
      return dateB.localeCompare(dateA)
    })

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
          <ProfileTabs isAdmin={isAdmin} />
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
                <span className="font-semibold">{tradeIdeenGesamt}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Geschlossen</span>
                <span className="font-semibold">{tradeIdeenGeschlossen}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Offen</span>
                <span className="font-semibold">{tradeIdeenOffen}</span>
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance + Asset Class side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart data={monthly} />
        <WinLossChart data={monthly} />
      </div>

      {/* Active Trades */}
      {activeTrades.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">
                Aktive Trades{' '}
                <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {activeTrades.length}
                </span>
              </CardTitle>
              {avgUnrealizedPct !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ø G/V aktuell:{' '}
                  <span className={`font-semibold font-mono ${avgUnrealizedPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {avgUnrealizedPct >= 0 ? '+' : ''}{avgUnrealizedPct.toFixed(2)}%
                  </span>
                  <span className="ml-1.5 text-muted-foreground/60">({pricedCount} von {activeTrades.length} bewertet)</span>
                </p>
              )}
            </div>
            <RefreshPricesButton />
          </CardHeader>
          <CardContent className="px-0">
            <ActiveTradesTable
              trades={activeTrades}
              activePrices={activePrices}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground">
        <p>Hinweis: Diese Übersicht dient zu Informationszwecken. Maßgeblich sind die offiziell versendeten Ausgaben und Eilmeldungen.</p>
        <details className="mt-1">
          <summary className="cursor-pointer hover:text-foreground transition-colors">
            Mehr erfahren
          </summary>
          <p className="mt-2 leading-relaxed">
            Diese Übersicht erhebt keinen Anspruch auf Vollständigkeit oder Richtigkeit.
            Trotz sorgfältiger Pflege können die angezeigten Kursdaten und Performancewerte
            von den tatsächlichen Werten abweichen. Maßgeblich sind stets die Informationen
            aus den offiziell versendeten Ausgaben und Eilmeldungen von &bdquo;Fugmann&apos;s
            Trading Woche&ldquo;. Bei Abweichungen gelten ausschließlich diese als verbindlich.
          </p>
        </details>
      </div>

      <RecentTradesSection
        trades={recentClosedTrades}
        partialCloseLabels={Object.fromEntries(partialCloseLabels)}
        isAdmin={isAdmin}
        showProfile={tabConfig.listProfiles.length > 1}
        token={params.token}
      />
    </div>
  )
}
