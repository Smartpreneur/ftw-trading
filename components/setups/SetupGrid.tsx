import { SetupCard } from './SetupCard'

interface Setup {
  id: string
  asset: string
  asset_klasse: string
  datum: string
  aktueller_kurs: number
  richtung: 'LONG' | 'SHORT'
  einstieg_von: number
  einstieg_bis: number
  stop_loss: number
  tp1: number
  tp2: number
  tp3: number
  tp4?: number
  risiko_reward_min: number
  risiko_reward_max: number
  zeiteinheit: string
  dauer_erwartung: string
  status: 'Aktiv' | 'Getriggert' | 'Abgelaufen'
  bemerkungen?: string
  chart_bild_url?: string
}

interface SetupGridProps {
  setups: Setup[]
}

export function SetupGrid({ setups }: SetupGridProps) {
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
        <SetupCard key={setup.id} setup={setup} />
      ))}
    </div>
  )
}
