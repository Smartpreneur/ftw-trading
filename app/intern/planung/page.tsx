import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'
import { PlanungDashboard } from './planung-dashboard'

export default async function PlanungPage() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  return <PlanungDashboard />
}
