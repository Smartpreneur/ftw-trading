import { getCachedTrades } from '@/lib/actions'
import { TRADER_NAMES } from '@/lib/constants'
import { formatPrice } from '@/lib/formatters'
import { getCurrencySymbol } from '@/lib/asset-mapping'
import Link from 'next/link'

export const metadata = {
  title: "Eilmeldungen – Fugmann's Trading Woche",
}

export default async function EilmeldungenPage() {
  const allTrades = await getCachedTrades()

  // Show trades that were published as Eilmeldung (have eilmeldung_sent_at)
  const eilmeldungen = allTrades
    .filter((t) => t.eilmeldung_sent_at)
    .sort((a, b) => (b.eilmeldung_sent_at ?? '').localeCompare(a.eilmeldung_sent_at ?? ''))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Eilmeldungen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Alle versendeten Trade-Signale im Überblick.
        </p>
      </div>

      {eilmeldungen.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Noch keine Eilmeldungen versendet.
        </p>
      ) : (
        <div className="space-y-3">
          {eilmeldungen.map((trade) => {
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
              <div key={trade.id} className="rounded-xl border bg-card overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5" style={{ background: dirColor }}>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-bold">{dirArrow} {dirLabel}</span>
                    <span className="text-white/80 text-sm font-medium">{trade.asset_name || trade.asset}</span>
                  </div>
                  <span className="text-white/90 text-xs font-medium">{traderName}</span>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      {/* Einstieg */}
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

                      {/* SL + TPs inline */}
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

                    {/* Status + Date */}
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

                  {/* CRV row */}
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
          })}
        </div>
      )}
    </div>
  )
}
