import { getTrades } from '@/lib/actions'
import { TradeTable } from '@/components/trades/TradeTable'
import { checkAuth, checkAdmin } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'
import type { TradingProfile } from '@/lib/types'
import { ACTIVE_PROFILES } from '@/lib/profile-tabs'
import { TRADING_PROFILES } from '@/lib/constants'

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ profiles?: string; token?: string }>
}) {
  const params = await searchParams
  const isAuthed = await checkAuth(params.token)
  if (!isAuthed) return <PasswordGate />

  const isAdmin = await checkAdmin()

  const profilesParam = params.profiles
  const selectedProfiles = profilesParam?.split(',') as TradingProfile[] | undefined

  // Admin sees all profiles; public sees only enabled profiles
  const availableProfiles = isAdmin ? TRADING_PROFILES : ACTIVE_PROFILES
  const profilesToLoad = selectedProfiles ?? availableProfiles

  let trades: Awaited<ReturnType<typeof getTrades>> = []
  let error: string | null = null

  try {
    const SETUP_STATUSES = ['Entwurf', 'Setup', 'Ausstehend']
    const allTrades = await getTrades(profilesToLoad)
    // Only show trades opened or closed in 2026+, exclude setup statuses
    trades = allTrades.filter(
      (t) => !SETUP_STATUSES.includes(t.status) &&
             (t.datum_eroeffnung >= '2026-01-01' || (t.datum_schliessung ?? '') >= '2026-01-01')
    )
  } catch (e: any) {
    error = e?.message ?? 'Fehler beim Laden'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alle Trades verwalten, filtern und analysieren
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} — Bitte Supabase-Credentials in <code>.env.local</code> prüfen.
        </div>
      )}

      <TradeTable trades={trades} initialProfiles={selectedProfiles} availableProfiles={availableProfiles} isAdmin={isAdmin} />
    </div>
  )
}
