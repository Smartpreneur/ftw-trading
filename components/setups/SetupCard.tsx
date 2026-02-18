import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DirectionBadge } from '@/components/trades/DirectionBadge'
import { formatPrice } from '@/lib/formatters'
import { Clock, Target, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

interface SetupCardProps {
  setup: Setup
}

export function SetupCard({ setup }: SetupCardProps) {
  const isLong = setup.richtung === 'LONG'
  const formattedDate = new Date(setup.datum).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-lg leading-none">{setup.asset}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-xs">
                {setup.asset_klasse}
              </Badge>
              <DirectionBadge direction={setup.richtung} />
              <Badge
                variant={setup.status === 'Aktiv' ? 'default' : 'outline'}
                className="text-xs"
              >
                {setup.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Aktueller Kurs</p>
            <p className="text-lg font-bold tabular-nums">{formatPrice(setup.aktueller_kurs)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entry Zone */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-blue-600" />
            <span>Einstiegszone</span>
          </div>
          <div className="bg-blue-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Von</span>
              <span className="font-mono font-semibold">{formatPrice(setup.einstieg_von)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Bis</span>
              <span className="font-mono font-semibold">{formatPrice(setup.einstieg_bis)}</span>
            </div>
          </div>
        </div>

        {/* Take-Profit Levels */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isLong ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            )}
            <span>Take-Profit Ziele</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-0.5">TP1</p>
              <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp1)}</p>
            </div>
            <div className="bg-emerald-50 rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-0.5">TP2</p>
              <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp2)}</p>
            </div>
            <div className="bg-emerald-50 rounded-md p-2">
              <p className="text-xs text-muted-foreground mb-0.5">TP3</p>
              <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp3)}</p>
            </div>
            {setup.tp4 && (
              <div className="bg-emerald-50 rounded-md p-2">
                <p className="text-xs text-muted-foreground mb-0.5">TP4</p>
                <p className="font-mono font-semibold text-sm">{formatPrice(setup.tp4)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stop-Loss */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            <span>Stop-Loss</span>
          </div>
          <div className="bg-rose-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SL neu</span>
              <span className="font-mono font-semibold text-rose-700">
                {formatPrice(setup.stop_loss)}
              </span>
            </div>
          </div>
        </div>

        {/* Risk/Reward & Timing */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>CRV</span>
            </div>
            <p className="font-semibold">
              {setup.risiko_reward_min.toFixed(1)} - {setup.risiko_reward_max.toFixed(1)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Zeitrahmen</span>
            </div>
            <p className="font-semibold">{setup.zeiteinheit}</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-2 border-t space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Dauer:</span> {setup.dauer_erwartung}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Erstellt:</span> {formattedDate}
          </p>
          {setup.bemerkungen && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              {setup.bemerkungen}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
