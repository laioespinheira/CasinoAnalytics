import React, { useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import CasinoScene from './components/CasinoScene'
import BasicDashboard from './components/BasicDashboard'
import GUI from './components/GUI'
import NavigationBar from './components/NavigationBar'
import MachineTooltip from './components/MachineTooltip'
import MachineDetailCard from './components/MachineDetailCard'
import BankHoverTooltip from './components/BankHoverTooltip'
import InsightPanel from './components/InsightPanel'
import CustomerDemandPanel from './components/CustomerDemandPanel'
import ComparisonPanel from './components/ComparisonPanel'
import FloorSummaryPanel from './components/FloorSummaryPanel'
import TimePanel from './components/TimePanel'
import useCasinoData from './hooks/useCasinoData'
import useCustomerTierData from './hooks/useCustomerTierData'

function App() {
  const [currentView, setCurrentView] = useState('3d') // Boot into the 3D floor; Analytics still reachable via nav
  const [viewMode, setViewMode] = useState('overall') // 3D view mode: overall, heatmap, comparison, time

  // Comparison mode states
  const [comparisonPeriod, setComparisonPeriod] = useState('previousYear')
  const [comparisonMetrics, setComparisonMetrics] = useState({
    turnover: true,
    revenue: true,
    theoWin: true
  })
  const [displayOptions, setDisplayOptions] = useState({
    showPercentageLabels: true,
    showArrows: true,
    highlightSignificant: false,
    filter: 'all' // 'all', 'improved', 'declined'
  })
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

  const highlightedMachineIds = useMemo(() => {
    if (!highlightTarget?.machineIds?.length || !heatMapEnabled || viewMode !== 'heatmap') {
      return null
    }
    return new Set(highlightTarget.machineIds)
  }, [highlightTarget, heatMapEnabled, viewMode])

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

  // Mock floor summary data for comparison mode
  // TODO: Calculate this from actual casino data
  const floorSummaryMetrics = {
    turnover: {
      current: 2400000,
      change: 12.5
    },
    revenue: {
      current: 456000,
      change: 8.3
    },
    theoWin: {
      current: 423000,
      change: 9.1
    },
    bestZone: {
      name: 'Zone C',
      change: 18.2
    },
    worstZone: {
      // LEGACY: 'Zone F' (before D/E/F were merged into "Zone DD")
      name: 'Zone DD',
      change: -4.3
    }
  }


  return (
    <>
      {currentView === 'analytics' ? (
        <div>
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
          />
          <BasicDashboard />
        </div>
      ) : (
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

          {/* Comparison Mode Panels */}
          {viewMode === 'comparison' && (
            <>
              <ComparisonPanel
                comparisonPeriod={comparisonPeriod}
                onComparisonChange={setComparisonPeriod}
                metrics={comparisonMetrics}
                onMetricsChange={setComparisonMetrics}
                displayOptions={displayOptions}
                onDisplayOptionsChange={setDisplayOptions}
              />
              <FloorSummaryPanel
                metrics={floorSummaryMetrics}
                comparisonPeriod={comparisonPeriod}
              />
            </>
          )}

          {/* Time tab: deep-analytics home reusing the real-data descriptive panels */}
          {viewMode === 'time' && (
            <TimePanel
              filters={filters}
              selectedTier={selectedTier}
              getPerformanceInsights={getPerformanceInsights}
              getZoneOccupancy={getZoneOccupancy}
              getCustomerDemandInsights={getCustomerDemandInsights}
              tierLoading={tierLoading}
              tierReady={tierReady}
            />
          )}

          {/* Combined Insights panel (heatmap mode) */}
          {viewMode === 'heatmap' && showInsightPanel && (
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

          {/* Customer Demand panel (heatmap mode) */}
          {viewMode === 'heatmap' && showCustomerDemandPanel && (
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
      )}
    </>
  )
}

export default App
