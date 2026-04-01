import { getCachedTrades } from '@/lib/actions'
import { getCachedEilmeldungCampaigns } from '@/lib/email/mailchimp-campaigns'
import { TRADER_NAMES } from '@/lib/constants'
import { formatPrice } from '@/lib/formatters'
import { getCurrencySymbol } from '@/lib/asset-mapping'
import { ExternalLink } from 'lucide-react'
import type { Trade } from '@/lib/types'

export const metadata = {
  title: "Eilmeldungen – Fugmann's Trading Woche",
}

export default async function EilmeldungenPage() {
  const [allTrades, mailchimpCampaigns] = await Promise.all([
    getCachedTrades(),
    getCachedEilmeldungCampaigns(),
  ])

  // Trade-based Eilmeldungen (sent via our system)
  const tradeEilmeldungen = allTrades.filter((t) => t.eilmeldung_sent_at)

  // Build a set of campaign IDs that are already linked to trades (via send date matching)
  // to avoid duplicates when Mailchimp campaigns overlap with trade-based ones
  const tradeSentDates = new Set(
    tradeEilmeldungen.map(t => t.eilmeldung_sent_at?.split('T')[0])
  )

  // Merge: trade-based entries + Mailchimp-only campaigns
  type EilmeldungEntry =
    | { type: 'trade'; trade: Trade; sent_at: string }
    | { type: 'mailchimp'; campaign: typeof mailchimpCampaigns[0]; sent_at: string }

  const entries: EilmeldungEntry[] = []

  // Add trade-based entries
  for (const trade of tradeEilmeldungen) {
    entries.push({ type: 'trade', trade, sent_at: trade.eilmeldung_sent_at! })
  }

  // Add Mailchimp campaigns that don't have a matching trade
  for (const campaign of mailchimpCampaigns) {
    const campaignDate = campaign.sent_at.split('T')[0]
    // Check if a trade was sent on the same date with similar asset name
    const hasMatchingTrade = tradeEilmeldungen.some(t => {
      const tradeDate = t.eilmeldung_sent_at?.split('T')[0]
      if (tradeDate !== campaignDate) return false
      // Match by asset name appearing in campaign title
      const asset = (t.asset_name || t.asset).toLowerCase()
      return campaign.title.toLowerCase().includes(asset)
    })
    if (!hasMatchingTrade) {
      entries.push({ type: 'mailchimp', campaign, sent_at: campaign.sent_at })
    }
  }

  // Sort by date descending
  entries.sort((a, b) => b.sent_at.localeCompare(a.sent_at))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Eilmeldungen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alle versendeten Trade-Signale im Überblick.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Noch keine Eilmeldungen versendet.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) =>
            entry.type === 'trade'
              ? <TradeCard key={entry.trade.id} trade={entry.trade} />
              : <MailchimpCard key={entry.campaign.id} campaign={entry.campaign} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Trade-based Eilmeldung card ──────────────────────────────

function TradeCard({ trade }: { trade: Trade }) {
  const isLong = trade.richtung === 'LONG'
  const dirColor = isLong ? '#059669' : '#dc2626'
  const dirLabel = trade.richtung ?? 'LONG'
  const dirArrow = isLong ? '\u25B2' : '\u25BC'
  const traderName = TRADER_NAMES[trade.profil] ?? trade.profil
  const ccy = getCurrencySymbol(trade.asset, trade.asset_klasse, trade.currency)
  const sentDate = trade.eilmeldung_sent_at
    ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date(trade.eilmeldung_sent_at))
    : ''

  const entries = (trade.entries ?? []).filter(e => e.preis > 0).sort((a, b) => a.nummer - b.nummer)
  const tps = [
    { label: 'TP1', level: trade.tp1 },
    { label: 'TP2', level: trade.tp2 },
    { label: 'TP3', level: trade.tp3 },
    { label: 'TP4', level: trade.tp4 },
  ].filter(tp => tp.level != null)

  const statusColors: Record<string, string> = {
    'Aktiv': '#3b82f6',
    'Geschlossen': '#059669',
    'Ausgestoppt': '#dc2626',
    'Ungültig': '#71717a',
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: dirColor }}>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold">{dirArrow} {dirLabel}</span>
          <span className="text-white/80 text-sm font-medium">{trade.asset_name || trade.asset}</span>
        </div>
        <span className="text-white/90 text-xs font-medium">{traderName}</span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {entries.length > 1 ? `Limit ${isLong ? 'Buy' : 'Sell'}` : 'Einstieg'}
              </span>
              <div className="font-semibold tabular-nums">
                {entries.length > 1
                  ? entries.map(e => `${formatPrice(e.preis)}${ccy ? ` ${ccy}` : ''}`).join(' / ')
                  : `${formatPrice(trade.einstiegspreis)}${ccy ? ` ${ccy}` : ''}`
                }
                {entries.length > 1 && trade.einstiegspreis && (
                  <span className="text-muted-foreground font-normal text-xs ml-1.5">= {formatPrice(trade.einstiegspreis)} Mischkurs</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {trade.stop_loss != null && (
                <span>
                  <span className="text-muted-foreground">SL </span>
                  <span className="font-semibold text-rose-600 tabular-nums">{formatPrice(trade.stop_loss)}{ccy ? ` ${ccy}` : ''}</span>
                </span>
              )}
              {tps.map(tp => (
                <span key={tp.label}>
                  <span className="text-muted-foreground">{tp.label} </span>
                  <span className="font-semibold text-emerald-600 tabular-nums">{formatPrice(tp.level!)}{ccy ? ` ${ccy}` : ''}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="text-right shrink-0 space-y-1">
            <span
              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: statusColors[trade.status] ?? '#71717a' }}
            >
              {trade.status}
            </span>
            <div className="text-[11px] text-muted-foreground">{sentDate}</div>
          </div>
        </div>

        {(trade.risiko_reward_min != null || trade.zeiteinheit) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
            {trade.risiko_reward_min != null && (
              <span>CRV <span className="font-semibold text-foreground">
                {trade.risiko_reward_min === trade.risiko_reward_max
                  ? trade.risiko_reward_min.toFixed(1)
                  : `${trade.risiko_reward_min.toFixed(1)}-${trade.risiko_reward_max?.toFixed(1)}`}
              </span></span>
            )}
            {trade.zeiteinheit && <span>Zeiteinheit <span className="font-semibold text-foreground">{trade.zeiteinheit}</span></span>}
            {trade.dauer_erwartung && <span>Dauer <span className="font-semibold text-foreground">{trade.dauer_erwartung}</span></span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mailchimp-only campaign card (historical) ────────────────

function MailchimpCard({ campaign }: { campaign: { id: string; title: string; subject: string; sent_at: string; archive_url: string; emails_sent: number } }) {
  const sentDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(new Date(campaign.sent_at))

  // Try to extract trader + asset from title like "Eilmeldung Michael B. 20260324 - Wolters Beiersdorf UNH"
  const titleMatch = campaign.title.match(/Eilmeldung\s+(.*?)\s+\d{8}\s*-\s*(.+)/)
  const trader = titleMatch?.[1] ?? ''
  const assets = titleMatch?.[2] ?? campaign.subject.replace(/^Eilmeldung von\s*/, '').replace(/\s*-\s*/, ' – ')

  return (
    <a
      href={campaign.archive_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{assets || campaign.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{trader}</span>
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{sentDate}</div>
        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
          <ExternalLink className="h-3 w-3" /> E-Mail ansehen
        </span>
      </div>
    </a>
  )
}
