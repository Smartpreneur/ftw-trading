'use client'

import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'
import type { TradeSetup } from '@/lib/types'

interface ActiveSetupsProps {
  setups: TradeSetup[]
}

export function ActiveSetups({ setups }: ActiveSetupsProps) {
  if (setups.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-blue-500" />
        <h2 className="text-sm font-semibold">Aktive Setups ({setups.length})</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {setups.map((setup) => {
          const isLong = setup.richtung === 'LONG'
          return (
            <a
              key={setup.id}
              href="/setups"
              className="block rounded-lg border bg-card p-3 hover:shadow-md transition-shadow space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm truncate">{setup.asset}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {setup.asset_klasse}
                  </Badge>
                </div>
                <Badge
                  className={`text-[10px] shrink-0 ${
                    isLong
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isLong ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {setup.richtung}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Einstieg</span>
                  <p className="font-mono font-medium">
                    {formatPrice(setup.einstiegskurs)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">SL</span>
                  <p className="font-mono font-medium text-rose-600">{setup.stop_loss != null ? formatPrice(setup.stop_loss) : '–'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">TP1</span>
                  <p className="font-mono font-medium text-emerald-600">{formatPrice(setup.tp1)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>CRV {setup.risiko_reward_min.toFixed(1)}–{setup.risiko_reward_max.toFixed(1)}</span>
                <span>{setup.zeiteinheit}</span>
                <Badge variant="outline" className="text-[10px]">{setup.profil}</Badge>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
