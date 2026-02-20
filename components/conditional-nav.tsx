'use client'

import { usePathname } from 'next/navigation'
import { Nav } from './nav'

export function ConditionalNav() {
  const pathname = usePathname()

  // Don't show Nav on landing page
  if (pathname === '/landing') {
    return null
  }

  return <Nav />
}
