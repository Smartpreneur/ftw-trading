'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssetClassPerformance } from '@/lib/types'
import { ASSET_CLASS_COLORS } from '@/lib/constants'

interface AssetClassChartProps {
  data: AssetClassPerformance[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as AssetClassPerformance
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className={`font-medium ${d.avg_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        Ø {d.avg_pct >= 0 ? '+' : ''}{d.avg_pct.toFixed(2)} %
      </p>
      <p className="text-muted-foreground">{d.win_rate} % Win Rate</p>
      <p className="text-muted-foreground">{d.trade_count} Trades</p>
    </div>
  )
}

export function AssetClassChart({ data }: AssetClassChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance nach Asset-Klasse</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Noch keine Daten
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ø Performance nach Asset-Klasse (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="asset_klasse"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg_pct" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ASSET_CLASS_COLORS[entry.asset_klasse]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {data.map((d) => (
            <div key={d.asset_klasse} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: ASSET_CLASS_COLORS[d.asset_klasse] }}
              />
              {d.asset_klasse} ({d.trade_count})
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
