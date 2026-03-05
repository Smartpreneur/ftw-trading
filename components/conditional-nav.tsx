'use client'

import { usePathname } from 'next/navigation'
import { Nav } from './nav'

export function ConditionalNav() {
  const pathname = usePathname()

  // Don't show Nav on landing pages and intern area (has own nav)
  if (
    pathname === '/' ||
    pathname === '/landing' ||
    pathname === '/landing-light' ||
    pathname.startsWith('/landing/') ||
    pathname.startsWith('/intern')
  ) {
    return null
  }

  return <Nav />
}
