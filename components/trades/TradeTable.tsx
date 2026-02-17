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
import { Pencil, Trash2, Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SortField = 'id' | 'asset' | 'klasse' | 'richtung' | 'status' | 'performance'
type SortOrder = 'asc' | 'desc'

interface TradeTableProps {
  trades: TradeWithPerformance[]
}

export function TradeTable({ trades }: TradeTableProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const [filterAssetClass, setFilterAssetClass] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortField>('id')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const filtered = useMemo(() => {
    // Filter
    let result = trades.filter((t) => {
      if (search && !t.asset.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterDirection !== 'all' && t.richtung !== filterDirection) return false
      if (filterAssetClass !== 'all' && t.asset_klasse !== filterAssetClass) return false
      return true
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'id': {
          const aId = a.trade_id || ''
          const bId = b.trade_id || ''
          comparison = aId.localeCompare(bId)
          break
        }
        case 'asset':
          comparison = a.asset.localeCompare(b.asset)
          break
        case 'klasse':
          comparison = a.asset_klasse.localeCompare(b.asset_klasse)
          break
        case 'richtung': {
          const aDir = a.richtung || ''
          const bDir = b.richtung || ''
          comparison = aDir.localeCompare(bDir)
          break
        }
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'performance': {
          const aPerf = a.performance_pct ?? -Infinity
          const bPerf = b.performance_pct ?? -Infinity
          comparison = aPerf - bPerf
          break
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [trades, search, filterStatus, filterDirection, filterAssetClass, sortBy, sortOrder])

  const hasFilters =
    search || filterStatus !== 'all' || filterDirection !== 'all' || filterAssetClass !== 'all'

  function clearFilters() {
    setSearch('')
    setFilterStatus('all')
    setFilterDirection('all')
    setFilterAssetClass('all')
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1" />
    )
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
              <TableHead className="w-20">
                <button
                  onClick={() => toggleSort('id')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  ID
                  <SortIcon field="id" />
                </button>
              </TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('asset')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Asset
                  <SortIcon field="asset" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('klasse')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Klasse
                  <SortIcon field="klasse" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('richtung')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Richtung
                  <SortIcon field="richtung" />
                </button>
              </TableHead>
              <TableHead className="text-right">Einstieg</TableHead>
              <TableHead className="text-right">SL</TableHead>
              <TableHead className="text-right">TP1</TableHead>
              <TableHead className="text-right">R/R</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('status')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => toggleSort('performance')}
                  className="flex items-center ml-auto hover:text-foreground transition-colors"
                >
                  Performance
                  <SortIcon field="performance" />
                </button>
              </TableHead>
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
