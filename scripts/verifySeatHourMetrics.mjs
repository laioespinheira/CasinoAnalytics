// Verification harness for the shared seat-hour metric (Stage 2, load-bearing).
// Loads the committed casino JSON, applies the same zone merge useCasinoData does,
// runs the pure metric module, and prints the numbers + assertions the brief asks
// for. Not bundled into the app.  Run:  node scripts/verifySeatHourMetrics.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  TENURE_MODES,
  computeSeatHourBase,
  rollupByMachine,
  rollupByBank,
  rollupByProduct,
  rollupByHourOfDay,
  rollupByTier,
  rollupByProductHourBank,
  verifyIdentity,
  reconcile
} from '../src/metrics/seatHourMetrics.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = resolve(__dirname, '../public/assets/casino_data.json')

const MERGED_ZONES = new Set(['Zone D', 'Zone E', 'Zone F'])

const usd = (x) => (x == null ? 'null' : `$${Number(x).toFixed(2)}`)
const num = (x) => Number(x).toLocaleString('en-US')

const line = (label, value) => console.log(`  ${label.padEnd(42)} ${value}`)
const rule = (t) => console.log(`\n=== ${t} ===`)

function loadRows() {
  const cols = JSON.parse(readFileSync(DATA, 'utf8'))
  const keys = Object.keys(cols)
  const n = keys.length && Array.isArray(cols[keys[0]]) ? cols[keys[0]].length : 0
  const rows = new Array(n)
  for (let i = 0; i < n; i++) {
    const row = {}
    for (const k of keys) row[k] = cols[k][i]
    if (MERGED_ZONES.has(row.zone)) row.zone = 'Zone DD'
    row.turnover = parseFloat(row.turnover) || 0
    row.stroke = parseFloat(row.stroke) || 0
    // theo_win / occupancy left as-is (already numeric in the committed data).
    rows[i] = row
  }
  return rows
}

function run() {
  const rows = loadRows()

  // Denominator comparison across tenure modes (context for the SPAN choice).
  rule('DENOMINATOR MODES (blended DD)')
  for (const mode of [TENURE_MODES.DENSE, TENURE_MODES.SPAN, TENURE_MODES.DISTINCT]) {
    const b = computeSeatHourBase(rows, { tenureMode: mode })
    const t = b.totals
    line(
      `${mode.toUpperCase()} avail=${num(t.availableSeatHours)}`,
      `theo/avail=${usd(t.blendedTheoPerAvailable)}  occ=${(t.blendedOccupancy * 100).toFixed(2)}%`
    )
  }

  // Locked choice: SPAN.
  const base = computeSeatHourBase(rows, { tenureMode: TENURE_MODES.SPAN })
  const t = base.totals

  rule('DD TOTALS (SPAN tenure, 13 weeks)')
  line('DD machines (positions)', num(t.machineCount))
  line('distinct dates (days)', num(t.dayCount))
  line('present (played) machine-hours', num(t.presentHours))
  line('available seat-hours', `${num(t.availableSeatHours)}  (~= positions x 24 x days)`)
  line('occupied seat-hours', num(Math.round(t.occupiedSeatHours)))
  line('total theo (13wk)', usd(t.theo))
  line('annualised theo (x 52/13)', usd(t.theo * (52 / 13)))
  line('blended theo / AVAILABLE seat-hour', usd(t.blendedTheoPerAvailable))
  line('blended occupancy', `${(t.blendedOccupancy * 100).toFixed(2)}%`)
  line('blended theo / OCCUPIED seat-hour', usd(t.blendedTheoPerOccupied))

  // Order-of-magnitude sanity vs the brief's ~$20 available seat-hour.
  const perAvail = t.blendedTheoPerAvailable
  const sane = perAvail >= 5 && perAvail <= 60
  line('sanity vs brief ~$20/avail seat-hour', sane ? 'OK (in $5-$60 band)' : '*** FLAG: OUT OF BAND ***')

  rule('DUAL-PRODUCT LEAKAGE (primary-family attribution)')
  line('machines running >1 product family', num(base.leakage.dualFamilyMachines))
  line('off-primary theo', usd(base.leakage.offPrimaryTheo))
  line('off-primary theo as % of DD theo', `${base.leakage.offPrimaryTheoPct.toFixed(3)}%`)

  // Worked single machine-hour example: pick the machine-hour with the largest
  // theo so the numbers are legible, and reconstruct the identity by hand.
  rule('WORKED EXAMPLE (one machine x one hour)')
  let ex = base.atoms[0]
  for (const a of base.atoms) if (a.theo > ex.theo) ex = a
  const theoPerAvail = ex.theo / 1
  const theoPerOcc = ex.occ > 0 ? ex.theo / ex.occ : null
  line('machine / bank', `${ex.machineId} / ${ex.bankLabel}`)
  line('product family (row / primary)', `${ex.family} / ${ex.primaryFamily}`)
  line('date / weekday / hour', `${ex.date} / ${ex.weekday} / ${ex.hour}:00`)
  line('theo_win', usd(ex.theo))
  line('occupied-minutes (occupancy x 60)', `${(ex.occ * 60).toFixed(1)} min`)
  line('occupancy', `${(ex.occ * 100).toFixed(1)}%`)
  line('available seat-hours', '1')
  line('theo / AVAILABLE seat-hour', usd(theoPerAvail))
  line('theo / OCCUPIED seat-hour', usd(theoPerOcc))
  line('identity occ x theo/occupied', usd(ex.occ * theoPerOcc) + `  (== theo/avail ${usd(theoPerAvail)})`)

  rule('IDENTITY  theo/available = occupancy x theo/occupied')
  const idn = verifyIdentity(base)
  line('max residual @ atomic grain', idn.maxAtomResidual.toExponential(3))
  line('max residual @ roll-up cells', idn.maxCellResidual.toExponential(3))
  line('identity holds', idn.ok ? 'OK' : '*** FAIL ***')

  rule('RECONCILIATION (partitions vs atomic totals)')
  const rec = reconcile(base)
  line('atomic total theo', usd(rec.atomicTheo))
  line('atomic available seat-hours', num(rec.atomicAvail))
  line('atomic blended theo/avail', usd(rec.atomicBlended))
  for (const [name, r] of Object.entries(rec.partitions)) {
    const flags = `theo:${r.theoOk ? 'ok' : 'X'} occ:${r.occOk ? 'ok' : 'X'} avail:${r.availOk ? 'ok' : 'X'} blended:${r.blendedOk ? 'ok' : 'X'}`
    line(`${name}`, `theo=${usd(r.sumTheo)} avail=${num(r.sumAvail)} blended=${usd(r.blended)}  [${flags}]`)
  }
  line('all partitions reconcile', rec.ok ? 'OK' : '*** FAIL ***')

  // Small proofs the roll-ups are usable downstream.
  rule('TOP 5 PRODUCTS by theo / available seat-hour (>= 5 machines)')
  rollupByProduct(base)
    .filter((p) => p.machineCount >= 5)
    .sort((a, b) => b.theoPerAvailable - a.theoPerAvailable)
    .slice(0, 5)
    .forEach((p, i) => line(`${i + 1}. ${p.product}`, `${usd(p.theoPerAvailable)}/avail  occ=${(p.occupancy * 100).toFixed(1)}%  ${usd(p.theoPerOccupied)}/occ  (${p.machineCount} m)`))

  rule('PLACEMENT PROOF sample: one product x one hour across banks')
  const phb = rollupByProductHourBank(base)
  // Find a (product,hour) present in >= 2 banks with the most banks, hour in peak-ish range.
  const byPH = new Map()
  for (const c of phb) {
    const k = `${c.product}|${c.hour}`
    if (!byPH.has(k)) byPH.set(k, [])
    byPH.get(k).push(c)
  }
  let bestKey = null
  let bestCells = []
  byPH.forEach((cells, k) => {
    const eligible = cells.filter((c) => c.machineCount >= 2)
    if (eligible.length > bestCells.length) { bestCells = eligible; bestKey = k }
  })
  if (bestKey) {
    line('product | hour', bestKey.replace('|', '  |  hour '))
    bestCells
      .sort((a, b) => b.theoPerAvailable - a.theoPerAvailable)
      .slice(0, 6)
      .forEach((c) => line(`  bank ${c.bankLabel}`, `${usd(c.theoPerAvailable)}/avail  occ=${(c.occupancy * 100).toFixed(1)}%  (${c.machineCount} m, ${c.presentHours} played hrs)`))
  }

  rule('TIER (value density only - theo / OCCUPIED seat-hour)')
  rollupByTier(base)
    .sort((a, b) => (b.theoPerOccupied || 0) - (a.theoPerOccupied || 0))
    .forEach((c) => line(`  ${c.tier}`, `${usd(c.theoPerOccupied)}/occ  (${num(Math.round(c.occupiedSeatHours))} occ seat-hrs)`))

  const allOk = idn.ok && rec.ok && sane
  rule('RESULT')
  console.log(allOk ? '  ALL CHECKS PASSED' : '  *** CHECKS FAILED ***')
  process.exit(allOk ? 0 : 1)
}

run()
