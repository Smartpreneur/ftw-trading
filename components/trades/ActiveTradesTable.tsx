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
import { Check, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Hand, Trash2 } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TradeDialog } from './TradeDialog'
import { Button } from '@/components/ui/button'
import { updateTrade } from '@/lib/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
        cmp = (a.asset_name || a.asset).localeCompare(b.asset_name || b.asset)
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
          const tradeCurrency = priceData?.currency || trade.currency
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
                  <span className="font-medium" title={trade.asset}>{trade.asset_name || trade.asset}</span>
                  {trade.manuell_getrackt && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 mt-0.5 hover:text-amber-800 transition-colors">
                          <Hand className="h-3 w-3" />
                          manuell
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" className="text-sm max-w-[220px]">
                        <p>Manuell getrackt — Kurse werden nicht automatisch aktualisiert.</p>
                      </PopoverContent>
                    </Popover>
                  )}
                  {isAdmin && !trade.manuell_getrackt && (() => {
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
                    ? `${getCurrencySymbol(trade.asset, trade.asset_klasse, tradeCurrency)}${formatPrice(entryPrice, trade.asset_klasse)}`
                    : '—'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono text-sm">
                  {currentPrice
                    ? `${getCurrencySymbol(trade.asset, trade.asset_klasse, tradeCurrency)}${formatPrice(currentPrice, trade.asset_klasse)}`
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
                    trade.sl_erreicht_am && "text-rose-600 font-semibold",
                    !trade.sl_erreicht_am && trade.stop_loss_vorher && "underline decoration-dotted decoration-muted-foreground/40 underline-offset-2"
                  )}
                  title={
                    trade.sl_erreicht_am
                      ? `SL erreicht am ${formatDate(trade.sl_erreicht_am)}`
                      : trade.stop_loss_vorher
                      ? `Angepasst am ${formatDate(trade.tp_sl_geaendert_am)}: von ${formatPrice(trade.stop_loss_vorher, trade.asset_klasse)} auf ${formatPrice(trade.stop_loss, trade.asset_klasse)}`
                      : undefined
                  }
                >
                  {trade.stop_loss ? formatPrice(trade.stop_loss, trade.asset_klasse) : '—'}
                  {trade.sl_erreicht_am && <AlertTriangle className="h-3 w-3" />}
                </span>
              </TableCell>
              {([
                { level: trade.tp1, vorher: trade.tp1_vorher, hit: trade.tp1_erreicht_am, label: 'TP1' },
                { level: trade.tp2, vorher: trade.tp2_vorher, hit: trade.tp2_erreicht_am, label: 'TP2' },
                { level: trade.tp3, vorher: trade.tp3_vorher, hit: trade.tp3_erreicht_am, label: 'TP3' },
                { level: trade.tp4, vorher: trade.tp4_vorher, hit: trade.tp4_erreicht_am, label: 'TP4' },
              ] as const).map((tp) => (
                <TableCell key={tp.label} className="text-right">
                  <span
                    className={cn(
                      "font-mono text-sm inline-flex items-center justify-end gap-1",
                      tp.hit && "text-emerald-600 font-semibold",
                      !tp.hit && tp.vorher && "underline decoration-dotted decoration-muted-foreground/40 underline-offset-2"
                    )}
                    title={
                      tp.hit
                        ? `${tp.label} erreicht am ${formatDate(tp.hit)}`
                        : tp.vorher
                        ? `Angepasst am ${formatDate(trade.tp_sl_geaendert_am)}: von ${formatPrice(tp.vorher, trade.asset_klasse)} auf ${formatPrice(tp.level, trade.asset_klasse)}`
                        : undefined
                    }
                  >
                    {tp.level ? formatPrice(tp.level, trade.asset_klasse) : '—'}
                    {tp.hit && <Check className="h-3 w-3" />}
                  </span>
                </TableCell>
              ))}
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
              <TableCell className={cn("min-w-[250px] max-w-[400px]", !isAdmin && "pr-6")}>
                {trade.bemerkungen ? (
                  <BemerkungCell text={trade.bemerkungen} />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              {isAdmin && (
                <TableCell className="pr-6">
                  <div className="flex gap-0.5">
                    <TradeDialog
                      trade={trade}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <SoftDeleteButton tradeId={trade.id} tradeName={trade.asset_name || trade.asset} />
                  </div>
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function BemerkungCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isHtml = text.includes('<')
  const plainText = text.replace(/<[^>]*>/g, '').trim()
  // Short text (< 80 chars, single line) → no clamp needed
  const isShort = plainText.length < 80 && !plainText.includes('\n')

  if (isShort) {
    return isHtml ? (
      <div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: text }} />
    ) : (
      <span className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{text}</span>
    )
  }

  return (
    <div>
      {isHtml ? (
        <div
          className={cn("text-sm text-muted-foreground prose prose-sm max-w-none overflow-hidden", !expanded && "line-clamp-3")}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : (
        <span className={cn("text-sm text-muted-foreground whitespace-pre-wrap break-words", !expanded && "line-clamp-3")}>
          {text}
        </span>
      )}
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline mt-0.5 block">
        {expanded ? 'Weniger' : 'Mehr anzeigen'}
      </button>
    </div>
  )
}

function SoftDeleteButton({ tradeId, tradeName }: { tradeId: string; tradeName: string }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleSoftDelete() {
    setIsDeleting(true)
    try {
      await updateTrade(tradeId, { status: 'Gelöscht' as any })
      toast.success(`${tradeName} gelöscht`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Fehler beim Löschen')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="bottom" align="end">
        <p className="text-sm font-medium mb-1">Trade löschen?</p>
        <p className="text-xs text-muted-foreground mb-3">{tradeName} wird aus der Ansicht entfernt.</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            className="flex-1 h-7 text-xs"
            onClick={handleSoftDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Löscht...' : 'Löschen'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
