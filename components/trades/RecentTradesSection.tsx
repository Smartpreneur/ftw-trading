'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { TradeDialog } from './TradeDialog'
import { DirectionBadge } from './DirectionBadge'
import { formatDate, formatPrice } from '@/lib/formatters'
import { getCurrencySymbol } from '@/lib/asset-mapping'
import { ArrowRight } from 'lucide-react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TradeWithPerformance } from '@/lib/types'

const PREVIEW_COUNT = 15

interface RecentTradesSectionProps {
  trades: TradeWithPerformance[]
  partialCloseLabels: Record<string, string>
  isAdmin: boolean
}

export function RecentTradesSection({
  trades,
  partialCloseLabels,
  isAdmin,
}: RecentTradesSectionProps) {
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? trades : trades.slice(0, PREVIEW_COUNT)
  const hasMore = trades.length > PREVIEW_COUNT

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">
          Letzte Trades{' '}
          {trades.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {showAll ? trades.length : Math.min(PREVIEW_COUNT, trades.length)}
            </span>
          )}
        </CardTitle>
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? 'Weniger anzeigen' : 'Alle Trades 2026'}
            <ArrowRight className={cn('h-3.5 w-3.5 transition-transform', showAll && 'rotate-180')} />
          </button>
        )}
      </CardHeader>
      <CardContent className="px-0">
        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Keine geschlossenen Trades
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-16">ID</TableHead>
                  <TableHead>Basiswert</TableHead>
                  <TableHead className="w-14 text-right">Gew.</TableHead>
                  <TableHead>L/S</TableHead>
                  <TableHead>Eröffnung</TableHead>
                  <TableHead>Schließung</TableHead>
                  <TableHead className="text-right">Einstieg</TableHead>
                  <TableHead className="text-right">Ausstieg</TableHead>
                  <TableHead className="text-right">G/V</TableHead>
                  <TableHead className={cn('text-right', !isAdmin && 'pr-6')}>Tage</TableHead>
                  {isAdmin && <TableHead className="pr-6 w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {trade.trade_id ? trade.trade_id.replace(/^T-0*/, '') : '—'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{trade.asset}</span>
                        {partialCloseLabels[trade.id] && (
                          <span className={cn(
                            'ml-1.5 text-[10px] font-semibold',
                            partialCloseLabels[trade.id] === '(SL)' ? 'text-rose-600' : 'text-emerald-600'
                          )}>
                            {partialCloseLabels[trade.id]}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {Math.round(trade.gewichtung * 100)}%
                    </TableCell>
                    <TableCell>
                      {trade.richtung && <DirectionBadge direction={trade.richtung} />}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(trade.datum_eroeffnung)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {trade.datum_schliessung ? formatDate(trade.datum_schliessung) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.einstiegspreis
                          ? `${getCurrencySymbol(trade.asset, trade.asset_klasse)}${formatPrice(trade.einstiegspreis)}`
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {trade.ausstiegspreis
                          ? `${getCurrencySymbol(trade.asset, trade.asset_klasse)}${formatPrice(trade.ausstiegspreis)}`
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.performance_pct !== null ? (
                        <span className={cn(
                          'font-mono text-sm font-semibold',
                          trade.performance_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        )}>
                          {trade.performance_pct >= 0 ? '+' : ''}
                          {trade.performance_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className={cn('text-right', !isAdmin && 'pr-6')}>
                      <span className="text-sm text-muted-foreground">
                        {trade.haltedauer_tage === 0 ? '< 1' : `${trade.haltedauer_tage}`}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="pr-6">
                        {!trade.id.includes('-tp') && !trade.id.includes('-sl') && (
                          <TradeDialog
                            trade={trade}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
