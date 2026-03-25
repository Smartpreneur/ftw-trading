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
import { Badge } from '@/components/ui/badge'
import { MultiSelect } from '@/components/ui/multi-select'
import { TradeDialog } from './TradeDialog'
import { TradeCloseDialog } from './TradeCloseDialog'
import { StatusBadge } from './StatusBadge'
import { DirectionBadge } from './DirectionBadge'
import { ASSET_CLASSES, TRADE_LIST_STATUSES, TRADER_NAMES } from '@/lib/constants'
import { ACTIVE_PROFILES } from '@/lib/profile-tabs'
import { formatDate, formatPrice, formatPercent, formatRR } from '@/lib/formatters'
import type { TradeWithPerformance, TradingProfile, TradeStatus, AssetClass } from '@/lib/types'
import { Pencil, Plus, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'trades' | 'closes'
type SortField = 'id' | 'eroeffnung' | 'schliessung' | 'asset' | 'klasse' | 'richtung' | 'status' | 'performance'
type SortOrder = 'asc' | 'desc'

interface DisplayRow {
  /** Original trade data (for rendering shared columns) */
  trade: TradeWithPerformance
  /** If this row represents a single close, its close ID */
  closeId: string | null
  /** Close type label, e.g. "TP1", "SL" */
  closeTyp: string | null
  /** Close-specific exit price (null = use trade-level) */
  closeAusstiegspreis: number | null
  /** Close-specific date (null = use trade-level) */
  closeDatum: string | null
  /** Close-specific performance % */
  closePerformance: number | null
  /** Close anteil (0-1) */
  closeAnteil: number | null
  /** Unique key for React */
  key: string
}

interface TradeTableProps {
  trades: TradeWithPerformance[]
  initialProfiles?: string[]
  availableProfiles?: string[]
  isAdmin?: boolean
}

export function TradeTable({ trades, initialProfiles, availableProfiles, isAdmin = false }: TradeTableProps) {
  const profileOptions = availableProfiles ?? ACTIVE_PROFILES
  const [viewMode, setViewMode] = useState<ViewMode>('trades')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>(TRADE_LIST_STATUSES)
  const [filterDirection, setFilterDirection] = useState<string[]>(['LONG', 'SHORT'])
  const [filterAssetClass, setFilterAssetClass] = useState<string[]>(ASSET_CLASSES)
  const [filterTrader, setFilterTrader] = useState<string[]>(initialProfiles ?? profileOptions)
  const [sortBy, setSortBy] = useState<SortField>('schliessung')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (search && !(t.asset_name || t.asset).toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus.length > 0 && filterStatus.length < TRADE_LIST_STATUSES.length && !filterStatus.includes(t.status)) return false
      if (filterDirection.length > 0 && filterDirection.length < 2 && t.richtung && !filterDirection.includes(t.richtung)) return false
      if (filterAssetClass.length > 0 && filterAssetClass.length < ASSET_CLASSES.length && !filterAssetClass.includes(t.asset_klasse)) return false
      if (filterTrader.length > 0 && filterTrader.length < profileOptions.length && !filterTrader.includes(t.profil)) return false
      return true
    })
  }, [trades, search, filterStatus, filterDirection, filterAssetClass, filterTrader, profileOptions])

  /** Build display rows: in closes mode, expand trades with closes into individual rows */
  const rows: DisplayRow[] = useMemo(() => {
    if (viewMode === 'trades') {
      return filtered.map((t) => ({
        trade: t,
        closeId: null,
        closeTyp: null,
        closeAusstiegspreis: null,
        closeDatum: null,
        closePerformance: null,
        closeAnteil: null,
        key: t.id,
      }))
    }

    // Closes mode: expand each trade into its close rows
    const result: DisplayRow[] = []
    for (const trade of filtered) {
      const validCloses = (trade.closes ?? []).filter(
        (c) => c.ausstiegspreis != null && c.anteil != null
      )

      if (validCloses.length === 0) {
        // No closes — show as single row (same as trade view)
        result.push({
          trade,
          closeId: null,
          closeTyp: null,
          closeAusstiegspreis: null,
          closeDatum: null,
          closePerformance: null,
          closeAnteil: null,
          key: trade.id,
        })
        continue
      }

      const sorted = [...validCloses].sort((a, b) => (a.nummer ?? 0) - (b.nummer ?? 0))
      for (const close of sorted) {
        let perf: number | null = null
        if (trade.einstiegspreis && trade.richtung && close.ausstiegspreis != null) {
          const raw = trade.richtung === 'LONG'
            ? ((close.ausstiegspreis - trade.einstiegspreis) / trade.einstiegspreis) * 100
            : ((trade.einstiegspreis - close.ausstiegspreis) / trade.einstiegspreis) * 100
          perf = Math.round(raw * 100) / 100
        }

        result.push({
          trade,
          closeId: close.id,
          closeTyp: close.typ,
          closeAusstiegspreis: close.ausstiegspreis,
          closeDatum: close.datum,
          closePerformance: perf,
          closeAnteil: close.anteil,
          key: `${trade.id}-${close.id}`,
        })
      }
    }
    return result
  }, [filtered, viewMode])

  /** Sort the display rows */
  const sortedRows = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let comparison = 0
      const at = a.trade
      const bt = b.trade

      switch (sortBy) {
        case 'id':
          comparison = (at.trade_id || 0) - (bt.trade_id || 0)
          break
        case 'eroeffnung':
          comparison = (at.datum_eroeffnung || '').localeCompare(bt.datum_eroeffnung || '')
          break
        case 'schliessung': {
          const dateA = a.closeDatum || at.effective_datum_schliessung || at.datum_schliessung || ''
          const dateB = b.closeDatum || bt.effective_datum_schliessung || bt.datum_schliessung || ''
          // No close date = active trades → sort to top (desc) or bottom (asc)
          if (!dateA && !dateB) { comparison = 0; break }
          if (!dateA) { comparison = 1; break }
          if (!dateB) { comparison = -1; break }
          comparison = dateA.localeCompare(dateB)
          break
        }
        case 'asset':
          comparison = (at.asset_name || at.asset).localeCompare(bt.asset_name || bt.asset)
          break
        case 'klasse':
          comparison = at.asset_klasse.localeCompare(bt.asset_klasse)
          break
        case 'richtung':
          comparison = (at.richtung || '').localeCompare(bt.richtung || '')
          break
        case 'status':
          comparison = at.status.localeCompare(bt.status)
          break
        case 'performance': {
          const perfA = (a.closePerformance ?? a.trade.performance_pct) ?? -Infinity
          const perfB = (b.closePerformance ?? b.trade.performance_pct) ?? -Infinity
          comparison = perfA - perfB
          break
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
    return copy
  }, [rows, sortBy, sortOrder])

  const hasFilters =
    search ||
    (filterStatus.length > 0 && filterStatus.length < TRADE_LIST_STATUSES.length) ||
    (filterDirection.length > 0 && filterDirection.length < 2) ||
    (filterAssetClass.length > 0 && filterAssetClass.length < ASSET_CLASSES.length) ||
    (filterTrader.length > 0 && filterTrader.length < profileOptions.length)

  function clearFilters() {
    setSearch('')
    setFilterStatus(TRADE_LIST_STATUSES)
    setFilterDirection(['LONG', 'SHORT'])
    setFilterAssetClass(ASSET_CLASSES)
    setFilterTrader(profileOptions)
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

  const isClosesView = viewMode === 'closes'

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="inline-flex rounded-lg border bg-muted p-0.5">
        <button
          onClick={() => setViewMode('trades')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'trades'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Trades
        </button>
        <button
          onClick={() => setViewMode('closes')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            viewMode === 'closes'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Teilschließungen
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-2">
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
        <MultiSelect
          options={TRADE_LIST_STATUSES.map((s) => ({ value: s, label: s }))}
          selected={filterStatus}
          onChange={setFilterStatus}
          placeholder="Status"
          className="w-36"
        />

        {/* Direction filter */}
        <MultiSelect
          options={[
            { value: 'LONG', label: 'LONG' },
            { value: 'SHORT', label: 'SHORT' },
          ]}
          selected={filterDirection}
          onChange={setFilterDirection}
          placeholder="Richtung"
          className="w-32"
        />

        {/* Asset class filter */}
        <MultiSelect
          options={ASSET_CLASSES.map((c) => ({ value: c, label: c }))}
          selected={filterAssetClass}
          onChange={setFilterAssetClass}
          placeholder="Klasse"
          className="w-36"
        />

        {/* Trader filter */}
        <MultiSelect
          options={profileOptions.map((p) => ({ value: p, label: p }))}
          selected={filterTrader}
          onChange={setFilterTrader}
          placeholder="Trader"
          className="w-32"
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
            <X className="h-3.5 w-3.5" />
            Filter löschen
          </Button>
        )}

        {/* New Trade Button - right side (admin only) */}
        {isAdmin && (
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
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {sortedRows.length} {isClosesView ? (sortedRows.length === 1 ? 'Eintrag' : 'Einträge') : (sortedRows.length === 1 ? 'Trade' : 'Trades')}
        {hasFilters && ` (gefiltert von ${trades.length})`}
      </p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
              <TableHead className="w-20">
                <button
                  onClick={() => toggleSort('id')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  ID
                  <SortIcon field="id" />
                </button>
              </TableHead>
              )}
              <TableHead>
                <button
                  onClick={() => toggleSort('eroeffnung')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Eröffnung
                  <SortIcon field="eroeffnung" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('schliessung')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Schließung
                  <SortIcon field="schliessung" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('asset')}
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  Asset
                  <SortIcon field="asset" />
                </button>
              </TableHead>
              {isClosesView && <TableHead className="w-16">Typ</TableHead>}
              {isClosesView && <TableHead className="w-16 text-right">Anteil</TableHead>}
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
              <TableHead className="text-right">
                <button
                  onClick={() => toggleSort('performance')}
                  className="flex items-center ml-auto hover:text-foreground transition-colors"
                >
                  Performance
                  <SortIcon field="performance" />
                </button>
              </TableHead>
              {!isClosesView && (
                <TableHead>
                  <button
                    onClick={() => toggleSort('status')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Status
                    <SortIcon field="status" />
                  </button>
                </TableHead>
              )}
              <TableHead className="text-right">Einstieg</TableHead>
              <TableHead className="text-right">Ausstieg</TableHead>
              {!isClosesView && <TableHead>Kommentar</TableHead>}
              <TableHead>Trader</TableHead>
              {isAdmin && <TableHead className="text-right">Aktionen</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 15 : 13} className="h-24 text-center text-muted-foreground">
                  {hasFilters ? 'Keine Trades für diese Filter' : 'Noch keine Trades vorhanden'}
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => {
                const trade = row.trade
                const perf = row.closePerformance ?? trade.performance_pct
                const exitPrice = row.closeAusstiegspreis ?? (isClosesView ? null : (trade.effective_ausstiegspreis ?? trade.ausstiegspreis))
                const closeDate = row.closeDatum ?? trade.effective_datum_schliessung ?? trade.datum_schliessung

                return (
                  <TableRow key={row.key} className="group">
                    {isAdmin && (
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {trade.trade_id}
                    </TableCell>
                    )}
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(trade.datum_eroeffnung)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(closeDate)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span title={trade.asset}>{trade.asset_name || trade.asset}</span>
                      {!isClosesView && trade.gewichtung < 1 && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                          {Math.round(trade.gewichtung * 100)}%
                        </span>
                      )}
                    </TableCell>
                    {isClosesView && (
                      <TableCell>
                        {row.closeTyp ? (
                          <span className={cn(
                            'text-xs font-semibold',
                            row.closeTyp === 'SL' ? 'text-rose-600' : 'text-emerald-600'
                          )}>
                            {row.closeTyp}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">–</span>
                        )}
                      </TableCell>
                    )}
                    {isClosesView && (
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        {row.closeAnteil != null
                          ? `${Math.round(row.closeAnteil * 100)}%`
                          : '–'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {trade.asset_klasse}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DirectionBadge direction={trade.richtung ?? 'LONG'} />
                    </TableCell>
                    <TableCell className="text-right">
                      {perf !== null ? (
                        <span
                          className={cn(
                            'font-semibold text-sm',
                            perf > 0
                              ? 'text-emerald-600'
                              : perf < 0
                              ? 'text-rose-600'
                              : 'text-muted-foreground'
                          )}
                        >
                          {formatPercent(perf)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">–</span>
                      )}
                    </TableCell>
                    {!isClosesView && (
                      <TableCell>
                        <StatusBadge status={trade.status} />
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono text-sm">
                      {formatPrice(trade.einstiegspreis)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPrice(exitPrice)}
                    </TableCell>
                    {!isClosesView && (
                      <TableCell className="text-sm text-muted-foreground max-w-[260px]">
                        {trade.bemerkungen ? (
                          <span
                            className="block truncate"
                            title={trade.bemerkungen}
                          >
                            {trade.bemerkungen.split('\n')[0]}
                          </span>
                        ) : (
                          <span>–</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {TRADER_NAMES[trade.profil] ?? trade.profil}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {row.closeId ? (
                            (() => {
                              const tradeClose = (trade.closes ?? []).find((c) => c.id === row.closeId) ?? null
                              return tradeClose ? (
                                <TradeCloseDialog
                                  tradeFk={trade.id}
                                  close={tradeClose}
                                  trigger={
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  }
                                />
                              ) : null
                            })()
                          ) : (
                            <TradeDialog
                              trade={trade}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
