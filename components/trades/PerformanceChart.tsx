'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Info } from 'lucide-react'
import type { MonthlyPerformance } from '@/lib/types'

interface PerformanceChartProps {
  data: MonthlyPerformance[]
}

/** Parse "Okt 2024" → { monthNum: 10, year: "24" } */
const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mär: 3, Apr: 4, Mai: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Okt: 10, Nov: 11, Dez: 12,
}

function parseMonth(label: string) {
  const parts = label.split(' ')
  return { monthNum: MONTH_MAP[parts[0]] ?? 0, year: parts[1]?.slice(2) ?? '' }
}

function MonthTick({ x, y, payload, data }: any) {
  const { monthNum, year } = parseMonth(payload.value)
  const idx = data.findIndex((d: any) => d.month === payload.value)
  const prevYear = idx > 0 ? parseMonth(data[idx - 1].month).year : null
  const showYear = year !== prevYear

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={11}
      >
        {monthNum}
      </text>
      {showYear && (
        <text
          x={0}
          y={0}
          dy={24}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={10}
          fontWeight={600}
        >
          {`'${year}`}
        </text>
      )}
    </g>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as MonthlyPerformance
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className={`font-medium ${d.avg_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        Ø {d.avg_pct >= 0 ? '+' : ''}{d.avg_pct.toFixed(2)} %
      </p>
      <p className="text-muted-foreground">
        {d.win_count}/{d.trade_count} Trades gewonnen
      </p>
    </div>
  )
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trade Performance / Monat</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Noch keine geschlossenen Trades
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base">Trade Performance / Monat</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Info zur Berechnung"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" className="text-sm space-y-2">
              <p>
                Gewichteter Durchschnitt der Trade-Performance pro Monat.
                Teilschließungen (z.B. 34% bei TP1) fließen anteilig ein –
                eine Position mit höherer Gewichtung beeinflusst den
                Durchschnitt stärker.
              </p>
              <p className="text-muted-foreground">
                Hat ein Trade mehrere Take-Profit-Ziele, wird jede erreichte
                Tranche mit ihrer jeweiligen Gewichtung einzeln verbucht.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 16, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={<MonthTick data={data} />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="avg_pct" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.avg_pct >= 0 ? '#10b981' : '#f43f5e'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
