import Link from 'next/link'
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
import { TradeCloseDialog } from './TradeCloseDialog'
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
  showProfile?: boolean
  token?: string
}

export function RecentTradesSection({
  trades,
  partialCloseLabels,
  isAdmin,
  showProfile = false,
  token,
}: RecentTradesSectionProps) {
  const visible = trades.slice(0, PREVIEW_COUNT)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">
          Letzte Trades{' '}
          {trades.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {Math.min(PREVIEW_COUNT, trades.length)}
            </span>
          )}
        </CardTitle>
        <Link
          href={token ? `/trades?token=${token}` : '/trades'}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Alle Trades
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
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
                  <TableHead className="text-right">Tage</TableHead>
                  {showProfile && <TableHead className={cn('text-center', !isAdmin && 'pr-6')}>Trader</TableHead>}
                  {isAdmin && <TableHead className="pr-6 w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {trade.trade_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium" title={trade.asset}>{trade.asset_name || trade.asset}</span>
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
                        {(trade.effective_datum_schliessung ?? trade.datum_schliessung) ? formatDate(trade.effective_datum_schliessung ?? trade.datum_schliessung) : '—'}
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
                        {(trade.effective_ausstiegspreis ?? trade.ausstiegspreis)
                          ? `${getCurrencySymbol(trade.asset, trade.asset_klasse)}${formatPrice(trade.effective_ausstiegspreis ?? trade.ausstiegspreis)}`
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
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {trade.haltedauer_tage === 0 ? '< 1' : `${trade.haltedauer_tage}`}
                      </span>
                    </TableCell>
                    {showProfile && (
                      <TableCell className={cn('text-center', !isAdmin && 'pr-6')}>
                        <span className={cn(
                          'inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold',
                          trade.profil === 'SJ' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {trade.profil}
                        </span>
                      </TableCell>
                    )}
                    {isAdmin && (() => {
                      const isCloseEntry = trade.id.includes('-close-')
                      const closeId = isCloseEntry ? trade.id.split('-close-')[1] : null
                      const parentUuid = isCloseEntry ? trade.id.split('-close-')[0] : null
                      const tradeClose = closeId
                        ? (trade.closes ?? []).find((c) => c.id === closeId) ?? null
                        : null
                      return (
                        <TableCell className="pr-6">
                          {trade.id.length === 36 ? (
                            <TradeDialog
                              trade={trade}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                          ) : isCloseEntry && tradeClose && parentUuid ? (
                            <TradeCloseDialog
                              tradeFk={parentUuid}
                              close={tradeClose}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                          ) : null}
                        </TableCell>
                      )
                    })()}
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
