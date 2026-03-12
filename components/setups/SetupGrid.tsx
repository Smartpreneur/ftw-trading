import { SetupCard } from './SetupCard'
import type { Trade } from '@/lib/types'

interface SetupGridProps {
  setups: Trade[]
  isAdmin?: boolean
}

export function SetupGrid({ setups, isAdmin = false }: SetupGridProps) {
  if (setups.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Noch keine Trade-Setups vorhanden.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Erstelle dein erstes Setup mit dem "Neues Setup" Button.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {setups.map((setup) => (
        <SetupCard key={setup.id} setup={setup} isAdmin={isAdmin} />
      ))}
    </div>
  )
}
