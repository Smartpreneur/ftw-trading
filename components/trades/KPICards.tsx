'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PerformanceKPIs } from '@/lib/types'
import { formatPercent } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Target, BarChart2, Clock, Award, Info } from 'lucide-react'

interface KPICardsProps {
  kpis: PerformanceKPIs
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  info,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  colorClass?: string
  info?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          {title}
          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help">
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-sm">{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass ?? ''}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <KPICard
        title="Trades gesamt"
        value={String(kpis.total_trades)}
        subtitle={`${kpis.closed_trades} geschlossen`}
        icon={BarChart2}
      />
      <KPICard
        title="Win Rate"
        value={`${kpis.win_rate} %`}
        subtitle={`Ø Gewinn ${formatPercent(kpis.avg_win_pct)}`}
        icon={Target}
        colorClass={kpis.win_rate >= 50 ? 'text-emerald-600' : 'text-rose-600'}
      />
      <KPICard
        title="Profit Factor"
        value={kpis.profit_factor > 0 ? String(kpis.profit_factor) : '–'}
        subtitle={`Ø Verlust ${formatPercent(-kpis.avg_loss_pct)}`}
        icon={kpis.profit_factor >= 1 ? TrendingUp : TrendingDown}
        colorClass={kpis.profit_factor >= 1 ? 'text-emerald-600' : 'text-rose-600'}
        info="Der Profit Faktor zeigt das Verhältnis von Gewinnen zu Verlusten. Ein Wert über 1 bedeutet, dass die Gewinne die Verluste übersteigen — je höher, desto besser."
      />
      <KPICard
        title="Bester Trade"
        value={formatPercent(kpis.best_trade_pct)}
        subtitle={`Schlechtester: ${formatPercent(kpis.worst_trade_pct)}`}
        icon={Award}
        colorClass="text-emerald-600"
      />
      <KPICard
        title="Ø Haltedauer"
        value={`${kpis.avg_holding_days} Tage`}
        subtitle="geschlossene Trades"
        icon={Clock}
      />
    </div>
  )
}
