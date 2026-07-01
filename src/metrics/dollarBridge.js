// Dollar bridge (Stage 2, hero feature 4c) — the glass-box valuation that turns
// the placement ranking into a defensible, traceable dollar figure. Every input
// is visible and traces to Crown's own data; conservatism is explicit so the CFO
// reads the number as understated, not risky.
//
// Consumes computePlacementRanking (which consumes the seat-hour metric). Changes
// no upstream math. Three components, kept visually separate, never blended:
//
//   base_b     = gap_b x affected_b               (undiscounted theo uplift, 13wk, bank b)
//   affected_b = available seat-hours of the bank's current product config
//   split_b    : constrained_b  = played machine-hours with occ >= machineHour-
//                                  ConstraintThreshold (0.80); real demand present.
//                unconstrained_b = affected_b - constrained_b (empty + light hours).
//
//   C1  Reallocation prize (HEADLINE hard number, segmented capture):
//         C1 = SUM_b gap_b x (constrained_b*captureConstrained + unconstrained_b*captureUnconstrained)
//   C2  Product-swap prize (DIRECTIONAL, shown beside C1, never summed in):
//         C2 = SUM_b base_b x captureProductSwap
//   C3  Conservative floor (flat, the "even if pessimistic" anchor):
//         C3 = SUM_b base_b x captureFlatFloor
//   Upside  Full-floor extrapolation of C1 (UPSIDE, never in the headline):
//         upside = C1 x (total DD available seat-hours / SUM_b affected_b)
//
// All shown for the 13-week window and annualised x (52/13).

import { computePlacementRanking, DEFAULT_PARAMS as RANK_DEFAULTS } from './placementRanking.js'

const WEEKS_IN_WINDOW = 13
const ANNUALISE = 52 / WEEKS_IN_WINDOW

export const DEFAULT_BRIDGE_PARAMS = Object.freeze({
  ...RANK_DEFAULTS,
  captureConstrained: 0.85,   // constrained machine-hours: proven demand
  captureUnconstrained: 0.10, // unconstrained: unproven demand, priced low
  captureProductSwap: 0.25,   // directional product-swap capture (C2)
  captureFlatFloor: 0.20      // flat conservative floor (C3)
})

/**
 * @param {Object} base    from computeSeatHourBase
 * @param {Object} [params] overrides merged onto DEFAULT_BRIDGE_PARAMS (shared
 *                          with the ranking so peak windows / thresholds line up)
 * @returns the bridge: per-bank lines, the three components, the flat floor, the
 *          full-floor upside, and a reconciliation block.
 */
export function computeDollarBridge(base, params = {}) {
  const P = { ...DEFAULT_BRIDGE_PARAMS, ...params }
  const ranking = computePlacementRanking(base, P)

  const perBank = ranking.flagged.map((b) => {
    const affected = b.affectedAvailableSeatHours
    const constrained = b.constrainedSeatHours
    const unconstrained = b.unconstrainedSeatHours
    const gap = b.gap
    const baseUplift = gap * affected

    const capturedConstrained = gap * constrained * P.captureConstrained
    const capturedUnconstrained = gap * unconstrained * P.captureUnconstrained
    const c1 = capturedConstrained + capturedUnconstrained

    return {
      bankLabel: b.bankLabel,
      currentProduct: b.currentProduct,
      betterProduct: b.betterProduct,
      peakOcc: b.peakOcc,
      gap,
      affected,
      constrained,
      unconstrained,
      baseUplift,
      capturedConstrained,
      capturedUnconstrained,
      c1,
      c2: baseUplift * P.captureProductSwap,
      c3: baseUplift * P.captureFlatFloor
    }
  })

  const sum = (f) => perBank.reduce((s, x) => s + f(x), 0)

  const totalAffected = sum((x) => x.affected)
  const totalConstrained = sum((x) => x.constrained)
  const totalUnconstrained = sum((x) => x.unconstrained)
  const totalBaseUplift = sum((x) => x.baseUplift)

  const c1 = sum((x) => x.c1)
  const c2 = sum((x) => x.c2)
  const c3 = sum((x) => x.c3)
  const capturedConstrained = sum((x) => x.capturedConstrained)
  const capturedUnconstrained = sum((x) => x.capturedUnconstrained)

  // Full-floor extrapolation: scale C1 by (all DD available seat-hours / flagged
  // affected seat-hours). Deliberately crude; UPSIDE only.
  const floorAvailable = base.totals.availableSeatHours
  const extrapolationMultiplier = totalAffected > 0 ? floorAvailable / totalAffected : 0
  const upside = c1 * extrapolationMultiplier

  const annual = (x) => x * ANNUALISE

  // --- reconciliation: captured dollars must tie to the grain they're applied at,
  // and the constrained/unconstrained split must not drop or double-count.
  const splitTiesToAffected = Math.abs((totalConstrained + totalUnconstrained) - totalAffected) < 1e-6
  const c1Recomputed = perBank.reduce(
    (s, x) => s + x.gap * (x.constrained * P.captureConstrained + x.unconstrained * P.captureUnconstrained), 0
  )
  const c1TiesToGrain = Math.abs(c1Recomputed - c1) < 1e-6
  const c1EqualsBuckets = Math.abs((capturedConstrained + capturedUnconstrained) - c1) < 1e-6
  const c2TiesToBase = Math.abs(c2 - totalBaseUplift * P.captureProductSwap) < 1e-6
  const c3TiesToBase = Math.abs(c3 - totalBaseUplift * P.captureFlatFloor) < 1e-6

  // --- sanity: DD is one zone standing in for a much larger floor, so the per-zone
  // hard number is judged against a per-zone pilot hurdle, not a whole-property
  // figure. Only flag components that are implausible (exceed DD's own theo, or
  // round to ~0 / negative).
  const ddTheo = base.totals.theo
  const flags = []
  if (!(c1 > 0)) flags.push('C1 is not positive')
  if (c1 > ddTheo) flags.push('C1 exceeds total DD theo (likely a seat-hour-scope bug)')
  if (c2 > ddTheo) flags.push('C2 exceeds total DD theo')
  if (annual(c1) > ddTheo * ANNUALISE) flags.push('annualised C1 exceeds annualised DD theo')

  return {
    params: P,
    ranking,
    perBank,
    components: {
      c1: { window: c1, annual: annual(c1), label: 'Reallocation prize (headline, segmented capture)' },
      c2: { window: c2, annual: annual(c2), label: 'Product-swap prize (directional, 25% capture)' },
      c3: { window: c3, annual: annual(c3), label: 'Conservative floor (flat 20% capture)' }
    },
    upside: {
      window: upside,
      annual: annual(upside),
      extrapolationMultiplier,
      floorAvailableSeatHours: floorAvailable,
      flaggedAffectedSeatHours: totalAffected,
      label: 'Full-floor extrapolation of C1 (UPSIDE — not in the headline)'
    },
    totals: {
      flaggedBanks: perBank.length,
      totalAffected,
      totalConstrained,
      totalUnconstrained,
      totalBaseUplift,
      capturedConstrained,
      capturedUnconstrained,
      constrainedShareOfC1: c1 > 0 ? capturedConstrained / c1 : 0,
      unconstrainedShareOfC1: c1 > 0 ? capturedUnconstrained / c1 : 0,
      ddTheo,
      ddTheoAnnual: ddTheo * ANNUALISE
    },
    reconciliation: {
      splitTiesToAffected,
      c1TiesToGrain,
      c1EqualsBuckets,
      c2TiesToBase,
      c3TiesToBase,
      ok: splitTiesToAffected && c1TiesToGrain && c1EqualsBuckets && c2TiesToBase && c3TiesToBase
    },
    sanity: {
      ok: flags.length === 0,
      flags,
      note: 'Judged as a per-zone pilot hurdle: DD is one zone standing in for a larger floor; tens-of-thousands is a strong per-zone result and the upside line scales it.'
    }
  }
}

export default { DEFAULT_BRIDGE_PARAMS, computeDollarBridge }
