// Verification harness for the dollar bridge. Loads the committed casino JSON,
// zone-merges D/E/F -> Zone DD, runs the bridge, and prints the three components,
// the flat floor, the full-floor upside, the reconciliation block, and the
// per-zone sanity check. Not bundled.  Run:
//   node scripts/verifyDollarBridge.mjs   (or npm run verify:bridge)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { computeSeatHourBase } from '../src/metrics/seatHourMetrics.js'
import { computeDollarBridge } from '../src/metrics/dollarBridge.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = resolve(__dirname, '../public/assets/casino_data.json')
const MERGED = new Set(['Zone D', 'Zone E', 'Zone F'])

const usd0 = (x) => (x == null ? 'n/a' : `$${Math.round(Number(x)).toLocaleString('en-US')}`)
const usd2 = (x) => (x == null ? 'n/a' : `$${Number(x).toFixed(2)}`)
const num = (x) => Number(x).toLocaleString('en-US')
const pct = (x) => `${(x * 100).toFixed(1)}%`
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
  const bridge = computeDollarBridge(base)
  const P = bridge.params
  const T = bridge.totals

  rule('CAPTURE PARAMETERS')
  console.log(`  machineHourConstraintThreshold ${P.machineHourConstraintThreshold}  (bridge-local; OCCUPANCY_THRESHOLD 0.85 untouched)`)
  console.log(`  captureConstrained ${P.captureConstrained}  captureUnconstrained ${P.captureUnconstrained}`)
  console.log(`  captureProductSwap ${P.captureProductSwap}  captureFlatFloor ${P.captureFlatFloor}`)

  rule('VALIDATION HEADLINE (from the ranking)')
  console.log(`  ${bridge.ranking.validation.message}`)
  console.log(`  saturated banks: ${bridge.ranking.validation.saturatedCount}, under-configured: ${bridge.ranking.validation.saturatedUnderConfiguredCount}`)

  rule('PER-BANK GLASS BOX (near-saturated / emerging cohort)')
  console.log('  bank    peakOcc  gap/av   affected   constr/unconstr    C1 (segmented)')
  bridge.perBank.forEach((b) => {
    console.log(`  ${b.bankLabel.padEnd(6)} ${pct(b.peakOcc).padStart(6)}  ${usd2(b.gap).padStart(7)}  ${num(b.affected).padStart(8)}   ${num(b.constrained)}/${num(b.unconstrained)}      ${usd0(b.c1)}`)
    console.log(`         swap ${b.currentProduct} -> ${b.betterProduct};  constrained $ ${usd0(b.capturedConstrained)} (85%) + unconstrained $ ${usd0(b.capturedUnconstrained)} (10%)`)
  })

  rule('BRIDGE COMPONENTS  (13-week window  ->  annualised x52/13)')
  const row = (c) => `${usd0(c.window).padStart(12)}  ->  ${usd0(c.annual).padStart(12)} /yr`
  console.log(`  C1  Reallocation prize (HEADLINE, segmented)   ${row(bridge.components.c1)}`)
  console.log(`  C3  Conservative floor (flat 20%)              ${row(bridge.components.c3)}`)
  console.log(`  C2  Product-swap prize (DIRECTIONAL, 25%)      ${row(bridge.components.c2)}   [shown beside C1, NOT summed in]`)
  console.log(`\n  HEADLINE HARD NUMBER  =  C1 annualised  =  ${usd0(bridge.components.c1.annual)}/yr   (floor ${usd0(bridge.components.c3.annual)}/yr)`)

  rule('C1 CAPTURE MIX (85% constrained vs 10% unconstrained)')
  console.log(`  from constrained (>=0.80) seat-hours: ${usd0(T.capturedConstrained)}  (${pct(T.constrainedShareOfC1)} of C1)`)
  console.log(`  from unconstrained seat-hours:        ${usd0(T.capturedUnconstrained)}  (${pct(T.unconstrainedShareOfC1)} of C1)`)
  console.log(`  affected seat-hours: ${num(T.totalAffected)}  =  constrained ${num(T.totalConstrained)} + unconstrained ${num(T.totalUnconstrained)}`)

  rule('UPSIDE — full-floor extrapolation (NOT in the headline)')
  const u = bridge.upside
  console.log(`  multiplier = floor available seat-hrs ${num(u.floorAvailableSeatHours)} / flagged affected ${num(u.flaggedAffectedSeatHours)} = ${u.extrapolationMultiplier.toFixed(1)}x`)
  console.log(`  extrapolated C1: ${usd0(u.window)} (13wk)  ->  ${usd0(u.annual)}/yr   [crude extrapolation, label as upside]`)

  rule('RECONCILIATION')
  const r = bridge.reconciliation
  console.log(`  split ties to affected (no double-count): ${r.splitTiesToAffected ? 'OK' : 'FAIL'}`)
  console.log(`  C1 recomputed from grain ties:            ${r.c1TiesToGrain ? 'OK' : 'FAIL'}`)
  console.log(`  C1 == constrained$ + unconstrained$:      ${r.c1EqualsBuckets ? 'OK' : 'FAIL'}`)
  console.log(`  C2 == base x 0.25, C3 == base x 0.20:     ${r.c2TiesToBase && r.c3TiesToBase ? 'OK' : 'FAIL'}`)
  console.log(`  all reconcile: ${r.ok ? 'OK' : '*** FAIL ***'}`)

  rule('SANITY (per-zone pilot hurdle)')
  console.log(`  DD is one zone standing in for a larger floor.`)
  console.log(`  headline C1 = ${usd0(bridge.components.c1.annual)}/yr; DD total theo = ${usd0(T.ddTheoAnnual)}/yr (C1 is ${pct(bridge.components.c1.annual / T.ddTheoAnnual)} of it)`)
  const hurdle = bridge.components.c1.annual >= 50000
  console.log(`  clears a $50k per-zone pilot hurdle: ${hurdle ? 'YES' : 'NO'}`)
  console.log(`  ${bridge.sanity.note}`)
  if (bridge.sanity.flags.length) console.log(`  *** FLAGS: ${bridge.sanity.flags.join('; ')}`)

  rule('RESULT')
  const ok = r.ok && bridge.sanity.ok
  console.log(ok ? '  ALL CHECKS PASSED' : '  *** CHECKS FAILED ***')
  process.exit(ok ? 0 : 1)
}

run()
