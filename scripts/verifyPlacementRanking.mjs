// Verification harness for the placement-adjusted product yield ranking.
// Loads the committed casino JSON, zone-merges D/E/F -> Zone DD (same as
// useCasinoData), runs the ranking, and prints the flagged-bank table + the
// same-product-across-banks evidence. Not bundled.  Run:
//   node scripts/verifyPlacementRanking.mjs   (or npm run verify:ranking)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { computeSeatHourBase, rollupByProductHourBank } from '../src/metrics/seatHourMetrics.js'
import { computePlacementRanking } from '../src/metrics/placementRanking.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = resolve(__dirname, '../public/assets/casino_data.json')
const MERGED = new Set(['Zone D', 'Zone E', 'Zone F'])

const usd = (x) => (x == null ? 'n/a' : `$${Number(x).toFixed(2)}`)
const num = (x) => Number(x).toLocaleString('en-US')
const pct = (x) => (x == null ? 'n/a' : `${(x * 100).toFixed(1)}%`)
const rule = (t) => console.log(`\n=== ${t} ===`)

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
  const rank = computePlacementRanking(base)
  const P = rank.params

  rule('PARAMETERS')
  console.log('  peakWindows       ', JSON.stringify(rank.peakWindows))
  console.log('  bankConstraintThreshold', P.bankConstraintThreshold)
  console.log('  comparableBenchmarkPercentile', P.comparableBenchmarkPercentile)
  console.log('  comparableBands   ', P.comparableBands, ' minComparablePositions', P.minComparablePositions)
  console.log('  machineHourConstraintThreshold', P.machineHourConstraintThreshold)

  rule('DESIRABILITY BANDS (equal-count tiles of peak-window occupancy)')
  rank.bands.forEach((b) => console.log(`  band ${b.index}: peakOcc ${pct(b.minPeakOcc)}..${pct(b.maxPeakOcc)}  (${b.bankCount} banks)`))

  rule('VALIDATION — are any SATURATED banks (peakOcc >= 0.72) mis-configured?')
  const v = rank.validation
  console.log(`  saturated banks: ${v.saturatedCount}   of which under-configured: ${v.saturatedUnderConfiguredCount}`)
  console.log(`  => ${v.message}`)
  v.saturatedBanks.forEach((b) => console.log(`  ${b.bankLabel.padEnd(6)} peakOcc ${pct(b.peakOcc)}  ${b.machineType.padEnd(11)} runs ${b.currentProduct} @ ${usd(b.currentYield)}/avail  better: ${b.betterProduct || 'NONE (already best)'}`))

  rule('FLAGGED / OPPORTUNITY BANKS  (near-saturated: top desirability band, under-configured)')
  console.log('  Note: labelled NEAR-SATURATED / EMERGING, not saturated — the 0.72 gate stays strict for the validation headline above.')
  if (rank.flagged.length === 0) {
    console.log('  NONE')
  }
  rank.flagged.forEach((b, i) => {
    const cohort = b.saturated ? 'SATURATED+under-config' : 'near-saturated/emerging'
    console.log(`\n  ${i + 1}. ${b.bankLabel}  [${b.machineType}, band ${b.band}, peer ${b.peerGroup}]  peakOcc ${pct(b.peakOcc)}  (${cohort})`)
    console.log(`     current product        ${b.currentProduct}  (${pct(b.currentProductShare)} of bank seat-hours)`)
    console.log(`     current theo/avail     ${usd(b.currentYield)}`)
    console.log(`     better product         ${b.betterProduct}  (p75 of ${b.benchmarkN} comparable machines)`)
    console.log(`     achievable-comparable  ${usd(b.achievableComparableYield)}/avail`)
    console.log(`     gap                    ${usd(b.gap)}/avail`)
    console.log(`     affected avail seat-hrs ${num(b.affectedAvailableSeatHours)}  (constrained ${num(b.constrainedSeatHours)} / unconstrained ${num(b.unconstrainedSeatHours)})`)
    console.log(`     undiscounted uplift    ${usd(b.gap * b.affectedAvailableSeatHours)}  (gap x affected, 13wk)`)
  })

  rule('SAME PRODUCT, DIFFERENT BANKS, DIFFERENT YIELD  (placement effect)')
  console.log('  product                 banks  machines   min .. p25 .. median .. p75 .. max   spread/avail')
  rank.productVariance.slice(0, 8).forEach((v) => {
    console.log(`  ${v.product.padEnd(22)} ${String(v.bankCount).padStart(3)}   ${String(v.machineCount).padStart(3)}     ${usd(v.min)} .. ${usd(v.p25)} .. ${usd(v.median)} .. ${usd(v.p75)} .. ${usd(v.max)}   ${usd(v.spread)}`)
  })

  rule('SAME PRODUCT, SAME HOUR, DIFFERENT BANKS  (placement effect, hour held fixed)')
  {
    const phb = rollupByProductHourBank(base)
    // Pick the (product, hour) present in the most banks with >= 2 machines each.
    const byPH = new Map()
    for (const c of phb) {
      if (c.machineCount < 2) continue
      const k = `${c.product}|${c.hour}`
      if (!byPH.has(k)) byPH.set(k, [])
      byPH.get(k).push(c)
    }
    let bestKey = null; let best = []
    byPH.forEach((cells, k) => { if (cells.length > best.length) { best = cells; bestKey = k } })
    if (bestKey) {
      const [prod, hour] = bestKey.split('|')
      console.log(`  ${prod} @ hour ${hour}:00 across ${best.length} banks:`)
      best.sort((a, b) => b.theoPerAvailable - a.theoPerAvailable).slice(0, 8)
        .forEach((c) => console.log(`    ${c.bankLabel.padEnd(6)} ${usd(c.theoPerAvailable)}/avail  occ ${pct(c.occupancy)}  (${c.machineCount} m)`))
    }
  }

  rule('SUMMARY')
  const totAffected = rank.flagged.reduce((s, b) => s + b.affectedAvailableSeatHours, 0)
  const totUplift = rank.flagged.reduce((s, b) => s + b.gap * b.affectedAvailableSeatHours, 0)
  console.log(`  flagged banks: ${rank.flagged.length}`)
  console.log(`  total affected available seat-hours: ${num(totAffected)}`)
  console.log(`  total undiscounted gap x seat-hours (13wk): ${usd(totUplift)}`)
}

run()
