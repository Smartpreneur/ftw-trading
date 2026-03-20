import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { buildEilmeldungHtml } from '@/lib/email/template'
import type { Trade } from '@/lib/types'

/**
 * GET /api/email-preview?trade_id=123
 *
 * Renders the Eilmeldung HTML template for a given trade.
 * Protected: requires dev=1 param + service role key as bearer token,
 * OR just works locally on localhost.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tradeId = searchParams.get('trade_id')
  const isLocal = request.nextUrl.hostname === 'localhost'

  // Auth: localhost, bearer token, or admin cookie
  if (!isLocal) {
    const auth = request.headers.get('authorization')
    const adminCookie = request.cookies.get('ftw_admin')?.value
    const isAdmin = adminCookie === process.env.ADMIN_PASSWORD
    const hasToken = auth === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    if (!isAdmin && !hasToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()

  // If no trade_id, use the most recent Entwurf setup
  let tradeFilter = supabase
    .from('trades')
    .select('*, closes:trade_closes(*), notes:trade_notes(*), entries:trade_entries(*)')

  if (tradeId) {
    tradeFilter = tradeFilter.eq('trade_id', parseInt(tradeId, 10))
  } else {
    tradeFilter = tradeFilter.eq('status', 'Entwurf').order('created_at', { ascending: false }).limit(1)
  }

  const { data, error } = await tradeFilter.single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Trade nicht gefunden', details: error?.message },
      { status: 404 }
    )
  }

  const html = buildEilmeldungHtml(data as Trade)

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
