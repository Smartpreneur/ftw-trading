import { Badge } from '@/components/ui/badge'
import { DirectionBadge } from '@/components/trades/DirectionBadge'
import { StatusBadge } from '@/components/trades/StatusBadge'
import { formatPrice } from '@/lib/formatters'
import { TRADER_NAMES } from '@/lib/constants'
import { Mail, Check, Clock } from 'lucide-react'
import Image from 'next/image'
import type { Trade } from '@/lib/types'

interface SetupReadOnlyProps {
  setup: Trade
}

export function SetupReadOnly({ setup }: SetupReadOnlyProps) {
  const entries = (setup.entries ?? []).filter(e => e.preis > 0).sort((a, b) => a.nummer - b.nummer)
  const tps = [
    { label: 'TP1', level: setup.tp1, weight: setup.tp1_gewichtung },
    { label: 'TP2', level: setup.tp2, weight: setup.tp2_gewichtung },
    { label: 'TP3', level: setup.tp3, weight: setup.tp3_gewichtung },
    { label: 'TP4', level: setup.tp4, weight: setup.tp4_gewichtung },
  ].filter(tp => tp.level != null)

  const createdDate = new Date(setup.created_at)
  const publishedDate = setup.published_at ? new Date(setup.published_at) : null
  const formatDT = (d: Date) => {
    const berlin = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(d)
    return berlin
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{setup.asset_name || setup.asset}</h2>
          <span className="text-sm text-muted-foreground font-mono">{setup.asset}</span>
        </div>
        <div className="flex items-center gap-2">
          {setup.richtung && <DirectionBadge direction={setup.richtung} />}
          <StatusBadge status={setup.status} />
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">Trader</span>
          <p className="font-medium">{TRADER_NAMES[setup.profil] ?? setup.profil}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Asset-Klasse</span>
          <p className="font-medium">{setup.asset_klasse}</p>
        </div>
        {setup.tradingview_symbol && (
          <div>
            <span className="text-xs text-muted-foreground">TradingView</span>
            <p>
              <a href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(setup.tradingview_symbol)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-mono text-sm hover:underline">
                {setup.tradingview_symbol}
              </a>
            </p>
          </div>
        )}
        {setup.aktueller_kurs != null && (
          <div>
            <span className="text-xs text-muted-foreground">Kurs bei Signal</span>
            <p className="font-mono font-semibold">{formatPrice(setup.aktueller_kurs)}</p>
          </div>
        )}
      </div>

      {/* Entry points */}
      <div className="rounded-lg border p-3 space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Einstieg</span>
        {entries.length > 1 ? (
          <div className="space-y-1">
            {entries.map(e => (
              <div key={e.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground">E{e.nummer}</span>
                <span className="font-mono font-semibold">{formatPrice(e.preis)}</span>
                <span className="text-xs text-muted-foreground">{Math.round(e.anteil * 100)}%</span>
                {e.erreicht_am && <Check className="h-3 w-3 text-emerald-600" />}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Mischkurs: <span className="font-mono font-semibold">{formatPrice(setup.einstiegspreis)}</span></p>
          </div>
        ) : (
          <p className="font-mono font-semibold text-sm">{formatPrice(setup.einstiegspreis)}</p>
        )}
      </div>

      {/* SL + TPs */}
      <div className="grid grid-cols-2 gap-3">
        {setup.stop_loss != null && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <span className="text-xs font-semibold text-rose-600">Stop-Loss</span>
            <p className="font-mono font-bold text-rose-700">{formatPrice(setup.stop_loss)}</p>
          </div>
        )}
        {tps.map(tp => (
          <div key={tp.label} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600">{tp.label}</span>
              {tp.weight != null && <span className="text-xs text-muted-foreground">{Math.round(tp.weight * 100)}%</span>}
            </div>
            <p className="font-mono font-bold text-emerald-700">{formatPrice(tp.level)}</p>
          </div>
        ))}
      </div>

      {/* CRV / Zeiteinheit / Dauer */}
      <div className="grid grid-cols-3 gap-3 text-sm border-t pt-3">
        <div>
          <span className="text-xs text-muted-foreground">CRV</span>
          <p className="font-semibold">
            {setup.risiko_reward_min != null && setup.risiko_reward_max != null
              ? `${setup.risiko_reward_min.toFixed(1)}-${setup.risiko_reward_max.toFixed(1)}`
              : '–'}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Zeiteinheit</span>
          <p className="font-semibold">{setup.zeiteinheit || '–'}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Dauer</span>
          <p className="font-semibold">{setup.dauer_erwartung || '–'}</p>
        </div>
      </div>

      {/* Bemerkungen */}
      {setup.bemerkungen && (
        <div className="border-t pt-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Bemerkungen</span>
          <div className="text-sm mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: setup.bemerkungen }} />
        </div>
      )}

      {/* Chart */}
      {setup.chart_bild_url && (
        <div className="border-t pt-3">
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
            <Image src={setup.chart_bild_url} alt={`Chart ${setup.asset_name}`} fill className="object-contain" />
          </div>
        </div>
      )}

      {/* Analyse */}
      {setup.analyse_text && (
        <div className="border-t pt-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Ausführliche Analyse</span>
          <div className="text-sm mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: setup.analyse_text }} />
        </div>
      )}

      {/* Timeline / Status */}
      <div className="border-t pt-3 space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Verlauf</span>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Erstellt: {formatDT(createdDate)}</span>
          </div>
          {setup.status !== 'Entwurf' && publishedDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Veröffentlicht: {formatDT(publishedDate)}</span>
            </div>
          )}
          {setup.eilmeldung_sent_at && (
            <div className="flex items-center gap-2 text-blue-600">
              <Mail className="h-3.5 w-3.5" />
              <span>E-Mail versendet: {formatDT(new Date(setup.eilmeldung_sent_at))}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground pt-1">
          Trade-ID: {setup.trade_id}
        </div>
      </div>
    </div>
  )
}
