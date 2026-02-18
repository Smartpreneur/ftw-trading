import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/formatters'
import { Clock, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react'
import Image from 'next/image'

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

interface SetupCardProps {
  setup: Setup
}

export function SetupCard({ setup }: SetupCardProps) {
  const isLong = setup.richtung === 'LONG'

  // Format date consistently to avoid hydration mismatch
  const date = new Date(setup.datum)
  const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <h3 className="font-semibold text-base leading-tight">{setup.asset}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {setup.asset_klasse}
              </Badge>
              <Badge
                variant={setup.status === 'Aktiv' ? 'default' : 'outline'}
                className="text-xs"
              >
                {setup.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Kurs bei Signal</p>
            <p className="text-base font-bold tabular-nums">{formatPrice(setup.aktueller_kurs)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Setup Direction & Entry */}
        <div className="space-y-1.5">
          <p className="text-sm">
            <span className="font-medium">Setup:</span>{' '}
            <span className={isLong ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
              {setup.richtung}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Einstieg:</span>{' '}
            <span className="font-mono font-semibold">
              {formatPrice(setup.aktueller_kurs)} ({formatPrice(setup.einstieg_von)} - {formatPrice(setup.einstieg_bis)})
            </span>
          </p>
        </div>

        {/* Take-Profit Levels */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isLong ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            )}
            <span>Take-Profit</span>
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
        <p className="text-sm">
          <span className="font-medium">SL:</span>{' '}
          <span className="font-mono font-semibold text-rose-600">
            {formatPrice(setup.stop_loss)}
          </span>
        </p>

        {/* Risk/Reward & Timing */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <BarChart3 className="h-3 w-3" />
              <span>CRV</span>
            </div>
            <p className="font-semibold text-sm">
              {setup.risiko_reward_min.toFixed(1)}-{setup.risiko_reward_max.toFixed(1)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Clock className="h-3 w-3" />
              <span>Zeiteinheit</span>
            </div>
            <p className="font-semibold text-sm">{setup.zeiteinheit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Dauer</p>
            <p className="font-semibold text-sm">{setup.dauer_erwartung}</p>
          </div>
        </div>

        {/* Chart Image */}
        {setup.chart_bild_url && (
          <div className="pt-2 border-t">
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
              <Image
                src={setup.chart_bild_url}
                alt={`Chart für ${setup.asset}`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Bemerkungen */}
        {setup.bemerkungen && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {setup.bemerkungen}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-muted-foreground">
          {formattedDate}
        </p>
      </CardContent>
    </Card>
  )
}
