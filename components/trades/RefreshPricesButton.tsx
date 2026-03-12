'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { refreshActiveTradePrices } from '@/lib/price-actions'
import { toast } from 'sonner'
export function RefreshPricesButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      window.location.reload()
    } catch (error: any) {
      toast.error('Fehler beim Aktualisieren der Kurse')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
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
  )
}
