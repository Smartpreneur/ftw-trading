import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'So startest du | FTW Trading',
  description: 'In 5 Schritten vom Postfach ins Depot',
}

export default async function StartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
