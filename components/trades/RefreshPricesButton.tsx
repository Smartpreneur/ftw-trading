'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Check } from 'lucide-react'
import { refreshActiveTradePrices } from '@/lib/price-actions'
import { toast } from 'sonner'

const PRICE_CACHE_MINUTES = 15

interface RefreshPricesButtonProps {
  lastUpdatedAt?: string | null  // when our fetch job ran (for freshness check)
  lastDataAt?: string | null     // when the price data is actually from (after subtracting API delays)
}

export function RefreshPricesButton({ lastUpdatedAt, lastDataAt }: RefreshPricesButtonProps) {
  const isFresh = lastUpdatedAt
    ? (Date.now() - new Date(lastUpdatedAt).getTime()) < PRICE_CACHE_MINUTES * 60 * 1000
    : false

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)

  // Display the time the price DATA is from, not when we fetched it
  const displayTime = lastDataAt ?? lastUpdatedAt
  const timeLabel = displayTime
    ? new Date(displayTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
    : null

  if (isFresh || justRefreshed) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        Kursstand von {timeLabel ?? '–'}
      </span>
    )
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      const result = await refreshActiveTradePrices()
      toast.success(`${result.updated} Kurse aktualisiert`)
      if (result.errors > 0) {
        const details = result.failedAssets.length > 0
          ? `\n${result.failedAssets.join(', ')}`
          : ''
        toast.warning(`${result.errors} Kurs(e) nicht verfügbar${details}`, { duration: 8000 })
      }
      setJustRefreshed(true)
      window.location.reload()
    } catch (error: any) {
      toast.error('Fehler beim Aktualisieren der Kurse')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {timeLabel && (
        <span className="text-xs text-muted-foreground/60">
          Kursstand von {timeLabel}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="gap-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Aktualisiere...' : 'Kurse aktualisieren'}
      </Button>
    </div>
  )
}
