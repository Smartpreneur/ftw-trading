'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Info } from 'lucide-react'
import type { MonthlyPerformance } from '@/lib/types'

interface WinLossChartProps {
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
  const wins = payload.find((p: any) => p.dataKey === 'win_count')?.value ?? 0
  const losses = payload.find((p: any) => p.dataKey === 'loss_count')?.value ?? 0
  const total = wins + losses
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-emerald-600">{wins} Gewinner</p>
      <p className="text-rose-600">{losses} Verlierer</p>
      <p className="text-muted-foreground mt-1">{winRate}% Win Rate</p>
    </div>
  )
}

export function WinLossChart({ data }: WinLossChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Win/Loss Verteilung</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Noch keine Daten
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    month: d.month,
    win_count: d.win_count,
    loss_count: d.trade_count - d.win_count,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base">Win/Loss Verteilung pro Monat</CardTitle>
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
                Anzahl gewonnener und verlorener Trades pro Monat.
                Ein Trade gilt als Gewinner wenn die Performance positiv ist,
                als Verlierer bei negativer Performance.
              </p>
              <p className="text-muted-foreground">
                Zählung auf Basis von Teilschließungen: Hat ein Trade z.B.
                3 Take-Profit-Ziele, wird jede erreichte Tranche einzeln
                als Win gezählt. So können aus einer Trade-Idee bis zu
                4 Einzelpositionen entstehen.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 16, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={<MonthTick data={chartData} />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="win_count"
              name="Gewinner"
              stackId="a"
              fill="#10b981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="loss_count"
              name="Verlierer"
              stackId="a"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
