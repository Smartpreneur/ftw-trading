import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WIDERRUF_DAYS = 37

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Auth: Bearer token check
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Felder aus Zapier-Payload mappen
  const orderId = String(body.order_id || body.Order_ID || '')
  if (!orderId) {
    return NextResponse.json({ error: 'order_id required' }, { status: 400 })
  }

  // Rohwert als Text speichern (z.B. "TRUE", "Subscription_Cancelled")
  const rawNew = body.is_new_order ?? body.Is_New_Order ?? 'true'
  const isNewOrder = String(rawNew)

  // --- Cancellation-Logik ---
  if (isNewOrder.toLowerCase().includes('cancelled') || isNewOrder.toLowerCase().includes('canceled')) {
    const now = new Date()

    // Bestehende Original-Order nachschlagen
    const { data: existing } = await supabase
      .from('ablefy_orders')
      .select('ordered_at')
      .eq('order_id', orderId)
      .eq('event_type', 'order')
      .single()

    let cancellationType = 'Kündigung' // Default: nicht gefunden oder > 37 Tage
    if (existing?.ordered_at) {
      const orderedAt = new Date(existing.ordered_at)
      const daysDiff = (now.getTime() - orderedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff <= WIDERRUF_DAYS) {
        cancellationType = 'Widerruf'
      }
    }

    // Neuen Eintrag als 'cancellation' anlegen (Original-Order bleibt unverändert)
    const { error } = await supabase
      .from('ablefy_orders')
      .upsert({
        order_id: orderId,
        event_type: 'cancellation',
        is_new_order: isNewOrder,
        ordered_at: existing?.ordered_at || now.toISOString(),
        cancelled_at: now.toISOString(),
        cancellation_type: cancellationType,
        amount: 0,
        campaign_id: body.campaign_id || body.Campaign_ID || null,
        plan_name: body.plan_name || body.Plan_Name || null,
        country_code: body.country_code || body.Country_Code || null,
        payment_method: body.payment_method || body.Payment_Method || null,
        synced_at: now.toISOString(),
      }, { onConflict: 'order_id,event_type' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, order_id: orderId, event_type: 'cancellation', cancellation_type: cancellationType })
  }

  // --- Normale Bestellung ---

  // Datum parsen: "05.03.2026 10:53" (DE-Format, Berliner Zeit) oder ISO
  let orderedAt: string
  const rawDate = body.ordered_at || body.Datum || ''
  if (rawDate.includes('.')) {
    // DD.MM.YYYY HH:MM format — Berliner Zeit → UTC
    const [datePart, timePart] = rawDate.split(' ')
    const [d, m, y] = datePart.split('.')
    const h = (timePart || '00:00').split(':')[0]
    const mi = (timePart || '00:00').split(':')[1] || '00'
    // Berliner Zeit zu UTC konvertieren
    const naiveUtc = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(h), Number(mi))
    const TZ = 'Europe/Berlin'
    const parts = new Intl.DateTimeFormat('sv-SE', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(naiveUtc))
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value || '0')
    const berlinMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
    const offsetMs = berlinMs - naiveUtc
    orderedAt = new Date(naiveUtc - offsetMs).toISOString()
  } else if (rawDate) {
    orderedAt = new Date(rawDate).toISOString()
  } else {
    orderedAt = new Date().toISOString()
  }

  // Amount: kann leer sein
  const rawAmount = body.amount || body.Amount || 0
  const amount = parseFloat(String(rawAmount).replace(',', '.')) || 0

  const row = {
    order_id: orderId,
    event_type: 'order',
    ordered_at: orderedAt,
    is_new_order: isNewOrder,
    amount,
    campaign_id: body.campaign_id || body.Campaign_ID || null,
    plan_name: body.plan_name || body.Plan_Name || null,
    country_code: body.country_code || body.Country_Code || null,
    payment_method: body.payment_method || body.Payment_Method || null,
    synced_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('ablefy_orders')
    .upsert(row, { onConflict: 'order_id,event_type' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, order_id: orderId, event_type: 'order' })
}
