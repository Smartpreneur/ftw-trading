'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function SetupsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to browser console so the developer can inspect it in the user's session
    console.error('SetupsPage render error:', error)
  }, [error])

  return (
    <div className="py-16">
      <div className="mx-auto max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-600" />
        <h2 className="mb-2 text-lg font-semibold text-amber-900">
          Setups konnten nicht geladen werden
        </h2>
        <p className="mb-4 text-sm text-amber-800">
          Beim Laden der Setup-Seite ist ein Fehler aufgetreten. Versuche es bitte erneut —
          deine Eingaben wurden gespeichert.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-amber-700/70">
            Fehler-ID: {error.digest}
          </p>
        )}
        <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Erneut versuchen
        </Button>
      </div>
    </div>
  )
}
