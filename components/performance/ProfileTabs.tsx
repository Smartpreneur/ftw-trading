'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ACTIVE_TABS, PROFILE_TABS, DEFAULT_TAB } from '@/lib/profile-tabs'

export function ProfileTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const tabs = isAdmin ? PROFILE_TABS : ACTIVE_TABS
  const currentTab = searchParams.get('tab') ?? DEFAULT_TAB

  // Preserve embed token across tab switches
  const token = searchParams.get('token')

  function handleTabClick(tabKey: string) {
    const href = `/performance?tab=${tabKey}${token ? `&token=${token}` : ''}`
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
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
