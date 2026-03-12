const XLSX = require('xlsx');
const fs = require('fs');

// Read Excel
const wb = XLSX.readFile('tmp/Beendete Trades FTW Stand 05.03.2026.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

function excelDateToISO(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return d.toISOString().split('T')[0];
}

const excelTrades = rawData.slice(1).map(r => ({
  instrument: r[0],
  kaufdatum: excelDateToISO(r[1]),
  verkaufsdatum: excelDateToISO(r[2]),
}));

// Read DB trades
const dbTrades = JSON.parse(fs.readFileSync('/tmp/mb_trades.json', 'utf8'));
console.log('Excel trades:', excelTrades.length);
console.log('DB trades total:', dbTrades.length);
console.log('DB by profil:', JSON.stringify(dbTrades.reduce((a, t) => { a[t.profil] = (a[t.profil]||0)+1; return a; }, {})));

// Build lookup maps
const excelKeySet = new Map();
excelTrades.forEach(t => {
  const k = t.instrument + '|' + t.kaufdatum;
  excelKeySet.set(k, (excelKeySet.get(k)||0)+1);
});

const dbKeySet = new Map();
dbTrades.forEach(t => {
  const k = t.asset + '|' + t.datum_eroeffnung;
  const list = dbKeySet.get(k) || [];
  list.push(t);
  dbKeySet.set(k, list);
});

// DB trades NOT in Excel
const dbNotInExcel = dbTrades.filter(t => {
  const k = t.asset + '|' + t.datum_eroeffnung;
  return !excelKeySet.has(k);
});

// Excel trades NOT in DB
const excelNotInDb = excelTrades.filter(t => {
  const k = t.instrument + '|' + t.kaufdatum;
  return !dbKeySet.has(k);
});

console.log('\n--- DB trades NOT in Excel (' + dbNotInExcel.length + ') ---');
dbNotInExcel.forEach(t => console.log(t.profil, t.trade_id, t.asset, t.datum_eroeffnung, t.status));

console.log('\n--- Excel trades NOT in DB (' + excelNotInDb.length + ') ---');
excelNotInDb.forEach(t => console.log(t.instrument, t.kaufdatum, t.verkaufsdatum));

// Duplicates in DB (same asset + datum)
console.log('\n--- Duplicates in DB (same asset + date) ---');
dbKeySet.forEach((list, key) => {
  if (list.length > 1) {
    console.log(key, '->', list.map(t => t.trade_id + '(' + t.profil + ')').join(', '));
  }
});
