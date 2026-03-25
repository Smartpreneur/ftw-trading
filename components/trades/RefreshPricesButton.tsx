'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Check } from 'lucide-react'
import { refreshActiveTradePrices } from '@/lib/price-actions'
import { toast } from 'sonner'

const PRICE_CACHE_MINUTES = 15

interface RefreshPricesButtonProps {
  lastUpdatedAt?: string | null
}

export function RefreshPricesButton({ lastUpdatedAt }: RefreshPricesButtonProps) {
  const isFresh = lastUpdatedAt
    ? (Date.now() - new Date(lastUpdatedAt).getTime()) < PRICE_CACHE_MINUTES * 60 * 1000
    : false

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)

  const timeLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
    : null

  if (isFresh || justRefreshed) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        Kurse aktuell
        {timeLabel && <span className="text-muted-foreground/60">({timeLabel})</span>}
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
          Zuletzt: {timeLabel}
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
