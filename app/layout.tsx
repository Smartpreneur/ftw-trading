import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ConditionalNav } from '@/components/conditional-nav'
import { ConditionalMain } from '@/components/conditional-main'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FTW Trading Journal',
  description: 'Persönliches Trading-Tagebuch mit Performance-Analyse',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={`${geist.variable} font-sans antialiased`} suppressHydrationWarning>
        <ConditionalNav />
        <ConditionalMain>{children}</ConditionalMain>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
