'use client'

import { useEffect, useState } from 'react'
import { getAnalytics } from './actions'
import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useTheme } from './use-theme'
import './styles.css'

type AnalyticsData = {
  totalViews: number
  totalClicks: number
  uniqueSessions: number
  conversionRate: string
  viewsToday: number
  views7d: number
  views30d: number
  clicksToday: number
  clicks7d: number
  clicks30d: number
  viewsByDay: Record<string, number>
  uniqueSessionsByDay: Record<string, number>
  clicksByDay: Record<string, number>
  clicksByProduct: Record<string, number>
  clicksByProductByDay: Record<string, Record<string, number>>
  sources: Record<string, number>
  sourcesByDay: Record<string, Record<string, number>>
  referrers: Record<string, number>
  referrersByDay: Record<string, Record<string, number>>
  campaigns: CampaignEntry[]
  campaignsByDay: Record<string, CampaignEntry[]>
  refCodes: Record<string, number>
  refCodesByDay: Record<string, Record<string, number>>
}

type CampaignEntry = {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  campaign_id: string
  views: number
  clicks: number
}

function formatDay(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  })
}

function formatDayShort(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit',
  })
}

export function InternDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<number | null>(14)
  const router = useRouter()
  const { light, toggle } = useTheme()

  useEffect(() => {
    getAnalytics().then(result => {
      if (result.data) setData(result.data)
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="intern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#5a6a7a' }}>Daten werden geladen...</p>
      </div>
    )
  }

  if (!data) return null

  // All days sorted
  const allDays = Object.keys(data.uniqueSessionsByDay).sort()

  // Date range filter: restrict to last N days
  const rangeOptions = [
    { label: '2T', value: 2 },
    { label: '7T', value: 7 },
    { label: '14T', value: 14 },
    { label: '28T', value: 28 },
    { label: 'Alle', value: null as number | null },
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rangeDays = dateRange !== null
    ? allDays.filter(d => {
        const diff = (today.getTime() - new Date(d + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)
        return diff < dateRange
      })
    : allDays

  // Chart shows days in range
  const chartDays = rangeDays
  const maxSessions = Math.max(...chartDays.map(d => data.uniqueSessionsByDay[d] || 0), 1)

  // Helper: sum values from a Record for days in range
  function sumRange(byDay: Record<string, number>): number {
    return rangeDays.reduce((s, d) => s + (byDay[d] || 0), 0)
  }
  function mergeRange(byDay: Record<string, Record<string, number>>): Record<string, number> {
    const merged: Record<string, number> = {}
    for (const d of rangeDays) {
      for (const [k, v] of Object.entries(byDay[d] || {})) {
        merged[k] = (merged[k] || 0) + v
      }
    }
    return merged
  }
  function mergeRangeCampaigns(byDay: Record<string, CampaignEntry[]>): CampaignEntry[] {
    const map = new Map<string, CampaignEntry>()
    for (const d of rangeDays) {
      for (const c of byDay[d] || []) {
        const key = `${c.utm_source}|${c.utm_medium}|${c.utm_campaign}|${c.campaign_id}`
        const existing = map.get(key)
        if (existing) {
          existing.views += c.views
          existing.clicks += c.clicks
        } else {
          map.set(key, { ...c })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks))
  }
  function countUniqueSessions(): number {
    if (!data) return 0
    return rangeDays.reduce((s, d) => s + (data.uniqueSessionsByDay[d] || 0), 0)
  }

  // Filtered data based on selected day or range
  const isDayFiltered = selectedDay !== null
  const rangeViews = sumRange(data.viewsByDay)
  const rangeSessions = countUniqueSessions()
  const rangeClicks = sumRange(data.clicksByDay)

  const displayViews = isDayFiltered ? (data.viewsByDay[selectedDay] || 0) : rangeViews
  const displaySessions = isDayFiltered ? (data.uniqueSessionsByDay[selectedDay] || 0) : rangeSessions
  const displayClicks = isDayFiltered ? (data.clicksByDay[selectedDay] || 0) : rangeClicks
  const displayProducts = isDayFiltered ? (data.clicksByProductByDay[selectedDay] || {}) : mergeRange(data.clicksByProductByDay)
  const displaySources = isDayFiltered ? (data.sourcesByDay[selectedDay] || {}) : mergeRange(data.sourcesByDay)
  const displayReferrers = isDayFiltered ? (data.referrersByDay[selectedDay] || {}) : mergeRange(data.referrersByDay)
  const displayCampaigns = isDayFiltered ? (data.campaignsByDay[selectedDay] || []) : mergeRangeCampaigns(data.campaignsByDay)
  const displayRefCodes = isDayFiltered ? (data.refCodesByDay[selectedDay] || {}) : mergeRange(data.refCodesByDay)
  const rangeLabel = dateRange !== null ? `Letzte ${dateRange} Tage` : 'Gesamt'
  const displayLabel = isDayFiltered ? formatDay(selectedDay) : rangeLabel

  return (
    <div className={`intern${light ? ' light' : ''}`}>
      <header className="intern__header">
        <h1>Landing Page KPIs</h1>
        <div className="intern__header-actions">
          <a href="/intern" className="intern__nav-link">Übersicht</a>
          <button onClick={toggle} className="theme-toggle" title={light ? 'Dark Mode' : 'Light Mode'}>
            {light ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="intern__logout">
            Abmelden
          </button>
        </div>
      </header>

      {/* Date Range Filter */}
      <div className="range-filter">
        {rangeOptions.map(opt => (
          <button
            key={opt.label}
            className={`range-filter__btn ${dateRange === opt.value ? 'range-filter__btn--active' : ''}`}
            onClick={() => { setDateRange(opt.value); setSelectedDay(null) }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card__label">Seitenaufrufe</div>
          <div className="kpi-card__value">{displayViews}</div>
          <div className="kpi-card__sub">{displayLabel}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Checkout-Klicks</div>
          <div className="kpi-card__value">{displayClicks}</div>
          <div className="kpi-card__sub">{displayLabel}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Unique Sessions</div>
          <div className="kpi-card__value">{displaySessions}</div>
          <div className="kpi-card__sub">{displayLabel}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card__label">Conversion Rate</div>
          <div className="kpi-card__value">
            {displaySessions > 0 && displayClicks > 0
              ? ((displayClicks / displaySessions) * 100).toFixed(1)
              : data.conversionRate} %
          </div>
          <div className="kpi-card__sub">{displayLabel}</div>
        </div>
      </div>

      {/* Sessions Chart (last 14 days) */}
      <section className="intern__section">
        <div className="intern__section-header">
          <h2>Unique Sessions ({rangeLabel})</h2>
          {isDayFiltered && (
            <button onClick={() => setSelectedDay(null)} className="intern__reset-btn">
              Alle anzeigen
            </button>
          )}
        </div>
        <div className="bar-chart">
          {chartDays.map(day => {
            const count = data.uniqueSessionsByDay[day] || 0
            const isDayActive = selectedDay === day
            return (
              <div
                key={day}
                className={`bar-chart__col ${isDayActive ? 'bar-chart__col--active' : ''}`}
                onClick={() => setSelectedDay(isDayActive ? null : day)}
              >
                <div className="bar-chart__count">{count}</div>
                <div
                  className="bar-chart__bar"
                  style={{ height: `${(count / maxSessions) * 100}%` }}
                />
                <div className="bar-chart__label">
                  {formatDayShort(day)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Detail Tables 2x2 */}
      <div className="intern__grid-2x2">
        <section className="intern__section">
          <h2>Klicks pro Produkt {isDayFiltered && <span className="intern__filter-tag">{displayLabel}</span>}</h2>
          <table className="intern-table">
            <thead>
              <tr><th>Produkt</th><th>Klicks</th></tr>
            </thead>
            <tbody>
              {Object.entries(displayProducts)
                .sort(([, a], [, b]) => b - a)
                .map(([product, clicks]) => (
                  <tr key={product}>
                    <td>{product}</td>
                    <td>{clicks}</td>
                  </tr>
                ))}
              {Object.keys(displayProducts).length === 0 && (
                <tr><td colSpan={2}>{isDayFiltered ? 'Keine Klicks an diesem Tag' : 'Noch keine Klicks'}</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="intern__section">
          <h2>Ref-Codes {isDayFiltered && <span className="intern__filter-tag">{displayLabel}</span>}</h2>
          <table className="intern-table">
            <thead>
              <tr><th>Code</th><th>Aufrufe</th><th>Anteil</th></tr>
            </thead>
            <tbody>
              {Object.entries(displayRefCodes)
                .sort(([, a], [, b]) => b - a)
                .map(([code, count]) => (
                  <tr key={code}>
                    <td>{code}</td>
                    <td>{count}</td>
                    <td>{displayViews > 0 ? ((count / displayViews) * 100).toFixed(1) : '0'} %</td>
                  </tr>
                ))}
              {Object.keys(displayRefCodes).length === 0 && (
                <tr><td colSpan={3}>{isDayFiltered ? 'Keine Ref-Codes an diesem Tag' : 'Noch keine Ref-Code-Daten'}</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="intern__section">
          <h2>Traffic-Quellen {isDayFiltered && <span className="intern__filter-tag">{displayLabel}</span>}</h2>
          <table className="intern-table">
            <thead>
              <tr><th>Quelle</th><th>Aufrufe</th><th>Anteil</th></tr>
            </thead>
            <tbody>
              {Object.entries(displaySources)
                .sort(([, a], [, b]) => b - a)
                .map(([src, count]) => (
                  <tr key={src}>
                    <td>{src}</td>
                    <td>{count}</td>
                    <td>{displayViews > 0 ? ((count / displayViews) * 100).toFixed(1) : '0'} %</td>
                  </tr>
                ))}
              {Object.keys(displaySources).length === 0 && (
                <tr><td colSpan={3}>Keine Daten</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="intern__section">
          <h2>Referrer {isDayFiltered && <span className="intern__filter-tag">{displayLabel}</span>}</h2>
          <table className="intern-table">
            <thead>
              <tr><th>Herkunft</th><th>Aufrufe</th><th>Anteil</th></tr>
            </thead>
            <tbody>
              {Object.entries(displayReferrers)
                .sort(([, a], [, b]) => b - a)
                .map(([ref, count]) => (
                  <tr key={ref}>
                    <td>{ref}</td>
                    <td>{count}</td>
                    <td>{displayViews > 0 ? ((count / displayViews) * 100).toFixed(1) : '0'} %</td>
                  </tr>
                ))}
              {Object.keys(displayReferrers).length === 0 && (
                <tr><td colSpan={3}>{isDayFiltered ? 'Keine Referrer an diesem Tag' : 'Noch keine Referrer-Daten'}</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="intern__section">
          <h2>Kampagnen / UTM {isDayFiltered && <span className="intern__filter-tag">{displayLabel}</span>}</h2>
          <table className="intern-table">
            <thead>
              <tr><th>Quelle</th><th>Medium</th><th>Kampagne</th><th>Views</th><th>Klicks</th></tr>
            </thead>
            <tbody>
              {displayCampaigns.map((c, i) => (
                <tr key={i}>
                  <td>{c.utm_source || c.campaign_id || '–'}</td>
                  <td>{c.utm_medium || '–'}</td>
                  <td>{c.utm_campaign || c.campaign_id || '–'}</td>
                  <td>{c.views}</td>
                  <td>{c.clicks}</td>
                </tr>
              ))}
              {displayCampaigns.length === 0 && (
                <tr><td colSpan={5}>{isDayFiltered ? 'Keine Kampagnen-Daten an diesem Tag' : 'Noch keine Kampagnen-Daten'}</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
