'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { INSTRUMENTS, type Instrument } from '@/lib/asset-mapping'
import { searchInstruments } from '@/lib/price-actions'
import { cn } from '@/lib/utils'
import { Search, PenLine, Loader2 } from 'lucide-react'

const ASSET_CLASS_COLORS: Record<string, string> = {
  Index: 'bg-indigo-100 text-indigo-700',
  Rohstoff: 'bg-amber-100 text-amber-700',
  Krypto: 'bg-violet-100 text-violet-700',
  Aktie: 'bg-emerald-100 text-emerald-700',
  FX: 'bg-blue-100 text-blue-700',
}

interface InstrumentSearchProps {
  value: string
  onSelect: (instrument: Instrument) => void
  onManualInput: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function InstrumentSearch({
  value,
  onSelect,
  onManualInput,
  placeholder = 'Instrument suchen...',
  disabled,
}: InstrumentSearchProps) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [apiResults, setApiResults] = useState<Instrument[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Filter local instruments by query
  const localFiltered = query.trim()
    ? INSTRUMENTS.filter((inst) => {
        const q = query.toLowerCase()
        return (
          inst.name.toLowerCase().includes(q) ||
          inst.symbol.toLowerCase().includes(q) ||
          inst.api.toLowerCase().includes(q)
        )
      })
    : INSTRUMENTS

  // Deduplicate: exclude API results that match local instruments
  const localSymbols = new Set(localFiltered.map((i) => i.api.toUpperCase()))
  const uniqueApiResults = apiResults.filter(
    (r) => !localSymbols.has(r.api.toUpperCase())
  )

  const allResults = [...localFiltered, ...uniqueApiResults]

  // Whether the current query exactly matches a known instrument
  const exactMatch = allResults.some(
    (i) =>
      i.name.toLowerCase() === query.trim().toLowerCase() ||
      i.symbol.toLowerCase() === query.trim().toLowerCase()
  )

  // Show manual option when query has text and isn't an exact match
  const showManualOption = query.trim().length > 0 && !exactMatch

  // Manual option is at index 0 when shown; instrument results shift by 1
  const manualOffset = showManualOption ? 1 : 0
  const totalItems = allResults.length + manualOffset

  // Debounced API search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setApiResults([])
      return
    }

    // Only search API if local results are < 3
    if (localFiltered.length >= 3) {
      setApiResults([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchInstruments(query.trim())
        setApiResults(
          results.map((r) => ({
            name: r.name,
            symbol: r.symbol,
            asset_klasse: r.asset_klasse,
            api: r.api,
            type: r.type,
          }))
        )
      } catch {
        setApiResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query, localFiltered.length])

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0)
  }, [query])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[highlightIndex] as HTMLElement
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectInstrument = useCallback(
    (inst: Instrument) => {
      setQuery(inst.name)
      setIsOpen(false)
      onSelect(inst)
    },
    [onSelect]
  )

  const selectManual = useCallback(() => {
    setIsOpen(false)
    onManualInput(query.trim())
  }, [query, onManualInput])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((i) => Math.min(i + 1, totalItems - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (showManualOption && highlightIndex === 0) {
          selectManual()
        } else if (highlightIndex - manualOffset >= 0 && highlightIndex - manualOffset < allResults.length) {
          selectInstrument(allResults[highlightIndex - manualOffset])
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'border-input h-10 w-full rounded-md border bg-transparent pl-9 pr-9 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'placeholder:text-muted-foreground',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && (totalItems > 0 || isSearching) && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[320px] rounded-md border bg-popover shadow-lg"
        >
          {/* Manual entry option – pinned at top, always visible */}
          {showManualOption && (
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm border-b transition-colors',
                highlightIndex === 0
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
              onMouseEnter={() => setHighlightIndex(0)}
              onClick={selectManual}
            >
              <PenLine className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Manuell eingeben:</span>
              <span className="font-medium truncate">
                &quot;{query.trim()}&quot;
              </span>
            </button>
          )}

          {/* Scrollable results area */}
          <div
            ref={listRef}
            className="max-h-64 overflow-y-auto"
          >
            {/* Local results */}
            {localFiltered.length > 0 && (
              <>
                {uniqueApiResults.length > 0 && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                    Favoriten
                  </div>
                )}
                {localFiltered.map((inst, idx) => {
                  const globalIdx = idx + manualOffset
                  return (
                    <button
                      key={`local-${inst.symbol}`}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                        globalIdx === highlightIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      )}
                      onMouseEnter={() => setHighlightIndex(globalIdx)}
                      onClick={() => selectInstrument(inst)}
                    >
                      <span className="font-medium flex-1 truncate">
                        {inst.name}
                      </span>
                      {inst.name !== inst.symbol && (
                        <span className="text-xs text-muted-foreground">
                          {inst.symbol}
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
                          ASSET_CLASS_COLORS[inst.asset_klasse] ||
                            'bg-gray-100 text-gray-700'
                        )}
                      >
                        {inst.asset_klasse}
                      </span>
                    </button>
                  )
                })}
              </>
            )}

            {/* API results */}
            {uniqueApiResults.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-t">
                  Weitere Ergebnisse
                </div>
                {uniqueApiResults.map((inst, idx) => {
                  const globalIdx = localFiltered.length + idx + manualOffset
                  return (
                    <button
                      key={`api-${inst.api}`}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                        globalIdx === highlightIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      )}
                      onMouseEnter={() => setHighlightIndex(globalIdx)}
                      onClick={() => selectInstrument(inst)}
                    >
                      <span className="font-medium flex-1 truncate">
                        {inst.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {inst.symbol}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
                          ASSET_CLASS_COLORS[inst.asset_klasse] ||
                            'bg-gray-100 text-gray-700'
                        )}
                      >
                        {inst.asset_klasse}
                      </span>
                    </button>
                  )
                })}
              </>
            )}

            {/* Loading indicator */}
            {isSearching && allResults.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Suche...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
