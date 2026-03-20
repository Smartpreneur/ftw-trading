'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { buildEilmeldungHtml } from './template'
import { TRADER_NAMES } from '@/lib/constants'
import type { Trade } from '@/lib/types'

/**
 * Send a trade alert via Mailchimp Campaign to the configured audience.
 * Creates a campaign, sets the HTML content, and sends it immediately.
 */
export async function sendEilmeldung(tradeId: string): Promise<void> {
  const apiKey = process.env.MAILCHIMP_API_KEY
  if (!apiKey) throw new Error('MAILCHIMP_API_KEY nicht konfiguriert')

  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  if (!audienceId) throw new Error('MAILCHIMP_AUDIENCE_ID nicht konfiguriert')

  // Extract datacenter from API key (e.g. "xxx-us10" → "us10")
  const dc = apiKey.split('-').pop()
  const baseUrl = `https://${dc}.api.mailchimp.com/3.0`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
  }

  const supabase = createAdminClient()

  // Fetch fresh trade data
  const { data: trade, error } = await supabase
    .from('trades')
    .select('*, closes:trade_closes(*), notes:trade_notes(*), entries:trade_entries(*)')
    .eq('id', tradeId)
    .single()

  if (error || !trade) throw new Error('Trade nicht gefunden')

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
    throw new Error(`Mailchimp Kampagne erstellen fehlgeschlagen: ${err.detail || err.title || createRes.status}`)
  }

  const campaign = await createRes.json()
  const campaignId = campaign.id

  // 2. Set campaign content (HTML)
  const contentRes = await fetch(`${baseUrl}/campaigns/${campaignId}/content`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ html }),
  })

  if (!contentRes.ok) {
    const err = await contentRes.json()
    throw new Error(`Mailchimp Content setzen fehlgeschlagen: ${err.detail || err.title || contentRes.status}`)
  }

  // 3. Send campaign
  const sendRes = await fetch(`${baseUrl}/campaigns/${campaignId}/actions/send`, {
    method: 'POST',
    headers,
  })

  if (!sendRes.ok) {
    const err = await sendRes.json()
    throw new Error(`Mailchimp Versand fehlgeschlagen: ${err.detail || err.title || sendRes.status}`)
  }

  // Mark as sent (only for active trades, not for test sends from Entwurf)
  if (trade.status !== 'Entwurf') {
    await supabase
      .from('trades')
      .update({ eilmeldung_sent_at: new Date().toISOString() })
      .eq('id', tradeId)
  }
}
