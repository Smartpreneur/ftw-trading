import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Fugmanns Trading Service – Mit Profi-Wissen mehr Rendite erwirtschaften',
  description: 'Top-Analysen fertig vorbereitet mit Einstieg, Stop-Loss & Gewinnmitnahme. 70%+ Trefferquote, 140+ Chancen pro Jahr.',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
