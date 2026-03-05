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
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [activeTab, setActiveTab] = useState<'quellen' | 'klicks' | 'bestellungen'>('quellen')
  const [funnelOpen, setFunnelOpen] = useState(false)
  const [chartMode, setChartMode] = useState<'funnel' | 'visitors' | 'revenue'>('funnel')
  const [customRangeOpen, setCustomRangeOpen] = useState(false)
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
  const isCustomRange = customFrom !== '' || customTo !== ''
  const rangeDays = isCustomRange
    ? allDays.filter(d => {
        if (customFrom && d < customFrom) return false
        if (customTo && d > customTo) return false
        return true
      })
    : dateRange !== null
      ? allDays.filter(d => {
          const diff = (today.getTime() - new Date(d + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)
          return diff < dateRange
        })
      : allDays

  // Chart shows days in range
  const chartDays = rangeDays
  const maxSessions = Math.max(...chartDays.map(d => data.uniqueSessionsByDay[d] || 0), 1)
  const ordersCountByDay: Record<string, number> = {}
  const revenueByDay: Record<string, number> = {}
  for (const d of chartDays) {
    const dayOrders = data.ordersByDay[d] || []
    ordersCountByDay[d] = dayOrders.length
    revenueByDay[d] = dayOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0)
  }
  const maxRevenue = Math.max(...chartDays.map(d => revenueByDay[d] || 0), 1)

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
  const rangeLabel = isCustomRange
    ? `${customFrom || '...'} – ${customTo || '...'}`
    : dateRange !== null ? `Letzte ${dateRange} Tage` : 'Gesamt'
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
          <a href="/intern" className="intern__nav-link" title="Übersicht">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="intern__btn-label">Übersicht</span>
          </a>
          <button onClick={toggle} className="theme-toggle" title={light ? 'Dark Mode' : 'Light Mode'}>
            {light ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="intern__logout" title="Abmelden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span className="intern__btn-label">Abmelden</span>
          </button>
        </div>
      </header>

      {/* Date Range Filter */}
      <div className="range-filter">
        {rangeOptions.map(opt => (
          <button
            key={opt.label}
            className={`range-filter__btn ${!isCustomRange && dateRange === opt.value ? 'range-filter__btn--active' : ''}`}
            onClick={() => { setDateRange(opt.value); setSelectedDay(null); setCustomFrom(''); setCustomTo(''); setCustomRangeOpen(false) }}
          >
            {opt.label}
          </button>
        ))}
        <div className="range-filter__custom">
          <button
            className={`range-filter__btn ${isCustomRange ? 'range-filter__btn--active' : ''}`}
            onClick={() => setCustomRangeOpen(!customRangeOpen)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: -2 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {isCustomRange ? `${customFrom || '...'} – ${customTo || '...'}` : 'Zeitraum'}
          </button>
          {customRangeOpen && (
            <div className="range-filter__dropdown">
              <label className="range-filter__dropdown-label">Von</label>
              <input
                type="date"
                className={`range-filter__date ${isCustomRange ? 'range-filter__date--active' : ''}`}
                value={customFrom}
                onChange={e => { setCustomFrom(e.target.value); setSelectedDay(null) }}
              />
              <label className="range-filter__dropdown-label">Bis</label>
              <input
                type="date"
                className={`range-filter__date ${isCustomRange ? 'range-filter__date--active' : ''}`}
                value={customTo}
                onChange={e => { setCustomTo(e.target.value); setSelectedDay(null) }}
              />
              {isCustomRange && (
                <button
                  className="range-filter__btn range-filter__btn--clear"
                  onClick={() => { setCustomFrom(''); setCustomTo(''); setDateRange(14); setCustomRangeOpen(false) }}
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Funnel Overview */}
      <div className="funnel">
        <div className="funnel__step" onClick={() => setFunnelOpen(!funnelOpen)} role="button">
          <div className="funnel__step-header">
            <span className="funnel__step-label">Besucher</span>
            <span className="funnel__step-value">{displaySessions}</span>
          </div>
          <div className="funnel__step-sub">{displayViews} Seitenaufrufe</div>
        </div>

        <div className="funnel__arrow">&#9654;</div>

        <div className="funnel__step" onClick={() => setFunnelOpen(!funnelOpen)} role="button">
          <div className="funnel__step-header">
            <span className="funnel__step-label">Checkout-Klicks</span>
            <span className="funnel__step-value">{displayClicks}</span>
            <span className={`funnel__step-chevron ${funnelOpen ? 'funnel__step-chevron--open' : ''}`}>&#9662;</span>
          </div>
          <div className="funnel__step-rate">
            {displaySessions > 0 ? ((displayClicks / displaySessions) * 100).toFixed(1) : '0'} % der Besucher
          </div>
          {funnelOpen && (
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
          )}
        </div>

        <div className="funnel__arrow">&#9654;</div>

        <div className="funnel__step" onClick={() => setFunnelOpen(!funnelOpen)} role="button">
          <div className="funnel__step-header">
            <span className="funnel__step-label">Bestellungen</span>
            <span className="funnel__step-value">{displayOrderCount}</span>
            <span className={`funnel__step-chevron ${funnelOpen ? 'funnel__step-chevron--open' : ''}`}>&#9662;</span>
          </div>
          <div className="funnel__step-rate">
            {displayClicks > 0 ? ((displayOrderCount / displayClicks) * 100).toFixed(1) : '0'}&nbsp;% der Klicks
            {' | '}
            {displaySessions > 0 ? ((displayOrderCount / displaySessions) * 100).toFixed(1) : '0'}&nbsp;% Gesamtkonvertierung
          </div>
          {displayRevenue > 0 && (
            <div className="funnel__revenue">
              {displayRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} &euro; Umsatz
            </div>
          )}
          {funnelOpen && (
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
          )}
        </div>
      </div>
      <div className="funnel__meta">{displayLabel}</div>

      {/* Chart with mode toggle */}
      <section className="intern__section">
        <div className="intern__section-header intern__section-header--chart">
          <h2>Tagesübersicht</h2>
          <div className="chart-mode-toggle">
            {([
              { key: 'funnel' as const, label: 'Konvertierung' },
              { key: 'visitors' as const, label: 'Besucher' },
              { key: 'revenue' as const, label: 'Umsatz' },
            ]).map(m => (
              <button
                key={m.key}
                className={`chart-mode-toggle__btn ${chartMode === m.key ? 'chart-mode-toggle__btn--active' : ''}`}
                onClick={() => setChartMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          {isDayFiltered && (
            <button onClick={() => setSelectedDay(null)} className="intern__reset-btn">
              Alle anzeigen
            </button>
          )}
        </div>

        {chartMode === 'funnel' && (
          <div className="chart-legend">
            <span className="chart-legend__item chart-legend__item--sessions">Besucher</span>
            <span className="chart-legend__item chart-legend__item--clicks">Checkout</span>
            <span className="chart-legend__item chart-legend__item--orders">Bestellungen</span>
          </div>
        )}

        <div className="bar-chart">
          {chartDays.map(day => {
            const sessions = data.uniqueSessionsByDay[day] || 0
            const clicks = data.clicksByDay[day] || 0
            const orders = ordersCountByDay[day] || 0
            const revenue = revenueByDay[day] || 0
            const isDayActive = selectedDay === day
            return (
              <div
                key={day}
                className={`bar-chart__col ${isDayActive ? 'bar-chart__col--active' : ''}`}
                onClick={() => setSelectedDay(isDayActive ? null : day)}
              >
                {chartMode === 'funnel' && (
                  <>
                    <div className="bar-chart__counts">
                      <span className="bar-chart__val bar-chart__val--sessions">{sessions}</span>
                      {clicks > 0 && <span className="bar-chart__val bar-chart__val--clicks">{clicks}</span>}
                      {orders > 0 && <span className="bar-chart__val bar-chart__val--orders">{orders}</span>}
                    </div>
                    <div className="bar-chart__stack">
                      <div className="bar-chart__layer bar-chart__layer--sessions" style={{ height: `${(sessions / maxSessions) * 100}%` }} />
                      <div className="bar-chart__layer bar-chart__layer--clicks" style={{ height: `${(clicks / maxSessions) * 100}%` }} />
                      <div className="bar-chart__layer bar-chart__layer--orders" style={{ height: `${(orders / maxSessions) * 100}%` }} />
                    </div>
                  </>
                )}
                {chartMode === 'visitors' && (
                  <>
                    <div className="bar-chart__count">{sessions}</div>
                    <div className="bar-chart__stack">
                      <div className="bar-chart__layer bar-chart__layer--sessions" style={{ height: `${(sessions / maxSessions) * 100}%`, width: '70%' }} />
                    </div>
                  </>
                )}
                {chartMode === 'revenue' && (
                  <>
                    <div className="bar-chart__count bar-chart__val--revenue">{revenue > 0 ? `${revenue}€` : ''}</div>
                    <div className="bar-chart__stack">
                      <div className="bar-chart__layer bar-chart__layer--revenue" style={{ height: `${(revenue / maxRevenue) * 100}%`, width: '70%' }} />
                    </div>
                  </>
                )}
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
                      <td style={{ whiteSpace: 'nowrap' }}>{v.revenue.toFixed(2).replace('.', ',')}&nbsp;&euro;</td>
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
                    <td style={{ whiteSpace: 'nowrap' }}>{Number(o.amount).toFixed(2).replace('.', ',')}&nbsp;&euro;</td>
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
