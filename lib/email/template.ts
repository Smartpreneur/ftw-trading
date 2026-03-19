import type { Trade } from '@/lib/types'
import { formatPrice, formatDate } from '@/lib/formatters'

/**
 * Builds an HTML email for a trade alert ("Eilmeldung").
 * Uses inline styles and tables for maximum email client compatibility.
 */
export function buildEilmeldungHtml(trade: Trade): string {
  const isLong = trade.richtung === 'LONG'
  const dirColor = isLong ? '#059669' : '#dc2626'
  const dirBg = isLong ? '#ecfdf5' : '#fef2f2'
  const dirLabel = trade.richtung ?? 'LONG'
  const dirArrow = isLong ? '▲' : '▼'

  // TP data
  const tps = [
    { label: 'TP1', level: trade.tp1, weight: trade.tp1_gewichtung },
    { label: 'TP2', level: trade.tp2, weight: trade.tp2_gewichtung },
    { label: 'TP3', level: trade.tp3, weight: trade.tp3_gewichtung },
    { label: 'TP4', level: trade.tp4, weight: trade.tp4_gewichtung },
  ].filter(tp => tp.level != null)

  // Entry points
  const entries = (trade.entries ?? [])
    .filter(e => e.preis > 0)
    .sort((a, b) => a.nummer - b.nummer)

  // CRV
  const crvText = trade.risiko_reward_min != null && trade.risiko_reward_max != null
    ? `${trade.risiko_reward_min.toFixed(1)} – ${trade.risiko_reward_max.toFixed(1)}`
    : trade.risiko_reward_min != null
    ? trade.risiko_reward_min.toFixed(1)
    : '–'

  // Zeiteinheit + Dauer
  const timingParts: string[] = []
  if (trade.zeiteinheit) timingParts.push(trade.zeiteinheit)
  if (trade.dauer_erwartung) timingParts.push(trade.dauer_erwartung)
  const timingText = timingParts.join(' · ') || '–'

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

  <!-- Header -->
  <tr>
    <td style="background:${dirColor};padding:16px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="display:inline-block;background:rgba(255,255,255,0.2);color:#ffffff;font-size:13px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:0.5px;">
              ${dirArrow} ${dirLabel}
            </span>
          </td>
          <td align="right">
            <span style="color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;letter-spacing:0.5px;">
              ⚡ EILMELDUNG
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Asset Name -->
  <tr>
    <td style="padding:20px 24px 8px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#18181b;">
        ${trade.asset_name || trade.asset}
      </h1>
      <p style="margin:4px 0 0;font-size:13px;color:#71717a;">
        ${trade.asset} · ${trade.asset_klasse}${trade.profil ? ` · ${trade.profil}` : ''}
      </p>
      ${trade.aktueller_kurs ? `
      <p style="margin:6px 0 0;font-size:13px;color:#71717a;">
        Kurs aktuell: <strong style="color:#18181b;font-family:monospace;">${formatPrice(trade.aktueller_kurs)}</strong>
        · ${formatDate(trade.datum_eroeffnung)}
      </p>` : ''}
    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="padding:0 24px;"><hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0;"></td></tr>

  <!-- Entry Points -->
  <tr>
    <td style="padding:8px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="120" style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;padding-top:4px;">
            Einstieg
          </td>
          <td style="font-size:15px;color:#18181b;">
            ${entries.length > 1
              ? entries.map(e =>
                  `<div style="margin-bottom:2px;"><span style="font-family:monospace;font-weight:700;">${formatPrice(e.preis)}</span> <span style="font-size:12px;color:#71717a;">(${Math.round(e.anteil * 100)}%)</span></div>`
                ).join('') +
                `<div style="margin-top:4px;font-size:12px;color:#71717a;">Mischkurs: <strong style="font-family:monospace;color:#18181b;">${formatPrice(trade.einstiegspreis)}</strong></div>`
              : `<span style="font-family:monospace;font-weight:700;font-size:18px;">${formatPrice(trade.einstiegspreis)}</span>`
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Stop Loss -->
  ${trade.stop_loss != null ? `
  <tr>
    <td style="padding:8px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="120" style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;padding-top:4px;">
            Stop-Loss
          </td>
          <td>
            <span style="display:inline-block;background:#fef2f2;color:#dc2626;font-family:monospace;font-size:15px;font-weight:700;padding:4px 10px;border-radius:6px;">
              ${formatPrice(trade.stop_loss)}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- Take Profits -->
  ${tps.length > 0 ? `
  <tr>
    <td style="padding:8px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="120" style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;padding-top:4px;">
            Take Profit
          </td>
          <td>
            ${tps.map(tp =>
              `<span style="display:inline-block;margin-right:12px;margin-bottom:4px;">
                <span style="display:inline-block;background:#ecfdf5;color:#059669;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;margin-right:4px;">${tp.label}</span>
                <span style="font-family:monospace;font-size:14px;font-weight:600;color:#18181b;">${formatPrice(tp.level)}</span>
              </span>`
            ).join('')}
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- CRV -->
  <tr>
    <td style="padding:8px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="120" style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">
            CRV
          </td>
          <td>
            <span style="color:#059669;font-weight:700;font-size:15px;">${crvText}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="padding:0 24px;"><hr style="border:none;border-top:1px solid #e4e4e7;margin:12px 0;"></td></tr>

  <!-- Zeiteinheit / Dauer -->
  <tr>
    <td style="padding:8px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="120" style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">
            Zeiteinheit / Dauer
          </td>
          <td style="font-size:14px;color:#18181b;font-weight:500;">
            ${timingText}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Gewinnmitnahme-Plan -->
  ${tps.length > 0 && tps.some(tp => tp.weight != null) ? `
  <tr>
    <td style="padding:12px 24px;">
      <p style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">
        Gewinnmitnahme-Plan
      </p>
      <table width="100%" cellpadding="0" cellspacing="8">
        <tr>
          ${tps.filter(tp => tp.weight != null).map(tp => `
          <td align="center" style="background:#fefce8;border-radius:8px;padding:12px 8px;">
            <div style="font-size:20px;font-weight:700;color:#059669;">${Math.round(tp.weight! * 100)}%</div>
            <div style="font-size:11px;color:#71717a;margin-top:2px;">bei ${tp.label}</div>
          </td>
          `).join('')}
        </tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- Bemerkungen -->
  ${trade.bemerkungen ? `
  <tr>
    <td style="padding:12px 24px;">
      <p style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">
        Analyse
      </p>
      <p style="font-size:14px;color:#3f3f46;line-height:1.6;margin:0;white-space:pre-wrap;">${escapeHtml(trade.bemerkungen)}</p>
    </td>
  </tr>` : ''}

  <!-- Chart Image -->
  ${trade.chart_bild_url ? `
  <tr>
    <td style="padding:12px 24px;">
      <img src="${trade.chart_bild_url}" alt="Chart ${trade.asset_name || trade.asset}" style="width:100%;border-radius:8px;border:1px solid #e4e4e7;" />
    </td>
  </tr>` : ''}

  <!-- Footer -->
  <tr>
    <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #e4e4e7;">
      <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;">
        Fugmanns Trading Woche · Diese E-Mail wurde automatisch generiert.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
