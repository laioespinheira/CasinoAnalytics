import React, { useState, useEffect, useMemo } from 'react'
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
import TimeDepthPanel from './components/TimeDepthPanel'

// Stable empty-params ref so the Yield hooks' useMemos hold across renders
// (passing an inline {} would recompute the ranking/bridge every render).
const YIELD_PARAMS = {}

// Two-tone floor highlight on the Yield tab: opportunity vs validation.
const YIELD_FLAGGED_COLOR = '#f59e0b'   // amber - the 6 under-configured banks
const YIELD_VALIDATED_COLOR = '#10b981' // green - the 3 saturated, already-optimal banks

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

  // Yield tab: which flagged bank row is focused (drives floor focus in commit 2)
  const [selectedBankKey, setSelectedBankKey] = useState(null)

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

  const bankRankings = useMemo(() => getBankRankings(filters), [getBankRankings, filters])

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

  const heartbeat = useMemo(() => valueDensity.weeklyHeartbeat(), [valueDensity])

  // Where the >=0.80 (85%-capture) seat-hours physically sit across the flagged
  // banks - computed from the same atoms the metric verified, for the Sunday 13-16
  // corroboration line.
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

  // bankKey -> [machineId] (blender_ids), resolved from the seat-hour base so the
  // Yield tab can light a bank's machines on the floor.
  const bankMachineIds = useMemo(() => {
    const m = new Map()
    seatHourBase?.machines?.forEach((mac, id) => {
      if (!m.has(mac.bankKey)) m.set(mac.bankKey, [])
      m.get(mac.bankKey).push(id)
    })
    return m
  }, [seatHourBase])

  // Yield-tab floor highlight: flagged banks (amber) vs validated saturated banks
  // (green). Selecting a table row focuses that bank and dims the rest.
  const yieldHighlight = useMemo(() => {
    if (!(currentView === '3d' && viewMode === 'yield')) return { ids: null, colors: null }
    const flaggedKeys = (ranking?.flagged || []).map((b) => b.bankKey)
    const validatedKeys = (ranking?.validation?.saturatedBanks || []).map((b) => b.bankKey)
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
  }, [currentView, viewMode, ranking, bankMachineIds, selectedBankKey])

  // Floor highlight is available in the drawer modes (heatmap heat-on / time
  // heat-off) and, driven by the flagged banks, the Yield tab. Keyed off viewMode.
  const highlightedMachineIds = useMemo(() => {
    if (viewMode === 'yield') return yieldHighlight.ids
    if (!highlightTarget?.machineIds?.length || (viewMode !== 'heatmap' && viewMode !== 'time')) {
      return null
    }
    return new Set(highlightTarget.machineIds)
  }, [highlightTarget, viewMode, yieldHighlight])

  const handleFilterChange = (newFilters) => {
    // Merge so App-only fields (e.g. weekEnding, which NavigationBar does not emit)
    // survive updates coming from the nav bar.
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleBankHover = (bankData, position) => {
    setHoveredBank(bankData)
    setBankTooltipPosition(position)
  }

  const handleMachineClick = (machineData, position) => {
    if (!machineData) {
      setPinnedMachine(null)
      setPinnedMachinePosition(null)
      setDetailModalMachine(null)
      return
    }

    // Second click on the same machine -> open the detailed modal (clear pin so the small card does not stay on screen)
    if (pinnedMachine && pinnedMachine.blender_id === machineData.blender_id) {
      setDetailModalMachine(getMachineMetrics(machineData.blender_id, filters) || machineData)
      setPinnedMachine(null)
      setPinnedMachinePosition(null)
      return
    }

    // New machine clicked -> pin its tooltip at the click position
    setPinnedMachine(getMachineMetrics(machineData.blender_id, filters) || machineData)
    setPinnedMachinePosition(position)
    setDetailModalMachine(null)
  }

  const handleDetailModalClose = () => {
    setDetailModalMachine(null)
    setPinnedMachine(null)
    setPinnedMachinePosition(null)
  }

  const handleToggleInsightPanel = () => {
    setShowInsightPanel((prev) => {
      const next = !prev
      if (next) setShowCustomerDemandPanel(false) // right-drawer panels are mutually exclusive
      return next
    })
  }

  const handleToggleCustomerDemandPanel = () => {
    setShowCustomerDemandPanel((prev) => {
      const next = !prev
      if (next) setShowInsightPanel(false)
      return next
    })
  }

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
  }, [currentView, viewMode])

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
                highlightColorMap={viewMode === 'yield' ? yieldHighlight.colors : null}
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
                  ? 'Turnover matches heat map (this hour, all games summed)'
                  : viewMode === 'overall' && heatMapEnabled
                    ? 'Turnover matches heat map (full day sum)'
                    : null
              }
            />
          )}

          {/* Bank hover tooltip - cursor-tracking, or docked top-right while a machine is pinned. */}
          {hoveredBank && (bankTooltipPosition || pinnedMachine) && (
            <BankHoverTooltip
              position={bankTooltipPosition}
              bankUserData={hoveredBank}
              ranking={bankRankings}
              pinned={Boolean(pinnedMachine)}
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
              validation={ranking?.validation}
              flagged={ranking?.flagged}
              bridge={bridge}
              heartbeat={heartbeat}
              constrainedSummary={constrainedSummary}
              selectedBankKey={selectedBankKey}
              onSelectBank={setSelectedBankKey}
            />
          )}

          {/* Time tab depth additions: hourly curve + tier decomposition (left-docked,
              additive to the existing Time right-drawers) */}
          {viewMode === 'time' && (
            <TimeDepthPanel vd={valueDensity.vd} />
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
    </>
  )
}

export default App
