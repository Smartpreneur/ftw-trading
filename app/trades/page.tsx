import { getTrades } from '@/lib/actions'
import { TradeTable } from '@/components/trades/TradeTable'
import type { TradingProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TradesPage({
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

      <TradeTable trades={trades} />
    </div>
  )
}
