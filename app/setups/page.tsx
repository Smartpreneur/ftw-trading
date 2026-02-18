import { SetupGrid } from '@/components/setups/SetupGrid'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Beispiel-Daten (später aus Datenbank laden)
const exampleSetups = [
  {
    id: '1',
    asset: 'Gold - TVC (TradingView)',
    asset_klasse: 'Rohstoff' as const,
    datum: '2025-02-17T09:25:00',
    aktueller_kurs: 4925,
    richtung: 'SHORT' as const,
    einstieg_von: 4995,
    einstieg_bis: 5030,
    stop_loss: 4975,
    tp1: 4895,
    tp2: 4845,
    tp3: 4821,
    tp4: 4800,
    risiko_reward_min: 2.0,
    risiko_reward_max: 4.0,
    zeiteinheit: 'H1',
    dauer_erwartung: 'wenige Tage',
    status: 'Aktiv' as const,
    bemerkungen: 'Short-Einstieg nach Rejection an der 5.000er Marke',
    chart_bild_url: '/placeholder-chart.svg', // Platzhalter - später echte Charts
  },
]

export default function SetupsPage() {
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

      <SetupGrid setups={exampleSetups} />
    </div>
  )
}
