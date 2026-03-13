import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ConditionalNav } from '@/components/conditional-nav'
import { ConditionalMain } from '@/components/conditional-main'
import { Toaster } from '@/components/ui/sonner'
import { checkAdmin } from '@/lib/auth'
import { AdminBar } from '@/components/AdminBar'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Fugmann's Trading Woche",
  description: 'Fertige Analysen für jede Marktlage – direkt ins Postfach, sofort umsetzbar.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isAdmin = await checkAdmin()

  return (
    <html lang="de">
      <body className={`${geist.variable} font-sans antialiased`} suppressHydrationWarning>
        {isAdmin && <AdminBar />}
        <ConditionalNav isAdmin={isAdmin} />
        <ConditionalMain>{children}</ConditionalMain>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
