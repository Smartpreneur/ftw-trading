import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'
import { RabattcodesDashboard } from './rabattcodes-dashboard'

export default async function RabattcodesPage() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  return <RabattcodesDashboard />
}
