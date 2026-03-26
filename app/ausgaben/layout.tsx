import type { Metadata } from 'next'
import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'

export const metadata: Metadata = {
  title: 'Ausgaben | FTW Trading',
  description: 'Archiv aller Newsletter-Ausgaben von Fugmann\'s Trading Woche',
}

export default async function AusgabenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  return <>{children}</>
}
