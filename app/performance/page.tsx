import type { Metadata } from 'next'
import { getCachedTrades } from '@/lib/actions'
import { getCachedSetups } from '@/lib/setup-actions'
import { checkAuth, checkAdmin } from '@/lib/auth'
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
import { RefreshPricesButton } from '@/components/trades/RefreshPricesButton'
import { ActiveTradesTable } from '@/components/trades/ActiveTradesTable'
import { RecentTradesSection } from '@/components/trades/RecentTradesSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Suspense } from 'react'
import { ProfileTabs } from '@/components/performance/ProfileTabs'
import { resolveTab } from '@/lib/profile-tabs'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  const isAdmin = await checkAdmin()
  const params = await searchParams
  const tabConfig = resolveTab(params.tab)

  let kpiTrades: Awaited<ReturnType<typeof getCachedTrades>> = []
  let activePrices: Awaited<ReturnType<typeof getActiveTradePrices>> = []
  let allSetups: Awaited<ReturnType<typeof getCachedSetups>> = []
  let error: string | null = null

  // Fetch KPI trades (all historical), prices, and setups in parallel
  try {
    const [kpiResult, pricesResult, setupsResult] = await Promise.all([
      getCachedTrades(tabConfig.kpiProfiles),
      getActiveTradePrices(),
      getCachedSetups(tabConfig.listProfiles),
    ])
    kpiTrades = kpiResult
    activePrices = pricesResult
    allSetups = setupsResult
  } catch (e: any) {
    error = e?.message ?? 'Fehler beim Laden der Daten'
  }

  // Filter list-profile trades from kpiTrades for trade lists
  const listProfileSet = new Set(tabConfig.listProfiles)
  const listTrades = kpiTrades.filter((t) => listProfileSet.has(t.profil))
  const activeSetups = allSetups.filter(s => s.status === 'Aktiv')

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

  // Generate virtual close entries from TP hits and SL hits (all KPI trades)
  const partialCloseEntries: typeof kpiTrades = []
  const partialCloseLabels = new Map<string, string>()
  const replacedTradeIds = new Set<string>()

  function calcHoldingDays(openDate: string, closeIso: string) {
    const close = closeIso.split('T')[0]
    return Math.max(1, Math.round(
      (new Date(close).getTime() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24)
    ))
  }

  for (const trade of kpiTrades) {
    if (!trade.einstiegspreis || !trade.richtung) continue

    // Trades with explicit partial weight (< 1) already represent partial positions
    if (trade.gewichtung < 1) continue

    // TP partial close entries with per-TP weights
    const tpLevels = [
      { key: 'tp1', level: trade.tp1, hitAt: trade.tp1_erreicht_am, label: 'TP1', weight: trade.tp1_gewichtung },
      { key: 'tp2', level: trade.tp2, hitAt: trade.tp2_erreicht_am, label: 'TP2', weight: trade.tp2_gewichtung },
      { key: 'tp3', level: trade.tp3, hitAt: trade.tp3_erreicht_am, label: 'TP3', weight: trade.tp3_gewichtung },
      { key: 'tp4', level: trade.tp4, hitAt: trade.tp4_erreicht_am, label: 'TP4', weight: trade.tp4_gewichtung },
    ]

    const hasAnyHit = tpLevels.some((tp) => tp.level && tp.hitAt) || (trade.sl_erreicht_am && trade.stop_loss)
    if (!hasAnyHit) continue

    replacedTradeIds.add(trade.id)

    // Fallback: distribute evenly if no tp_gewichtung set
    const definedTPs = tpLevels.filter((tp) => tp.level != null)
    const evenWeight = definedTPs.length > 0
      ? Math.round((trade.gewichtung / definedTPs.length) * 100) / 100
      : trade.gewichtung

    for (const tp of tpLevels) {
      if (!tp.level || !tp.hitAt) continue

      // Use stored tp_gewichtung (as fraction of total), fallback to even split
      const tpWeight = tp.weight != null
        ? Math.round(tp.weight * trade.gewichtung * 100) / 100
        : evenWeight

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

      // SL weight = total weight minus weight of all TPs that were hit
      const hitTpWeight = tpLevels
        .filter((tp) => tp.level && tp.hitAt)
        .reduce((sum, tp) => sum + (tp.weight != null ? tp.weight * trade.gewichtung : evenWeight), 0)
      const slWeight = Math.round(Math.max(0, trade.gewichtung - hitTpWeight) * 100) / 100

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
  const effectivelyClosedPartials: typeof kpiTrades = []
  for (const trade of kpiTrades) {
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
  for (const trade of kpiTrades) {
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

  // KPI calculations: use all KPI trades with virtual entries (exclude Ungültig)
  const tradesWithPartials = [
    ...kpiTrades.filter((t) => !replacedTradeIds.has(t.id) && t.status !== 'Ungültig'),
    ...partialCloseEntries,
    ...effectivelyClosedPartials,
  ]
  const kpis = calculateKPIs(tradesWithPartials)
  const monthly = calculateMonthlyPerformance(tradesWithPartials)

  // Trade-Ideen counts (original trades, excluding Ungültig)
  const tradeIdeen = kpiTrades.filter((t) => t.status !== 'Ungültig')
  const tradeIdeenGesamt = tradeIdeen.length
  const tradeIdeenGeschlossen = tradeIdeen.filter((t) => t.status !== 'Aktiv').length
  const tradeIdeenOffen = tradeIdeen.filter((t) => t.status === 'Aktiv').length

  const RECENT_TRADES_CUTOFF = '2026-01-01'

  // Recent trades list: only list-profile trades from 2026+
  const recentClosedTrades = [
    ...listTrades.filter((t) => t.status !== 'Aktiv' && !replacedTradeIds.has(t.id)),
    ...partialCloseEntries.filter((t) => listProfileSet.has(t.profil)),
    ...effectivelyClosedPartials.filter((t) => listProfileSet.has(t.profil)),
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
            <CardTitle className="text-base">
              Aktive Trades{' '}
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {activeTrades.length}
              </span>
            </CardTitle>
            <RefreshPricesButton />
          </CardHeader>
          <CardContent className="px-0">
            <ActiveTradesTable
              trades={activeTrades}
              setups={[]}
              activePrices={activePrices}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      )}

      <RecentTradesSection
        trades={recentClosedTrades}
        partialCloseLabels={Object.fromEntries(partialCloseLabels)}
        isAdmin={isAdmin}
      />
    </div>
  )
}
