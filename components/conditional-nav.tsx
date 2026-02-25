'use client'

import { usePathname } from 'next/navigation'
import { Nav } from './nav'

export function ConditionalNav() {
  const pathname = usePathname()

  // Don't show Nav on landing pages and their sub-routes
  if (pathname === '/landing' || pathname === '/landing-light' || pathname.startsWith('/landing/')) {
    return null
  }

  return <Nav />
}
