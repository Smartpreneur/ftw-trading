import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wissen | FTW Trading',
  description: 'Wissensbereich und Onboarding für Fugmann\'s Trading Woche',
}

export default async function WissenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
