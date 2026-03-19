'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { buildEilmeldungHtml } from './template'
import type { Trade } from '@/lib/types'

/**
 * Send a trade alert email for the given trade.
 * Phase 1: sends to EILMELDUNG_TEST_EMAIL (single test recipient).
 * Phase 2: will be replaced with Mailchimp campaign send.
 */
export async function sendEilmeldung(tradeId: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY nicht konfiguriert')

  const testEmail = process.env.EILMELDUNG_TEST_EMAIL
  if (!testEmail) throw new Error('EILMELDUNG_TEST_EMAIL nicht konfiguriert')

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const supabase = createAdminClient()

  // Fetch fresh trade data with entries
  const { data: trade, error } = await supabase
    .from('trades')
    .select('*, closes:trade_closes(*), notes:trade_notes(*), entries:trade_entries(*)')
    .eq('id', tradeId)
    .single()

  if (error || !trade) throw new Error('Trade nicht gefunden')

  const html = buildEilmeldungHtml(trade as Trade)
  const dirLabel = trade.richtung === 'SHORT' ? 'SHORT' : 'LONG'
  const subject = `⚡ EILMELDUNG: ${dirLabel} ${trade.asset_name || trade.asset}`

  const { error: sendError } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'FTW Trading <onboarding@resend.dev>',
    to: testEmail,
    subject,
    html,
  })

  if (sendError) throw new Error(`E-Mail-Versand fehlgeschlagen: ${sendError.message}`)

  // Mark as sent
  await supabase
    .from('trades')
    .update({ eilmeldung_sent_at: new Date().toISOString() })
    .eq('id', tradeId)
}
