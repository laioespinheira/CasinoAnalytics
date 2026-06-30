import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { parseGameFamily, buildTwoWordFamilyIndex } from '../utils/gameFamilies'
import { OCCUPANCY_THRESHOLD } from './useCasinoData'

// A bank whose mean occupancy clears this is considered demand-saturated for the
// "capacity constraint" story. Reuses the floor's occupancy knee (0.85).
const SATURATION_THRESHOLD = OCCUPANCY_THRESHOLD
// A tier needs at least this share of a saturated bank to count as its driver.
const TIER_DOMINANCE_SHARE = 0.4
// High-value tiers sitting below this look under-served despite product supply.
const UNDERUTILISED_THRESHOLD = 0.4
const PREMIUM_TIERS = new Set(['PLATINUM', 'BLACK'])

const bankKeyFor = (meta) =>
  meta.machineType === 'Tables' ? `TABLE_${meta.zone}` : `${meta.zone}_${meta.location}`

const bankLabelFor = (meta) =>
  meta.machineType === 'Tables' ? meta.zone : (meta.location || meta.zone || 'Unknown')

/**
 * Lazily loads the aggregated, anonymised customer-tier SHARE table and exposes
 * getCustomerDemandInsights(filters, selectedTier). The lens allocates the floor's
 * actual (week-specific) filtered revenue/occupancy across tiers using stable
 * per-machine shares, so totals reconcile exactly with the floor. Tier data is
 * DD-only.
 *
 * @param {Array}    casinoData      rows from useCasinoData (blender_id -> bank/zone)
 * @param {Function} getFilteredData useCasinoData.getFilteredData
 * @param {boolean}  enabled         when true, triggers the (one-time) lazy fetch
 */
const useCustomerTierData = (casinoData, getFilteredData, enabled) => {
  const [tierData, setTierData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestedRef = useRef(false)

  useEffect(() => {
    if (!enabled || requestedRef.current) return
    requestedRef.current = true
    setLoading(true)

    fetch('/assets/customer_tier_data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Customer tier data not found')
        return res.json()
      })
      .then((json) => setTierData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [enabled])

  // blender_id -> { zone, location, machineType, bankKey, label }
  const machineMeta = useMemo(() => {
    const map = new Map()
    if (!casinoData) return map
    casinoData.forEach((row) => {
      if (!row.blender_id || map.has(row.blender_id)) return
      const meta = {
        zone: row.zone,
        location: row.location,
        machineType: row.machineType
      }
      meta.bankKey = bankKeyFor(meta)
      meta.label = bankLabelFor(meta)
      map.set(row.blender_id, meta)
    })
    return map
  }, [casinoData])

  const familyIndex = useMemo(() => {
    if (!casinoData) return []
    const types = [...new Set(casinoData.map((r) => r.game_type).filter(Boolean))]
    return buildTwoWordFamilyIndex(types)
  }, [casinoData])

  // `${blender_id}|${weekday}|${hour}|${tier}` -> { st, ss, so } share fractions.
  const shareIndex = useMemo(() => {
    const map = new Map()
    const s = tierData?.byShare
    if (!s) return map
    const n = s.blender_id.length
    for (let i = 0; i < n; i++) {
      const key = `${s.blender_id[i]}|${s.weekday[i]}|${s.hour[i]}|${s.Tier[i]}`
      map.set(key, {
        st: s.share_turnover[i] || 0,
        ss: s.share_stroke[i] || 0,
        so: s.share_occ[i] || 0
      })
    }
    return map
  }, [tierData])

  const getAvailableTiers = useCallback(
    () => (tierData?.tiers ? [...tierData.tiers] : []),
    [tierData]
  )

  const getCustomerDemandInsights = useCallback(
    (filters = {}, selectedTier = 'all') => {
      if (error) return { error }
      if (loading || !tierData || !tierData.byShare) return { loading: true }

      const tierFilter = selectedTier && selectedTier !== 'all' ? selectedTier : null

      const floorRows = getFilteredData({ ...filters, occupancy: 'all' })
        .filter((r) => r.date != null)

      if (floorRows.length === 0) {
        return { empty: true, noMatch: true, tier: selectedTier }
      }

      // Snapshot accumulators (tier-allocated).
      let turnover = 0
      let stroke = 0
      let occSum = 0
      let occN = 0
      const machines = new Set()

      // Floor-wide (all tiers) for avg-bet baseline.
      let floorTurnoverAll = 0
      let floorStrokeAll = 0

      const banks = new Map()
      const families = new Map()
      const zones = new Map()
      const tierMachineIds = new Set()

      for (let i = 0; i < floorRows.length; i++) {
        const row = floorRows[i]
        const id = row.blender_id
        const meta = machineMeta.get(id)
        if (!meta) continue

        const hour = parseInt(row.hour, 10)
        const T = row.turnover || 0
        const S = row.stroke || 0
        const O = row.occupancy != null ? row.occupancy : null

        floorTurnoverAll += T
        floorStrokeAll += S

        let st = 1
        let ss = 1
        let so = 1
        if (tierFilter) {
          const share = shareIndex.get(`${id}|${row.weekday}|${hour}|${tierFilter}`)
          st = share ? share.st : 0
          ss = share ? share.ss : 0
          so = share ? share.so : 0
        }

        const allocT = T * st
        const allocS = S * ss
        const allocO = O != null ? O * so : 0
        const tierPresent = !tierFilter || st > 0 || so > 0

        turnover += allocT
        stroke += allocS
        if (O != null) {
          occSum += allocO
          occN += 1
        }
        if (tierPresent) {
          machines.add(id)
          if (tierFilter) tierMachineIds.add(id)
        }

        // Per-bank rollup (tier-allocated metrics + overall floor occupancy).
        let bank = banks.get(meta.bankKey)
        if (!bank) {
          bank = {
            key: meta.bankKey,
            label: meta.label,
            zone: meta.zone,
            tierTurnover: 0,
            tierStroke: 0,
            tierOccSum: 0,
            floorTurnover: 0,
            floorOccSum: 0,
            occN: 0,
            machines: new Set()
          }
          banks.set(meta.bankKey, bank)
        }
        bank.tierTurnover += allocT
        bank.tierStroke += allocS
        bank.floorTurnover += T
        if (O != null) {
          bank.tierOccSum += allocO
          bank.floorOccSum += O
          bank.occN += 1
        }
        if (tierPresent) bank.machines.add(id)

        // Per-product (game family) rollup.
        const fam = parseGameFamily(row.game_type, familyIndex)
        let family = families.get(fam)
        if (!family) {
          family = { name: fam, turnover: 0, stroke: 0, machines: new Set() }
          families.set(fam, family)
        }
        family.turnover += allocT
        family.stroke += allocS
        if (tierPresent && allocT > 0) family.machines.add(id)

        // Per-zone rollup.
        let zone = zones.get(meta.zone)
        if (!zone) {
          zone = { zone: meta.zone, turnover: 0, occSum: 0, occN: 0, machines: new Set() }
          zones.set(meta.zone, zone)
        }
        zone.turnover += allocT
        if (O != null) {
          zone.occSum += allocO
          zone.occN += 1
        }
        if (tierPresent) zone.machines.add(id)
      }

      if (machines.size === 0) {
        return { empty: true, noMatch: true, tier: selectedTier }
      }

      const floorAvgBet = floorStrokeAll > 0 ? floorTurnoverAll / floorStrokeAll : 0

      const bankList = [...banks.values()].map((b) => {
        const utilisation = b.occN > 0 ? b.tierOccSum / b.occN : 0
        const bankOccupancy = b.occN > 0 ? b.floorOccSum / b.occN : 0
        const avgBet = b.tierStroke > 0 ? b.tierTurnover / b.tierStroke : 0
        const tierShareOfBank = b.floorTurnover > 0 ? b.tierTurnover / b.floorTurnover : 0

        let flag = 'neutral'
        if (bankOccupancy >= SATURATION_THRESHOLD) {
          if (!tierFilter || tierShareOfBank >= TIER_DOMINANCE_SHARE) {
            if (tierFilter && avgBet < floorAvgBet * 0.9) flag = 'fully_occupied_low_avg_bet'
            else if (tierFilter) flag = 'product_supply_constraint'
            else flag = 'tier_demand_hotspot'
          }
        } else if (tierFilter && PREMIUM_TIERS.has(tierFilter) && bankOccupancy < UNDERUTILISED_THRESHOLD && b.tierTurnover > 0) {
          flag = 'premium_underutilised'
        }

        return {
          key: b.key,
          label: b.label,
          zone: b.zone,
          turnover: b.tierTurnover,
          utilisation,
          bankOccupancy,
          tierShareOfBank,
          avgBet,
          machineCount: b.machines.size,
          machineIds: [...b.machines],
          flag
        }
      })

      const hotspots = [...bankList].sort((a, b) => b.turnover - a.turnover).slice(0, 6)
      const constraints = bankList
        .filter((b) => b.bankOccupancy >= SATURATION_THRESHOLD && (!tierFilter || b.tierShareOfBank >= TIER_DOMINANCE_SHARE))
        .sort((a, b) => b.bankOccupancy - a.bankOccupancy)
        .slice(0, 6)

      const totalProductTurnover = [...families.values()].reduce((s, f) => s + f.turnover, 0)
      const products = [...families.values()]
        .map((f) => ({
          name: f.name,
          turnover: f.turnover,
          avgBet: f.stroke > 0 ? f.turnover / f.stroke : 0,
          pct: totalProductTurnover > 0 ? (f.turnover / totalProductTurnover) * 100 : 0,
          machineCount: f.machines.size,
          machineIds: [...f.machines]
        }))
        .sort((a, b) => b.turnover - a.turnover)
        .slice(0, 6)

      const topZones = [...zones.values()]
        .map((z) => ({
          zone: z.zone,
          turnover: z.turnover,
          utilisation: z.occN > 0 ? z.occSum / z.occN : 0,
          machineCount: z.machines.size
        }))
        .sort((a, b) => b.turnover - a.turnover)

      return {
        tier: selectedTier,
        snapshot: {
          turnover,
          avgBet: stroke > 0 ? turnover / stroke : 0,
          utilisation: occN > 0 ? occSum / occN : 0,
          machineCount: machines.size,
          turnoverPerOccupiedHour: occSum > 0 ? turnover / occSum : 0
        },
        floorAvgBet,
        hotspots,
        constraints,
        products,
        topZones,
        tierMachineIds: [...tierMachineIds],
        saturationThreshold: SATURATION_THRESHOLD
      }
    },
    [tierData, loading, error, machineMeta, familyIndex, shareIndex, getFilteredData]
  )

  return { getCustomerDemandInsights, getAvailableTiers, loading, error, ready: !!tierData }
}

export default useCustomerTierData
