// Explicit .js so this module resolves under both Vite (app) and plain Node
// (the scripts/verifySeatHourMetrics.mjs harness).
import { parseGameFamily, buildTwoWordFamilyIndex } from '../utils/gameFamilies.js'

/**
 * Shared seat-hour metric layer (Stage 2, load-bearing).
 *
 * Atomic grain: MACHINE x DATE x HOUR (one row of the committed casino data =
 * one machine-hour = one available seat-hour). Everything rolls up from here;
 * nothing aggregates straight to per-product/per-bank so the placement-controlled
 * views downstream can hold hour + position fixed while varying product.
 *
 * Definitions (decided, not reinterpreted):
 *   - Available seat-hour (capacity / denominator): a fixed physical count, NOT
 *     derived from activity. Every machine position x every open hour; DD is 24/7
 *     so open hours = 24. An empty (no-play) machine-hour still counts as 1
 *     available seat-hour with 0 theo and 0 occupancy. The committed data only
 *     stores machine-hours that had play, so capacity is reconstructed from each
 *     machine's tenure (see TENURE_MODES) rather than by counting present rows.
 *   - Occupied seat-hour (value-density denominator): occupied-minutes / 60 per
 *     machine per hour. In the committed data this is already the finished
 *     `occupancy` fraction in [0,1], so occupied-seat-hours = occupancy directly.
 *   - Theo win per AVAILABLE seat-hour = theo_win / available-seat-hours  (RevPAR
 *     analog; the headline; fairly penalises empty positions).
 *   - Theo win per OCCUPIED seat-hour = theo_win / occupied-seat-hours  (value
 *     density; null when occupied-seat-hours = 0, never 0).
 *
 * Decomposition that must hold at every grain (verifyIdentity asserts it):
 *   theo / available  =  occupancy  x  (theo / occupied)
 *
 * Roll-ups aggregate NUMERATORS and DENOMINATORS then divide; they never average
 * per-machine-hour ratios (that would misweight).
 *
 * Scope: DD only. Non-DD rows lack the week/occupancy/theo detail this needs, so
 * every code path here gates on `zone === 'Zone DD'` (callers pass the already
 * zone-merged rows that useCasinoData produces; the verify script merges D/E/F
 * itself before calling).
 */

export const DD_ZONE = 'Zone DD'

// How the available-seat-hour denominator treats a machine's floor tenure.
//   span     - first-seen..last-seen date inclusive x 24 (default). Excludes days
//              before install / after removal; KEEPS dead days within tenure as
//              empty available capacity. Most defensible RevPAR denominator.
//   distinct - only the calendar days a machine actually appears x 24.
//   dense    - every window day for every machine x 24 (positions x 24 x #days).
export const TENURE_MODES = Object.freeze({ SPAN: 'span', DISTINCT: 'distinct', DENSE: 'dense' })

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const isoToWeekday = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

// Inclusive calendar-date enumeration between two ISO dates (UTC, no TZ drift).
const enumerateDates = (minISO, maxISO) => {
  const [y, m, d] = minISO.split('-').map(Number)
  const [Y, M, D] = maxISO.split('-').map(Number)
  const end = Date.UTC(Y, M - 1, D)
  const out = []
  for (let cur = Date.UTC(y, m - 1, d); cur <= end; cur += 86400000) {
    const dt = new Date(cur)
    const iso = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
    out.push(iso)
  }
  return out
}

const bankKeyFor = (machineType, zone, location) =>
  machineType === 'Tables' ? `TABLE_${zone}` : `${zone}_${location}`

const bankLabelFor = (machineType, zone, location) =>
  machineType === 'Tables' ? zone : (location || zone || 'Unknown')

/**
 * Build the atomic machine-hour base + the tenure-derived capacity model.
 *
 * @param {Array}  rows                zone-merged casino rows (DD identified by zone === 'Zone DD')
 * @param {Object} [opts]
 * @param {string} [opts.tenureMode]   one of TENURE_MODES (default 'span')
 * @returns {Object} base { tenureMode, familyIndex, atoms, machines, machineDays, totals, leakage }
 */
export function computeSeatHourBase(rows, { tenureMode = TENURE_MODES.SPAN } = {}) {
  if (!Array.isArray(rows)) rows = []
  const ddRows = rows.filter((r) => r && r.zone === DD_ZONE)

  const familyIndex = buildTwoWordFamilyIndex(
    [...new Set(ddRows.map((r) => r.game_type).filter(Boolean))]
  )

  // Pass 1 - per-machine static attributes, tenure dates, and per-family
  // occupied-seat-hour / theo tallies used to pick the primary product family.
  const machines = new Map()
  for (let i = 0; i < ddRows.length; i++) {
    const r = ddRows[i]
    const id = r.blender_id
    if (id == null || id === '') continue

    let m = machines.get(id)
    if (!m) {
      m = {
        machineId: id,
        zone: r.zone,
        location: r.location,
        machineType: r.machineType,
        bankKey: bankKeyFor(r.machineType, r.zone, r.location),
        bankLabel: bankLabelFor(r.machineType, r.zone, r.location),
        dates: new Set(),
        familyOcc: new Map(),
        familyTheo: new Map(),
        familyTitles: new Set(),
        primaryFamily: null
      }
      machines.set(id, m)
    }
    m.dates.add(r.date)

    const fam = parseGameFamily(r.game_type, familyIndex)
    const occ = r.occupancy != null ? r.occupancy : 0
    m.familyOcc.set(fam, (m.familyOcc.get(fam) || 0) + occ)
    m.familyTheo.set(fam, (m.familyTheo.get(fam) || 0) + (r.theo_win || 0))
    if (r.game_type) m.familyTitles.add(fam)
  }

  // Primary product family per machine: most occupied-seat-hours, tie-break by
  // theo, then name. Its capacity + all its theo attribute wholly to this family
  // so by-product numerator and denominator stay consistent.
  machines.forEach((m) => {
    let best = null
    m.familyOcc.forEach((occ, fam) => {
      const theo = m.familyTheo.get(fam) || 0
      if (
        !best ||
        occ > best.occ ||
        (occ === best.occ && theo > best.theo) ||
        (occ === best.occ && theo === best.theo && fam < best.fam)
      ) {
        best = { fam, occ, theo }
      }
    })
    m.primaryFamily = best ? best.fam : 'Unknown'
  })

  // Pass 2 - atomic machine-hour records (present/played hours only; empty hours
  // live in the capacity model, not here).
  const atoms = new Array(ddRows.length)
  let atomN = 0
  let offPrimaryTheo = 0
  for (let i = 0; i < ddRows.length; i++) {
    const r = ddRows[i]
    const id = r.blender_id
    if (id == null || id === '') continue
    const m = machines.get(id)
    const fam = parseGameFamily(r.game_type, familyIndex)
    const theo = r.theo_win || 0
    if (fam !== m.primaryFamily) offPrimaryTheo += theo

    atoms[atomN++] = {
      machineId: id,
      bankKey: m.bankKey,
      bankLabel: m.bankLabel,
      zone: m.zone,
      location: m.location,
      machineType: m.machineType,
      primaryFamily: m.primaryFamily,
      family: fam,
      date: r.date,
      weekEnding: r.week_ending,
      weekday: r.weekday,
      hour: parseInt(r.hour, 10),
      tier: r.dominant_tier || 'Unknown',
      theo,
      turnover: r.turnover || 0,
      stroke: r.stroke || 0,
      occ: r.occupancy != null ? r.occupancy : 0
    }
  }
  atoms.length = atomN

  // Capacity model: one record per (machine, tenure-date). Each stands for 24
  // available seat-hours (one per hour-of-day), all empty by default.
  const machineDays = []
  machines.forEach((m) => {
    const present = [...m.dates].sort()
    let tenureDates
    if (tenureMode === TENURE_MODES.DISTINCT) {
      tenureDates = present
    } else if (tenureMode === TENURE_MODES.DENSE) {
      tenureDates = null // filled after the global window is known
    } else {
      tenureDates = enumerateDates(present[0], present[present.length - 1])
    }
    m.tenureDates = tenureDates // null placeholder for dense
  })

  if (tenureMode === TENURE_MODES.DENSE) {
    const globalDates = [...new Set(ddRows.map((r) => r.date))].sort()
    machines.forEach((m) => { m.tenureDates = globalDates })
  }

  machines.forEach((m) => {
    m.tenureDayCount = m.tenureDates.length
    for (const date of m.tenureDates) {
      machineDays.push({
        machineId: m.machineId,
        bankKey: m.bankKey,
        zone: m.zone,
        location: m.location,
        machineType: m.machineType,
        primaryFamily: m.primaryFamily,
        date,
        weekday: isoToWeekday(date)
      })
    }
  })

  // Sanity: a generated weekday must match the data's weekday on present rows
  // (catches any TZ / date-math drift before it poisons weekday roll-ups).
  const weekdayCheck = atoms.find((a) => a.weekday && isoToWeekday(a.date) !== a.weekday)
  if (weekdayCheck) {
    throw new Error(
      `weekday mismatch for ${weekdayCheck.date}: data='${weekdayCheck.weekday}' computed='${isoToWeekday(weekdayCheck.date)}'`
    )
  }

  // Atomic DD totals.
  let sumTheo = 0
  let sumOcc = 0
  let sumTurnover = 0
  let sumStroke = 0
  for (let i = 0; i < atoms.length; i++) {
    sumTheo += atoms[i].theo
    sumOcc += atoms[i].occ
    sumTurnover += atoms[i].turnover
    sumStroke += atoms[i].stroke
  }
  const availableSeatHours = machineDays.length * 24

  const dualFamilyMachines = [...machines.values()].filter((m) => m.familyTitles.size > 1).length

  return {
    tenureMode,
    familyIndex,
    atoms,
    machines,
    machineDays,
    totals: {
      machineCount: machines.size,
      dayCount: new Set(ddRows.map((r) => r.date)).size,
      presentHours: atoms.length,
      availableSeatHours,
      occupiedSeatHours: sumOcc,
      theo: sumTheo,
      turnover: sumTurnover,
      stroke: sumStroke,
      blendedTheoPerAvailable: availableSeatHours > 0 ? sumTheo / availableSeatHours : null,
      blendedOccupancy: availableSeatHours > 0 ? sumOcc / availableSeatHours : null,
      blendedTheoPerOccupied: sumOcc > 0 ? sumTheo / sumOcc : null
    },
    leakage: {
      dualFamilyMachines,
      offPrimaryTheo,
      offPrimaryTheoPct: sumTheo > 0 ? (offPrimaryTheo / sumTheo) * 100 : 0
    }
  }
}

// ---- roll-up engine ---------------------------------------------------------
// Every roll-up sums numerators + denominators then divides. Available-seat-hour
// denominators come from the capacity model (machineDays), never from counting
// present atoms.

const aggregateNumerators = (atoms, groupOf, dimsOf) => {
  const map = new Map()
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i]
    const key = groupOf(a)
    let c = map.get(key)
    if (!c) {
      c = { key, dims: dimsOf(a), theo: 0, occ: 0, turnover: 0, stroke: 0, present: 0, machines: new Set() }
      map.set(key, c)
    }
    c.theo += a.theo
    c.occ += a.occ
    c.turnover += a.turnover
    c.stroke += a.stroke
    c.present += 1
    c.machines.add(a.machineId)
  }
  return map
}

const capacityCounts = (machineDays, capGroupOf) => {
  const map = new Map()
  for (let i = 0; i < machineDays.length; i++) {
    const k = capGroupOf(machineDays[i])
    map.set(k, (map.get(k) || 0) + 1)
  }
  return map
}

const finalizeAvailableCell = (c, availableSeatHours) => ({
  ...c.dims,
  theo: c.theo,
  turnover: c.turnover,
  stroke: c.stroke,
  occupiedSeatHours: c.occ,
  availableSeatHours,
  presentHours: c.present,
  machineCount: c.machines.size,
  theoPerAvailable: availableSeatHours > 0 ? c.theo / availableSeatHours : null,
  occupancy: availableSeatHours > 0 ? c.occ / availableSeatHours : null,
  theoPerOccupied: c.occ > 0 ? c.theo / c.occ : null
})

/**
 * Available-seat-hour roll-up.
 * @param perHour  true when the cell fixes a specific hour-of-day (each machine-day
 *                 supplies exactly 1 available seat-hour at that hour, so the
 *                 capacity multiplier is 1 instead of 24).
 */
const availableRollup = (base, { groupOf, dimsOf, capGroupOf, capKeyOfAtom, perHour = false }) => {
  const caps = capacityCounts(base.machineDays, capGroupOf)
  const agg = aggregateNumerators(base.atoms, groupOf, dimsOf)
  const mult = perHour ? 1 : 24
  const out = []
  agg.forEach((c) => {
    const mdCount = caps.get(capKeyOfAtom(c.dims)) || 0
    out.push(finalizeAvailableCell(c, mdCount * mult))
  })
  return out
}

// Occupied-only roll-up (tier): empty capacity has no tier, so there is no
// available denominator here - value density only.
const occupiedRollup = (base, { groupOf, dimsOf }) => {
  const agg = aggregateNumerators(base.atoms, groupOf, dimsOf)
  const out = []
  agg.forEach((c) => {
    out.push({
      ...c.dims,
      theo: c.theo,
      turnover: c.turnover,
      stroke: c.stroke,
      occupiedSeatHours: c.occ,
      presentHours: c.present,
      machineCount: c.machines.size,
      theoPerOccupied: c.occ > 0 ? c.theo / c.occ : null
    })
  })
  return out
}

export const rollupByMachine = (base) => availableRollup(base, {
  groupOf: (a) => a.machineId,
  dimsOf: (a) => ({ machineId: a.machineId, bankKey: a.bankKey, bankLabel: a.bankLabel, zone: a.zone, location: a.location, machineType: a.machineType, primaryFamily: a.primaryFamily }),
  capGroupOf: (md) => md.machineId,
  capKeyOfAtom: (d) => d.machineId
})

export const rollupByBank = (base) => availableRollup(base, {
  groupOf: (a) => a.bankKey,
  dimsOf: (a) => ({ bankKey: a.bankKey, bankLabel: a.bankLabel, zone: a.zone }),
  capGroupOf: (md) => md.bankKey,
  capKeyOfAtom: (d) => d.bankKey
})

export const rollupByProduct = (base) => availableRollup(base, {
  groupOf: (a) => a.primaryFamily,
  dimsOf: (a) => ({ product: a.primaryFamily }),
  capGroupOf: (md) => md.primaryFamily,
  capKeyOfAtom: (d) => d.product
})

export const rollupByHourOfDay = (base) => availableRollup(base, {
  groupOf: (a) => a.hour,
  dimsOf: (a) => ({ hour: a.hour }),
  capGroupOf: () => 'ALL',
  capKeyOfAtom: () => 'ALL',
  perHour: true
})

export const rollupByDate = (base) => availableRollup(base, {
  groupOf: (a) => a.date,
  dimsOf: (a) => ({ date: a.date, weekday: a.weekday, weekEnding: a.weekEnding }),
  capGroupOf: (md) => md.date,
  capKeyOfAtom: (d) => d.date
})

export const rollupByWeekday = (base) => availableRollup(base, {
  groupOf: (a) => a.weekday,
  dimsOf: (a) => ({ weekday: a.weekday }),
  capGroupOf: (md) => md.weekday,
  capKeyOfAtom: (d) => d.weekday
})

// Placement-control combo: product held with hour + bank fixed. Per-hour capacity.
export const rollupByProductHourBank = (base) => availableRollup(base, {
  groupOf: (a) => `${a.primaryFamily}|${a.hour}|${a.bankKey}`,
  dimsOf: (a) => ({ product: a.primaryFamily, hour: a.hour, bankKey: a.bankKey, bankLabel: a.bankLabel }),
  capGroupOf: (md) => `${md.primaryFamily}|${md.bankKey}`,
  capKeyOfAtom: (d) => `${d.product}|${d.bankKey}`,
  perHour: true
})

// Tier -> value density only (occupied denominator).
export const rollupByTier = (base) => occupiedRollup(base, {
  groupOf: (a) => a.tier,
  dimsOf: (a) => ({ tier: a.tier })
})

// ---- verification -----------------------------------------------------------

/**
 * Assert the decomposition identity theo/available = occupancy x theo/occupied
 * at the atomic grain and across roll-up cells. Returns max absolute residual.
 */
export function verifyIdentity(base, { tolerance = 1e-6 } = {}) {
  let maxAtom = 0
  for (let i = 0; i < base.atoms.length; i++) {
    const a = base.atoms[i]
    if (a.occ <= 0) continue // theo/occupied undefined; identity vacuous
    // available = 1 at the atomic grain, so theoPerAvailable = theo.
    const reconstructed = a.occ * (a.theo / a.occ)
    maxAtom = Math.max(maxAtom, Math.abs(a.theo - reconstructed))
  }

  let maxCell = 0
  const cellSources = [rollupByBank(base), rollupByProduct(base), rollupByProductHourBank(base)]
  for (const cells of cellSources) {
    for (const cell of cells) {
      if (cell.theoPerOccupied == null || cell.occupancy == null) continue
      const reconstructed = cell.occupancy * cell.theoPerOccupied
      maxCell = Math.max(maxCell, Math.abs(cell.theoPerAvailable - reconstructed))
    }
  }

  return { maxAtomResidual: maxAtom, maxCellResidual: maxCell, ok: maxAtom < tolerance && maxCell < tolerance }
}

/**
 * Reconciliation: every complete roll-up partition must sum back to the atomic
 * totals (total theo, total occupied- and available-seat-hours) and reproduce the
 * blended theo-per-available-seat-hour. Catches any roll-up that drops or
 * double-counts machine-hours or capacity.
 */
export function reconcile(base, { tolerance = 1e-3 } = {}) {
  const atomicTheo = base.totals.theo
  const atomicOcc = base.totals.occupiedSeatHours
  const atomicAvail = base.totals.availableSeatHours
  const atomicBlended = base.totals.blendedTheoPerAvailable

  const partitions = {
    byBank: rollupByBank(base),
    byProduct: rollupByProduct(base),
    byHourOfDay: rollupByHourOfDay(base)
  }

  const results = {}
  let ok = true
  for (const [name, cells] of Object.entries(partitions)) {
    const sumTheo = cells.reduce((s, c) => s + c.theo, 0)
    const sumOcc = cells.reduce((s, c) => s + c.occupiedSeatHours, 0)
    const sumAvail = cells.reduce((s, c) => s + c.availableSeatHours, 0)
    const blended = sumAvail > 0 ? sumTheo / sumAvail : null
    const theoOk = Math.abs(sumTheo - atomicTheo) < Math.max(tolerance, Math.abs(atomicTheo) * 1e-9)
    const occOk = Math.abs(sumOcc - atomicOcc) < Math.max(tolerance, Math.abs(atomicOcc) * 1e-9)
    const availOk = sumAvail === atomicAvail
    const blendedOk = blended != null && Math.abs(blended - atomicBlended) < 1e-9
    const partitionOk = theoOk && occOk && availOk && blendedOk
    ok = ok && partitionOk
    results[name] = { sumTheo, sumOcc, sumAvail, blended, theoOk, occOk, availOk, blendedOk, partitionOk }
  }

  return { ok, atomicTheo, atomicOcc, atomicAvail, atomicBlended, partitions: results }
}

export default {
  DD_ZONE,
  TENURE_MODES,
  computeSeatHourBase,
  rollupByMachine,
  rollupByBank,
  rollupByProduct,
  rollupByHourOfDay,
  rollupByDate,
  rollupByWeekday,
  rollupByProductHourBank,
  rollupByTier,
  verifyIdentity,
  reconcile
}
