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

export const DEFAULT_TAB: TabKey = 'gesamt'

export function resolveTab(tab?: string): TabConfig {
  const found = PROFILE_TABS.find((t) => t.key === tab)
  return found ?? PROFILE_TABS[0]
}
