import { checkAdmin } from '@/lib/auth'
import { getAusgaben } from '@/lib/ausgaben-actions'
import { AusgabenViewer } from './ausgaben-viewer'

export default async function AusgabenPage() {
  const isAdmin = await checkAdmin()
  const ausgaben = await getAusgaben()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">FTW</h1>
      <AusgabenViewer ausgaben={ausgaben} isAdmin={isAdmin} />
    </div>
  )
}
