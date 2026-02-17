import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS } from '@/lib/constants'
import type { TradeStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: TradeStatus }) {
  return (
    <Badge className={cn('font-medium', STATUS_COLORS[status])} variant="outline">
      {status}
    </Badge>
  )
}
