'use client'

import { usePathname } from 'next/navigation'
import { Nav } from './nav'

export function ConditionalNav() {
  const pathname = usePathname()

  // Don't show Nav on landing pages
  if (pathname === '/landing' || pathname === '/landing-light') {
    return null
  }

  return <Nav />
}
