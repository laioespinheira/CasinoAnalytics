import { useMemo } from 'react'
import { TENURE_MODES, computeSeatHourBase } from '../metrics/seatHourMetrics'
import {
  computeValueDensityBase,
  bankHourlyCurve,
  bankTierDecomposition,
  weeklyHeartbeat,
  bankConstrainedTexture
} from '../metrics/valueDensity'

/**
 * React surface for the constrained-hour value-density view (4b, DD). Mechanism
 * evidence only - no dollars, no peer comparison. Pure compute over the already
 * zone-merged casinoData from useCasinoData; touches no existing hook. Consumption
 * surface for the later pitch-UI prompt (no nav/Time wiring in this stage).
 *
 * @param {Array}  casinoData  rows from useCasinoData (D/E/F already merged to Zone DD)
 * @param {Object} [params]    overrides (tenureMode, tierSampleThreshold, ...)
 */
const useValueDensity = (casinoData, params = {}) => {
  const { tenureMode = TENURE_MODES.SPAN } = params

  const base = useMemo(
    () => computeSeatHourBase(casinoData || [], { tenureMode }),
    [casinoData, tenureMode]
  )
  const vd = useMemo(() => computeValueDensityBase(base, params), [base, params])

  // The return object must be identity-stable: App holds it whole and keys
  // expensive memos (heartbeat, constrained summary, Time slices) on it. An
  // unmemoized literal here invalidated all of them on every App render.
  return useMemo(() => ({
    base,
    vd,
    banks: vd.banks,
    weeklyHeartbeat: () => weeklyHeartbeat(vd),
    bankHourlyCurve: (bankKey, opts) => bankHourlyCurve(vd, bankKey, opts),
    bankTierDecomposition: (bankKey, opts) => bankTierDecomposition(vd, bankKey, opts),
    bankConstrainedTexture: (bankKey) => bankConstrainedTexture(vd, bankKey)
  }), [base, vd])
}

export default useValueDensity
