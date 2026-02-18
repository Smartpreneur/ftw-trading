'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { refreshActiveTradePrices } from '@/lib/price-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RefreshPricesButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      const result = await refreshActiveTradePrices()
      toast.success(`${result.updated} Kurse aktualisiert`)
      if (result.errors > 0) {
        toast.warning(`${result.errors} Kurse konnten nicht aktualisiert werden`)
      }
      router.refresh()
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
