import { getCachedTrades } from '@/lib/actions'
import { SetupGrid } from '@/components/setups/SetupGrid'
import { SetupDialog } from '@/components/setups/SetupDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { checkAdmin } from '@/lib/auth'
import type { Trade, TradingProfile } from '@/lib/types'

const SETUP_STATUSES = ['Entwurf'] as const

export default async function SetupsPage({
  searchParams,
}: {
  searchParams: Promise<{ profiles?: string; dev?: string }>
}) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) return <div className="py-16 text-center text-sm text-muted-foreground">Kein Zugriff.</div>

  const params = await searchParams
  const profilesParam = params.profiles
  const devMode = params.dev === '1'
  const selectedProfiles = profilesParam?.split(',') as TradingProfile[] | undefined

  let setups: Trade[] = []
  let error: string | null = null

  try {
    const allTrades = await getCachedTrades()
    setups = allTrades.filter((t) =>
      (SETUP_STATUSES as readonly string[]).includes(t.status)
    )
    if (selectedProfiles && selectedProfiles.length > 0) {
      setups = setups.filter((t) => selectedProfiles.includes(t.profil))
    }
  } catch (e: any) {
    error = e?.message ?? 'Fehler beim Laden der Setups'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade-Setups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aktuelle Trading-Signale und Setup-Analysen
          </p>
        </div>
        {isAdmin && (
          <SetupDialog
            trigger={
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                Neues Setup
              </Button>
            }
          />
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} — Bitte Supabase-Credentials in <code>.env.local</code> prüfen.
        </div>
      )}

      <SetupGrid setups={setups} isAdmin={isAdmin} devMode={devMode} />
    </div>
  )
}
