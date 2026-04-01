'use client'

import { usePathname } from 'next/navigation'
import { Nav } from './nav'

export function ConditionalNav({ isAdmin = false, isAuthed = false }: { isAdmin?: boolean; isAuthed?: boolean }) {
  const pathname = usePathname()

  // Don't show Nav on landing pages, intern area, and admin page
  if (
    pathname === '/' ||
    pathname === '/landing' ||
    pathname === '/landing-light' ||
    pathname.startsWith('/landing/') ||
    pathname.startsWith('/intern') ||
    pathname === '/trader'
  ) {
    return null
  }

  return <Nav isAdmin={isAdmin} isAuthed={isAuthed} />
}
