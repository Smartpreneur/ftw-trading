import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Fugmanns Trading Woche',
  description: 'Fertige Analysen für jede Marktlage – direkt ins Postfach, sofort umsetzbar.',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
