import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
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
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
