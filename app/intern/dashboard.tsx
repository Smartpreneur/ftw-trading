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
  orders: OrderRow[]
  ordersByDay: Record<string, OrderRow[]>
  ordersByCampaign: Record<string, { count: number; revenue: number; newOrders: number }>
}

type OrderRow = {
  order_id: string
  ordered_at: string
  is_new_order: boolean
  amount: number
  campaign_id: string | null
  plan_name: string | null
  country_code: string | null
  payment_method: string | null
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

function CollapsibleSection({ title, filterTag, defaultOpen = true, children }: {
  title: string
  filterTag?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="intern__section intern__section--collapsible">
      <button className="intern__section-toggle" onClick={() => setOpen(!open)}>
        <h2>
          {title}
          {filterTag && <span className="intern__filter-tag">{filterTag}</span>}
        </h2>
        <span className={`intern__chevron ${open ? 'intern__chevron--open' : ''}`}>&#9662;</span>
      </button>
      {open && <div className="intern__section-body">{children}</div>}
    </section>
  )
}

export function InternDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<number | null>(14)
  const [activeTab, setActiveTab] = useState<'quellen' | 'klicks' | 'bestellungen'>('quellen')
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
  // --- Orders filtered by range/day ---
  const filteredOrders = isDayFiltered
    ? (data.ordersByDay[selectedDay] || [])
    : (data.orders || []).filter(o => rangeDays.includes(o.ordered_at?.slice(0, 10) || ''))
  const displayOrderCount = filteredOrders.length
  const displayRevenue = filteredOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0)
  const displayNewOrders = filteredOrders.filter(o => o.is_new_order).length

  const displayOrdersByCampaign: Record<string, { count: number; revenue: number; newOrders: number }> = {}
  const displayOrdersByPlan: Record<string, number> = {}
  for (const o of filteredOrders) {
    const cid = o.campaign_id || 'Ohne Campaign'
    if (!displayOrdersByCampaign[cid]) displayOrdersByCampaign[cid] = { count: 0, revenue: 0, newOrders: 0 }
    displayOrdersByCampaign[cid].count++
    displayOrdersByCampaign[cid].revenue += Number(o.amount) || 0
    if (o.is_new_order) displayOrdersByCampaign[cid].newOrders++
    const plan = o.plan_name || 'Unbekannt'
    displayOrdersByPlan[plan] = (displayOrdersByPlan[plan] || 0) + 1
  }

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

      {/* Funnel Overview */}
      <div className="funnel">
        <div className="funnel__step">
          <div className="funnel__step-header">
            <span className="funnel__step-label">Besucher</span>
            <span className="funnel__step-value">{displaySessions}</span>
          </div>
          <div className="funnel__step-sub">{displayViews} Seitenaufrufe</div>
        </div>

        <div className="funnel__arrow">&#9654;</div>

        <div className="funnel__step">
          <div className="funnel__step-header">
            <span className="funnel__step-label">Checkout-Klicks</span>
            <span className="funnel__step-value">{displayClicks}</span>
          </div>
          <div className="funnel__step-rate">
            {displaySessions > 0 ? ((displayClicks / displaySessions) * 100).toFixed(1) : '0'} % der Besucher
          </div>
          <div className="funnel__breakdown">
            {Object.entries(displayProducts)
              .sort(([, a], [, b]) => b - a)
              .map(([product, clicks]) => (
                <div key={product} className="funnel__breakdown-row">
                  <span>{product}</span><span>{clicks}</span>
                </div>
              ))}
            {Object.keys(displayProducts).length === 0 && (
              <div className="funnel__breakdown-empty">Keine Klicks</div>
            )}
          </div>
        </div>

        <div className="funnel__arrow">&#9654;</div>

        <div className="funnel__step">
          <div className="funnel__step-header">
            <span className="funnel__step-label">Bestellungen</span>
            <span className="funnel__step-value">{displayOrderCount}</span>
          </div>
          <div className="funnel__step-rate">
            {displayClicks > 0 ? ((displayOrderCount / displayClicks) * 100).toFixed(1) : '0'} % der Klicks
          </div>
          <div className="funnel__breakdown">
            {Object.entries(displayOrdersByPlan)
              .sort(([, a], [, b]) => b - a)
              .map(([plan, count]) => (
                <div key={plan} className="funnel__breakdown-row">
                  <span>{plan}</span><span>{count}</span>
                </div>
              ))}
            {Object.keys(displayOrdersByPlan).length === 0 && (
              <div className="funnel__breakdown-empty">Keine Bestellungen</div>
            )}
          </div>
          {displayRevenue > 0 && (
            <div className="funnel__revenue">
              {displayRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} &euro; Umsatz
            </div>
          )}
        </div>
      </div>
      <div className="funnel__meta">{displayLabel}</div>

      {/* Sessions Chart */}
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

      {/* Tab Navigation */}
      <div className="detail-tabs">
        {([
          { key: 'quellen' as const, label: 'Quellen' },
          { key: 'klicks' as const, label: 'Klicks' },
          { key: 'bestellungen' as const, label: 'Bestellungen' },
        ]).map(tab => (
          <button
            key={tab.key}
            className={`detail-tabs__btn ${activeTab === tab.key ? 'detail-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Quellen */}
      {activeTab === 'quellen' && (
        <div className="detail-tab-content">
          <div className="detail-tab-row">
            <CollapsibleSection title="Traffic-Quellen" filterTag={isDayFiltered ? displayLabel : undefined}>
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
            </CollapsibleSection>

            <CollapsibleSection title="Ref-Codes" filterTag={isDayFiltered ? displayLabel : undefined}>
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
            </CollapsibleSection>
          </div>

          <CollapsibleSection title="Referrer" filterTag={isDayFiltered ? displayLabel : undefined}>
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
          </CollapsibleSection>
        </div>
      )}

      {/* Tab: Klicks */}
      {activeTab === 'klicks' && (
        <div className="detail-tab-content">
          <CollapsibleSection title="Klicks pro Produkt" filterTag={isDayFiltered ? displayLabel : undefined}>
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
          </CollapsibleSection>

          <CollapsibleSection title="Kampagnen / UTM" filterTag={isDayFiltered ? displayLabel : undefined}>
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
          </CollapsibleSection>
        </div>
      )}

      {/* Tab: Bestellungen */}
      {activeTab === 'bestellungen' && (
        <div className="detail-tab-content">
          <CollapsibleSection title="Bestellungen pro Campaign" filterTag={isDayFiltered ? displayLabel : undefined}>
            <table className="intern-table">
              <thead>
                <tr><th>Campaign</th><th>Bestellungen</th><th>Neue Kunden</th><th>Umsatz</th></tr>
              </thead>
              <tbody>
                {Object.entries(displayOrdersByCampaign)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([cid, v]) => (
                    <tr key={cid}>
                      <td>{cid}</td>
                      <td>{v.count}</td>
                      <td>{v.newOrders}</td>
                      <td>{v.revenue.toFixed(2).replace('.', ',')} &euro;</td>
                    </tr>
                  ))}
                {Object.keys(displayOrdersByCampaign).length === 0 && (
                  <tr><td colSpan={4}>{isDayFiltered ? 'Keine Bestellungen an diesem Tag' : 'Noch keine Bestellungen'}</td></tr>
                )}
              </tbody>
            </table>
          </CollapsibleSection>

          <CollapsibleSection title="Einzelne Bestellungen" filterTag={isDayFiltered ? displayLabel : undefined}>
            <table className="intern-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Order-ID</th>
                  <th>Plan</th>
                  <th>Campaign</th>
                  <th>Land</th>
                  <th>Zahlung</th>
                  <th>Neu</th>
                  <th>Betrag</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.order_id}>
                    <td>{new Date(o.ordered_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })}</td>
                    <td>{o.order_id}</td>
                    <td>{o.plan_name || '–'}</td>
                    <td>{o.campaign_id || '–'}</td>
                    <td>{o.country_code || '–'}</td>
                    <td>{o.payment_method || '–'}</td>
                    <td>{o.is_new_order ? 'Ja' : 'Nein'}</td>
                    <td>{Number(o.amount).toFixed(2).replace('.', ',')} &euro;</td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={8}>{isDayFiltered ? 'Keine Bestellungen an diesem Tag' : 'Noch keine Bestellungen'}</td></tr>
                )}
              </tbody>
            </table>
          </CollapsibleSection>
        </div>
      )}
    </div>
  )
}
