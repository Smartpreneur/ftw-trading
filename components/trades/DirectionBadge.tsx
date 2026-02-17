import { Badge } from '@/components/ui/badge'
import { DIRECTION_COLORS } from '@/lib/constants'
import type { TradeDirection } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function DirectionBadge({ direction }: { direction: TradeDirection }) {
  const Icon = direction === 'LONG' ? TrendingUp : TrendingDown
  return (
    <Badge className={cn('font-semibold gap-1', DIRECTION_COLORS[direction])} variant="outline">
      <Icon className="h-3 w-3" />
      {direction}
    </Badge>
  )
}
