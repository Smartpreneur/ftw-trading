import { getSetups } from '@/lib/setup-actions'
import { SetupGrid } from '@/components/setups/SetupGrid'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function SetupsPage() {
  let setups: Awaited<ReturnType<typeof getSetups>> = []
  let error: string | null = null

  try {
    setups = await getSetups()
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
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Neues Setup
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error} — Bitte Supabase-Credentials in <code>.env.local</code> prüfen.
        </div>
      )}

      <SetupGrid setups={setups} />
    </div>
  )
}
