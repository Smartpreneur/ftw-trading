'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DirectionBadge } from './DirectionBadge'
import { formatDate, formatPrice } from '@/lib/formatters'
import { getCurrencySymbol, getApiSymbol, getExchangeLabel } from '@/lib/asset-mapping'
import { cn } from '@/lib/utils'
import { Check, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Pencil } from 'lucide-react'
import { TradeDialog } from './TradeDialog'
import { Button } from '@/components/ui/button'
import type { TradeWithPerformance, ActiveTradePrice } from '@/lib/types'

type SortKey = 'datum' | 'asset' | 'richtung' | null
type SortDir = 'asc' | 'desc'

interface ActiveTradesTableProps {
  trades: TradeWithPerformance[]
  activePrices: ActiveTradePrice[]
  isAdmin?: boolean
}

export function ActiveTradesTable({ trades, activePrices, isAdmin = false }: ActiveTradesTableProps) {
  const priceMap = useMemo(() => new Map(activePrices.map(p => [p.trade_id, p])), [activePrices])
  const [sortKey, setSortKey] = useState<SortKey>('datum')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedTrades = useMemo(() => {
    if (!sortKey) return trades
    return [...trades].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'datum') {
        cmp = a.datum_eroeffnung.localeCompare(b.datum_eroeffnung)
      } else if (sortKey === 'asset') {
        cmp = a.asset.localeCompare(b.asset)
      } else if (sortKey === 'richtung') {
        cmp = (a.richtung || '').localeCompare(b.richtung || '')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [trades, sortKey, sortDir])

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="pl-6 cursor-pointer select-none"
            onClick={() => handleSort('datum')}
          >
            <span className="inline-flex items-center">
              Datum <SortIcon column="datum" />
            </span>
          </TableHead>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => handleSort('asset')}
          >
            <span className="inline-flex items-center">
              Basiswert <SortIcon column="asset" />
            </span>
          </TableHead>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => handleSort('richtung')}
          >
            <span className="inline-flex items-center">
              Long/Short <SortIcon column="richtung" />
            </span>
          </TableHead>
          <TableHead className="text-right">Einstiegskurs</TableHead>
          <TableHead className="text-right">Aktueller Kurs</TableHead>
          <TableHead className="text-right">G/V in %</TableHead>
          <TableHead className="text-right">SL</TableHead>
          <TableHead className="text-right">TP1</TableHead>
          <TableHead className="text-right">TP2</TableHead>
          <TableHead className="text-right">TP3</TableHead>
          <TableHead className="text-right">TP4</TableHead>
          <TableHead>Trade-Status</TableHead>
          <TableHead className={isAdmin ? '' : 'pr-6'}>Bemerkung</TableHead>
          {isAdmin && <TableHead className="pr-6 w-10"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTrades.map((trade) => {
          const priceData = priceMap.get(trade.id)
          const currentPrice = priceData?.current_price
          const entryPrice = trade.einstiegspreis

          let unrealizedPct: number | null = null
          if (currentPrice && entryPrice && trade.richtung) {
            if (trade.richtung === 'LONG') {
              unrealizedPct = ((currentPrice - entryPrice) / entryPrice) * 100
            } else {
              unrealizedPct = ((entryPrice - currentPrice) / entryPrice) * 100
            }
          }

          // Determine highest reached level
          let highestHit: string | null = null
          if (trade.sl_erreicht_am) highestHit = 'SL'
          if (trade.tp1_erreicht_am) highestHit = 'TP1'
          if (trade.tp2_erreicht_am) highestHit = 'TP2'
          if (trade.tp3_erreicht_am) highestHit = 'TP3'
          if (trade.tp4_erreicht_am) highestHit = 'TP4'

          return (
            <TableRow key={`trade-${trade.id}`}>
              <TableCell className="pl-6">
                <span className="text-sm text-muted-foreground">
                  {formatDate(trade.datum_eroeffnung)}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <span className="font-medium">{trade.asset}</span>
                  {isAdmin && (() => {
                    if (trade.manuell_getrackt) {
                      return <span className="block text-[10px] text-muted-foreground/50 mt-0.5">manuell</span>
                    }
                    const mapping = getApiSymbol(trade.asset)
                    if (!mapping) return <span className="block text-[10px] text-amber-500 mt-0.5">kein Ticker</span>
                    const url = mapping.type === 'yahoo'
                      ? `https://finance.yahoo.com/quote/${encodeURIComponent(mapping.api)}`
                      : mapping.type === 'coingecko'
                      ? `https://www.coingecko.com/en/coins/${mapping.api}`
                      : null
                    const exchange = getExchangeLabel(mapping)
                    return (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-blue-500 hover:text-blue-700 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {mapping.api}
                          </a>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground/60">{mapping.api}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/50">·</span>
                        <span className="text-[10px] text-muted-foreground/70">{exchange}</span>
                      </div>
                    )
                  })()}
                </div>
              </TableCell>
              <TableCell>
                {trade.richtung && <DirectionBadge direction={trade.richtung} />}
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-sm">
                  {entryPrice
                    ? `${getCurrencySymbol(trade.asset, trade.asset_klasse)}${formatPrice(entryPrice)}`
                    : '—'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-sm">
                  {currentPrice
                    ? `${getCurrencySymbol(trade.asset, trade.asset_klasse)}${formatPrice(currentPrice)}`
                    : '—'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {unrealizedPct !== null ? (
                  <span
                    className={`font-mono text-sm font-semibold ${
                      unrealizedPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {unrealizedPct >= 0 ? '+' : ''}
                    {unrealizedPct.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-mono text-sm inline-flex items-center justify-end gap-1",
                    trade.sl_erreicht_am && "text-rose-600 font-semibold"
                  )}
                  title={trade.sl_erreicht_am ? `SL erreicht am ${formatDate(trade.sl_erreicht_am)}` : undefined}
                >
                  {trade.stop_loss ? formatPrice(trade.stop_loss) : '—'}
                  {trade.sl_erreicht_am && <AlertTriangle className="h-3 w-3" />}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-mono text-sm inline-flex items-center justify-end gap-1",
                    trade.tp1_erreicht_am && "text-emerald-600 font-semibold"
                  )}
                  title={trade.tp1_erreicht_am ? `TP1 erreicht am ${formatDate(trade.tp1_erreicht_am)}` : undefined}
                >
                  {trade.tp1 ? formatPrice(trade.tp1) : '—'}
                  {trade.tp1_erreicht_am && <Check className="h-3 w-3" />}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-mono text-sm inline-flex items-center justify-end gap-1",
                    trade.tp2_erreicht_am && "text-emerald-600 font-semibold"
                  )}
                  title={trade.tp2_erreicht_am ? `TP2 erreicht am ${formatDate(trade.tp2_erreicht_am)}` : undefined}
                >
                  {trade.tp2 ? formatPrice(trade.tp2) : '—'}
                  {trade.tp2_erreicht_am && <Check className="h-3 w-3" />}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-mono text-sm inline-flex items-center justify-end gap-1",
                    trade.tp3_erreicht_am && "text-emerald-600 font-semibold"
                  )}
                  title={trade.tp3_erreicht_am ? `TP3 erreicht am ${formatDate(trade.tp3_erreicht_am)}` : undefined}
                >
                  {trade.tp3 ? formatPrice(trade.tp3) : '—'}
                  {trade.tp3_erreicht_am && <Check className="h-3 w-3" />}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "font-mono text-sm inline-flex items-center justify-end gap-1",
                    trade.tp4_erreicht_am && "text-emerald-600 font-semibold"
                  )}
                  title={trade.tp4_erreicht_am ? `TP4 erreicht am ${formatDate(trade.tp4_erreicht_am)}` : undefined}
                >
                  {trade.tp4 ? formatPrice(trade.tp4) : '—'}
                  {trade.tp4_erreicht_am && <Check className="h-3 w-3" />}
                </span>
              </TableCell>
              <TableCell>
                {!highestHit ? (
                  <span className="text-sm text-muted-foreground">Offen</span>
                ) : (
                  <span className={cn(
                    "text-xs font-semibold whitespace-nowrap",
                    highestHit === 'SL' ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {highestHit} erreicht
                  </span>
                )}
              </TableCell>
              <TableCell className={cn("max-w-[150px]", !isAdmin && "pr-6")}>
                <span
                  className="text-sm text-muted-foreground truncate block cursor-help"
                  title={trade.bemerkungen || undefined}
                >
                  {trade.bemerkungen || '—'}
                </span>
              </TableCell>
              {isAdmin && (
                <TableCell className="pr-6">
                  <TradeDialog
                    trade={trade}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
