'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAuth } from '@/lib/auth'

export async function getAnalytics() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = await createClient()

  const { data: events } = await supabase
    .from('landing_events')
    .select('event, source, session_id, created_at, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term, campaign_id, ref_code')
    .order('created_at', { ascending: false })
    .limit(50000)

  if (!events) return { error: 'Keine Daten verfügbar' }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const pageViews = events.filter(e => e.event === 'page_view')
  const checkoutClicks = events.filter(e => e.event.startsWith('checkout_') || e.event === 'checkout_click')

  function labelForEvent(event: string) {
    if (event === 'checkout_click') return 'Unbekannt (alt)'
    if (event === 'checkout_quarterly') return 'Quartalsabo'
    if (event === 'checkout_halfyear') return 'Halbjahresabo'
    if (event === 'checkout_yearly') return 'Jahresabo'
    return event
  }

  // --- Per-day aggregates ---
  const viewsByDay: Record<string, number> = {}
  const uniqueSessionsByDay: Record<string, number> = {}
  const clicksByDay: Record<string, number> = {}
  const clicksByProductByDay: Record<string, Record<string, number>> = {}
  const sourcesByDay: Record<string, Record<string, number>> = {}
  const sessionSets: Record<string, Set<string>> = {}

  pageViews.forEach(e => {
    const day = e.created_at?.slice(0, 10) || ''
    viewsByDay[day] = (viewsByDay[day] || 0) + 1
    if (!sessionSets[day]) sessionSets[day] = new Set()
    if (e.session_id) sessionSets[day].add(e.session_id)
    const src = e.source || 'Direkt / Unbekannt'
    if (!sourcesByDay[day]) sourcesByDay[day] = {}
    sourcesByDay[day][src] = (sourcesByDay[day][src] || 0) + 1
  })

  for (const [day, sessions] of Object.entries(sessionSets)) {
    uniqueSessionsByDay[day] = sessions.size
  }

  checkoutClicks.forEach(e => {
    const day = e.created_at?.slice(0, 10) || ''
    clicksByDay[day] = (clicksByDay[day] || 0) + 1
    const label = labelForEvent(e.event)
    if (!clicksByProductByDay[day]) clicksByProductByDay[day] = {}
    clicksByProductByDay[day][label] = (clicksByProductByDay[day][label] || 0) + 1
  })

  // --- Referrer aggregates ---
  const referrersByDay: Record<string, Record<string, number>> = {}
  const referrerMap: Record<string, number> = {}
  pageViews.forEach(e => {
    const ref = e.referrer || null
    if (!ref) return
    let domain: string
    try { domain = new URL(ref).hostname.replace(/^www\./, '') } catch { domain = ref }
    referrerMap[domain] = (referrerMap[domain] || 0) + 1
    const day = e.created_at?.slice(0, 10) || ''
    if (!referrersByDay[day]) referrersByDay[day] = {}
    referrersByDay[day][domain] = (referrersByDay[day][domain] || 0) + 1
  })

  // --- Ref-Code aggregates ---
  const REF_LABELS: Record<string, string> = {
    'y26': 'YouTube (y26)',
    'n26': 'Newsletter (n26)',
    'w26': 'Website (w26)',
  }
  const refCodeMap: Record<string, number> = {}
  const refCodesByDay: Record<string, Record<string, number>> = {}
  pageViews.forEach(e => {
    const code = e.ref_code || null
    if (!code) return
    const label = REF_LABELS[code] || code
    refCodeMap[label] = (refCodeMap[label] || 0) + 1
    const day = e.created_at?.slice(0, 10) || ''
    if (!refCodesByDay[day]) refCodesByDay[day] = {}
    refCodesByDay[day][label] = (refCodesByDay[day][label] || 0) + 1
  })

  // --- UTM / Campaign aggregates ---
  type UtmEntry = { utm_source: string; utm_medium: string; utm_campaign: string; campaign_id: string; views: number; clicks: number }
  type EventRow = { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; campaign_id?: string | null; source?: string | null }
  const utmMap = new Map<string, UtmEntry>()
  const utmByDay: Record<string, Map<string, UtmEntry>> = {}

  function addUtm(map: Map<string, UtmEntry>, e: EventRow, isClick: boolean) {
    const src = e.utm_source || e.source || ''
    const med = e.utm_medium || ''
    const camp = e.utm_campaign || ''
    const cid = e.campaign_id || ''
    if (!src && !med && !camp && !cid) return
    const key = `${src}|${med}|${camp}|${cid}`
    const existing = map.get(key)
    if (existing) {
      if (isClick) existing.clicks++; else existing.views++
    } else {
      map.set(key, { utm_source: src, utm_medium: med, utm_campaign: camp, campaign_id: cid, views: isClick ? 0 : 1, clicks: isClick ? 1 : 0 })
    }
  }

  pageViews.forEach(e => {
    addUtm(utmMap, e, false)
    const day = e.created_at?.slice(0, 10) || ''
    if (!utmByDay[day]) utmByDay[day] = new Map()
    addUtm(utmByDay[day], e, false)
  })
  checkoutClicks.forEach(e => {
    addUtm(utmMap, e, true)
    const day = e.created_at?.slice(0, 10) || ''
    if (!utmByDay[day]) utmByDay[day] = new Map()
    addUtm(utmByDay[day], e, true)
  })

  const campaigns = Array.from(utmMap.values()).sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks))
  const campaignsByDay: Record<string, UtmEntry[]> = {}
  for (const [day, map] of Object.entries(utmByDay)) {
    campaignsByDay[day] = Array.from(map.values()).sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks))
  }

  // --- Totals ---
  const clicksByProduct: Record<string, number> = {}
  checkoutClicks.forEach(e => {
    const label = labelForEvent(e.event)
    clicksByProduct[label] = (clicksByProduct[label] || 0) + 1
  })

  const sourceMap: Record<string, number> = {}
  pageViews.forEach(e => {
    const src = e.source || 'Direkt / Unbekannt'
    sourceMap[src] = (sourceMap[src] || 0) + 1
  })

  const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size
  const sessionsWithClick = new Set(
    checkoutClicks.map(e => e.session_id).filter(Boolean)
  ).size

  const viewsToday = pageViews.filter(e => new Date(e.created_at!) >= today).length
  const views7d = pageViews.filter(e => new Date(e.created_at!) >= sevenDaysAgo).length
  const views30d = pageViews.filter(e => new Date(e.created_at!) >= thirtyDaysAgo).length
  const clicksToday = checkoutClicks.filter(e => new Date(e.created_at!) >= today).length
  const clicks7d = checkoutClicks.filter(e => new Date(e.created_at!) >= sevenDaysAgo).length
  const clicks30d = checkoutClicks.filter(e => new Date(e.created_at!) >= thirtyDaysAgo).length

  // --- Ablefy Orders ---
  const { data: orders } = await supabase
    .from('ablefy_orders')
    .select('order_id, ordered_at, is_new_order, amount, campaign_id, plan_name, country_code, payment_method')
    .order('ordered_at', { ascending: false })

  const ordersByDay: Record<string, NonNullable<typeof orders>> = {}
  const ordersByCampaign: Record<string, { count: number; revenue: number; newOrders: number }> = {}
  for (const o of orders || []) {
    const day = o.ordered_at?.slice(0, 10) || ''
    if (!ordersByDay[day]) ordersByDay[day] = []
    ordersByDay[day].push(o)
    const cid = o.campaign_id || 'Ohne Campaign'
    if (!ordersByCampaign[cid]) ordersByCampaign[cid] = { count: 0, revenue: 0, newOrders: 0 }
    ordersByCampaign[cid].count++
    ordersByCampaign[cid].revenue += Number(o.amount) || 0
    if (o.is_new_order) ordersByCampaign[cid].newOrders++
  }

  return {
    data: {
      totalViews: pageViews.length,
      totalClicks: checkoutClicks.length,
      uniqueSessions,
      conversionRate: uniqueSessions > 0
        ? ((sessionsWithClick / uniqueSessions) * 100).toFixed(1)
        : '0',
      viewsToday, views7d, views30d,
      clicksToday, clicks7d, clicks30d,
      viewsByDay,
      uniqueSessionsByDay,
      clicksByDay,
      clicksByProduct,
      clicksByProductByDay,
      sources: sourceMap,
      sourcesByDay,
      referrers: referrerMap,
      referrersByDay,
      campaigns,
      campaignsByDay,
      refCodes: refCodeMap,
      refCodesByDay,
      orders: orders || [],
      ordersByDay,
      ordersByCampaign,
    },
  }
}
