import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'
import { InternDashboard } from '../dashboard'

export default async function AnalyticsPage() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  return <InternDashboard />
}
