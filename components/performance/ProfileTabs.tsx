'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useTransition, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ACTIVE_TABS, PROFILE_TABS, DEFAULT_TAB } from '@/lib/profile-tabs'

export const TAB_STORAGE_KEY = 'ftw-perf-tab'

export function ProfileTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const tabs = isAdmin ? PROFILE_TABS : ACTIVE_TABS
  const urlTab = searchParams.get('tab')
  // Always derive displayed tab from URL only — never from localStorage.
  // This ensures the highlighted tab always matches the server-rendered data.
  const currentTab = urlTab && tabs.some((t) => t.key === urlTab) ? urlTab : DEFAULT_TAB

  // Preserve embed token across tab switches
  const token = searchParams.get('token')

  // Persist tab selection and restore on navigation back
  useEffect(() => {
    if (urlTab) {
      // Sync URL → localStorage
      localStorage.setItem(TAB_STORAGE_KEY, urlTab)
    } else {
      // No tab in URL → restore saved preference (triggers server re-render with correct data)
      const saved = localStorage.getItem(TAB_STORAGE_KEY)
      if (saved && saved !== DEFAULT_TAB && tabs.some((t) => t.key === saved)) {
        const href = `/performance?tab=${saved}${token ? `&token=${token}` : ''}`
        router.replace(href, { scroll: false })
      }
    }
  }, [urlTab, token, router, tabs])

  function handleTabClick(tabKey: string) {
    localStorage.setItem(TAB_STORAGE_KEY, tabKey)
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
