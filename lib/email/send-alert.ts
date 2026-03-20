'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { buildEilmeldungHtml } from './template'
import { TRADER_NAMES } from '@/lib/constants'
import type { Trade } from '@/lib/types'

/**
 * Send a trade alert via Mailchimp Campaign to the configured audience.
 * Returns { ok, error } instead of throwing, to prevent Server Components crash.
 */
export async function sendEilmeldung(tradeId: string): Promise<{ ok: boolean; error?: string }> {
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

    const html = buildEilmeldungHtml(trade as Trade)
    const dirLabel = trade.richtung === 'SHORT' ? 'SHORT' : 'LONG'
    const traderName = TRADER_NAMES[trade.profil] ?? trade.profil
    const subject = `Eilmeldung von ${traderName} – ${trade.asset_name || trade.asset} ${dirLabel}`

    // 1. Create campaign
    const createRes = await fetch(`${baseUrl}/campaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'regular',
        recipients: { list_id: audienceId },
        settings: {
          subject_line: subject,
          from_name: process.env.MAILCHIMP_FROM_NAME || 'Fugmanns Trading Woche',
          reply_to: process.env.MAILCHIMP_REPLY_TO || 'premium@finanzmarktwelt.de',
          title: `Eilmeldung ${trade.asset_name || trade.asset} ${dirLabel} – ${new Date().toISOString().split('T')[0]}`,
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
    const contentRes = await fetch(`${baseUrl}/campaigns/${campaignId}/content`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ html }),
    })

    if (!contentRes.ok) {
      const err = await contentRes.json()
      return { ok: false, error: `Content setzen: ${err.detail || err.title || contentRes.status}` }
    }

    // 3. Check readiness before sending
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

    // 4. Send campaign
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
