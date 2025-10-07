import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import CasinoScene from './components/CasinoScene'
import BasicDashboard from './components/BasicDashboard'
import GUI from './components/GUI'
import NavigationBar from './components/NavigationBar'
import MachineTooltip from './components/MachineTooltip'
import ComparisonPanel from './components/ComparisonPanel'
import FloorSummaryPanel from './components/FloorSummaryPanel'
import useCasinoData from './hooks/useCasinoData'

function App() {
  const [currentView, setCurrentView] = useState('analytics') // Default to analytics dashboard
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
  const [filters, setFilters] = useState({
    zone: 'all',
    machineType: 'all',
    gameType: 'all',
    occupancy: 'vacant',
    dayOfWeek: 'all',
    hourOfDay: 'all'
  })

  // Interaction states
  const [hoveredMachine, setHoveredMachine] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState(null)

  // Load casino data
  const {
    casinoData,
    loading,
    error,
    getFilteredData,
    getHeatMapData,
    getBankAggregates,
    getUniqueLocations,
    getMachinesByLocation
  } = useCasinoData()

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleMachineHover = (machineData, position) => {
    setHoveredMachine(machineData)
    setTooltipPosition(position)
  }

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
      name: 'Zone F',
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
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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
                toneMapping: 0, // LinearToneMapping
                toneMappingExposure: 2.5 // Brighter exposure (similar to -1.22 in viewer)
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
                heatMapEnabled={heatMapEnabled}
                tableColor={tableColor}
                etgColor={etgColor}
                specialObjectsColor={specialObjectsColor}
                onMachineHover={handleMachineHover}
                getUniqueLocations={getUniqueLocations}
                getMachinesByLocation={getMachinesByLocation}
                showBankLabels={showBankLabels}
              />
            </Canvas>
          </div>

          {/* Machine Tooltip */}
          {hoveredMachine && tooltipPosition && (
            <MachineTooltip
              position={tooltipPosition}
              machineData={hoveredMachine}
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
