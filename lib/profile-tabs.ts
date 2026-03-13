import type { TradingProfile } from './types'

export type TabKey = 'gesamt' | 'jaeger' | 'borgmann'

interface TabConfig {
  label: string
  key: TabKey
  /** Profiles for KPIs/charts (all historical data) */
  kpiProfiles: TradingProfile[]
  /** Profiles for trade lists (clean data from 2026+) */
  listProfiles: TradingProfile[]
}

/** All defined tabs */
export const PROFILE_TABS: TabConfig[] = [
  {
    label: 'Gesamt',
    key: 'gesamt',
    kpiProfiles: ['MB', 'SJ'],
    listProfiles: ['MB', 'SJ'],
  },
  {
    label: 'Stefan Jäger',
    key: 'jaeger',
    kpiProfiles: ['SJ'],
    listProfiles: ['SJ'],
  },
  {
    label: 'Michael Borgmann',
    key: 'borgmann',
    kpiProfiles: ['MB'],
    listProfiles: ['MB'],
  },
]

/**
 * Active profiles from env var NEXT_PUBLIC_ENABLED_PROFILES.
 * Set to "SJ" for only Stefan Jäger, "SJ,MB" for both.
 * Defaults to all profiles if not set.
 */
export const ACTIVE_PROFILES: TradingProfile[] = (
  process.env.NEXT_PUBLIC_ENABLED_PROFILES
    ? process.env.NEXT_PUBLIC_ENABLED_PROFILES.split(',').map((p) => p.trim() as TradingProfile)
    : ['SJ', 'MB']
)

/** Only tabs where every required profile is enabled */
export const ACTIVE_TABS: TabConfig[] = PROFILE_TABS.filter((tab) =>
  tab.kpiProfiles.every((p) => ACTIVE_PROFILES.includes(p))
)

export const DEFAULT_TAB: TabKey = ACTIVE_TABS[0]?.key ?? 'jaeger'

export function resolveTab(tab?: string, isAdmin = false): TabConfig {
  const tabs = isAdmin ? PROFILE_TABS : ACTIVE_TABS
  const found = tabs.find((t) => t.key === tab)
  return found ?? tabs[0]
}
