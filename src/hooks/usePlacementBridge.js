import { useMemo } from 'react'
import { TENURE_MODES, computeSeatHourBase } from '../metrics/seatHourMetrics'
import { computePlacementRanking } from '../metrics/placementRanking'
import { computeDollarBridge } from '../metrics/dollarBridge'

/**
 * React surface for the placement ranking + dollar bridge (DD, Stage 2 heroes).
 * Pure compute over the already zone-merged casinoData from useCasinoData; it does
 * not touch the existing hooks. Consumption surface for the later pitch-UI prompt
 * (this stage ships compute + Node-verified readouts, no nav wiring yet).
 *
 * @param {Array}  casinoData  rows from useCasinoData (D/E/F already merged to Zone DD)
 * @param {Object} [params]    overrides (tenureMode, thresholds, capture rates, ...)
 */
const usePlacementBridge = (casinoData, params = {}) => {
  const { tenureMode = TENURE_MODES.SPAN } = params

  const base = useMemo(
    () => computeSeatHourBase(casinoData || [], { tenureMode }),
    [casinoData, tenureMode]
  )

  const ranking = useMemo(() => computePlacementRanking(base, params), [base, params])
  const bridge = useMemo(() => computeDollarBridge(base, params), [base, params])

  return { base, ranking, bridge }
}

export default usePlacementBridge
