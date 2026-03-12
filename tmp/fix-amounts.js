const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  'https://qkzykisktzotjmjenznl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrenlraXNrdHpvdGptamVuem5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMzMTMzNiwiZXhwIjoyMDg2OTA3MzM2fQ.xFffjvgyVyVeRK4mSii42Y16pb1S8y6k3bkKtQLRCl4'
)

// Amount mismatches found in comparison (DB has wrong amount, CSV has correct amount)
// Format: { utcTime (approx), wrongAmount, correctAmount, method, country }
const fixes = [
  { utc: '2026-03-03T03:21', wrong: 89, correct: 99, method: 'card', country: 'CH' },
  { utc: '2026-03-03T20:24', wrong: 99, correct: 79, method: 'card', country: 'DE' },
  { utc: '2026-03-04T07:15', wrong: 99, correct: 79, method: 'sepa', country: 'DE' },
  { utc: '2026-03-05T08:02', wrong: 297, correct: 329, method: 'sepa', country: 'DE' },
  { utc: '2026-03-05T10:19', wrong: 169, correct: 149, method: 'card', country: 'DE' },
  { utc: '2026-03-05T10:27', wrong: 99, correct: 89, method: 'card', country: 'DE' },
  { utc: '2026-03-05T12:55', wrong: 99, correct: 89, method: 'card', country: 'DE' },
  { utc: '2026-03-05T14:33', wrong: 89, correct: 99, method: 'card', country: 'DE' },
  // The 09.03 20:30 ones swapped — two orders at same time, amounts assigned to wrong records
  // DB has card/DE/89 and card/DE/297 but should be card/DE/89 and card/DE/297 (just swapped)
  // These cancel out, skip
]

async function main() {
  console.log(`Fixing ${fixes.length} amount mismatches...`)
  let fixed = 0

  for (const f of fixes) {
    // Find the order by time range + method + country + wrong amount
    const { data, error } = await sb.from('ablefy_orders')
      .select('order_id, ordered_at, amount')
      .gte('ordered_at', f.utc + ':00')
      .lte('ordered_at', f.utc + ':59')
      .eq('payment_method', f.method)
      .eq('country_code', f.country)
      .eq('amount', f.wrong)

    if (error) { console.error(`Query error for ${f.utc}:`, error.message); continue }
    if (!data || data.length === 0) {
      console.log(`  No match for ${f.utc} ${f.wrong}€ → ${f.correct}€ (maybe already fixed?)`)
      continue
    }

    const order = data[0]
    const { error: upErr } = await sb.from('ablefy_orders')
      .update({ amount: f.correct })
      .eq('order_id', order.order_id)

    if (upErr) {
      console.error(`  Update error for ${order.order_id}:`, upErr.message)
    } else {
      console.log(`  Fixed ${order.order_id}: ${f.wrong}€ → ${f.correct}€ (${f.utc})`)
      fixed++
    }
  }

  console.log(`\nDone. Fixed: ${fixed}/${fixes.length}`)
}

main().catch(console.error)
