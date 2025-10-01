import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import CasinoScene from './components/CasinoScene'
import BasicDashboard from './components/BasicDashboard'
import GUI from './components/GUI'
import NavigationBar from './components/NavigationBar'
import useCasinoData from './hooks/useCasinoData'

function App() {
  const [currentView, setCurrentView] = useState('analytics') // Default to analytics dashboard
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [ambientIntensity, setAmbientIntensity] = useState(0.51)
  const [directionalIntensity, setDirectionalIntensity] = useState(2.5)
  const [tableColor, setTableColor] = useState('#dedede')
  const [etgColor, setEtgColor] = useState('#dedede')
  const [specialObjectsColor, setSpecialObjectsColor] = useState('#ffffff')
  const [heatMapEnabled, setHeatMapEnabled] = useState(false)
  const [filters, setFilters] = useState({
    zone: 'all',
    machineType: 'all',
    gameType: 'all',
    occupancy: 'vacant',
    dayOfWeek: 'all',
    hourOfDay: 'all'
  })

  // Load casino data
  const { casinoData, loading, error, getFilteredData, getHeatMapData } = useCasinoData()

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
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
              />
            </Canvas>
          </div>

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
