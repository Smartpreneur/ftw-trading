const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const sb = createClient(
  'https://qkzykisktzotjmjenznl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenlraXNrdHpvdGptamVuem5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMzMTMzNiwiZXhwIjoyMDg2OTA3MzM2fQ.xFffjvgyVyVeRK4mSii42Y16pb1S8y6k3bkKtQLRCl4'
)

async function main() {
  const csvIds = JSON.parse(fs.readFileSync('/Users/christopher/Development/FTW/tmp/csv-order-ids.json', 'utf8')).map(String)
  console.log(`CSV Order-IDs: ${csvIds.length} (unique: ${new Set(csvIds).size})`)

  // Fetch all DB orders
  const dbOrders = []
  let offset = 0
  while (true) {
    const { data } = await sb.from('ablefy_orders')
      .select('order_id,ordered_at,amount,payment_method,country_code')
      .order('ordered_at', { ascending: true }).range(offset, offset + 999)
    if (!data || !data.length) break
    dbOrders.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }
  console.log(`DB orders total: ${dbOrders.length}`)

  // DB duplicates check
  const dbIdCounts = {}
  dbOrders.forEach(o => { dbIdCounts[o.order_id] = (dbIdCounts[o.order_id] || 0) + 1 })
  const dbDupes = Object.entries(dbIdCounts).filter(([, c]) => c > 1)
  console.log(dbDupes.length > 0 ? `\n!! DB has ${dbDupes.length} duplicate order_ids` : `\nDB order_ids: all unique`)

  // Split DB by type
  const dbReal = dbOrders.filter(o => !o.order_id.startsWith('SYNC-'))
  const dbSync = dbOrders.filter(o => o.order_id.startsWith('SYNC-'))
  console.log(`DB real IDs: ${dbReal.length}, SYNC IDs: ${dbSync.length}`)

  // Match CSV IDs against DB real IDs
  const dbRealIdSet = new Set(dbReal.map(o => o.order_id))
  const csvInDb = csvIds.filter(id => dbRealIdSet.has(id))
  const csvNotInDb = csvIds.filter(id => !dbRealIdSet.has(id))
  console.log(`\nCSV IDs found in DB (real): ${csvInDb.length}`)
  console.log(`CSV IDs NOT in DB (real):   ${csvNotInDb.length}`)

  // In-range analysis
  const dbInRange = dbOrders.filter(o => {
    const d = o.ordered_at?.slice(0, 10)
    return d >= '2026-03-02' && d <= '2026-03-10'
  })
  const dbRealInRange = dbInRange.filter(o => !o.order_id.startsWith('SYNC-'))
  const dbSyncInRange = dbInRange.filter(o => o.order_id.startsWith('SYNC-'))
  console.log(`\nDB in date range (03-09 Mar): ${dbInRange.length} (real: ${dbRealInRange.length}, SYNC: ${dbSyncInRange.length})`)

  // DB real IDs in range that are NOT in CSV
  const csvIdSet = new Set(csvIds)
  const dbRealNotInCsv = dbRealInRange.filter(o => !csvIdSet.has(o.order_id))
  console.log(`DB real IDs in range NOT in CSV: ${dbRealNotInCsv.length}`)
  if (dbRealNotInCsv.length > 0) {
    dbRealNotInCsv.forEach(o => console.log(`  ${o.order_id} | ${o.ordered_at} | ${o.amount}€ | ${o.payment_method}`))
  }

  // Summary
  console.log(`\n=== Summary ===`)
  console.log(`CSV has ${csvIds.length} orders`)
  console.log(`DB has ${dbRealInRange.length} real + ${dbSyncInRange.length} SYNC = ${dbInRange.length} total in range`)
  console.log(`${csvInDb.length} CSV orders matched by real ID in DB`)
  console.log(`${csvNotInDb.length} CSV orders have no real ID in DB (should be covered by SYNC entries)`)

  if (csvNotInDb.length !== dbSyncInRange.length) {
    console.log(`\n!! Mismatch: ${csvNotInDb.length} CSV orders missing real IDs vs ${dbSyncInRange.length} SYNC entries`)
    console.log(`Difference: ${Math.abs(csvNotInDb.length - dbSyncInRange.length)}`)
  } else {
    console.log(`\nPerfect: ${csvNotInDb.length} missing = ${dbSyncInRange.length} SYNC entries`)
  }

  // Recommendation: replace SYNC IDs with real ones
  if (dbSyncInRange.length > 0 && csvNotInDb.length > 0) {
    console.log(`\n=== Recommendation ===`)
    console.log(`Update ${Math.min(csvNotInDb.length, dbSyncInRange.length)} SYNC entries with real Ablefy Order-IDs`)
  }
}

main().catch(console.error)
