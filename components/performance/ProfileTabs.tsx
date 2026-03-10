'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const PROFILE_TABS = [
  { label: 'Gesamt', profiles: ['MB3', 'SJ', 'SJ2'] },
  { label: 'Michael Borgmann', profiles: ['MB3'] },
  { label: 'Stefan Jäger', profiles: ['SJ', 'SJ2'] },
] as const

function isActiveTab(
  currentProfiles: string[] | null,
  tabProfiles: readonly string[]
): boolean {
  const current = currentProfiles ?? ['MB3', 'SJ', 'SJ2']
  if (current.length !== tabProfiles.length) return false
  const sorted = [...current].sort()
  const tabSorted = [...tabProfiles].sort()
  return sorted.every((p, i) => p === tabSorted[i])
}

export function ProfileTabs() {
  const searchParams = useSearchParams()
  const profilesParam = searchParams.get('profiles')
  const currentProfiles = profilesParam?.split(',') ?? null

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {PROFILE_TABS.map((tab) => {
        const active = isActiveTab(currentProfiles, tab.profiles)
        const href = `/performance?profiles=${tab.profiles.join(',')}`

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
