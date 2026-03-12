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
  // March 3-9 2026: CET = UTC+1 (before DST switch)
  const utcMs = Date.UTC(+y, +m - 1, +d, +h - 1, +mi)
  return new Date(utcMs).toISOString()
}

async function main() {
  // Parse CSV
  const csvText = fs.readFileSync('/dev/stdin', 'utf8')
  const lines = csvText.trim().split('\n')
  const csvOrders = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';')
    if (cols.length < 12) continue
    const dateStr = cols[0]?.trim()
    if (!dateStr || !dateStr.includes('.')) continue
    const amount = parseFloat(cols[4]?.replace(',', '.')) || 0
    const method = METHOD_MAP[cols[2]?.trim()] || cols[2]?.trim()?.toLowerCase()
    const plan = cols[6]?.trim() || ''
    const planId = cols[7]?.trim() || ''
    const campaign = cols[8]?.trim() || ''
    const country = COUNTRY_MAP[cols[10]?.trim()] || cols[10]?.trim()
    const orderId = cols[11]?.trim() || ''
    const orderedAt = berlinToUtc(dateStr)
    csvOrders.push({ date: dateStr, orderedAt, amount, method, plan, campaign, country, orderId })
  }
  console.log(`CSV orders parsed: ${csvOrders.length}`)

  // Check for duplicate Order-IDs in CSV itself
  const csvIdCounts = {}
  csvOrders.forEach(o => { csvIdCounts[o.orderId] = (csvIdCounts[o.orderId] || 0) + 1 })
  const csvDupes = Object.entries(csvIdCounts).filter(([, c]) => c > 1)
  if (csvDupes.length > 0) {
    console.log(`\n⚠ Duplicate Order-IDs in CSV: ${csvDupes.length}`)
    csvDupes.forEach(([id, count]) => console.log(`  ${id}: ${count}x`))
  } else {
    console.log(`\n✓ All Order-IDs in CSV are unique`)
  }

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
  console.log(`DB orders total: ${dbOrders.length}`)

  // Check for duplicate order_ids in DB
  const dbIdCounts = {}
  dbOrders.forEach(o => { dbIdCounts[o.order_id] = (dbIdCounts[o.order_id] || 0) + 1 })
  const dbDupes = Object.entries(dbIdCounts).filter(([, c]) => c > 1)
  if (dbDupes.length > 0) {
    console.log(`\n⚠ Duplicate order_ids in DB: ${dbDupes.length}`)
    dbDupes.forEach(([id, count]) => console.log(`  ${id}: ${count}x`))
  } else {
    console.log(`✓ All order_ids in DB are unique`)
  }

  // Match CSV Order-IDs against DB
  const dbIdSet = new Set(dbOrders.map(o => o.order_id))
  const csvIdsInDb = csvOrders.filter(o => dbIdSet.has(o.orderId))
  const csvIdsNotInDb = csvOrders.filter(o => !dbIdSet.has(o.orderId))

  console.log(`\n--- Matching by Order-ID ---`)
  console.log(`CSV orders found in DB: ${csvIdsInDb.length}`)
  console.log(`CSV orders NOT in DB:   ${csvIdsNotInDb.length}`)

  // For orders not in DB by ID, check if there's a SYNC- entry that matches by time/amount
  const syncOrders = dbOrders.filter(o => o.order_id.startsWith('SYNC-'))
  console.log(`\nSYNC orders in DB: ${syncOrders.length}`)

  // Try to match missing CSV orders to SYNC entries
  const matchedSync = []
  const unmatchedCsv = []
  const usedSyncIds = new Set()

  for (const csv of csvIdsNotInDb) {
    // Find SYNC entry within same minute, same amount, method, country
    const csvMin = csv.orderedAt.slice(0, 16)
    const match = syncOrders.find(s => {
      if (usedSyncIds.has(s.order_id)) return false
      const dbMin = s.ordered_at?.slice(0, 16)
      return dbMin === csvMin &&
        Math.abs(s.amount - csv.amount) < 0.1 &&
        s.payment_method === csv.method &&
        s.country_code === csv.country
    })
    if (match) {
      matchedSync.push({ csv, sync: match })
      usedSyncIds.add(match.order_id)
    } else {
      unmatchedCsv.push(csv)
    }
  }

  console.log(`Matched to SYNC entries: ${matchedSync.length}`)
  console.log(`Truly missing from DB:   ${unmatchedCsv.length}`)

  if (unmatchedCsv.length > 0) {
    console.log('\n=== Orders missing from DB ===')
    unmatchedCsv.forEach(o => {
      console.log(`  ${o.date} | ${o.orderId} | ${o.amount}€ | ${o.method} | ${o.country}`)
    })
  }

  // Check for DB orders that are not in CSV (extra orders)
  const csvIdSet = new Set(csvOrders.map(o => o.orderId))
  const dbInRange = dbOrders.filter(o => {
    const d = o.ordered_at?.slice(0, 10)
    return d >= '2026-03-03' && d <= '2026-03-09'
  })
  const dbNotInCsv = dbInRange.filter(o => !csvIdSet.has(o.order_id) && !o.order_id.startsWith('SYNC-'))
  const dbSyncNotMatched = dbInRange.filter(o => o.order_id.startsWith('SYNC-') && !usedSyncIds.has(o.order_id))

  console.log(`\n--- DB orders in range (03.03-09.03) ---`)
  console.log(`Total in range: ${dbInRange.length}`)
  console.log(`DB real IDs not in CSV: ${dbNotInCsv.length}`)
  if (dbNotInCsv.length > 0) {
    dbNotInCsv.forEach(o => {
      console.log(`  ${o.order_id} | ${o.ordered_at} | ${o.amount}€ | ${o.payment_method} | ${o.country_code}`)
    })
  }
  console.log(`SYNC entries not matched to any CSV order: ${dbSyncNotMatched.length}`)
  if (dbSyncNotMatched.length > 0) {
    dbSyncNotMatched.forEach(o => {
      console.log(`  ${o.order_id} | ${o.ordered_at} | ${o.amount}€`)
    })
  }

  // Summary: revenue comparison
  const csvRevenue = csvOrders.reduce((s, o) => s + o.amount, 0)
  const dbRangeRevenue = dbInRange.reduce((s, o) => s + (Number(o.amount) || 0), 0)
  console.log(`\n--- Revenue ---`)
  console.log(`CSV total:  ${csvRevenue.toFixed(2)}€ (${csvOrders.length} orders)`)
  console.log(`DB total:   ${dbRangeRevenue.toFixed(2)}€ (${dbInRange.length} orders)`)
  console.log(`Difference: ${(dbRangeRevenue - csvRevenue).toFixed(2)}€ (${dbInRange.length - csvOrders.length} orders)`)

  // Recommendation
  if (matchedSync.length > 0) {
    console.log(`\n--- Recommendation ---`)
    console.log(`${matchedSync.length} SYNC entries should be updated with real Ablefy Order-IDs`)
    console.log(`${unmatchedCsv.length > 0 ? unmatchedCsv.length + ' orders need to be inserted' : 'No missing orders to insert'}`)
  }
}

main().catch(console.error)
