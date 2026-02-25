'use client'

import { usePathname } from 'next/navigation'

export function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Landing pages and their sub-routes have their own layout, no main wrapper needed
  if (pathname === '/landing' || pathname === '/landing-light' || pathname.startsWith('/landing/')) {
    return <>{children}</>
  }

  // Dashboard pages use standard main wrapper
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </main>
  )
}
