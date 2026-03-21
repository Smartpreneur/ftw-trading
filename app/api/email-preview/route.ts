import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { buildEilmeldungContent } from '@/lib/email/template'
import type { Trade } from '@/lib/types'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * GET /api/email-preview?trade_id=123
 *
 * Renders the Eilmeldung content inside the Mailchimp template — shows exactly
 * how the final email will look (FTW logo, social icons, footer included).
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

  // Build the content block (same as what gets sent to Mailchimp)
  const content = buildEilmeldungContent(data as Trade)

  // Load the Mailchimp template and insert the content
  let html: string

  try {
    const templatePath = join(process.cwd(), 'lib/email/mailchimp-template.html')
    const templateHtml = readFileSync(templatePath, 'utf-8')

    // Replace the mc:edit="body_content" placeholder with our content
    html = templateHtml.replace(
      /<div mc:edit="body_content">[\s\S]*?<\/div>/,
      `<div mc:edit="body_content">${content}</div>`
    )

    // Replace Mailchimp merge tags with readable placeholders for preview
    html = html
      .replace(/\*\|ARCHIVE\|\*/g, '#')
      .replace(/\*\|UNSUB\|\*/g, '#')
      .replace(/\*\|UPDATE_PROFILE\|\*/g, '#')
      .replace(/\*\|LIST:COMPANY\|\*/g, 'Know How Pool GmbH')
      .replace(/\*\|LIST:ADDRESS\|\*/g, 'Hans-Henny-Jahnn-Weg 53, 22085 Hamburg')
      .replace(/\*\|LIST:DESCRIPTION\|\*/g, '')
      .replace(/\*\|HTML:LIST_ADDRESS\|\*/g, 'Hans-Henny-Jahnn-Weg 53<br>22085 Hamburg')
      .replace(/\*\|CURRENT_YEAR\|\*/g, new Date().getFullYear().toString())
      .replace(/\*\|EMAIL\|\*/g, 'vorschau@example.com')
      .replace(/\*\|MC:SUBJECT\|\*/g, `Eilmeldung – ${data.asset_name || data.asset}`)
      .replace(/\*\|MC_PREVIEW_TEXT\|\*/g, '')
      .replace(/\*\|IF:MC_PREVIEW_TEXT\|\*[\s\S]*?\*\|END:IF\|\*/g, '')
      .replace(/\*\|IFNOT:ARCHIVE_PAGE\|\*/g, '')
      .replace(/\*\|END:IF\|\*/g, '')
  } catch {
    // Fallback: show content in simple wrapper
    html = wrapStandalone(content)
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/** Simple HTML wrapper for when Mailchimp template is not available */
function wrapStandalone(content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;">
${content}
</table>
</td></tr></table>
</body></html>`
}
