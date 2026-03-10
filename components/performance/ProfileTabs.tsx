'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const PROFILE_TABS = [
  { label: 'Gesamt', profiles: ['MB3', 'SJ', 'SJ2'] },
  { label: 'Stefan Jäger', profiles: ['SJ', 'SJ2'] },
  { label: 'Michael Borgmann', profiles: ['MB3'] },
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const profilesParam = searchParams.get('profiles')
  const currentProfiles = profilesParam?.split(',') ?? null

  function handleTabClick(profiles: readonly string[]) {
    const href = `/performance?profiles=${profiles.join(',')}`
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {PROFILE_TABS.map((tab) => {
        const active = isActiveTab(currentProfiles, tab.profiles)

        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => handleTabClick(tab.profiles)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        )
      })}
      {isPending && (
        <Loader2 className="h-4 w-4 ml-1 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
