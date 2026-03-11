'use client'

import { usePathname } from 'next/navigation'
import { Nav } from './nav'

export function ConditionalNav() {
  const pathname = usePathname()

  // Don't show Nav on landing pages, intern area, and admin page
  if (
    pathname === '/' ||
    pathname === '/landing' ||
    pathname === '/landing-light' ||
    pathname.startsWith('/landing/') ||
    pathname.startsWith('/intern') ||
    pathname === '/admin'
  ) {
    return null
  }

  return <Nav />
}
