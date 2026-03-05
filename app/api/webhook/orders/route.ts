import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  // Datum parsen: "05.03.2026 10:53" (DE-Format) oder ISO
  let orderedAt: string
  const rawDate = body.ordered_at || body.Datum || ''
  if (rawDate.includes('.')) {
    // DD.MM.YYYY HH:MM format
    const [datePart, timePart] = rawDate.split(' ')
    const [d, m, y] = datePart.split('.')
    orderedAt = new Date(`${y}-${m}-${d}T${timePart || '00:00'}:00Z`).toISOString()
  } else if (rawDate) {
    orderedAt = new Date(rawDate).toISOString()
  } else {
    orderedAt = new Date().toISOString()
  }

  // Boolean: TRUE/true/"TRUE"/1 → true
  const rawNew = body.is_new_order ?? body.Is_New_Order ?? true
  const isNewOrder = rawNew === true || rawNew === 'TRUE' || rawNew === 'true' || rawNew === 1

  // Amount: kann leer sein
  const rawAmount = body.amount || body.Amount || 0
  const amount = parseFloat(String(rawAmount).replace(',', '.')) || 0

  const row = {
    order_id: orderId,
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
    .upsert(row, { onConflict: 'order_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, order_id: orderId })
}
