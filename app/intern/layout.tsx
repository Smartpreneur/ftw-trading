import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'
import { InternShell } from './intern-shell'

export default async function InternLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  return <InternShell>{children}</InternShell>
}
