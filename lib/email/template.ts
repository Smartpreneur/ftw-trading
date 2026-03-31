import type { Trade } from '@/lib/types'
import { formatPrice } from '@/lib/formatters'
import { TRADER_NAMES } from '@/lib/constants'
import { getCurrencySymbol } from '@/lib/asset-mapping'

/**
 * Returns ONLY the content block (signal card, chart, analyse text).
 * This is what gets inserted into the Mailchimp template's mc:edit="body_content" section.
 * No <html>, <head>, <body>, no footer, no social icons — Mailchimp template handles those.
 */
export function buildEilmeldungContent(trade: Trade): string {
  const { dirColor, dirLabel, dirArrow, tps, entries, crvText, timeStr, tvUrl, tvDisplayLabel, ccy } = buildTradeData(trade)

  return `
  <!-- MOBILE RESPONSIVE STYLES -->
  <style type="text/css">
    .ftw-mobile-br { display: none; }
    @media only screen and (max-width: 480px) {
      .ftw-mobile-br { display: inline !important; }
      .ftw-header-text { font-size: 24px !important; }
      .ftw-signal-dir { font-size: 13px !important; }
      .ftw-signal-asset { font-size: 13px !important; }
      .ftw-signal-badge { font-size: 11px !important; }
      .ftw-tp-tile { padding: 6px 4px !important; }
      .ftw-tp-label { font-size: 10px !important; }
      .ftw-tp-price { font-size: 13px !important; }
      .ftw-tp-weight { font-size: 11px !important; }
      .ftw-asset-title { font-size: 18px !important; }
      .ftw-label-col { width: 65px !important; font-size: 10px !important; }
      .ftw-entry-price { font-size: 14px !important; }
    }
  </style>

  <!-- SIGNAL HEADER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <tr>
    <td style="background:${dirColor};padding:14px 24px;border-radius:8px 8px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
        <td>
          <span class="ftw-signal-dir" style="color:#fff;font-size:14px;font-weight:700;letter-spacing:0.5px;">${dirArrow} ${dirLabel}</span>
          <span class="ftw-signal-asset" style="color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;margin-left:6px;">${esc(trade.asset_name || trade.asset)}</span>
        </td>
        <td align="right"><span class="ftw-signal-badge" style="color:#fff;font-size:12px;font-weight:600;letter-spacing:0.5px;">EILMELDUNG<br>${esc(TRADER_NAMES[trade.profil] ?? trade.profil)}</span></td>
      </tr></table>
    </td>
  </tr>

  <!-- ASSET + TICKER + KURS -->
  <tr>
    <td style="padding:20px 24px 4px;background:#fff;">
      <h1 class="ftw-asset-title" style="margin:0;font-size:22px;font-weight:700;color:#000;">
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

  <tr><td style="padding:12px 24px 0;background:#fff;"><hr style="border:none;border-top:1px solid #d0d0d0;margin:0;"></td></tr>

  <!-- EINSTIEG -->
  <tr>
    <td style="padding:16px 24px 8px;background:#fff;">
      ${dataRow(
        entries.length > 1
          ? `LIMIT ${dirLabel === 'LONG' ? 'BUY' : 'SELL'}`
          : `${dirLabel}-<br class="ftw-mobile-br">EINSTIEG`,
        entries.length > 1
          ? entries.map(e =>
              `<strong class="ftw-entry-price" style="font-size:16px;">${formatPrice(e.preis)}</strong> <span style="color:#71717a;font-size:13px;">(${Math.round(e.anteil * 100)}%)</span>`
            ).join(' &nbsp;/&nbsp; ') +
            `<br><span style="color:#71717a;font-size:13px;">= ${formatPrice(trade.einstiegspreis)} (Mischkurs)</span>`
          : `<strong style="font-size:18px;">${formatPrice(trade.einstiegspreis)}</strong>`
      )}
    </td>
  </tr>

  <!-- STOP-LOSS -->
  ${trade.stop_loss != null ? `
  <tr>
    <td style="padding:8px 24px;background:#fff;">
      ${dataRow('STOP-<br class="ftw-mobile-br">LOSS',
        `<span style="display:inline-block;background:#fef2f2;color:#dc2626;font-weight:700;font-size:16px;padding:3px 10px;border-radius:4px;">${formatPrice(trade.stop_loss)}${ccy ? `<span style="font-weight:500;font-size:12px;color:#71717a;margin-left:4px;">${esc(ccy)}</span>` : ''}</span>`
      )}
    </td>
  </tr>` : ''}

  <!-- TAKE PROFIT TILES -->
  ${tps.length > 0 ? `
  <tr>
    <td style="padding:8px 24px;background:#fff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
        <td class="ftw-label-col" width="120" style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;padding-top:6px;">TAKE PROFIT</td>
        <td>
          <table cellpadding="0" cellspacing="0" width="${tps.length === 1 ? '40%' : '100%'}" style="border-collapse:collapse;">
            ${tps.map((tp, i) => {
              const perRow = tps.length <= 3 ? tps.length : 2
              const isRowStart = i % perRow === 0
              const isRowEnd = i % perRow === perRow - 1 || i === tps.length - 1
              const tdWidth = Math.floor(100 / perRow)
              return `${isRowStart ? '<tr>' : ''}
            <td width="${tdWidth}%" style="padding:0 ${isRowEnd ? '0' : '3'}px ${i < tps.length - perRow ? '6px' : '0'} ${isRowStart ? '0' : '3'}px;vertical-align:top;">
              <div class="ftw-tp-tile" style="background:#ecfdf5;border-radius:6px;padding:8px 10px;text-align:center;">
                <div class="ftw-tp-label" style="font-size:11px;font-weight:700;color:#059669;">${tp.label}</div>
                <div class="ftw-tp-price" style="font-family:monospace;font-size:15px;font-weight:700;color:#000;margin:3px 0;white-space:nowrap;">${formatPrice(tp.level!)}${ccy ? `<span style="font-weight:500;font-size:11px;color:#71717a;"> ${esc(ccy)}</span>` : ''}</div>
                ${tp.weight != null ? `<div class="ftw-tp-weight" style="font-size:12px;font-weight:600;color:#4d4d4d;">(${Math.round(tp.weight * 100)}%)</div>` : ''}
              </div>
            </td>${isRowEnd ? '</tr>' : ''}`
            }).join('')}
          </table>
        </td>
      </tr></table>
    </td>
  </tr>` : ''}

  <tr><td style="padding:8px 24px;background:#fff;"><hr style="border:none;border-top:1px solid #d0d0d0;margin:0;"></td></tr>

  <!-- CRV / ZEITEINHEIT / DAUER -->
  <tr>
    <td style="padding:12px 24px;background:#fff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
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

  <tr><td style="padding:0 24px;background:#fff;"><hr style="border:none;border-top:1px solid #d0d0d0;margin:0;"></td></tr>

  <!-- BEMERKUNGEN (kurz) — may contain HTML from rich text editor -->
  ${trade.bemerkungen ? `
  <tr>
    <td style="padding:16px 24px 8px;font-size:14px;color:#000;line-height:1.6;background:#fff;">
      ${trade.bemerkungen}
    </td>
  </tr>` : ''}

  <!-- HINWEIS -->
  <tr>
    <td style="padding:8px 24px 16px;background:#fff;">
      <div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:10px 14px;border-radius:0 4px 4px 0;">
        <p style="margin:0;font-size:13px;color:#1e40af;">
          <strong>Hinweis:</strong> Dieses Setup stellt keine Anlageberatung dar. Jeder Trader handelt auf eigenes Risiko.
          <a href="https://ftw.finanzmarktwelt.de/risikohinweis" target="_blank" rel="noopener noreferrer" style="color:#1e40af;text-decoration:underline;">Risikohinweis &amp; Haftungsausschluss</a>
        </p>
      </div>
    </td>
  </tr>

  <!-- CHART IMAGE -->
  ${trade.chart_bild_url ? `
  <tr>
    <td style="padding:12px 24px;background:#fff;">
      <a href="${trade.chart_bild_url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img src="${trade.chart_bild_url}" alt="Chart ${esc(trade.asset_name || trade.asset)}" width="560" style="display:block;width:100%;max-width:100%;height:auto;border-radius:4px;border:1px solid #d0d0d0;cursor:pointer;" /></a>
    </td>
  </tr>` : ''}

  <!-- ANALYSE (lang) -->
  ${trade.analyse_text ? `
  <tr>
    <td style="padding:16px 24px;font-size:16px;color:#000;line-height:1.6;background:#fff;">
      ${formatAnalyseHtml(trade.analyse_text)}
    </td>
  </tr>` : ''}

  <!-- MITGLIEDERBEREICH LINK -->
  <tr>
    <td style="padding:16px 24px 20px;background:#fff;text-align:center;">
      <a href="https://premium.finanzmarktwelt.de/s/finanzmarktwelt/sign_in" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 24px;background:#00748D;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">Zum Mitgliederbereich</a>
    </td>
  </tr>

  </table>`
}

/**
 * Full standalone HTML email — used for local preview (/api/email-preview).
 * Wraps the content block in a complete HTML document with its own footer.
 */
export function buildEilmeldungHtml(trade: Trade): string {
  const content = buildEilmeldungContent(trade)

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#000;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;">

${content}

  <!-- FOOTER (standalone preview only — Mailchimp template provides its own) -->
  <tr>
    <td style="padding:20px 24px;background:#f4f4f4;border-top:1px solid #d0d0d0;">
      <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 12px;">
        <tr>
          <td style="padding:0 8px;">
            <a href="https://youtube.com/user/FinanzmarktWelt" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
              <img src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/youtube-filled-dark-40.png" alt="YouTube" width="24" height="24" style="display:block;" />
            </a>
          </td>
          <td style="padding:0 8px;">
            <a href="https://x.com/finanzmarktwelt" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
              <img src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/twitter-filled-dark-40.png" alt="X" width="24" height="24" style="display:block;" />
            </a>
          </td>
          <td style="padding:0 8px;">
            <a href="https://instagram.com/finanzmarktwelt/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
              <img src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/instagram-filled-dark-40.png" alt="Instagram" width="24" height="24" style="display:block;" />
            </a>
          </td>
          <td style="padding:0 8px;">
            <a href="https://www.facebook.com/share/1FpWPtAYHB/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
              <img src="https://cdn-images.mailchimp.com/icons/social-block-v3/block-icons-v3/facebook-filled-dark-40.png" alt="Facebook" width="24" height="24" style="display:block;" />
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:12px;color:#71717a;text-align:center;line-height:1.6;">
        <strong>Fugmanns Trading Woche</strong>
      </p>
    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`
}

// ── Shared helpers ───────────────────────────────────────────────────────

function buildTradeData(trade: Trade) {
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
  const berlinTime = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }).format(now)
  const timeStr = `${berlinTime} Uhr`

  const ticker = trade.asset ?? ''
  const tvSymbol = trade.tradingview_symbol
  const tvUrl = tvSymbol
    ? `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`
    : ticker
    ? `https://www.tradingview.com/symbols/${encodeURIComponent(ticker.replace('.', '-'))}/`
    : null
  const tvDisplayLabel = tvSymbol || ticker
  const ccySym = getCurrencySymbol(trade.asset, trade.asset_klasse, trade.currency)
  const ccy = ccySym ? ` ${ccySym.trim()}` : ''

  return { isLong, dirColor, dirLabel, dirArrow, tps, entries, crvText, timeStr, tvUrl, tvDisplayLabel, ccy }
}

function dataRow(label: string, value: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
    <td class="ftw-label-col" width="120" style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;padding-top:4px;">${label}</td>
    <td>${value}</td>
  </tr></table>`
}

/** Convert WYSIWYG HTML for email: ensure empty paragraphs create visible spacing */
function formatAnalyseHtml(html: string): string {
  return html
    .replace(/<p><\/p>/g, '<p style="margin:0;line-height:1.2;">&nbsp;</p>')
    .replace(/<p>/g, '<p style="margin:0 0 12px;">')
    .replace(/<p style="margin:0 0 12px;"> style="margin:0;line-height:1.2;">/g, '<p style="margin:0;line-height:1.2;">')
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
