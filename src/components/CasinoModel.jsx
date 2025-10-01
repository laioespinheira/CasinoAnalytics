import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

const TABLE_NAMES = [
  "VisualSceneNode1221", "VisualSceneNode1222", "VisualSceneNode1223", 
  "VisualSceneNode1224", "VisualSceneNode1225", "VisualSceneNode1226",
  "VisualSceneNode1227", "VisualSceneNode1228", "VisualSceneNode1229", 
  "VisualSceneNode1230", "VisualSceneNode1231", "VisualSceneNode1232"
]

const CasinoModel = ({
  casinoData = [],
  filters = {},
  getFilteredData,
  getHeatMapData,
  heatMapEnabled = false,
  tableColor,
  etgColor,
  specialObjectsColor
}) => {
  const gltf = useLoader(GLTFLoader, './models/casino_floor_map.glb')
  const groupRef = useRef()
  const { camera } = useThree()
  const [cubeObjects, setCubeObjects] = useState([])
  const [allMeshes, setAllMeshes] = useState([])
  const [objectMeshMap, setObjectMeshMap] = useState(new Map())
  const [originalMaterials, setOriginalMaterials] = useState(new Map())

  // Cache casino data lookup for performance
  const casinoDataMap = useMemo(() => {
    const map = new Map()
    casinoData.forEach(item => {
      if (item.blender_id) {
        map.set(item.blender_id, item)
      }
    })
    return map
  }, [casinoData])

  // Heat map color function
  const getHeatMapColor = (heatLevel) => {
    switch (heatLevel) {
      case 0: return '#c7c7c7' // No activity (lighter gray)
      case 1: return '#c7c7c7' // Low performance (lighter gray)
      case 2: return '#f59e0b' // Mid performance (orange)
      case 3: return '#ef4444' // Strong performance (red)
      default: return '#c7c7c7' // Default (lighter gray)
    }
  }

  useEffect(() => {
    if (gltf && groupRef.current) {
      const object = gltf.scene.clone()
      
      // Calculate bounding box and center the model
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      
      // Center the model at origin
      object.position.sub(center)
      object.scale.setScalar(1)
      
      // Set rotation
      groupRef.current.rotation.y = Math.PI + 0.75
      
      // Update camera settings
      const maxDim = Math.max(size.x, size.y, size.z)
      camera.near = maxDim * 0.001
      camera.far = maxDim * 10
      camera.updateProjectionMatrix()
      
      // Process child objects for tables and collect all meshes
      const cubes = []
      const meshes = []
      const meshMap = new Map()
      const materialMap = new Map()
      
      object.traverse((child) => {
        if (child.isMesh) {
          meshes.push(child)
          
          // Store original material for later restoration
          const originalMaterial = child.material.clone()
          materialMap.set(child.name, originalMaterial)
          
          // Map mesh by blender object name for easy lookup
          meshMap.set(child.name, child)
          
          if (TABLE_NAMES.includes(child.name)) {
            const material = new THREE.MeshStandardMaterial()
            child.material = material
            cubes.push(child)
            console.log('Found table object:', child.name)
          }
        }
      })
      
      setCubeObjects(cubes)
      setAllMeshes(meshes)
      setObjectMeshMap(meshMap)
      setOriginalMaterials(materialMap)
      
      // Reduced logging for performance
      console.log('🎯 3D Model loaded with', meshMap.size, 'objects')
      
      // Highlight specific table
      const baseTable = object.getObjectByName('Obj_972')
      if (baseTable) {
        baseTable.material = new THREE.MeshStandardMaterial({ color: 'red' })
      }
      
      // Color another specific table
      const specialTable = object.getObjectByName('VisualSceneNode1228')
      if (specialTable) {
        specialTable.material = new THREE.MeshBasicMaterial({ color: 0x00ffff })
      }
      
      // Clear the group and add the processed object
      groupRef.current.clear()
      groupRef.current.add(object)
    }
  }, [gltf, camera])

  // Handle filtering and highlighting
  useEffect(() => {
    if (casinoData.length > 0 && objectMeshMap.size > 0 && originalMaterials.size > 0) {
      
      // Check which CSV objects are missing from 3D model
      const csvObjects = [...new Set(casinoData.map(item => item.blender_id))]
      const modelObjects = Array.from(objectMeshMap.keys())
      const missingFromModel = csvObjects.filter(csvId => !modelObjects.includes(csvId))
      
      // Performance: Only log summary
      console.log(`📊 CSV Analysis: ${csvObjects.length} CSV objects, ${modelObjects.length} 3D objects, ${missingFromModel.length} missing`)
      if (heatMapEnabled && getHeatMapData) {
        // Heat map mode: show turnover-based colors
        const { data: heatMapData, percentiles } = getHeatMapData(filters)
        
        // Reduced heat map logging
        console.log('🌡️ Heat map:', heatMapData.length, 'objects colored')
        
        // Reset all objects first (keep original colors for objects not in CSV)
        objectMeshMap.forEach((mesh, meshName) => {
          const originalMaterial = originalMaterials.get(meshName)
          if (mesh.isMesh && originalMaterial) {
            mesh.material = originalMaterial.clone()
            mesh.material.transparent = false
            mesh.material.opacity = 1.0
            // Keep original color instead of gray - only change objects with data
          }
        })
        
        // Apply heat map colors
        heatMapData.forEach((item) => {
          const mesh = objectMeshMap.get(item.blender_id)
          if (mesh && mesh.isMesh) {
            const heatColor = getHeatMapColor(item.heatLevel)
            mesh.material = new THREE.MeshStandardMaterial({ 
              color: heatColor,
              transparent: false,
              opacity: 1.0
            })
            // Removed detailed heat map logging for performance
          }
        })
        
      } else if (getFilteredData) {
        // Simple behavior: only red highlighting, no transparency
        const filteredData = getFilteredData(filters)
        
        // Reset all objects to original state and apply custom colors
        objectMeshMap.forEach((mesh, meshName) => {
          const originalMaterial = originalMaterials.get(meshName)
          if (mesh.isMesh && originalMaterial) {
            mesh.material = originalMaterial.clone()
            mesh.material.transparent = false
            mesh.material.opacity = 1.0
            
            // Apply custom colors based on machine type from CSV data
            const objectData = casinoDataMap.get(meshName)
            if (objectData) {
              // Apply color based on machine type
              if (objectData.machineType === 'eTGs' && etgColor) {
                mesh.material.color.set(etgColor)
              } else if (objectData.machineType === 'Tables' && tableColor) {
                mesh.material.color.set(tableColor)
              } else if ((objectData.machineType === 'Classic' || objectData.machineType === 'Round Banks') && specialObjectsColor) {
                mesh.material.color.set(specialObjectsColor)
              } else if (specialObjectsColor) {
                mesh.material.color.set(specialObjectsColor)
              }
            } else {
              // No CSV data found, apply special objects color (walls, floors, etc.)
              if (specialObjectsColor) {
                mesh.material.color.set(specialObjectsColor)
              }
            }
          }
        })
        
        // Apply red highlighting only to occupied objects that match filters
        filteredData.forEach((item) => {
          if (item.occupancy === 1) {
            const mesh = objectMeshMap.get(item.blender_id)
            if (mesh && mesh.isMesh) {
              mesh.material = new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                transparent: false,
                opacity: 1.0
              })
            }
          }
        })
      }
    }
  }, [casinoData, filters, objectMeshMap, originalMaterials, getFilteredData, getHeatMapData, heatMapEnabled, tableColor, etgColor, specialObjectsColor, casinoDataMap])

  if (!gltf) return null

  return (
    <group ref={groupRef} />
  )
}

export default CasinoModel