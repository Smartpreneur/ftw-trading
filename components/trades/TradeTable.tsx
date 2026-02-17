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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TradeDialog } from './TradeDialog'
import { StatusBadge } from './StatusBadge'
import { DirectionBadge } from './DirectionBadge'
import { deleteTrade } from '@/lib/actions'
import { ASSET_CLASSES, TRADE_STATUSES } from '@/lib/constants'
import { formatDate, formatPrice, formatPercent, formatRR } from '@/lib/formatters'
import type { TradeWithPerformance } from '@/lib/types'
import { Pencil, Trash2, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TradeTableProps {
  trades: TradeWithPerformance[]
}

export function TradeTable({ trades }: TradeTableProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const [filterAssetClass, setFilterAssetClass] = useState<string>('all')

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (search && !t.asset.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterDirection !== 'all' && t.richtung !== filterDirection) return false
      if (filterAssetClass !== 'all' && t.asset_klasse !== filterAssetClass) return false
      return true
    })
  }, [trades, search, filterStatus, filterDirection, filterAssetClass])

  const hasFilters =
    search || filterStatus !== 'all' || filterDirection !== 'all' || filterAssetClass !== 'all'

  function clearFilters() {
    setSearch('')
    setFilterStatus('all')
    setFilterDirection('all')
    setFilterAssetClass('all')
  }

  async function handleDelete(id: string, asset: string) {
    if (!confirm(`Trade "${asset}" wirklich löschen?`)) return
    try {
      await deleteTrade(id)
      toast.success('Trade gelöscht')
    } catch (err: any) {
      toast.error(err?.message ?? 'Fehler beim Löschen')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 h-9"
            placeholder="Asset suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {TRADE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Direction filter */}
        <Select value={filterDirection} onValueChange={setFilterDirection}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="Richtung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="LONG">LONG</SelectItem>
            <SelectItem value="SHORT">SHORT</SelectItem>
          </SelectContent>
        </Select>

        {/* Asset class filter */}
        <Select value={filterAssetClass} onValueChange={setFilterAssetClass}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Klasse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Klassen</SelectItem>
            {ASSET_CLASSES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
            <X className="h-3.5 w-3.5" />
            Filter löschen
          </Button>
        )}

        {/* New Trade Button - right side */}
        <div className="ml-auto">
          <TradeDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Neuer Trade
              </Button>
            }
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'Trade' : 'Trades'}
        {hasFilters && ` (gefiltert von ${trades.length})`}
      </p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Klasse</TableHead>
              <TableHead>Richtung</TableHead>
              <TableHead className="text-right">Einstieg</TableHead>
              <TableHead className="text-right">SL</TableHead>
              <TableHead className="text-right">TP1</TableHead>
              <TableHead className="text-right">R/R</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Performance</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                  {hasFilters ? 'Keine Trades für diese Filter' : 'Noch keine Trades vorhanden'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((trade) => (
                <TableRow key={trade.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {trade.trade_id ?? '–'}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(trade.datum_eroeffnung)}
                  </TableCell>
                  <TableCell className="font-medium">{trade.asset}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {trade.asset_klasse}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DirectionBadge direction={trade.richtung} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPrice(trade.einstiegspreis)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatPrice(trade.stop_loss)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatPrice(trade.tp1)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {trade.risk_reward ? `${formatRR(trade.risk_reward)}R` : '–'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={trade.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {trade.performance_pct !== null ? (
                      <span
                        className={cn(
                          'font-semibold text-sm',
                          trade.performance_pct > 0
                            ? 'text-emerald-600'
                            : trade.performance_pct < 0
                            ? 'text-rose-600'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatPercent(trade.performance_pct)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">–</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TradeDialog
                        trade={trade}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(trade.id, trade.asset)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
