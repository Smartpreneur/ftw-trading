import type { Metadata } from 'next'
import { checkAuth } from '@/lib/auth'
import { PasswordGate } from '@/components/password-gate'

export const metadata: Metadata = {
  title: 'So startest du | FTW Trading',
  description: 'In 5 Schritten vom Postfach ins Depot',
}

export default async function StartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return <PasswordGate />

  return <>{children}</>
}
