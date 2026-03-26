import { Suspense } from 'react'
import { SolutionFooter } from '@/components/solution-footer'
import { checkAdmin } from '@/lib/auth'
import { getAusgaben } from '@/lib/ausgaben-actions'
import { AusgabenViewer } from './ausgaben-viewer'
import { Loader2 } from 'lucide-react'

async function AusgabenContent() {
  const [isAdmin, ausgaben] = await Promise.all([
    checkAdmin(),
    getAusgaben(),
  ])

  return <AusgabenViewer ausgaben={ausgaben} isAdmin={isAdmin} />
}

function AusgabenSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* PDF viewer skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="rounded-lg border bg-muted/30 flex items-center justify-center" style={{ height: '70vh' }}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
      {/* Archive list skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="rounded-lg border overflow-hidden divide-y">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="h-4 w-40 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AusgabenPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Wochenausgaben</h1>
      <Suspense fallback={<AusgabenSkeleton />}>
        <AusgabenContent />
      </Suspense>
      <SolutionFooter />
    </div>
  )
}
