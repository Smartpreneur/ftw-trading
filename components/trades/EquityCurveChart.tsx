'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EquityCurvePoint } from '@/lib/types'

interface EquityCurveChartProps {
  data: EquityCurvePoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as EquityCurvePoint
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className={`font-medium ${d.cumulative_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {d.cumulative_pct >= 0 ? '+' : ''}{d.cumulative_pct.toFixed(2)} %
      </p>
      <p className="text-muted-foreground text-xs">{d.asset} · {d.richtung}</p>
    </div>
  )
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance-Kurve</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-56 text-muted-foreground text-sm">
          Noch keine geschlossenen Trades
        </CardContent>
      </Card>
    )
  }

  const isPositive = data[data.length - 1]?.cumulative_pct >= 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Performance-Kurve (kumulativ)</CardTitle>
          <span
            className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {isPositive ? '+' : ''}
            {data[data.length - 1]?.cumulative_pct.toFixed(2)} %
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="cumulative_pct"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              strokeWidth={2}
              dot={{ r: 3, fill: isPositive ? '#10b981' : '#f43f5e', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
