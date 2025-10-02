import React, { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import CasinoModel from './CasinoModel'
import Lighting from './Lighting'

const CasinoScene = ({
  backgroundColor,
  ambientIntensity,
  directionalIntensity,
  casinoData,
  filters,
  getFilteredData,
  getHeatMapData,
  transparencyEnabled,
  heatMapEnabled,
  tableColor,
  etgColor,
  specialObjectsColor,
  onMachineHover,
  onMachineClick
}) => {
  const { camera } = useThree()
  const controlsRef = useRef()

  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      
      // Set up controls configuration
      controls.minDistance = 2  // Allow much closer zoom
      controls.maxDistance = 2000
      controls.enableDamping = true
      controls.dampingFactor = 0.1
      controls.target.set(0, 0, 0)
    }
  }, [])

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={2000}
      />
      
      <Lighting 
        ambientIntensity={ambientIntensity}
        directionalIntensity={directionalIntensity}
      />
      
      <CasinoModel
        casinoData={casinoData}
        filters={filters}
        getFilteredData={getFilteredData}
        getHeatMapData={getHeatMapData}
        enableTransparencyEffect={transparencyEnabled}
        heatMapEnabled={heatMapEnabled}
        tableColor={tableColor}
        etgColor={etgColor}
        specialObjectsColor={specialObjectsColor}
        onMachineHover={onMachineHover}
        onMachineClick={onMachineClick}
      />
    </>
  )
}

export default CasinoScene