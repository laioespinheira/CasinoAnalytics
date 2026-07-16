// Constrained-hour value-density view (Stage 2, hero feature 4b).
//
// MECHANISM evidence for the dollar bridge - it produces NO dollar figure. It
// shows WHERE/WHEN saturation forms and WHO is in the seats, as raw observed
// facts sliced by bank x (weekday) x hour over the 13 weeks. Comparison basis is
// WITHIN-BANK OVER TIME only: no peer/benchmark comparison, no methodology to
// defend. Consumes the seat-hour metric base (atoms + machineDays); reimplements
// none of its math.
//
// Tier metrics are OCCUPIED-basis only (empty capacity has no tier - same rule as
// the metric layer). Dominant-tier attribution caveat: each machine-hour is
// wholly attributed to its single dominant_tier, so tier shares here are "occupied
// seat-hours by DOMINANT tier", not "play by tier". The per-(machine,hour,tier)
// fractional split lives in customer_tier_data.json and is the full-build
// refinement path; 4b deliberately stays on the raw dominant-tier label.

import { DEFAULT_PARAMS as RANK_DEFAULTS } from './placementRanking.js'

// Monday-first output order.
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Sentinel bankKey: aggregate across every DD bank (Time tab "All banks"). The
// slice functions treat it as "all atoms / all machine-days" - same math, wider
// group - so per-bank results recombine exactly to this aggregate.
export const ALL_BANKS = '__ALL_DD__'
export const ALL_BANKS_LABEL = 'All DD banks'

export const TIER_ATTRIBUTION_CAVEAT =
  'Each machine-hour is wholly attributed to its dominant_tier, so shares are ' +
  '"occupied seat-hours by dominant tier", not "play by tier". Fractional ' +
  'per-tier splits live in customer_tier_data.json (full-build refinement path).'

export const DEFAULT_DENSITY_PARAMS = Object.freeze({
  // Occupied seat-hours below which a tier is flagged as too thin to claim (BLACK
  // is ~10 in the whole window). Surface it, but flag it.
  tierSampleThreshold: 50,
  // A machine-HOUR is "constrained" at/above this occupancy. Reused from the
  // ranking/bridge default (0.80) - the global OCCUPANCY_THRESHOLD (0.85) is
  // untouched.
  machineHourConstraintThreshold: RANK_DEFAULTS.machineHourConstraintThreshold,
  // Per-day peak windows (Fri/Sat 18-23, Sun 13-16), reused so "peak window"
  // means the same thing across features.
  peakWindows: RANK_DEFAULTS.peakWindows
})

const labelFromKey = (bankKey) => {
  const i = bankKey.indexOf('_')
  return i >= 0 ? bankKey.slice(i + 1) : bankKey
}

/**
 * Precompute the per-bank atom groups and the machine-day capacity indices once.
 * @param {Object} base    from computeSeatHourBase
 * @param {Object} [params] overrides merged onto DEFAULT_DENSITY_PARAMS
 */
export function computeValueDensityBase(base, params = {}) {
  const P = { ...DEFAULT_DENSITY_PARAMS, ...params }

  const atomsByBank = new Map()
  const bankLabel = new Map()
  for (let i = 0; i < base.atoms.length; i++) {
    const a = base.atoms[i]
    let arr = atomsByBank.get(a.bankKey)
    if (!arr) { arr = []; atomsByBank.set(a.bankKey, arr) }
    arr.push(a)
    if (!bankLabel.has(a.bankKey)) bankLabel.set(a.bankKey, a.bankLabel || labelFromKey(a.bankKey))
  }

  const mdTotalByBank = new Map()
  const mdByBankWeekday = new Map() // bankKey -> Map(weekday -> count)
  const mdByWeekday = new Map()     // DD-wide weekday -> count
  for (let i = 0; i < base.machineDays.length; i++) {
    const md = base.machineDays[i]
    mdTotalByBank.set(md.bankKey, (mdTotalByBank.get(md.bankKey) || 0) + 1)
    let mw = mdByBankWeekday.get(md.bankKey)
    if (!mw) { mw = new Map(); mdByBankWeekday.set(md.bankKey, mw) }
    mw.set(md.weekday, (mw.get(md.weekday) || 0) + 1)
    mdByWeekday.set(md.weekday, (mdByWeekday.get(md.weekday) || 0) + 1)
    if (!bankLabel.has(md.bankKey)) bankLabel.set(md.bankKey, labelFromKey(md.bankKey))
  }

  const banks = [...mdTotalByBank.keys()]
    .map((bankKey) => ({
      bankKey,
      bankLabel: bankLabel.get(bankKey),
      machineDayCount: mdTotalByBank.get(bankKey),
      availableSeatHours: mdTotalByBank.get(bankKey) * 24
    }))
    .sort((a, b) => a.bankLabel.localeCompare(b.bankLabel))

  return {
    params: P,
    base,
    banks,
    index: { atomsByBank, bankLabel, mdTotalByBank, mdByBankWeekday, mdByWeekday }
  }
}

/**
 * Hour-by-hour curve of occupancy, theo/available and theo/occupied for one bank
 * (optionally one weekday), over the 13 weeks. "Watch the day breathe."
 */
export function bankHourlyCurve(vd, bankKey, { weekday = 'all' } = {}) {
  const isAll = bankKey === ALL_BANKS
  const atoms = isAll ? vd.base.atoms : (vd.index.atomsByBank.get(bankKey) || [])
  const mdTotal = isAll ? vd.base.machineDays.length : (vd.index.mdTotalByBank.get(bankKey) || 0)
  const availPerHour = weekday === 'all'
    ? mdTotal
    : (isAll
        ? (vd.index.mdByWeekday.get(weekday) || 0)
        : (vd.index.mdByBankWeekday.get(bankKey)?.get(weekday) || 0))

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    availableSeatHours: availPerHour,
    occupiedSeatHours: 0,
    theo: 0
  }))

  let totalOccupied = 0
  let totalTheo = 0
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i]
    if (weekday !== 'all' && a.weekday !== weekday) continue
    const H = hours[a.hour]
    H.occupiedSeatHours += a.occ
    H.theo += a.theo
    totalOccupied += a.occ
    totalTheo += a.theo
  }

  let peakHour = null
  let peakOccupancy = -1
  hours.forEach((H) => {
    H.occupancy = H.availableSeatHours > 0 ? H.occupiedSeatHours / H.availableSeatHours : null
    H.theoPerAvailable = H.availableSeatHours > 0 ? H.theo / H.availableSeatHours : null
    H.theoPerOccupied = H.occupiedSeatHours > 0 ? H.theo / H.occupiedSeatHours : null
    if (H.occupancy != null && H.occupancy > peakOccupancy) { peakOccupancy = H.occupancy; peakHour = H.hour }
  })

  return {
    bankKey,
    bankLabel: isAll ? ALL_BANKS_LABEL : (vd.index.bankLabel.get(bankKey) || labelFromKey(bankKey)),
    weekday,
    availableSeatHoursPerHour: availPerHour,
    hours,
    peakHour,
    peakOccupancy: peakOccupancy < 0 ? null : peakOccupancy,
    totalOccupiedSeatHours: totalOccupied,
    totalTheo
  }
}

/**
 * Tier decomposition of OCCUPIED seat-hours for one bank in a window.
 * mode: 'peak' (per-day peak windows), 'all', or 'custom' (weekday + hours).
 */
export function bankTierDecomposition(vd, bankKey, { mode = 'peak', weekday = 'all', hours = 'all' } = {}) {
  const isAll = bankKey === ALL_BANKS
  const atoms = isAll ? vd.base.atoms : (vd.index.atomsByBank.get(bankKey) || [])
  const peakWindows = vd.params.peakWindows
  const wkList = Array.isArray(weekday) ? new Set(weekday) : null

  const inWindow = (a) => {
    if (mode === 'all') return true
    if (mode === 'peak') { const hs = peakWindows[a.weekday]; return hs ? hs.includes(a.hour) : false }
    const wkOk = weekday === 'all' || (wkList ? wkList.has(a.weekday) : a.weekday === weekday)
    const hrOk = hours === 'all' || hours.includes(a.hour)
    return wkOk && hrOk
  }

  const byTier = new Map()
  let totOcc = 0
  let totTheo = 0
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i]
    if (!inWindow(a)) continue
    let t = byTier.get(a.tier)
    if (!t) { t = { tier: a.tier, occupiedSeatHours: 0, theo: 0 }; byTier.set(a.tier, t) }
    t.occupiedSeatHours += a.occ
    t.theo += a.theo
    totOcc += a.occ
    totTheo += a.theo
  }

  const thr = vd.params.tierSampleThreshold
  const tiers = [...byTier.values()]
    .map((t) => ({
      tier: t.tier,
      occupiedSeatHours: t.occupiedSeatHours,
      theo: t.theo,
      shareOfOccupied: totOcc > 0 ? t.occupiedSeatHours / totOcc : null,
      theoPerOccupied: t.occupiedSeatHours > 0 ? t.theo / t.occupiedSeatHours : null,
      belowSampleThreshold: t.occupiedSeatHours < thr
    }))
    .sort((a, b) => b.occupiedSeatHours - a.occupiedSeatHours)

  const windowLabel = mode === 'peak' ? 'per-day peak windows' : mode === 'all' ? 'all hours' : `${weekday} @ ${hours}`

  return {
    bankKey,
    bankLabel: isAll ? ALL_BANKS_LABEL : (vd.index.bankLabel.get(bankKey) || labelFromKey(bankKey)),
    mode,
    windowLabel,
    sampleThreshold: thr,
    attributionCaveat: TIER_ATTRIBUTION_CAVEAT,
    totalOccupiedSeatHours: totOcc,
    totalTheo: totTheo,
    bankTheoPerOccupied: totOcc > 0 ? totTheo / totOcc : null,
    tiers
  }
}

/**
 * DD-wide weekly heartbeat: peak hour + occupancy per day-of-week, plus the
 * single busiest (weekday, hour). Surfaces the Sunday day-shift as a finding.
 */
export function weeklyHeartbeat(vd) {
  const occByKey = new Map() // `${weekday}|${hour}` -> summed occupancy
  for (let i = 0; i < vd.base.atoms.length; i++) {
    const a = vd.base.atoms[i]
    const k = `${a.weekday}|${a.hour}`
    occByKey.set(k, (occByKey.get(k) || 0) + a.occ)
  }

  const days = WEEKDAYS.map((weekday) => {
    const md = vd.index.mdByWeekday.get(weekday) || 0
    const hours = Array.from({ length: 24 }, (_, hour) => {
      const occSum = occByKey.get(`${weekday}|${hour}`) || 0
      return { hour, occupiedSeatHours: occSum, availableSeatHours: md, occupancy: md > 0 ? occSum / md : null }
    })
    let peak = hours[0]
    for (const H of hours) if ((H.occupancy || 0) > (peak.occupancy || 0)) peak = H
    return { weekday, peakHour: peak.hour, peakOccupancy: peak.occupancy, hours }
  })

  let busiest = null
  for (const d of days) {
    if (!busiest || (d.peakOccupancy || 0) > (busiest.occupancy || 0)) {
      busiest = { weekday: d.weekday, hour: d.peakHour, occupancy: d.peakOccupancy }
    }
  }

  return { days, busiest }
}

/**
 * Constrained-hour texture for one bank: count/share of machine-hours at/above
 * the 0.80 threshold, by weekday and hour. Justifies the bridge's 85%-capture
 * split by showing where the constrained seat-hours actually sit.
 */
export function bankConstrainedTexture(vd, bankKey) {
  const atoms = vd.index.atomsByBank.get(bankKey) || []
  const thr = vd.params.machineHourConstraintThreshold
  const mdTotal = vd.index.mdTotalByBank.get(bankKey) || 0
  const availableSeatHours = mdTotal * 24

  let constrained = 0
  const byWeekday = new Map()
  const byHour = new Map()
  const byWH = new Map()
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i]
    if (a.occ < thr) continue
    constrained += 1
    byWeekday.set(a.weekday, (byWeekday.get(a.weekday) || 0) + 1)
    byHour.set(a.hour, (byHour.get(a.hour) || 0) + 1)
    const k = `${a.weekday}|${a.hour}`
    byWH.set(k, (byWH.get(k) || 0) + 1)
  }

  return {
    bankKey,
    bankLabel: vd.index.bankLabel.get(bankKey) || labelFromKey(bankKey),
    threshold: thr,
    availableSeatHours,
    playedHours: atoms.length,
    constrainedHours: constrained,
    constrainedShareOfPlayed: atoms.length > 0 ? constrained / atoms.length : 0,
    constrainedShareOfAvailable: availableSeatHours > 0 ? constrained / availableSeatHours : 0,
    byWeekday: WEEKDAYS.map((weekday) => ({ weekday, constrainedHours: byWeekday.get(weekday) || 0 })),
    byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, constrainedHours: byHour.get(hour) || 0 })),
    topCells: [...byWH.entries()]
      .map(([k, v]) => { const [weekday, hour] = k.split('|'); return { weekday, hour: Number(hour), constrainedHours: v } })
      .sort((a, b) => b.constrainedHours - a.constrainedHours)
      .slice(0, 10)
  }
}

export default {
  DEFAULT_DENSITY_PARAMS,
  TIER_ATTRIBUTION_CAVEAT,
  ALL_BANKS,
  ALL_BANKS_LABEL,
  computeValueDensityBase,
  bankHourlyCurve,
  bankTierDecomposition,
  weeklyHeartbeat,
  bankConstrainedTexture
}
