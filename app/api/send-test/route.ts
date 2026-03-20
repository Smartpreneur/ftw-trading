import { NextRequest, NextResponse } from 'next/server'
import { sendEilmeldung } from '@/lib/email/send-alert'

/**
 * POST /api/send-test?trade_id=392
 * Triggers email send directly — for debugging production issues.
 * Protected by service role key.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tradeId = request.nextUrl.searchParams.get('trade_id')
  if (!tradeId) return NextResponse.json({ error: 'trade_id required' }, { status: 400 })

  // Look up trade UUID from trade_id number
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  const { data: trade } = await supabase
    .from('trades')
    .select('id')
    .eq('trade_id', parseInt(tradeId, 10))
    .single()

  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

  const result = await sendEilmeldung(trade.id)
  return NextResponse.json(result)
}
