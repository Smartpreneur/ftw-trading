'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useOptimistic } from 'react'
import { User, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { TRADING_PROFILES } from '@/lib/constants'
import type { TradingProfile } from '@/lib/types'

export function ProfileFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get currently selected profiles from URL params
  // Default to all if none specified
  const urlProfiles = searchParams.get('profiles')?.split(',') || TRADING_PROFILES
  const [optimisticProfiles, setOptimisticProfiles] = useOptimistic(urlProfiles)

  const handleToggle = (profile: TradingProfile) => {
    const current = new Set(optimisticProfiles)

    if (current.has(profile)) {
      current.delete(profile)
    } else {
      current.add(profile)
    }

    // Don't allow deselecting all profiles
    if (current.size === 0) return

    const newProfiles = Array.from(current)
    const params = new URLSearchParams(searchParams.toString())

    if (current.size === TRADING_PROFILES.length) {
      // If all are selected, remove the param (default behavior)
      params.delete('profiles')
    } else {
      params.set('profiles', newProfiles.join(','))
    }

    startTransition(() => {
      setOptimisticProfiles(newProfiles)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const selectedCount = optimisticProfiles.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Trader</span>
          {selectedCount < TRADING_PROFILES.length && (
            <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
              {selectedCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium">Trader auswählen</p>
          <div className="space-y-2">
            {TRADING_PROFILES.map((profile) => (
              <div key={profile} className="flex items-center space-x-2">
                <Checkbox
                  id={`profile-${profile}`}
                  checked={optimisticProfiles.includes(profile)}
                  onCheckedChange={() => handleToggle(profile)}
                />
                <Label
                  htmlFor={`profile-${profile}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {profile}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
