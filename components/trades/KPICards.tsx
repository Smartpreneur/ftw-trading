import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PerformanceKPIs } from '@/lib/types'
import { formatPercent } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Target, BarChart2, Clock, Award } from 'lucide-react'

interface KPICardsProps {
  kpis: PerformanceKPIs
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  colorClass?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
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
