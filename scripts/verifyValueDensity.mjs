// Verification harness for the constrained-hour value-density view (4b).
// Loads the committed casino JSON, zone-merges D/E/F -> Zone DD, runs the value-
// density slices, and prints the weekly heartbeat, per-bank hourly summaries, tier
// decompositions (with the BLACK-tier flag), constrained texture, and the
// reconciliation against the verified metric layer. Not bundled.  Run:
//   node scripts/verifyValueDensity.mjs   (or npm run verify:density)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { computeSeatHourBase, rollupByBank } from '../src/metrics/seatHourMetrics.js'
import {
  computeValueDensityBase,
  bankHourlyCurve,
  bankTierDecomposition,
  weeklyHeartbeat,
  bankConstrainedTexture
} from '../src/metrics/valueDensity.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = resolve(__dirname, '../public/assets/casino_data.json')
const MERGED = new Set(['Zone D', 'Zone E', 'Zone F'])

const usd = (x) => (x == null ? 'n/a' : `$${Number(x).toFixed(2)}`)
const pct = (x) => (x == null ? 'n/a' : `${(x * 100).toFixed(1)}%`)
const num = (x) => Number(x).toLocaleString('en-US')
const hh = (h) => `${String(h).padStart(2, '0')}:00`
const rule = (t) => console.log(`\n=== ${t} ===`)
const close = (a, b, tol = 1e-6) => Math.abs(a - b) < Math.max(tol, Math.abs(b) * 1e-9)

function loadRows() {
  const cols = JSON.parse(readFileSync(DATA, 'utf8'))
  const keys = Object.keys(cols)
  const n = keys.length && Array.isArray(cols[keys[0]]) ? cols[keys[0]].length : 0
  const rows = new Array(n)
  for (let i = 0; i < n; i++) {
    const row = {}
    for (const k of keys) row[k] = cols[k][i]
    if (MERGED.has(row.zone)) row.zone = 'Zone DD'
    row.turnover = parseFloat(row.turnover) || 0
    row.stroke = parseFloat(row.stroke) || 0
    rows[i] = row
  }
  return rows
}

function run() {
  const base = computeSeatHourBase(loadRows(), { tenureMode: 'span' })
  const vd = computeValueDensityBase(base)
  const keyFor = new Map(vd.banks.map((b) => [b.bankLabel, b.bankKey]))

  let allOk = true

  rule('WEEKLY HEARTBEAT (DD-wide peak hour + occupancy per day-of-week)')
  const hb = weeklyHeartbeat(vd)
  hb.days.forEach((d) => console.log(`  ${d.weekday.padEnd(9)} peak ${hh(d.peakHour)}  ${pct(d.peakOccupancy)}`))
  console.log(`  --> busiest hour of the week: ${hb.busiest.weekday} ${hh(hb.busiest.hour)} at ${pct(hb.busiest.occupancy)}`)
  const sun = hb.days.find((d) => d.weekday === 'Sunday')
  const sundayShift = sun.peakHour >= 13 && sun.peakHour <= 16 && hb.busiest.weekday === 'Sunday'
  console.log(`  FINDING: Sunday day-shifts (peak in 13-16, busiest of the week): ${sundayShift ? 'CONFIRMED' : '*** NOT CONFIRMED ***'}`)
  allOk = allOk && sundayShift

  const saturated = ['DD05', 'DD06', 'DD19']
  const flagged = ['DD20', 'DD10']

  rule('PER-BANK HOURLY CURVE SUMMARY (all days)')
  for (const label of [...saturated, ...flagged]) {
    const bk = keyFor.get(label)
    if (!bk) { console.log(`  ${label}: not found`); continue }
    const c = bankHourlyCurve(vd, bk)
    const midday = c.hours[14]
    const evening = c.hours[21]
    const overnight = c.hours[5]
    console.log(`  ${label.padEnd(6)} peak ${hh(c.peakHour)} ${pct(c.peakOccupancy)} | 14:00 occ ${pct(midday.occupancy)} ${usd(midday.theoPerAvailable)}/av ${usd(midday.theoPerOccupied)}/occ | 21:00 ${pct(evening.occupancy)} | 05:00 ${pct(overnight.occupancy)}`)
  }

  rule('PEAK-WINDOW TIER DECOMPOSITION (occupied-basis, dominant tier)')
  for (const label of [...saturated, ...flagged]) {
    const bk = keyFor.get(label)
    if (!bk) continue
    const t = bankTierDecomposition(vd, bk, { mode: 'peak' })
    console.log(`\n  ${label}  (${t.windowLabel})  total occupied ${num(Math.round(t.totalOccupiedSeatHours))} seat-hrs  bank ${usd(t.bankTheoPerOccupied)}/occ`)
    t.tiers.forEach((tr) => {
      const flag = tr.belowSampleThreshold ? `  << below ${t.sampleThreshold} occ seat-hrs (too thin to claim)` : ''
      console.log(`     ${tr.tier.padEnd(9)} share ${pct(tr.shareOfOccupied).padStart(6)}  ${usd(tr.theoPerOccupied).padStart(8)}/occ  (${num(Math.round(tr.occupiedSeatHours))} occ seat-hrs)${flag}`)
    })
    // Value-density identity: bank theo/occ == sum(share * tier theo/occ).
    const recomposed = t.tiers.reduce((s, tr) => s + (tr.shareOfOccupied || 0) * (tr.theoPerOccupied || 0), 0)
    const idOk = t.bankTheoPerOccupied == null || close(recomposed, t.bankTheoPerOccupied)
    allOk = allOk && idOk
    if (!idOk) console.log(`     *** value-density identity FAIL: ${usd(recomposed)} vs ${usd(t.bankTheoPerOccupied)}`)
  }
  console.log(`\n  BLACK-tier flag demonstrated: ${(() => {
    const t = bankTierDecomposition(vd, keyFor.get('DD05'), { mode: 'all' })
    const black = t.tiers.find((x) => x.tier === 'BLACK')
    return black ? `DD05 BLACK = ${num(Math.round(black.occupiedSeatHours))} occ seat-hrs, belowSampleThreshold=${black.belowSampleThreshold}` : 'no BLACK rows at DD05'
  })()}`)
  console.log(`  CAVEAT printed with decomposition: "${bankTierDecomposition(vd, keyFor.get('DD05'), { mode: 'peak' }).attributionCaveat}"`)

  rule('CONSTRAINED-HOUR TEXTURE (>= 0.80) — where the 85%-capture seat-hours live')
  for (const label of [...saturated, ...flagged]) {
    const bk = keyFor.get(label)
    if (!bk) continue
    const tx = bankConstrainedTexture(vd, bk)
    const top = tx.topCells.slice(0, 3).map((c) => `${c.weekday.slice(0, 3)} ${hh(c.hour)}(${c.constrainedHours})`).join(', ')
    console.log(`  ${label.padEnd(6)} constrained ${num(tx.constrainedHours)} / played ${num(tx.playedHours)} (${pct(tx.constrainedShareOfPlayed)}) | share of available ${pct(tx.constrainedShareOfAvailable)} | top cells: ${top}`)
  }

  rule('RECONCILIATION vs metric layer (rollupByBank)')
  const bankCells = new Map(rollupByBank(base).map((c) => [c.bankKey, c]))
  let reconOk = true
  for (const b of vd.banks) {
    const c = bankCells.get(b.bankKey)
    const curve = bankHourlyCurve(vd, b.bankKey) // all days
    const sumOcc = curve.hours.reduce((s, H) => s + H.occupiedSeatHours, 0)
    const sumTheo = curve.hours.reduce((s, H) => s + H.theo, 0)
    const sumAvail = curve.hours.reduce((s, H) => s + H.availableSeatHours, 0)
    // tier decomposition over all hours must also sum to the bank occupied total
    const tier = bankTierDecomposition(vd, b.bankKey, { mode: 'all' })
    const ok =
      close(sumOcc, c.occupiedSeatHours) &&
      close(sumTheo, c.theo) &&
      sumAvail === c.availableSeatHours &&
      close(tier.totalOccupiedSeatHours, c.occupiedSeatHours) &&
      close(tier.totalTheo, c.theo)
    if (!ok) {
      reconOk = false
      console.log(`  ${b.bankLabel} MISMATCH: occ ${sumOcc} vs ${c.occupiedSeatHours}, theo ${sumTheo} vs ${c.theo}, avail ${sumAvail} vs ${c.availableSeatHours}, tierOcc ${tier.totalOccupiedSeatHours}`)
    }
  }
  console.log(`  all ${vd.banks.length} banks: hourly + tier slices tie to rollupByBank totals (occupied, theo, available): ${reconOk ? 'OK' : '*** FAIL ***'}`)
  allOk = allOk && reconOk

  rule('RESULT')
  console.log(allOk ? '  ALL CHECKS PASSED' : '  *** CHECKS FAILED ***')
  process.exit(allOk ? 0 : 1)
}

run()
