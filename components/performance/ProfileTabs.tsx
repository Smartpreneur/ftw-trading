'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PROFILE_TABS, DEFAULT_TAB } from '@/lib/profile-tabs'

export function ProfileTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentTab = searchParams.get('tab') ?? DEFAULT_TAB

  function handleTabClick(tabKey: string) {
    const href = `/performance?tab=${tabKey}`
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {PROFILE_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => handleTabClick(tab.key)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
            currentTab === tab.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
      {isPending && (
        <Loader2 className="h-4 w-4 ml-1 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
