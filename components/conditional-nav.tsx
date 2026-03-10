'use client'

import { usePathname } from 'next/navigation'
import { Nav } from './nav'

interface ConditionalNavProps {
  isAdmin: boolean
}

export function ConditionalNav({ isAdmin }: ConditionalNavProps) {
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

  return <Nav isAdmin={isAdmin} />
}
