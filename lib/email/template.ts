import type { Trade } from '@/lib/types'
import { formatPrice } from '@/lib/formatters'
import { TRADER_NAMES } from '@/lib/constants'

/**
 * Builds an HTML email for a trade alert ("Eilmeldung").
 * Uses inline styles and tables for maximum email client compatibility.
 */
export function buildEilmeldungHtml(trade: Trade): string {
  const isLong = trade.richtung === 'LONG'
  const dirColor = isLong ? '#059669' : '#dc2626'
  const dirLabel = trade.richtung ?? 'LONG'
  const dirArrow = isLong ? '▲' : '▼'

  const tps = [
    { label: 'TP1', level: trade.tp1, weight: trade.tp1_gewichtung },
    { label: 'TP2', level: trade.tp2, weight: trade.tp2_gewichtung },
    { label: 'TP3', level: trade.tp3, weight: trade.tp3_gewichtung },
    { label: 'TP4', level: trade.tp4, weight: trade.tp4_gewichtung },
  ].filter(tp => tp.level != null)

  const entries = (trade.entries ?? []).filter(e => e.preis > 0).sort((a, b) => a.nummer - b.nummer)

  const crvText = trade.risiko_reward_min != null && trade.risiko_reward_max != null
    ? `${trade.risiko_reward_min.toFixed(1)}-${trade.risiko_reward_max.toFixed(1)}`
    : trade.risiko_reward_min != null ? trade.risiko_reward_min.toFixed(1) : '–'

  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} Uhr`

  const ticker = trade.asset ?? ''
  // TradingView URL: use dedicated tradingview_symbol if set, otherwise fallback to asset ticker
  const tvSymbol = trade.tradingview_symbol
  const tvUrl = tvSymbol
    ? `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`
    : ticker
    ? `https://www.tradingview.com/symbols/${encodeURIComponent(ticker.replace('.', '-'))}/`
    : null
  const tvDisplayLabel = tvSymbol || ticker

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#000;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;">

  <!-- HEADER -->
  <tr>
    <td style="background:${dirColor};padding:14px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:0.5px;">${dirArrow} ${dirLabel}</span>
          <span style="color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;margin-left:6px;">${esc(trade.asset_name || trade.asset)}</span>
        </td>
        <td align="right"><span style="color:#fff;font-size:12px;font-weight:600;letter-spacing:0.5px;">EILMELDUNG ${esc(TRADER_NAMES[trade.profil] ?? trade.profil)}</span></td>
      </tr></table>
    </td>
  </tr>

  <!-- ASSET + TICKER + KURS -->
  <tr>
    <td style="padding:20px 24px 4px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#000;">
        ${esc(trade.asset_name || trade.asset)}
      </h1>
      <p style="margin:4px 0 0;font-size:13px;color:#71717a;">
        ${tvUrl
          ? `<a href="${tvUrl}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;text-decoration:none;font-weight:600;">${esc(tvDisplayLabel)}</a>`
          : esc(tvDisplayLabel)
        }
        ${trade.aktueller_kurs ? ` · Kurs aktuell: <strong style="color:#000;">${formatPrice(trade.aktueller_kurs)}</strong> (${timeStr})` : ''}
      </p>
    </td>
  </tr>

  <tr><td style="padding:12px 24px 0;"><hr style="border:none;border-top:1px solid #d0d0d0;margin:0;"></td></tr>

  <!-- EINSTIEG -->
  <tr>
    <td style="padding:16px 24px 8px;">
      ${dataRow(`${dirLabel}-EINSTIEG`,
        entries.length > 1
          ? entries.map(e =>
              `<strong style="font-size:16px;">${formatPrice(e.preis)}</strong> <span style="color:#71717a;font-size:13px;">(${Math.round(e.anteil * 100)}%)</span>`
            ).join(' &nbsp;/&nbsp; ') +
            `<br><span style="color:#71717a;font-size:13px;">= ${formatPrice(trade.einstiegspreis)} (Mischkurs)</span>`
          : `<strong style="font-size:18px;">${formatPrice(trade.einstiegspreis)}</strong>`
      )}
    </td>
  </tr>

  <!-- STOP-LOSS -->
  ${trade.stop_loss != null ? `
  <tr>
    <td style="padding:8px 24px;">
      ${dataRow('STOP-LOSS',
        `<span style="display:inline-block;background:#fef2f2;color:#dc2626;font-weight:700;font-size:16px;padding:3px 10px;border-radius:4px;">${formatPrice(trade.stop_loss)}</span>`
      )}
    </td>
  </tr>` : ''}

  <!-- TAKE PROFIT TILES -->
  ${tps.length > 0 ? `
  <tr>
    <td style="padding:8px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="120" style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;padding-top:6px;">Take Profit</td>
        <td>
          <table cellpadding="0" cellspacing="0" width="100%"><tr>
            ${tps.map((tp, i) => `
            <td width="${Math.floor(100 / tps.length)}%" style="padding:0 ${i < tps.length - 1 ? '3' : '0'}px 0 ${i > 0 ? '3' : '0'}px;vertical-align:top;">
              <div style="background:#ecfdf5;border-radius:6px;padding:8px 10px;text-align:center;">
                <div style="font-size:11px;font-weight:700;color:#059669;">${tp.label}</div>
                <div style="font-family:monospace;font-size:15px;font-weight:700;color:#000;margin:3px 0;">${formatPrice(tp.level)}</div>
                ${tp.weight != null ? `<div style="font-size:12px;font-weight:600;color:#4d4d4d;">(${Math.round(tp.weight * 100)}%)</div>` : ''}
              </div>
            </td>`).join('')}
          </tr></table>
        </td>
      </tr></table>
    </td>
  </tr>` : ''}

  <tr><td style="padding:8px 24px;"><hr style="border:none;border-top:1px solid #d0d0d0;margin:0;"></td></tr>

  <!-- CRV / ZEITEINHEIT / DAUER -->
  <tr>
    <td style="padding:12px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="33%" style="vertical-align:top;">
          <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px;">CRV</div>
          <div style="font-size:15px;font-weight:700;color:#000;">${crvText}</div>
        </td>
        <td width="33%" style="vertical-align:top;">
          <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px;">Zeiteinheit</div>
          <div style="font-size:15px;font-weight:700;color:#000;">${esc(trade.zeiteinheit ?? '–')}</div>
        </td>
        <td width="33%" style="vertical-align:top;">
          <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px;">Dauer</div>
          <div style="font-size:15px;font-weight:700;color:#000;">${esc(trade.dauer_erwartung ?? '–')}</div>
        </td>
      </tr></table>
    </td>
  </tr>

  <tr><td style="padding:0 24px;"><hr style="border:none;border-top:1px solid #d0d0d0;margin:0;"></td></tr>

  <!-- BEMERKUNGEN (kurz) -->
  ${trade.bemerkungen ? `
  <tr>
    <td style="padding:16px 24px 8px;">
      <p style="font-size:14px;color:#000;line-height:1.6;margin:0;white-space:pre-wrap;">${esc(trade.bemerkungen)}</p>
    </td>
  </tr>` : ''}

  <!-- CHART IMAGE (clickable → opens full size) -->
  ${trade.chart_bild_url ? `
  <tr>
    <td style="padding:12px 24px;">
      <a href="${trade.chart_bild_url}" target="_blank" rel="noopener noreferrer" style="display:block;">
        <img src="${trade.chart_bild_url}" alt="Chart ${esc(trade.asset_name || trade.asset)}" style="width:100%;border-radius:4px;border:1px solid #d0d0d0;cursor:pointer;" />
      </a>
      <p style="margin:4px 0 0;font-size:11px;color:#a1a1aa;text-align:center;">Bild anklicken für Vollansicht</p>
    </td>
  </tr>` : ''}

  <!-- ANALYSE (lang) — stored as HTML from WYSIWYG editor -->
  ${trade.analyse_text ? `
  <tr>
    <td style="padding:16px 24px;font-size:16px;color:#000;line-height:1.6;">
      ${trade.analyse_text}
    </td>
  </tr>` : ''}

  <!-- HINWEIS -->
  <tr>
    <td style="padding:8px 24px 16px;">
      <div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:10px 14px;border-radius:0 4px 4px 0;">
        <p style="margin:0;font-size:13px;color:#1e40af;">
          <strong>Hinweis:</strong> Dieses Setup stellt keine Anlageberatung dar. Jeder Trader handelt auf eigenes Risiko.
        </p>
      </div>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:16px 24px;background:#f4f4f4;border-top:1px solid #d0d0d0;">
      <p style="margin:0;font-size:12px;color:#71717a;text-align:center;line-height:1.6;">
        <strong>Fugmanns Trading Woche</strong><br>
        Know How Pool GmbH · Hans-Henny-Jahnn-Weg 53 · 22085 Hamburg<br>
        <a href="mailto:premium@finanzmarktwelt.de" style="color:#71717a;">premium@finanzmarktwelt.de</a>
      </p>
    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`
}

function dataRow(label: string, value: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="120" style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;padding-top:4px;">${label}</td>
    <td>${value}</td>
  </tr></table>`
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Escape HTML + convert **bold** markdown to <strong> tags */
function escWithBold(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}
