const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const sb = createClient(
  'https://qkzykisktzotjmjenznl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenlraXNrdHpvdGptamVuem5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMzMTMzNiwiZXhwIjoyMDg2OTA3MzM2fQ.xFffjvgyVyVeRK4mSii42Y16pb1S8y6k3bkKtQLRCl4'
)

const METHOD_MAP = {
  'Kreditkarte': 'card', 'Sepa': 'sepa', 'Google Pay': 'google_pay',
  'Apple Pay': 'apple_pay', 'Vorkasse': 'bank_transfer'
}
const COUNTRY_MAP = {
  'Deutschland': 'DE', 'Schweiz': 'CH', 'Oesterreich': 'AT', 'Spanien': 'ES',
  'Slowenien': 'SI', 'Zypern': 'CY', 'Tschechien': 'CZ', 'Ungarn': 'HU',
  'Polen': 'PL', 'Liechtenstein': 'LI', 'Luxemburg': 'LU', 'Daenemark': 'DK',
  'Belgien': 'BE', 'Italien': 'IT'
}

function berlinToUtc(dateStr) {
  const [datePart, timePart] = dateStr.split(' ')
  const [d, m, y] = datePart.split('.')
  const [h, mi] = (timePart || '00:00').split(':')
  // March 3-9 2026 is CET (UTC+1)
  const utcMs = Date.UTC(+y, +m - 1, +d, +h - 1, +mi)
  return new Date(utcMs).toISOString()
}

// Match on time (to minute) + normalized method + country
function fingerprint(utcIso, method, country) {
  return `${utcIso.slice(0, 16)}|${method}|${country}`
}

async function main() {
  const csvText = fs.readFileSync('/Users/christopher/Development/FTW/tmp/orders-export.csv', 'utf8')
  const lines = csvText.trim().split('\n')
  const csvOrders = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';')
    if (cols.length < 11) continue
    const dateStr = cols[1]?.trim()
    if (!dateStr || !dateStr.includes('.')) continue
    const amount = parseFloat(cols[5]?.replace(',', '.')) || 0
    const method = METHOD_MAP[cols[3]?.trim()] || cols[3]?.trim()?.toLowerCase()
    const plan = cols[7]?.trim() || ''
    const planId = cols[8]?.trim() || ''
    const campaign = cols[9]?.trim() || ''
    const country = COUNTRY_MAP[cols[10]?.trim()] || cols[10]?.trim()
    const orderedAt = berlinToUtc(dateStr)
    csvOrders.push({ date: dateStr, orderedAt, amount, method, plan, planId, campaign, country,
      fp: fingerprint(orderedAt, method, country) })
  }
  console.log(`CSV orders: ${csvOrders.length}`)

  // Fetch all DB orders
  const dbOrders = []
  let offset = 0
  while (true) {
    const { data } = await sb.from('ablefy_orders')
      .select('order_id,ordered_at,amount,payment_method,plan_name,campaign_id,country_code')
      .order('ordered_at', { ascending: true }).range(offset, offset + 999)
    if (!data || !data.length) break
    dbOrders.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }

  const dbInRange = dbOrders.filter(o => {
    const d = o.ordered_at?.slice(0, 10)
    return d >= '2026-03-03' && d <= '2026-03-09'
  })
  console.log(`DB orders in range: ${dbInRange.length}`)

  // Per-day comparison
  const csvByDay = {}, dbByDay = {}
  csvOrders.forEach(o => { const d = o.orderedAt.slice(0, 10); csvByDay[d] = (csvByDay[d] || 0) + 1 })
  dbInRange.forEach(o => { const d = o.ordered_at.slice(0, 10); dbByDay[d] = (dbByDay[d] || 0) + 1 })
  console.log('\nDay         | CSV | DB  | Diff')
  const allDays = [...new Set([...Object.keys(csvByDay), ...Object.keys(dbByDay)])].sort()
  allDays.forEach(day => {
    const c = csvByDay[day] || 0, d = dbByDay[day] || 0
    console.log(`${day} | ${String(c).padStart(3)} | ${String(d).padStart(3)} | ${c - d > 0 ? '+' : ''}${c - d}`)
  })
  const totalCsv = csvOrders.length, totalDb = dbInRange.length
  console.log(`TOTAL       | ${totalCsv} | ${totalDb} | +${totalCsv - totalDb}`)

  // Fingerprint matching
  const dbFpMap = new Map()
  dbInRange.forEach(o => {
    const fp = fingerprint(o.ordered_at, o.payment_method || '', o.country_code || '')
    if (!dbFpMap.has(fp)) dbFpMap.set(fp, [])
    dbFpMap.get(fp).push(o)
  })

  const matchedDbIds = new Set()
  const missing = [], matched = [], amountMismatch = []
  csvOrders.forEach(csv => {
    const candidates = dbFpMap.get(csv.fp) || []
    const m = candidates.find(db => !matchedDbIds.has(db.order_id))
    if (m) {
      matchedDbIds.add(m.order_id)
      matched.push({ csv, db: m })
      if (Math.abs(csv.amount - m.amount) > 0.1) amountMismatch.push({ csv, db: m })
    } else {
      missing.push(csv)
    }
  })

  console.log(`\nMatched: ${matched.length}`)
  console.log(`Amount mismatches: ${amountMismatch.length}`)
  console.log(`Missing from DB: ${missing.length}`)

  if (amountMismatch.length > 0) {
    console.log('\n=== Amount Mismatches ===')
    amountMismatch.forEach(({ csv, db }) => {
      console.log(`  ${csv.date} | CSV: ${csv.amount}€ | DB: ${db.amount}€ | ${csv.method} ${csv.country}`)
    })
  }

  // Missing per day
  const missingByDay = {}
  missing.forEach(o => { const d = o.orderedAt.slice(0, 10); if (!missingByDay[d]) missingByDay[d] = []; missingByDay[d].push(o) })

  console.log('\n=== Missing per day ===')
  Object.entries(missingByDay).sort().forEach(([day, orders]) => {
    console.log(`\n${day}: ${orders.length} missing`)
    orders.forEach(o => console.log(`  ${o.date} | ${o.amount}€ | ${o.method} | ${o.country} | ${o.campaign}`))
  })

  // Pattern analysis
  console.log('\n=== Patterns ===')
  const byHour = {}
  missing.forEach(o => { const h = new Date(o.orderedAt).getUTCHours(); byHour[h] = (byHour[h] || 0) + 1 })
  console.log('By hour (UTC):', Object.entries(byHour).sort((a,b) => +a[0] - +b[0]).map(([h,c]) => `${h}h:${c}`).join(', '))
  const byMethod = {}
  missing.forEach(o => { byMethod[o.method] = (byMethod[o.method] || 0) + 1 })
  console.log('By method:', JSON.stringify(byMethod))
  const missingRev = missing.reduce((s, o) => s + o.amount, 0)
  console.log(`Missing revenue: ${missingRev.toFixed(2)}€`)

  // Output missing as JSON for insert script
  fs.writeFileSync('/Users/christopher/Development/FTW/tmp/missing-orders.json', JSON.stringify(missing, null, 2))
  console.log(`\nWrote ${missing.length} missing orders to tmp/missing-orders.json`)
}

main().catch(console.error)
