import type { Metadata } from 'next'
import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'

export const metadata: Metadata = {
  title: 'Wissen | FTW Trading',
  description: 'Wissensbereich und Onboarding für Fugmann\'s Trading Woche',
}

export default async function WissenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  return <>{children}</>
}
