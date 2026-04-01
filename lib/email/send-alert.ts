'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { buildEilmeldungContent } from './template'
import { TRADER_NAMES } from '@/lib/constants'
import type { Trade } from '@/lib/types'

/**
 * Send a trade alert via Mailchimp Campaign to the configured audience.
 * Returns { ok, error } instead of throwing, to prevent Server Components crash.
 */
export async function sendEilmeldung(tradeId: string, options?: { draftOnly?: boolean }): Promise<{ ok: boolean; error?: string }> {
  try {
    const apiKey = process.env.MAILCHIMP_API_KEY?.trim()
    if (!apiKey) return { ok: false, error: 'MAILCHIMP_API_KEY nicht konfiguriert' }

    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID?.trim()
    if (!audienceId) return { ok: false, error: 'MAILCHIMP_AUDIENCE_ID nicht konfiguriert' }

    const dc = apiKey.split('-').pop()?.trim()
    const baseUrl = `https://${dc}.api.mailchimp.com/3.0`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
    }

    const supabase = createAdminClient()

    const { data: trade, error } = await supabase
      .from('trades')
      .select('*, closes:trade_closes(*), notes:trade_notes(*), entries:trade_entries(*)')
      .eq('id', tradeId)
      .single()

    if (error || !trade) return { ok: false, error: 'Trade nicht gefunden' }

    const html = buildEilmeldungContent(trade as Trade)
    const dirLabel = trade.richtung === 'SHORT' ? 'SHORT' : 'LONG'
    const traderName = TRADER_NAMES[trade.profil] ?? trade.profil
    const subject = `Eilmeldung von ${traderName} – ${trade.asset_name || trade.asset} ${dirLabel}`

    // 1. Create campaign with segment conditions + folder
    const segmentIncludeId = process.env.MAILCHIMP_SEGMENT_INCLUDE_ID // Tag "Order Created"
    const segmentExcludeId = process.env.MAILCHIMP_SEGMENT_EXCLUDE_ID // Tag "Order Canceled"
    const folderId = process.env.MAILCHIMP_EILMELDUNG_FOLDER_ID

    const recipients: Record<string, unknown> = { list_id: audienceId }
    if (segmentIncludeId || segmentExcludeId) {
      const conditions: Array<Record<string, unknown>> = []
      if (segmentIncludeId) {
        conditions.push({
          condition_type: 'StaticSegment',
          field: 'static_segment',
          op: 'static_is',
          value: parseInt(segmentIncludeId, 10),
        })
      }
      if (segmentExcludeId) {
        conditions.push({
          condition_type: 'StaticSegment',
          field: 'static_segment',
          op: 'static_not',
          value: parseInt(segmentExcludeId, 10),
        })
      }
      recipients.segment_opts = { match: 'all', conditions }
    }

    const createRes = await fetch(`${baseUrl}/campaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'regular',
        recipients,
        settings: {
          subject_line: subject,
          from_name: process.env.MAILCHIMP_FROM_NAME || 'Fugmanns Trading Woche',
          reply_to: process.env.MAILCHIMP_REPLY_TO || 'premium@finanzmarktwelt.de',
          title: `Eilmeldung ${trade.asset_name || trade.asset} ${dirLabel} – ${new Date().toISOString().split('T')[0]}`,
          ...(folderId ? { folder_id: folderId } : {}),
        },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      return { ok: false, error: `Kampagne erstellen: ${err.detail || err.title || createRes.status}` }
    }

    const campaign = await createRes.json()
    const campaignId = campaign.id

    // 2. Set campaign content
    // If a Mailchimp template is configured, use it (template handles header/footer/social)
    // Otherwise fall back to raw HTML
    const templateId = process.env.MAILCHIMP_TEMPLATE_ID
    const contentBody = templateId
      ? { template: { id: parseInt(templateId, 10), sections: { body_content: html } } }
      : { html }
    const contentRes = await fetch(`${baseUrl}/campaigns/${campaignId}/content`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(contentBody),
    })

    if (!contentRes.ok) {
      const err = await contentRes.json()
      return { ok: false, error: `Content setzen: ${err.detail || err.title || contentRes.status}` }
    }

    // 3. Draft-only mode: create campaign but don't send (for review in Mailchimp)
    const draftOnly = options?.draftOnly ?? process.env.MAILCHIMP_DRAFT_ONLY === 'true'

    if (draftOnly) {
      return { ok: true, error: `Kampagne als Entwurf erstellt (ID: ${campaignId}). Bitte in Mailchimp prüfen und manuell versenden.` }
    }

    // 4. Check readiness before sending
    const checkRes = await fetch(`${baseUrl}/campaigns/${campaignId}/send-checklist`, { headers })
    if (checkRes.ok) {
      const checklist = await checkRes.json()
      if (!checklist.is_ready) {
        const issues = checklist.items
          ?.filter((i: { type: string }) => i.type === 'error')
          ?.map((i: { heading: string; details: string }) => `${i.heading}: ${i.details}`)
          ?.join('; ')
        return { ok: false, error: `Kampagne nicht versandbereit: ${issues || 'Unbekannt'}` }
      }
    }

    // 5. Send campaign
    const sendRes = await fetch(`${baseUrl}/campaigns/${campaignId}/actions/send`, {
      method: 'POST',
      headers,
    })

    if (!sendRes.ok) {
      const err = await sendRes.json()
      return { ok: false, error: `Versand: ${err.detail || err.title || sendRes.status}` }
    }

    // Mark as sent (only for active trades)
    if (trade.status !== 'Entwurf') {
      await supabase
        .from('trades')
        .update({ eilmeldung_sent_at: new Date().toISOString() })
        .eq('id', tradeId)
    }

    return { ok: true }
  } catch (err: any) {
    console.error('sendEilmeldung error:', err)
    return { ok: false, error: err?.message ?? 'Unbekannter Fehler' }
  }
}
