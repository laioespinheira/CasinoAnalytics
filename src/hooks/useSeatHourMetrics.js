import { useMemo } from 'react'
import {
  TENURE_MODES,
  computeSeatHourBase,
  rollupByMachine,
  rollupByBank,
  rollupByProduct,
  rollupByHourOfDay,
  rollupByDate,
  rollupByWeekday,
  rollupByProductHourBank,
  rollupByTier
} from '../metrics/seatHourMetrics'

/**
 * React surface for the shared seat-hour metric (theo per available/occupied
 * seat-hour, DD-only). Pure compute over the already zone-merged casinoData from
 * useCasinoData - it reads that array, it does not touch or refactor the existing
 * hooks' aggregations. Downstream Stage-2 features (product yield ranking, dollar
 * bridge, constrained-hour value-density view) consume the roll-ups from here.
 *
 * @param {Array}  casinoData   rows from useCasinoData (zone D/E/F already merged to 'Zone DD')
 * @param {Object} [opts]
 * @param {string} [opts.tenureMode]  TENURE_MODES value (default 'span')
 */
const useSeatHourMetrics = (casinoData, { tenureMode = TENURE_MODES.SPAN } = {}) => {
  const base = useMemo(
    () => computeSeatHourBase(casinoData || [], { tenureMode }),
    [casinoData, tenureMode]
  )

  const rollups = useMemo(() => ({
    byMachine: () => rollupByMachine(base),
    byBank: () => rollupByBank(base),
    byProduct: () => rollupByProduct(base),
    byHourOfDay: () => rollupByHourOfDay(base),
    byDate: () => rollupByDate(base),
    byWeekday: () => rollupByWeekday(base),
    byProductHourBank: () => rollupByProductHourBank(base),
    byTier: () => rollupByTier(base)
  }), [base])

  return {
    base,
    totals: base.totals,
    leakage: base.leakage,
    ...rollups
  }
}

export default useSeatHourMetrics
