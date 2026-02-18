'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { PerformanceKPIs } from '@/lib/types'

interface WinRateGaugeProps {
  kpis: PerformanceKPIs
}

export function WinRateGauge({ kpis }: WinRateGaugeProps) {
  const winRate = kpis.win_rate
  const closed = kpis.closed_trades
  const wins = Math.round((winRate / 100) * closed)
  const losses = closed - wins

  // SVG circle gauge
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const winFillOffset = circumference - (winRate / 100) * circumference
  const lossFillOffset = 0
  const lossFillLength = (winRate / 100) * circumference

  const gaugeColor = winRate >= 60 ? '#10b981' : winRate >= 50 ? '#f59e0b' : '#f43f5e'

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: label + counts + percentage */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Trade Win %</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 min-w-[28px]">
                {wins}
              </span>
              <span className="inline-flex items-center justify-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 min-w-[28px]">
                {losses}
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: gaugeColor }}>
              {winRate.toFixed(2)} %
            </p>
            <p className="text-xs text-muted-foreground">{closed} geschlossene Trades</p>
          </div>

          {/* Right: circular gauge */}
          <div className="relative shrink-0">
            <svg width="100" height="100" className="-rotate-90">
              {/* Loss portion (red) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={lossFillOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              {/* Win portion (green) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={winFillOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold tabular-nums text-foreground">
                {winRate.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
