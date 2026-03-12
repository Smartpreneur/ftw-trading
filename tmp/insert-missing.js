const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const sb = createClient(
  'https://qkzykisktzotjmjenznl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenlraXNrdHpvdGptamVuem5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMzMTMzNiwiZXhwIjoyMDg2OTA3MzM2fQ.xFffjvgyVyVeRK4mSii42Y16pb1S8y6k3bkKtQLRCl4'
)

async function main() {
  const missing = JSON.parse(fs.readFileSync('/Users/christopher/Development/FTW/tmp/missing-orders.json', 'utf8'))
  console.log(`Inserting ${missing.length} missing orders...`)

  let inserted = 0, errors = 0

  for (const o of missing) {
    // Generate a synthetic order_id since we don't have real ones
    // Format: SYNC-{date}{time}-{index} to be unique and identifiable as manual sync
    const ts = o.orderedAt.replace(/[-:T]/g, '').slice(0, 12)
    const orderId = `SYNC-${ts}-${o.amount}-${o.method}-${o.country}-${inserted}`

    const row = {
      order_id: orderId,
      ordered_at: o.orderedAt,
      is_new_order: true,
      amount: o.amount,
      campaign_id: o.campaign || null,
      plan_name: o.plan || null,
      country_code: o.country || null,
      payment_method: o.method || null,
      synced_at: new Date().toISOString(),
    }

    const { error } = await sb.from('ablefy_orders').upsert(row, { onConflict: 'order_id' })
    if (error) {
      console.error(`ERROR inserting ${orderId}:`, error.message)
      errors++
    } else {
      inserted++
    }
  }

  console.log(`Done. Inserted: ${inserted}, Errors: ${errors}`)

  // Verify counts after insert
  const { count } = await sb.from('ablefy_orders').select('*', { count: 'exact', head: true })
  console.log(`Total orders in DB now: ${count}`)
}

main().catch(console.error)
