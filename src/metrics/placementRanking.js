// Placement-adjusted product yield ranking (Stage 2, hero feature 4a).
//
// Consumes the shared seat-hour metric base (see seatHourMetrics.js) and flags
// banks that are (a) CONSTRAINED at peak and (b) UNDER-CONFIGURED versus
// comparable positions, naming the better product. It does NOT reimplement any
// seat-hour math - it reads base.atoms / base.machineDays / rollupByMachine.
//
// Placement control = benchmark like-for-like LOCATION, not floor-wide. The
// committed data has no coordinates / area / adjacency, only a bank id, so
// physical "area" is not directly derivable. The closest defensible proxy for
// position desirability is a bank's PEAK-WINDOW occupancy: a busy spot draws high
// peak occupancy, a dead corner low. Banks are grouped into desirability bands by
// that figure (x machineType), and a flagged bank is benchmarked only against
// other same-band / same-type positions - so the residual yield gap reads as
// "wrong PRODUCT for this spot", not "wrong spot".
//
// Caveats (surfaced, not buried): peak occupancy is partly product-driven, so
// banding on it partially absorbs product effect -> the gap is conservative for
// product, which is fine for a don't-overclaim pitch. n is small (29 DD banks),
// so benchmarks are directional; each p75 carries its backing machine count.

import { rollupByMachine } from './seatHourMetrics.js'

// Per-day peak windows. Derived from the DD hour curve: Fri/Sat peak in the
// evening (21:00 ~50%), Sunday day-shifts to a midday peak (14:00 ~69%, the
// busiest hour of any day). Sunday's saturated core is 13:00-16:00.
export const DEFAULT_PEAK_WINDOWS = Object.freeze({
  Friday: [18, 19, 20, 21, 22, 23],
  Saturday: [18, 19, 20, 21, 22, 23],
  Sunday: [13, 14, 15, 16]
})

export const DEFAULT_PARAMS = Object.freeze({
  // Bank is "constrained" when its peak-window occupancy clears this. Applied to
  // the PEAK window (24/7 bank averages top out ~0.51 in DD and never reach 0.72;
  // saturation is inherently a peak phenomenon).
  bankConstraintThreshold: 0.72,
  peakWindows: DEFAULT_PEAK_WINDOWS,
  // Achievable-comparable benchmark = this percentile of comparable positions
  // running the better product (upper-middle, NOT the single best).
  comparableBenchmarkPercentile: 0.75,
  // Desirability bands (equal-count tiles of peak occupancy) for the peer groups.
  comparableBands: 3,
  // A product needs at least this many machines in a peer group to be an
  // eligible benchmark (guards thin-sample p75).
  minComparablePositions: 4,
  // A machine-HOUR is "constrained" at/above this occupancy. Bridge's own knob;
  // deliberately distinct from the global OCCUPANCY_THRESHOLD (0.85), untouched.
  machineHourConstraintThreshold: 0.80,
  // Minimum machine count for a product to appear in the same-product-across-banks
  // variance evidence.
  varianceMinMachines: 6
})

const percentile = (sortedAsc, p) => {
  const n = sortedAsc.length
  if (n === 0) return null
  if (n === 1) return sortedAsc[0]
  const idx = (n - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sortedAsc[lo]
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo)
}

const inPeak = (peakWindows, weekday, hour) => {
  const hours = peakWindows[weekday]
  return hours ? hours.includes(hour) : false
}

/**
 * @param {Object} base    from computeSeatHourBase
 * @param {Object} [params] overrides merged onto DEFAULT_PARAMS
 * @returns full ranking incl. per-bank rows, the flagged subset, and evidence.
 */
export function computePlacementRanking(base, params = {}) {
  const P = { ...DEFAULT_PARAMS, ...params }
  const peakWindows = params.peakWindows || DEFAULT_PARAMS.peakWindows

  // --- bank capacity + peak occupancy (from the tenure capacity model) --------
  const bankAvail = new Map()        // bankKey -> available seat-hours
  const bankFamAvail = new Map()     // `bank|fam` -> available seat-hours
  const bankPeakOcc = new Map()      // bankKey -> { num, den }
  const bankMeta = new Map()         // bankKey -> { bankKey, bankLabel, zone, machineType }
  const bankTypeVotes = new Map()    // bankKey -> Map(machineType -> machine-days)

  for (let i = 0; i < base.machineDays.length; i++) {
    const md = base.machineDays[i]
    bankAvail.set(md.bankKey, (bankAvail.get(md.bankKey) || 0) + 24)
    const fk = `${md.bankKey}|${md.primaryFamily}`
    bankFamAvail.set(fk, (bankFamAvail.get(fk) || 0) + 24)

    let votes = bankTypeVotes.get(md.bankKey)
    if (!votes) { votes = new Map(); bankTypeVotes.set(md.bankKey, votes) }
    votes.set(md.machineType, (votes.get(md.machineType) || 0) + 1)

    if (!bankPeakOcc.has(md.bankKey)) bankPeakOcc.set(md.bankKey, { num: 0, den: 0 })
    const hrs = peakWindows[md.weekday]
    if (hrs) bankPeakOcc.get(md.bankKey).den += hrs.length
  }

  // --- bank x family numerators (theo / occupied / constrained seat-hours) -----
  const bankFamTheo = new Map()
  const bankFamOcc = new Map()
  const bankFamConstrained = new Map() // played machine-hours with occ >= threshold
  const bankFamMachines = new Map()    // `bank|fam` -> Set(machineId)

  for (let i = 0; i < base.atoms.length; i++) {
    const a = base.atoms[i]
    const fk = `${a.bankKey}|${a.primaryFamily}`
    bankFamTheo.set(fk, (bankFamTheo.get(fk) || 0) + a.theo)
    bankFamOcc.set(fk, (bankFamOcc.get(fk) || 0) + a.occ)
    if (a.occ >= P.machineHourConstraintThreshold) {
      bankFamConstrained.set(fk, (bankFamConstrained.get(fk) || 0) + 1)
    }
    let ms = bankFamMachines.get(fk)
    if (!ms) { ms = new Set(); bankFamMachines.set(fk, ms) }
    ms.add(a.machineId)

    // Peak-window occupancy numerator.
    if (inPeak(peakWindows, a.weekday, a.hour)) bankPeakOcc.get(a.bankKey).num += a.occ
  }

  base.machines.forEach((m) => {
    if (!bankMeta.has(m.bankKey)) {
      bankMeta.set(m.bankKey, { bankKey: m.bankKey, bankLabel: m.bankLabel, zone: m.zone, machineType: m.machineType })
    }
  })
  // Bank machineType = plurality by machine-days.
  bankTypeVotes.forEach((votes, bankKey) => {
    let best = null
    votes.forEach((v, t) => { if (!best || v > best.v) best = { t, v } })
    if (best && bankMeta.has(bankKey)) bankMeta.get(bankKey).machineType = best.t
  })

  // --- machine-level yields (for the achievable-comparable p75 benchmark) ------
  const machineRows = rollupByMachine(base) // { machineId, bankKey, primaryFamily, theoPerAvailable, ... }
  const machineById = new Map(machineRows.map((r) => [r.machineId, r]))

  // --- desirability bands (equal-count tiles of peak occupancy) ----------------
  const bankList = [...bankAvail.keys()].map((bankKey) => {
    const po = bankPeakOcc.get(bankKey)
    const peakOcc = po && po.den > 0 ? po.num / po.den : 0
    return { bankKey, peakOcc }
  })
  bankList.sort((a, b) => a.peakOcc - b.peakOcc)
  const nBands = Math.max(1, P.comparableBands)
  const bandOfBank = new Map()
  const bandInfo = Array.from({ length: nBands }, (_, i) => ({ index: i, minPeakOcc: Infinity, maxPeakOcc: -Infinity, bankCount: 0 }))
  bankList.forEach((b, rank) => {
    const band = Math.min(nBands - 1, Math.floor((rank * nBands) / bankList.length))
    bandOfBank.set(b.bankKey, band)
    const bi = bandInfo[band]
    bi.minPeakOcc = Math.min(bi.minPeakOcc, b.peakOcc)
    bi.maxPeakOcc = Math.max(bi.maxPeakOcc, b.peakOcc)
    bi.bankCount += 1
  })

  const peerGroupOf = (bankKey) => `${bankMeta.get(bankKey).machineType}|band${bandOfBank.get(bankKey)}`

  // --- achievable-comparable yield: p75 of machine yields per (peerGroup, product)
  const groupProductYields = new Map() // `${group}||${product}` -> number[]
  machineRows.forEach((mr) => {
    if (mr.theoPerAvailable == null) return
    const group = peerGroupOf(mr.bankKey)
    const k = `${group}||${mr.primaryFamily}`
    if (!groupProductYields.has(k)) groupProductYields.set(k, [])
    groupProductYields.get(k).push(mr.theoPerAvailable)
  })
  const achievableComparable = (group, product) => {
    const arr = groupProductYields.get(`${group}||${product}`)
    if (!arr || arr.length < P.minComparablePositions) return null
    const sorted = arr.slice().sort((a, b) => a - b)
    return { yield: percentile(sorted, P.comparableBenchmarkPercentile), n: sorted.length }
  }

  // --- per-bank ranking rows ---------------------------------------------------
  const banks = []
  bankMeta.forEach((meta, bankKey) => {
    const avail = bankAvail.get(bankKey) || 0
    const po = bankPeakOcc.get(bankKey)
    const peakOcc = po && po.den > 0 ? po.num / po.den : 0
    const band = bandOfBank.get(bankKey)
    const group = peerGroupOf(bankKey)

    // Dominant (current) product = plurality of the bank's available seat-hours.
    let currentProduct = null
    let currentAvail = 0
    for (const [fk, v] of bankFamAvail) {
      if (!fk.startsWith(`${bankKey}|`)) continue
      if (v > currentAvail) { currentAvail = v; currentProduct = fk.slice(bankKey.length + 1) }
    }
    const curKey = `${bankKey}|${currentProduct}`
    const curTheo = bankFamTheo.get(curKey) || 0
    const currentYield = currentAvail > 0 ? curTheo / currentAvail : 0
    const currentProductShare = avail > 0 ? currentAvail / avail : 0

    // Best comparable alternative product in the peer group.
    let betterProduct = null
    let betterYield = -Infinity
    let betterN = 0
    const productsHere = new Set()
    for (const fk of bankFamAvail.keys()) {
      if (fk.startsWith(`${bankKey}|`)) productsHere.add(fk.slice(bankKey.length + 1))
    }
    // Candidates = every product proven in the peer group (not just those already
    // in this bank), excluding the current product.
    const candidateProducts = new Set()
    for (const k of groupProductYields.keys()) {
      const [g, prod] = k.split('||')
      if (g === group && prod !== currentProduct) candidateProducts.add(prod)
    }
    candidateProducts.forEach((prod) => {
      const ac = achievableComparable(group, prod)
      if (ac && ac.yield > betterYield) { betterYield = ac.yield; betterProduct = prod; betterN = ac.n }
    })

    const hasBetter = betterProduct != null && betterYield > currentYield
    const gap = hasBetter ? betterYield - currentYield : null
    // 0.72 stays STRICT and is reported as-is. A saturated bank that is ALSO
    // under-configured would be the classic "wrong product in a full spot" - the
    // strongest possible flag. In DD there are none: every saturated bank already
    // runs the best product (a validation result, not a null result). So the
    // opportunity/bridge cohort is the NEAR-SATURATED / EMERGING set: top
    // desirability band, under-configured, not yet saturated. The bank-level gate
    // is top-band membership (position quality); demand realism is then priced at
    // machine-hour grain by the 0.80 capture split, where near-saturated banks
    // correctly land most seat-hours in the 10% (unproven-demand) bucket.
    const saturated = peakOcc >= P.bankConstraintThreshold
    const topBand = band === (nBands - 1)
    const emerging = topBand && !saturated
    const flagged = topBand && hasBetter

    const affectedAvailableSeatHours = currentAvail
    const constrainedSeatHours = bankFamConstrained.get(curKey) || 0
    const unconstrainedSeatHours = affectedAvailableSeatHours - constrainedSeatHours

    banks.push({
      bankKey,
      bankLabel: meta.bankLabel,
      zone: meta.zone,
      machineType: meta.machineType,
      band,
      peerGroup: group,
      peakOcc,
      availableSeatHours: avail,
      currentProduct,
      currentProductShare,
      currentYield,
      betterProduct: hasBetter ? betterProduct : null,
      achievableComparableYield: hasBetter ? betterYield : null,
      benchmarkN: hasBetter ? betterN : null,
      gap,
      saturated,
      topBand,
      emerging,
      underConfigured: hasBetter,
      flagged,
      affectedAvailableSeatHours,
      constrainedSeatHours,
      unconstrainedSeatHours
    })
  })

  const flagged = banks
    .filter((b) => b.flagged)
    .sort((a, b) => (b.gap * b.affectedAvailableSeatHours) - (a.gap * a.affectedAvailableSeatHours))

  // Validation headline: are any already-saturated banks mis-configured? In DD the
  // answer is no - the busy positions already run the best product.
  const saturatedBanks = banks.filter((b) => b.saturated)
  const validation = {
    saturatedCount: saturatedBanks.length,
    saturatedUnderConfiguredCount: saturatedBanks.filter((b) => b.underConfigured).length,
    saturatedBanks,
    message: saturatedBanks.filter((b) => b.underConfigured).length === 0
      ? 'All saturated banks already run their best comparable product (placement of busy positions is already optimal).'
      : 'Some saturated banks are under-configured (wrong product in a full spot).'
  }

  // --- supporting evidence: same product, different banks, different yield -----
  const productBankYields = new Map() // product -> [{ bankLabel, theoPerAvailable, machineCount }]
  {
    const acc = new Map() // `${product}|${bank}` -> { theo, avail, machines:Set, bankLabel }
    for (let i = 0; i < base.atoms.length; i++) {
      const a = base.atoms[i]
      const k = `${a.primaryFamily}|${a.bankKey}`
      let c = acc.get(k)
      if (!c) { c = { product: a.primaryFamily, bankLabel: a.bankLabel, theo: 0, machines: new Set() }; acc.set(k, c) }
      c.theo += a.theo
      c.machines.add(a.machineId)
    }
    for (const [fk, availV] of bankFamAvail) {
      const idx = fk.indexOf('|')
      const bank = fk.slice(0, idx)
      const fam = fk.slice(idx + 1)
      const c = acc.get(`${fam}|${bank}`)
      if (c) c.avail = availV
    }
    acc.forEach((c) => {
      if (!c.avail) return
      if (!productBankYields.has(c.product)) productBankYields.set(c.product, [])
      productBankYields.get(c.product).push({
        bankLabel: c.bankLabel,
        theoPerAvailable: c.theo / c.avail,
        machineCount: c.machines.size
      })
    })
  }

  const productVariance = [...productBankYields.entries()]
    .map(([product, arr]) => {
      const totalMachines = arr.reduce((s, x) => s + x.machineCount, 0)
      const ys = arr.map((x) => x.theoPerAvailable).sort((a, b) => a - b)
      return {
        product,
        bankCount: arr.length,
        machineCount: totalMachines,
        min: ys[0],
        p25: percentile(ys, 0.25),
        median: percentile(ys, 0.5),
        p75: percentile(ys, 0.75),
        max: ys[ys.length - 1],
        spread: ys[ys.length - 1] - ys[0]
      }
    })
    .filter((v) => v.machineCount >= P.varianceMinMachines && v.bankCount >= 2)
    .sort((a, b) => b.spread - a.spread)

  return {
    params: P,
    peakWindows,
    bands: bandInfo,
    banks: banks.sort((a, b) => b.peakOcc - a.peakOcc),
    flagged,
    validation,
    productVariance
  }
}

export default { DEFAULT_PARAMS, DEFAULT_PEAK_WINDOWS, computePlacementRanking }
