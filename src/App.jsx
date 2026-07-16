import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import CasinoScene from './components/CasinoScene'
import GUI from './components/GUI'
import NavigationBar from './components/NavigationBar'
import MachineTooltip from './components/MachineTooltip'
import MachineDetailCard from './components/MachineDetailCard'
import BankHoverTooltip from './components/BankHoverTooltip'
import InsightPanel from './components/InsightPanel'
import CustomerDemandPanel from './components/CustomerDemandPanel'
import useCasinoData from './hooks/useCasinoData'
import useCustomerTierData from './hooks/useCustomerTierData'
import usePlacementBridge from './hooks/usePlacementBridge'
import useValueDensity from './hooks/useValueDensity'
import YieldPanel from './components/YieldPanel'
import YieldBankTooltip from './components/YieldBankTooltip'
import TimeDepthPanel from './components/TimeDepthPanel'
import { computeSeatHourBase } from './metrics/seatHourMetrics'
import { computePlacementRanking } from './metrics/placementRanking'
import { computeValueDensityBase, weeklyHeartbeat, ALL_BANKS } from './metrics/valueDensity'
import { DEMO_MODE } from './config'

// Stable empty-params ref so the Yield hooks' useMemos hold across renders
// (passing an inline {} would recompute the ranking/bridge every render).
const YIELD_PARAMS = {}

// Two-tone floor highlight on the Yield tab: opportunity vs validation.
const YIELD_FLAGGED_COLOR = '#f59e0b'   // amber - the 6 under-configured banks
const YIELD_VALIDATED_COLOR = '#10b981' // green - the 3 saturated, already-optimal banks

// Time-tab floor highlight for the panel's selected bank (blue = the app accent /
// the panel's occupancy series; distinct from Yield's amber/green semantics).
const TIME_BANK_COLOR = '#3b82f6'

// Yield-tab descriptive window presets (weeks). The bridge stays pinned to the
// full verified basis; only the ranking / flagged table / heartbeat re-aggregate.
const YIELD_WINDOWS = DEMO_MODE ? [13, 8] : [13, 8, 4]
// Demo headline capture rate for constrained (effectively-full) hours.
const DEMO_CAPTURE_CONSTRAINED = 0.75
// "First bite" scenario scope (presentation only - reuses the per-bank bridge
// math, changes no methodology parameter).
const FIRST_BITE_BANKS = 3
const FIRST_BITE_MACHINES_PER_BANK = 3
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const isoAddDays = (iso, delta) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + delta))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}
const isoToShort = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function App() {
  const [currentView, setCurrentView] = useState('3d') // Only the 3D floor remains; Analytics tab retired
  const [viewMode, setViewMode] = useState('overall') // 3D view mode: overall, yield, time, heatmap

  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [ambientIntensity, setAmbientIntensity] = useState(0.51)
  const [directionalIntensity, setDirectionalIntensity] = useState(2.5)
  const [tableColor, setTableColor] = useState('#dedede')
  const [etgColor, setEtgColor] = useState('#dedede')
  const [specialObjectsColor, setSpecialObjectsColor] = useState('#ffffff')
  const [heatMapEnabled, setHeatMapEnabled] = useState(false)
  const [showBankLabels, setShowBankLabels] = useState(false)
  const [labelMode, setLabelMode] = useState('name')
  const [labelsOutliersOnly, setLabelsOutliersOnly] = useState(false)
  const [showInsightPanel, setShowInsightPanel] = useState(false)
  const [showCustomerDemandPanel, setShowCustomerDemandPanel] = useState(false)
  const [selectedTier, setSelectedTier] = useState('all')
  const [highlightTarget, setHighlightTarget] = useState(null)
  const [filters, setFilters] = useState({
    zone: 'all',
    machineType: [], // Array for multiple selection
    gameType: 'all',
    occupancy: 'vacant',
    dayOfWeek: 'all',
    hourOfDay: 'all',
    weekEnding: 'all'
  })

  // Interaction states
  const [pinnedMachine, setPinnedMachine] = useState(null)
  const [pinnedMachinePosition, setPinnedMachinePosition] = useState(null)
  const [detailModalMachine, setDetailModalMachine] = useState(null)
  const [hoveredBank, setHoveredBank] = useState(null)
  const [bankTooltipPosition, setBankTooltipPosition] = useState(null)

  // Yield tab: which flagged bank row is focused (drives floor focus)
  const [selectedBankKey, setSelectedBankKey] = useState(null)
  // Time tab: the depth panel's own controls (bank / weekday / week-ending). They
  // drive the panel's aggregation, the floor bank-highlight, and the slice heat -
  // fully separate from the global filter strip and the Yield focus state.
  const [timeBankKey, setTimeBankKey] = useState(ALL_BANKS)
  const [timeWeekday, setTimeWeekday] = useState('all')
  const [timeWeek, setTimeWeek] = useState('all')
  // Yield tab: descriptive data window (13/8/4 wk). Drives the ranking + table +
  // heartbeat only; the dollar bridge stays pinned to the full verified basis.
  const [yieldWindow, setYieldWindow] = useState(13)

  // Load casino data
  const {
    casinoData,
    loading,
    error,
    getFilteredData,
    getHeatMapData,
    getDailyHeatMapData,
    getBankRankings,
    getZoneOccupancy,
    getPerformanceInsights,
    getMachineMetrics,
    getUniqueLocations,
    getMachinesByLocation
  } = useCasinoData()

  // Bank rankings, enriched with theo-per-machine so the floor labels + hover can
  // show Theo/Machine. Theo is aggregated read-only from getFilteredData; the
  // useCasinoData module is not modified.
  const bankRankings = useMemo(() => {
    const base = getBankRankings(filters)
    const rows = getFilteredData({ ...filters, occupancy: 'all' }).filter((r) => r.date != null)
    const theoAgg = new Map()
    rows.forEach((r) => {
      const key = r.machineType === 'Tables' ? `TABLE_${r.zone}` : `${r.zone}_${r.location}`
      let e = theoAgg.get(key)
      if (!e) { e = { theo: 0, machines: new Set() }; theoAgg.set(key, e) }
      e.theo += (r.theo_win || 0)
      if (r.blender_id) e.machines.add(r.blender_id)
    })
    const out = new Map()
    base.forEach((entry, key) => {
      const t = theoAgg.get(key)
      out.set(key, { ...entry, avgTheo: t && t.machines.size ? t.theo / t.machines.size : 0 })
    })
    return out
  }, [getBankRankings, getFilteredData, filters])

  const performanceInsights = useMemo(
    () => getPerformanceInsights(filters.zone === 'all' ? 'All' : filters.zone, filters),
    [getPerformanceInsights, filters]
  )

  // Customer Demand lens: lazily loads tier data once its drawer panel is opened
  // OR the Time tab (which also surfaces the Customer Demand readout) is active.
  const timeViewActive = currentView === '3d' && viewMode === 'time'
  const {
    getCustomerDemandInsights,
    getAvailableTiers,
    loading: tierLoading,
    ready: tierReady
  } = useCustomerTierData(casinoData, getFilteredData, showCustomerDemandPanel || timeViewActive)

  const customerDemandInsights = useMemo(
    () => getCustomerDemandInsights(filters, selectedTier),
    [getCustomerDemandInsights, filters, selectedTier]
  )

  const tierOptions = useMemo(() => getAvailableTiers(), [getAvailableTiers])

  // Stage-2 analysis layers for the Yield tab (DD placement ranking + dollar
  // bridge + value-density mechanism evidence). Pure compute over casinoData; these
  // consume the verified modules and touch none of the existing hooks.
  const { base: seatHourBase, ranking, bridge } = usePlacementBridge(casinoData, YIELD_PARAMS)
  const valueDensity = useValueDensity(casinoData, YIELD_PARAMS)

  // --- Yield descriptive window (13/8/4 wk) ------------------------------------
  // Anchored to the most recent DD date; an N-week window is the last N*7 days.
  // 13 wk == all committed data == the pinned bridge basis. Only the ranking /
  // flagged table / heartbeat re-aggregate; the bridge stays pinned.
  const yieldMaxDate = useMemo(() => {
    let mx = null
    for (const r of casinoData) if (r.zone === 'Zone DD' && r.date && (mx === null || r.date > mx)) mx = r.date
    return mx
  }, [casinoData])

  // Keyed cache: each visited window (13/8/...) is computed once per dataset and
  // then looked up, so switching back to an already-seen window is instant instead
  // of a full base+ranking+heartbeat recompute. Values are byte-identical to the
  // previous per-switch recompute - only the caching changed.
  const yieldWindowCacheRef = useRef({ data: null, map: new Map() })
  const windowed = useMemo(() => {
    const cache = yieldWindowCacheRef.current
    if (cache.data !== casinoData) { cache.data = casinoData; cache.map.clear() }
    if (cache.map.has(yieldWindow)) return cache.map.get(yieldWindow)
    let entry
    if (yieldWindow === 13 || !yieldMaxDate) {
      entry = { base: seatHourBase, ranking, heartbeat: valueDensity.weeklyHeartbeat() }
    } else {
      const cutoff = isoAddDays(yieldMaxDate, -(yieldWindow * 7 - 1))
      const base = computeSeatHourBase(
        casinoData.filter((r) => r.date && r.date >= cutoff),
        { tenureMode: 'span' }
      )
      entry = {
        base,
        ranking: computePlacementRanking(base),
        heartbeat: weeklyHeartbeat(computeValueDensityBase(base))
      }
    }
    cache.map.set(yieldWindow, entry)
    return entry
  }, [casinoData, yieldWindow, yieldMaxDate, seatHourBase, ranking, valueDensity])

  const windowedBase = windowed.base
  const windowedRanking = windowed.ranking
  const heartbeat = windowed.heartbeat
  // Full committed DD span (the pinned bridge basis). Day-count annualization
  // (×365/days) so the partial final week doesn't skew the run-rate.
  const yieldFullSpan = useMemo(() => {
    let minD = null
    let maxD = null
    for (const r of casinoData) if (r.zone === 'Zone DD' && r.date) {
      if (minD === null || r.date < minD) minD = r.date
      if (maxD === null || r.date > maxD) maxD = r.date
    }
    const days = minD && maxD ? Math.round((Date.parse(maxD) - Date.parse(minD)) / 86400000) + 1 : 91
    return { minD, maxD, days, weeks: Math.round(days / 7), annualFactor: 365 / days }
  }, [casinoData])

  const windowInfo = useMemo(() => {
    const cutoff = yieldMaxDate ? isoAddDays(yieldMaxDate, -(yieldWindow * 7 - 1)) : null
    return {
      weeks: yieldWindow,
      options: YIELD_WINDOWS,
      startLabel: isoToShort(cutoff),
      endLabel: isoToShort(yieldMaxDate),
      spanLabel: `${yieldWindow} weeks to ${isoToShort(yieldMaxDate)}`,
      basisLabel: `${yieldFullSpan.weeks} weeks to ${isoToShort(yieldFullSpan.maxD)}`,
      peakOccNote: "peak occ = a bank's mean machine occupancy during the peak windows (Fri/Sat 18–23, Sun 13–16) over the selected period — not a single hour."
    }
  }, [yieldWindow, yieldMaxDate, yieldFullSpan])

  // Per-DD-bank info (windowed): machine count + product mix + peak occ, plus the
  // flagged recommendation. Feeds the table, the validation rows, and the hover.
  const bankInfoByKey = useMemo(() => {
    const mixByBank = new Map()
    windowedBase?.machines?.forEach((m) => {
      let g = mixByBank.get(m.bankKey)
      if (!g) { g = new Map(); mixByBank.set(m.bankKey, g) }
      g.set(m.primaryFamily, (g.get(m.primaryFamily) || 0) + 1)
    })
    const info = new Map()
    ;(windowedRanking?.banks || []).forEach((b) => {
      const g = mixByBank.get(b.bankKey) || new Map()
      const parts = [...g.entries()].sort((x, y) => y[1] - x[1]).map(([family, count]) => ({ family, count }))
      info.set(b.bankKey, { bankKey: b.bankKey, bankLabel: b.bankLabel, peakOcc: b.peakOcc, total: parts.reduce((s, p) => s + p.count, 0), parts, grandStar: g.get('GRAND STAR') || 0, flagged: false })
    })
    ;(windowedRanking?.flagged || []).forEach((b) => {
      const e = info.get(b.bankKey)
      if (e) {
        e.flagged = true
        e.currentProduct = b.currentProduct
        e.betterProduct = b.betterProduct
        e.gap = b.gap
        e.currentYield = b.currentYield
        e.achievableComparableYield = b.achievableComparableYield
        e.benchmarkN = b.benchmarkN
        e.affectedAvailableSeatHours = b.affectedAvailableSeatHours
      }
    })
    return info
  }, [windowedBase, windowedRanking])

  // Demo headline: constrained (effectively-full) hours only, at 75% capture,
  // day-count annualized. Pinned to the full verified basis.
  const demoHeadline = useMemo(() => {
    if (!DEMO_MODE || !bridge?.perBank?.length) return null
    const windowUsd = bridge.perBank.reduce((s, pb) => s + pb.gap * pb.constrained * DEMO_CAPTURE_CONSTRAINED, 0)
    return { annual: windowUsd * yieldFullSpan.annualFactor, capture: DEMO_CAPTURE_CONSTRAINED }
  }, [bridge, yieldFullSpan])

  // "First bite": top-N flagged banks, a few machines each of the current product.
  // Ranked and valued on the active headline basis (demo: constrained-only @75%,
  // day-annualized; full: segmented C1, ×52/13). Reuses the per-bank bridge math.
  const firstBite = useMemo(() => {
    if (!bridge?.perBank?.length || !ranking?.flagged?.length) return null
    const byLabel = new Map(ranking.flagged.map((b) => [b.bankLabel, b]))
    const curProdByKey = new Map(ranking.flagged.map((b) => [b.bankKey, b.currentProduct]))
    const curCountByKey = new Map()
    seatHourBase.machines.forEach((m) => {
      if (curProdByKey.get(m.bankKey) === m.primaryFamily) curCountByKey.set(m.bankKey, (curCountByKey.get(m.bankKey) || 0) + 1)
    })
    const windowUsd = (pb) => (DEMO_MODE ? pb.gap * pb.constrained * DEMO_CAPTURE_CONSTRAINED : pb.c1)
    const factor = DEMO_MODE
      ? yieldFullSpan.annualFactor
      : (bridge.components.c1.window > 0 ? bridge.components.c1.annual / bridge.components.c1.window : 4)
    const ranked = bridge.perBank
      .map((pb) => ({ ...pb, _usd: windowUsd(pb), bankKey: byLabel.get(pb.bankLabel)?.bankKey }))
      .sort((a, b) => b._usd - a._usd)
      .slice(0, FIRST_BITE_BANKS)
    let windowSum = 0
    const banks = ranked.map((pb) => {
      const cur = curCountByKey.get(pb.bankKey) || 0
      const take = Math.min(FIRST_BITE_MACHINES_PER_BANK, cur)
      const w = cur > 0 ? pb._usd * (take / cur) : 0
      windowSum += w
      return { bankLabel: pb.bankLabel, currentProduct: pb.currentProduct, betterProduct: pb.betterProduct, curCount: cur, take, annual: w * factor }
    })
    return { annual: windowSum * factor, banks, nBanks: FIRST_BITE_BANKS, machinesPerBank: FIRST_BITE_MACHINES_PER_BANK }
  }, [bridge, ranking, seatHourBase, yieldFullSpan])

  // Where the >=0.80 (85%-capture) seat-hours physically sit across the flagged
  // banks - computed from the same atoms the metric verified, for the Sunday 13-16
  // corroboration line. Pinned to the verified basis (corroborates the bridge).
  const constrainedSummary = useMemo(() => {
    const flaggedKeys = new Set((ranking?.flagged || []).map((b) => b.bankKey))
    if (flaggedKeys.size === 0) return null
    const threshold = bridge?.params?.machineHourConstraintThreshold ?? 0.8
    const sundayHours = new Set([13, 14, 15, 16])
    const byCell = new Map()
    let total = 0
    let sundayWindow = 0
    for (const a of valueDensity.base.atoms) {
      if (!flaggedKeys.has(a.bankKey) || a.occ < threshold) continue
      total += 1
      if (a.weekday === 'Sunday' && sundayHours.has(a.hour)) sundayWindow += 1
      const k = `${a.weekday}|${a.hour}`
      byCell.set(k, (byCell.get(k) || 0) + 1)
    }
    const topCells = [...byCell.entries()]
      .map(([k, v]) => { const [weekday, hour] = k.split('|'); return { weekday, hour: Number(hour), constrainedHours: v } })
      .sort((a, b) => b.constrainedHours - a.constrainedHours)
      .slice(0, 6)
    const sundayWindowShare = total > 0 ? sundayWindow / total : 0
    // Uniform baseline for a 4-hour window: 4 / (7*24) of the week. Over-index =
    // how many times denser the Sunday 13-16 block is than a flat spread.
    const overIndex = sundayWindowShare / (4 / 168)
    return { threshold, totalConstrained: total, sundayWindowConstrained: sundayWindow, sundayWindowShare, overIndex, topCells }
  }, [ranking, bridge, valueDensity])

  // --- Time tab: panel data + floor linking ------------------------------------
  // Week-ending options from the committed DD rows (non-DD rows have no week_ending).
  const timeWeekEndings = useMemo(() => {
    const set = new Set()
    for (const r of casinoData) if (r.zone === 'Zone DD' && r.week_ending) set.add(r.week_ending)
    return [...set].sort().reverse()
  }, [casinoData])

  // Week slice for the Time panel - same re-aggregation approach as the Yield
  // window selector: filter the committed rows, rebuild the seat-hour base and the
  // value-density index over them. 'all' reuses the full verified basis untouched.
  // Keyed cache like the Yield windows: each visited week is built once per
  // dataset, so flipping between weeks is a lookup, not a rebuild.
  const timeWeekCacheRef = useRef({ data: null, map: new Map() })
  const timeVd = useMemo(() => {
    if (timeWeek === 'all') return valueDensity.vd
    const cache = timeWeekCacheRef.current
    if (cache.data !== casinoData) { cache.data = casinoData; cache.map.clear() }
    if (cache.map.has(timeWeek)) return cache.map.get(timeWeek)
    const rows = casinoData.filter((r) => r.week_ending === timeWeek)
    const sliced = computeValueDensityBase(computeSeatHourBase(rows, { tenureMode: 'span' }))
    cache.map.set(timeWeek, sliced)
    return sliced
  }, [timeWeek, casinoData, valueDensity])

  // bankKey -> [machineId] from the FULL basis (bank membership is stable; the
  // highlight should not flicker with the week slice).
  const timeBankMachineIds = useMemo(() => {
    const m = new Map()
    valueDensity.base.machines.forEach((mac, id) => {
      if (!m.has(mac.bankKey)) m.set(mac.bankKey, [])
      m.get(mac.bankKey).push(id)
    })
    return m
  }, [valueDensity])

  // Time-tab floor highlight: the panel's selected bank lights up, the rest dims.
  // Same gated highlightColorMap mechanism as the Yield row-focus, keyed to
  // viewMode === 'time' with its own state; "All banks" means no highlight.
  const timeHighlight = useMemo(() => {
    if (!(currentView === '3d' && viewMode === 'time') || timeBankKey === ALL_BANKS) {
      return { ids: null, colors: null }
    }
    const ids = new Set(timeBankMachineIds.get(timeBankKey) || [])
    const colors = new Map()
    ids.forEach((id) => colors.set(id, TIME_BANK_COLOR))
    return { ids: ids.size ? ids : null, colors }
  }, [currentView, viewMode, timeBankKey, timeBankMachineIds])

  // Time-tab slice heat: when a week and/or weekday is selected, the floor becomes
  // a heatmap of that slice - per-machine MEAN theo per played machine-hour over
  // the selected period, computed from the same verified atoms the panel uses.
  // Percentile bounds are recomputed downstream on exactly these values. Null when
  // nothing is selected (and on every other tab), so Hourly's own heat path -
  // heatMapEnabled with no override - is never affected.
  const timeHeatValues = useMemo(() => {
    if (!(currentView === '3d' && viewMode === 'time')) return null
    if (timeWeek === 'all' && timeWeekday === 'all') return null
    const sums = new Map()
    const counts = new Map()
    for (const a of valueDensity.base.atoms) {
      if (timeWeek !== 'all' && a.weekEnding !== timeWeek) continue
      if (timeWeekday !== 'all' && a.weekday !== timeWeekday) continue
      sums.set(a.machineId, (sums.get(a.machineId) || 0) + a.theo)
      counts.set(a.machineId, (counts.get(a.machineId) || 0) + 1)
    }
    const means = new Map()
    counts.forEach((n, id) => means.set(id, n > 0 ? sums.get(id) / n : 0))
    return means
  }, [currentView, viewMode, timeWeek, timeWeekday, valueDensity])

  // bankKey -> [machineId] (blender_ids), resolved from the windowed base so the
  // Yield floor highlight matches the (windowed) flagged table.
  const bankMachineIds = useMemo(() => {
    const m = new Map()
    windowedBase?.machines?.forEach((mac, id) => {
      if (!m.has(mac.bankKey)) m.set(mac.bankKey, [])
      m.get(mac.bankKey).push(id)
    })
    return m
  }, [windowedBase])

  // Yield-tab floor highlight: flagged banks (amber) vs validated saturated banks
  // (green). Selecting a table row focuses that bank and dims the rest.
  const yieldHighlight = useMemo(() => {
    if (!(currentView === '3d' && viewMode === 'yield')) return { ids: null, colors: null }
    const flaggedKeys = (windowedRanking?.flagged || []).map((b) => b.bankKey)
    const validatedKeys = (windowedRanking?.validation?.saturatedBanks || []).map((b) => b.bankKey)
    const ids = new Set()
    const colors = new Map()
    const add = (bankKey, color) => {
      (bankMachineIds.get(bankKey) || []).forEach((id) => { ids.add(id); colors.set(id, color) })
    }
    if (selectedBankKey) {
      const isValidated = validatedKeys.includes(selectedBankKey)
      add(selectedBankKey, isValidated ? YIELD_VALIDATED_COLOR : YIELD_FLAGGED_COLOR)
    } else {
      validatedKeys.forEach((k) => add(k, YIELD_VALIDATED_COLOR))
      flaggedKeys.forEach((k) => add(k, YIELD_FLAGGED_COLOR))
    }
    return { ids: ids.size ? ids : null, colors }
  }, [currentView, viewMode, windowedRanking, bankMachineIds, selectedBankKey])

  // Floor highlight is available in the drawer modes (heatmap heat-on / time
  // heat-off) and, driven by the flagged banks, the Yield tab. Keyed off viewMode.
  const highlightedMachineIds = useMemo(() => {
    if (viewMode === 'yield') return yieldHighlight.ids
    if (viewMode === 'time' && timeHighlight.ids) return timeHighlight.ids
    if (!highlightTarget?.machineIds?.length || (viewMode !== 'heatmap' && viewMode !== 'time')) {
      return null
    }
    return new Set(highlightTarget.machineIds)
  }, [highlightTarget, viewMode, yieldHighlight, timeHighlight])

  // Handlers passed into the memoized children (NavigationBar, CasinoScene, ...)
  // are useCallback'd so a hover-driven App render doesn't change their identity
  // and force those children to re-render.
  const handleFilterChange = useCallback((newFilters) => {
    // Merge so App-only fields (e.g. weekEnding, which NavigationBar does not emit)
    // survive updates coming from the nav bar.
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const handleBankHover = useCallback((bankData, position) => {
    setHoveredBank(bankData)
    setBankTooltipPosition(position)
  }, [])

  // Attach the summed theo win for the machine under the current filters (read-only
  // from getFilteredData; the metrics module is not modified).
  const withTheoWin = useCallback((metrics, blenderId) => {
    if (!metrics || metrics.noData) return metrics
    const rows = getFilteredData({ ...filters, occupancy: 'all' })
      .filter((r) => r.date != null && r.blender_id === blenderId)
    return { ...metrics, theoWin: rows.reduce((s, r) => s + (r.theo_win || 0), 0) }
  }, [getFilteredData, filters])

  const handleMachineClick = useCallback((machineData, position) => {
    if (!machineData) {
      setPinnedMachine(null)
      setPinnedMachinePosition(null)
      setDetailModalMachine(null)
      return
    }

    // Second click on the same machine -> open the detailed modal (clear pin so the small card does not stay on screen)
    if (pinnedMachine && pinnedMachine.blender_id === machineData.blender_id) {
      setDetailModalMachine(withTheoWin(getMachineMetrics(machineData.blender_id, filters) || machineData, machineData.blender_id))
      setPinnedMachine(null)
      setPinnedMachinePosition(null)
      return
    }

    // New machine clicked -> pin its tooltip at the click position
    setPinnedMachine(getMachineMetrics(machineData.blender_id, filters) || machineData)
    setPinnedMachinePosition(position)
    setDetailModalMachine(null)
  }, [pinnedMachine, getMachineMetrics, filters, withTheoWin])

  const handleDetailModalClose = useCallback(() => {
    setDetailModalMachine(null)
    setPinnedMachine(null)
    setPinnedMachinePosition(null)
  }, [])

  const handleToggleInsightPanel = useCallback(() => {
    setShowInsightPanel((prev) => {
      const next = !prev
      if (next) setShowCustomerDemandPanel(false) // right-drawer panels are mutually exclusive
      return next
    })
  }, [])

  const handleToggleCustomerDemandPanel = useCallback(() => {
    setShowCustomerDemandPanel((prev) => {
      const next = !prev
      if (next) setShowInsightPanel(false)
      return next
    })
  }, [])

  // Auto-enable heatmap and set defaults when switching to heatmap mode
  useEffect(() => {
    if (currentView === '3d' && viewMode === 'heatmap') {
      setHeatMapEnabled(true)
      // Set default hour to 6AM, day to Saturday, and all week-endings when entering heatmap mode
      setFilters(prev => ({ ...prev, hourOfDay: 6, dayOfWeek: 'Saturday', weekEnding: 'all' }))
    } else if (currentView === '3d' && viewMode !== 'heatmap') {
      setHeatMapEnabled(false)
      setShowInsightPanel(false)
      setShowCustomerDemandPanel(false)
      setHighlightTarget(null)
    }
    if (viewMode !== 'yield') setSelectedBankKey(null)
    // Round-trip rule (as on Yield): leaving Time clears its bank highlight.
    if (viewMode !== 'time') setTimeBankKey(ALL_BANKS)
  }, [currentView, viewMode])

  // Changing the Yield data window changes the flagged set - drop any stale focus.
  useEffect(() => { setSelectedBankKey(null) }, [yieldWindow])

  useEffect(() => {
    // The Customer Demand panel re-scopes its own tier highlight on filter change
    // (see effect below), so don't clear it here.
    if (showCustomerDemandPanel) return
    setHighlightTarget(null)
  }, [
    filters.zone,
    filters.dayOfWeek,
    filters.hourOfDay,
    filters.gameType,
    filters.machineType,
    showCustomerDemandPanel
  ])

  useEffect(() => {
    if (!showInsightPanel && !showCustomerDemandPanel) setHighlightTarget(null)
  }, [showInsightPanel, showCustomerDemandPanel])

  // Selecting a customer tier highlights the machines serving that tier under the
  // current filters; re-scopes when the tier or the active filters change.
  useEffect(() => {
    if (!showCustomerDemandPanel) return
    if (selectedTier === 'all') {
      setHighlightTarget(null)
      return
    }
    const ids = customerDemandInsights?.tierMachineIds
    if (ids && ids.length) {
      const label = selectedTier.charAt(0) + selectedTier.slice(1).toLowerCase()
      setHighlightTarget({
        type: 'tier_select',
        key: `tier:${selectedTier}`,
        label: `${label} guests`,
        machineIds: ids
      })
    } else {
      setHighlightTarget(null)
    }
  }, [showCustomerDemandPanel, selectedTier, customerDemandInsights])

  // Keyboard navigation for hour filter in heatmap mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle arrow keys in 3D view heatmap mode
      if (currentView !== '3d' || viewMode !== 'heatmap') return

      const currentHour = filters.hourOfDay

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        // Increment hour (0-23, wraps to 0)
        const nextHour = currentHour === 23 ? 0 : currentHour + 1
        setFilters(prev => ({ ...prev, hourOfDay: nextHour }))
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        // Decrement hour (0 wraps to 23)
        const prevHour = currentHour === 0 ? 23 : currentHour - 1
        setFilters(prev => ({ ...prev, hourOfDay: prevHour }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView, viewMode, filters.hourOfDay])

  return (
    <>
          <NavigationBar
            onFilterChange={handleFilterChange}
            casinoData={casinoData}
            currentView={currentView}
            onViewChange={setCurrentView}
            heatMapEnabled={heatMapEnabled}
            setHeatMapEnabled={setHeatMapEnabled}
            showBankLabels={showBankLabels}
            setShowBankLabels={setShowBankLabels}
            labelMode={labelMode}
            setLabelMode={setLabelMode}
            labelsOutliersOnly={labelsOutliersOnly}
            setLabelsOutliersOnly={setLabelsOutliersOnly}
            showInsightPanel={showInsightPanel}
            onToggleInsightPanel={handleToggleInsightPanel}
            showCustomerDemandPanel={showCustomerDemandPanel}
            onToggleCustomerDemandPanel={handleToggleCustomerDemandPanel}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            tierOptions={tierOptions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            externalFilters={filters}
          />
          <div style={{
            position: 'fixed',
            top: '110px',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: 'calc(100vh - 110px)'
          }}>
            <Canvas
              camera={{
                position: [25, 30, 25],
                fov: 75,
                near: 0.1,
                far: 10000
              }}
              gl={{
                antialias: true,
                powerPreference: "high-performance",
                toneMapping: 0,
                toneMappingExposure: 2.5
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <color attach="background" args={[backgroundColor]} />
              <CasinoScene
                backgroundColor={backgroundColor}
                ambientIntensity={ambientIntensity}
                directionalIntensity={directionalIntensity}
                casinoData={casinoData}
                filters={filters}
                getFilteredData={getFilteredData}
                getHeatMapData={getHeatMapData}
                getDailyHeatMapData={getDailyHeatMapData}
                heatMapEnabled={heatMapEnabled}
                viewMode={viewMode}
                tableColor={tableColor}
                etgColor={etgColor}
                specialObjectsColor={specialObjectsColor}
                onBankHover={handleBankHover}
                onMachineClick={handleMachineClick}
                getUniqueLocations={getUniqueLocations}
                getMachinesByLocation={getMachinesByLocation}
                getMachineMetrics={getMachineMetrics}
                showBankLabels={showBankLabels}
                pinned={Boolean(pinnedMachine)}
                bankRankings={bankRankings}
                labelMode={labelMode}
                labelsOutliersOnly={labelsOutliersOnly}
                highlightedMachineIds={highlightedMachineIds}
                highlightColorMap={viewMode === 'yield' ? yieldHighlight.colors : viewMode === 'time' ? timeHighlight.colors : null}
                heatValues={viewMode === 'time' ? timeHeatValues : null}
              />
            </Canvas>
          </div>

          {/* Pinned machine tooltip (first click) */}
          {pinnedMachine && pinnedMachinePosition && (
            <MachineTooltip
              position={pinnedMachinePosition}
              machineData={pinnedMachine}
              metricNote={
                viewMode === 'heatmap' && heatMapEnabled
                  ? 'Theo/Machine matches heat map (this hour, DD only - pinned machines are always DD)'
                  : viewMode === 'overall' && heatMapEnabled
                    ? 'Turnover matches heat map (full day sum)'
                    : null
              }
            />
          )}

          {/* Bank hover tooltip - cursor-tracking, or docked top-right while a machine is pinned.
              Suppressed on the Yield tab (its own DD-only tooltip). In demo mode, hover is
              disabled for non-DD banks on every tab. */}
          {viewMode !== 'yield' && hoveredBank && (!DEMO_MODE || !hoveredBank.isNonDd) && (bankTooltipPosition || pinnedMachine) && (
            <BankHoverTooltip
              position={bankTooltipPosition}
              bankUserData={hoveredBank}
              ranking={bankRankings}
              pinned={Boolean(pinnedMachine)}
            />
          )}

          {/* Yield tab bank tooltip: DD banks only (non-DD hover disabled), no jargon. */}
          {viewMode === 'yield' && hoveredBank && !hoveredBank.isNonDd && bankTooltipPosition && (
            <YieldBankTooltip
              position={bankTooltipPosition}
              info={bankInfoByKey.get(hoveredBank.key)}
              fallbackLabel={hoveredBank.isTableZone ? hoveredBank.zone : hoveredBank.location}
              weeks={windowInfo.weeks}
            />
          )}

          {/* Drill-down modal (second click on the same machine) */}
          {detailModalMachine && (
            <MachineDetailCard
              machineData={detailModalMachine}
              onClose={handleDetailModalClose}
            />
          )}

          {/* Yield tab: placement ranking + dollar bridge + mechanism evidence */}
          {viewMode === 'yield' && (
            <YieldPanel
              demoMode={DEMO_MODE}
              windowInfo={windowInfo}
              onWindowChange={setYieldWindow}
              validation={windowedRanking?.validation}
              flagged={windowedRanking?.flagged}
              bankInfo={bankInfoByKey}
              bridge={bridge}
              demoHeadline={demoHeadline}
              firstBite={firstBite}
              heartbeat={heartbeat}
              constrainedSummary={constrainedSummary}
              selectedBankKey={selectedBankKey}
              onSelectBank={setSelectedBankKey}
            />
          )}

          {/* Time tab depth panel: hourly curve + tier decomposition, with its own
              bank / weekday / week controls (state lives here so the floor highlight
              and slice heat stay in lockstep with the panel). Bank options come from
              the full basis so the list is stable across week slices. */}
          {viewMode === 'time' && (
            <TimeDepthPanel
              vd={timeVd}
              bankOptions={valueDensity.vd.banks}
              weekEndings={timeWeekEndings}
              bankKey={timeBankKey}
              weekday={timeWeekday}
              week={timeWeek}
              onBankChange={setTimeBankKey}
              onWeekdayChange={setTimeWeekday}
              onWeekChange={setTimeWeek}
            />
          )}

          {/* Combined Insights panel (heatmap + time modes) */}
          {(viewMode === 'heatmap' || viewMode === 'time') && showInsightPanel && (
            <InsightPanel
              zone={filters.zone === 'all' ? 'All zones' : filters.zone}
              hour={filters.hourOfDay}
              day={filters.dayOfWeek}
              insights={performanceInsights}
              occupancy={getZoneOccupancy(filters.zone === 'all' ? 'all' : filters.zone, filters)}
              highlightTarget={highlightTarget}
              onHighlightChange={setHighlightTarget}
            />
          )}

          {/* Customer Demand panel (heatmap + time modes) */}
          {(viewMode === 'heatmap' || viewMode === 'time') && showCustomerDemandPanel && (
            <CustomerDemandPanel
              zone={filters.zone === 'all' ? 'All zones' : filters.zone}
              hour={filters.hourOfDay}
              day={filters.dayOfWeek}
              tier={selectedTier}
              insights={customerDemandInsights}
              loading={tierLoading}
              ready={tierReady}
              highlightTarget={highlightTarget}
              onHighlightChange={setHighlightTarget}
            />
          )}

          {/* Controls panel (lil-gui: background/lighting/machine colours) - Overall tab only. */}
          {viewMode === 'overall' && (
            <GUI
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              ambientIntensity={ambientIntensity}
              setAmbientIntensity={setAmbientIntensity}
              directionalIntensity={directionalIntensity}
              setDirectionalIntensity={setDirectionalIntensity}
              tableColor={tableColor}
              setTableColor={setTableColor}
              etgColor={etgColor}
              setEtgColor={setEtgColor}
              specialObjectsColor={specialObjectsColor}
              setSpecialObjectsColor={setSpecialObjectsColor}
            />
          )}
    </>
  )
}

export default App
