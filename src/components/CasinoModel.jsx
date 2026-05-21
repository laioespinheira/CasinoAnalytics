import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useLoader, useThree, useFrame } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import BankLabel from './BankLabel'

// Label culling tunables.
// Labels are drei <Html> portals that reproject every frame. Limiting how
// many are alive at once is the highest-impact perf knob.
const LABEL_VISIBLE_RADIUS = 80      // world units from camera; tune to taste
const LABEL_CULL_THROTTLE_MS = 150   // re-evaluate visibility ~6x per second

// Hides bank labels whose world position is farther from the camera than
// LABEL_VISIBLE_RADIUS. Visibility is recomputed at most every
// LABEL_CULL_THROTTLE_MS, and only triggers a re-render when the set of
// visible keys actually changes.
const isOutlierTopOrBottom = (entry) => {
  if (!entry || !entry.rank || !entry.total) return false
  return entry.rank <= 5 || entry.rank > entry.total - 5
}

const rankTierFromEntry = (entry) => {
  if (!entry || !entry.rank || !entry.total) return null
  const ratio = entry.rank / entry.total
  if (ratio <= 0.25) return 'high'
  if (ratio >= 0.75) return 'low'
  return 'mid'
}

const BankLabelLayer = ({
  labels,
  bankRankings,
  labelMode,
  labelsOutliersOnly,
  labelTrendsByKey
}) => {
  const { camera } = useThree()
  const [visibleKeys, setVisibleKeys] = useState(() => new Set())
  const lastUpdateRef = useRef(0)
  const rankings = bankRankings ?? new Map()

  useFrame(() => {
    const now = performance.now()
    if (now - lastUpdateRef.current < LABEL_CULL_THROTTLE_MS) return
    lastUpdateRef.current = now

    const camPos = camera.position
    const r2 = LABEL_VISIBLE_RADIUS * LABEL_VISIBLE_RADIUS
    const next = new Set()
    for (const label of labels) {
      const dx = label.position[0] - camPos.x
      const dy = label.position[1] - camPos.y
      const dz = label.position[2] - camPos.z
      if (dx * dx + dy * dy + dz * dz <= r2) next.add(label.key)
    }

    setVisibleKeys(prev => {
      if (prev.size !== next.size) return next
      for (const k of next) if (!prev.has(k)) return next
      return prev
    })
  })

  const visibleLabels = labels.filter(label => {
    if (!visibleKeys.has(label.key)) return false
    const entry = rankings.get(label.key)
    if (labelsOutliersOnly) {
      if (!entry || !isOutlierTopOrBottom(entry)) return false
    }
    return true
  })

  return (
    <>
      {visibleLabels.map(label => {
        const entry = rankings.get(label.key)
        const tier = rankTierFromEntry(entry)
        const trend = labelTrendsByKey?.get(label.key) ?? []
        return (
          <BankLabel
            key={label.key}
            position={label.position}
            bankName={label.bankName}
            zone={label.zone}
            machineCount={label.machineCount}
            tier={tier}
            mode={labelMode}
            avgTurnover={entry?.avgTurnover ?? 0}
            occupancyPct={entry?.occupancyPct ?? 0}
            trend={trend}
          />
        )
      })}
    </>
  )
}

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
  getDailyHeatMapData,
  heatMapEnabled = false,
  viewMode = 'overall',
  tableColor,
  etgColor,
  specialObjectsColor,
  onBankHover,
  onMachineClick,
  getUniqueLocations,
  getMachinesByLocation,
  getMachineMetrics,
  showBankLabels = true,
  pinned = false,
  bankRankings,
  labelMode = 'name',
  labelsOutliersOnly = false,
  labelTrendsByKey = null,
  highlightedMachineIds = null
}) => {
  const gltf = useLoader(GLTFLoader, './models/casino_floor_map.glb')
  const groupRef = useRef()
  const { camera, gl, raycaster, mouse } = useThree()
  const [cubeObjects, setCubeObjects] = useState([])
  const [allMeshes, setAllMeshes] = useState([])
  const [objectMeshMap, setObjectMeshMap] = useState(new Map())
  const [originalMaterials, setOriginalMaterials] = useState(new Map())
  const [bankBoundingBoxes, setBankBoundingBoxes] = useState(new Map())
  const [bankLabels, setBankLabels] = useState([])
  const lastHoveredBankKeyRef = useRef(null)

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

  // Calculate bank (location) bounding boxes for hierarchical interaction
  useEffect(() => {
    if (!(objectMeshMap.size > 0 && getUniqueLocations && getMachinesByLocation)) return

    const locations = getUniqueLocations(filters)
    const boundingBoxMap = new Map()
    const labels = []

    if (groupRef.current) {
      groupRef.current.updateMatrixWorld(true)
    }

    locations.forEach(({ zone, location, key, isTableZone }) => {
      const bankMachines = getMachinesByLocation(zone, location)
      const bankMeshes = bankMachines
        .map(machine => objectMeshMap.get(machine.blender_id))
        .filter(mesh => mesh !== undefined)

      if (bankMeshes.length > 0) {
        const box = new THREE.Box3()
        bankMeshes.forEach(mesh => {
          const meshBox = new THREE.Box3().setFromObject(mesh)
          box.union(meshBox)
        })

        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
        const material = new THREE.MeshBasicMaterial({
          visible: false,
          transparent: true,
          opacity: 0
        })
        const boxMesh = new THREE.Mesh(geometry, material)

        const localCenter = groupRef.current
          ? groupRef.current.worldToLocal(center.clone())
          : center.clone()
        boxMesh.position.copy(localCenter)
        boxMesh.userData = { type: 'bank', zone, location, key, isTableZone }

        boundingBoxMap.set(key, boxMesh)

        const uniqueMachines = new Set(bankMachines.map(m => m.machineFullName))
        const machineCount = uniqueMachines.size

        const displayName = isTableZone ? zone : location

        labels.push({
          key,
          position: [center.x, center.y, center.z],
          bankName: displayName,
          zone,
          machineCount,
          isTableZone
        })

        if (groupRef.current) {
          groupRef.current.add(boxMesh)
        }
      }
    })

    setBankBoundingBoxes(boundingBoxMap)
    setBankLabels(labels)

    return () => {
      if (!groupRef.current) return
      const toRemove = []
      groupRef.current.children.forEach((child) => {
        if (child.userData?.type === 'bank') toRemove.push(child)
      })
      toRemove.forEach((mesh) => {
        mesh.geometry?.dispose()
        mesh.material?.dispose()
        groupRef.current.remove(mesh)
      })
    }
  }, [objectMeshMap, getUniqueLocations, getMachinesByLocation, filters])

  // LEGACY 3-tier color mapping - uncomment + remove the 5-tier version below to revert
  // const getHeatMapColor = (heatLevel) => {
  //   switch (heatLevel) {
  //     case 0: return '#c7c7c7' // No activity (lighter gray)
  //     case 1: return '#c7c7c7' // Low performance (lighter gray)
  //     case 2: return '#f59e0b' // Mid performance (orange)
  //     case 3: return '#ef4444' // Strong performance (red)
  //     default: return '#c7c7c7' // Default (lighter gray)
  //   }
  // }

  // Heat map color function (5-tier)
  const getHeatMapColor = (heatLevel) => {
    switch (heatLevel) {
      case 0: return '#374151' // idle - dark gray (gray-700)
      case 1: return '#ef4444' // low - red (red-500, <= p25)
      case 2: return '#f59e0b' // median - orange (amber-500, p25 - p75)
      case 3: return '#86efac' // strong - light green (green-300, p75 - p90)
      case 4: return '#15803d' // top - dark green (green-700, > p90)
      default: return '#374151'
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

      if (heatMapEnabled) {
        // Heat map mode: show turnover-based colors
        // Use daily aggregated data for Overall mode, hourly data for Heatmap mode
        const heatMapResult = viewMode === 'overall' && getDailyHeatMapData
          ? getDailyHeatMapData(filters)
          : getHeatMapData(filters)

        const { data: heatMapData, percentiles } = heatMapResult

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

        if (highlightedMachineIds && highlightedMachineIds.size > 0) {
          objectMeshMap.forEach((mesh, meshName) => {
            if (!mesh.isMesh) return
            if (highlightedMachineIds.has(meshName)) return
            mesh.material = new THREE.MeshStandardMaterial({
              color: '#d1d5db',
              transparent: true,
              opacity: 0.35
            })
          })
        }

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
  }, [casinoData, filters, objectMeshMap, originalMaterials, getFilteredData, getHeatMapData, getDailyHeatMapData, heatMapEnabled, viewMode, tableColor, etgColor, specialObjectsColor, casinoDataMap, highlightedMachineIds])

  // Hover -> bank tooltip (any bank, any zone).
  // The pointermove fires at the cursor's full sample rate, so we:
  //   1. Coalesce events with requestAnimationFrame (max one raycast per frame).
  //   2. Only re-render the App when the bank under the cursor actually changes
  //      identity; within the same bank we still update the tooltip position
  //      so it follows the cursor, but the bank stays stable.
  useEffect(() => {
    if (!gl || !gl.domElement) return

    const canvas = gl.domElement
    const pendingEventRef = { current: null }
    const rafIdRef = { current: null }

    const flush = () => {
      rafIdRef.current = null
      const event = pendingEventRef.current
      pendingEventRef.current = null
      if (!event) return

      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera({ x, y }, camera)

      let nextKey = null
      let nextUserData = null
      if (bankBoundingBoxes.size > 0) {
        const hits = raycaster.intersectObjects(
          Array.from(bankBoundingBoxes.values()), false
        )
        if (hits.length > 0) {
          nextUserData = hits[0].object.userData
          nextKey = nextUserData.key
        }
      }

      canvas.style.cursor = nextKey ? 'pointer' : 'default'

      // Identity changed - emit a single state update with a fresh position.
      if (nextKey !== lastHoveredBankKeyRef.current) {
        lastHoveredBankKeyRef.current = nextKey
        if (onBankHover) {
          onBankHover(
            nextUserData,
            nextKey ? { x: event.clientX, y: event.clientY } : null
          )
        }
        return
      }

      // Same bank as last frame - only update position so the tooltip follows.
      if (pinned) return
      if (nextKey && onBankHover) {
        onBankHover(nextUserData, { x: event.clientX, y: event.clientY })
      }
    }

    const handlePointerMove = (event) => {
      pendingEventRef.current = event
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flush)
      }
    }

    const handlePointerLeave = () => {
      pendingEventRef.current = null
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      canvas.style.cursor = 'default'
      if (pinned) return
      if (lastHoveredBankKeyRef.current != null) {
        lastHoveredBankKeyRef.current = null
        if (onBankHover) onBankHover(null, null)
      }
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
      canvas.style.cursor = 'default'
    }
  }, [gl, camera, raycaster, onBankHover, bankBoundingBoxes, pinned])

  // Click -> machine drill-down (raycast banks first, then machines inside the hit bank)
  useEffect(() => {
    if (!gl || !gl.domElement) return

    const canvas = gl.domElement

    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera({ x, y }, camera)

      if (bankBoundingBoxes.size === 0) return

      const bankIntersects = raycaster.intersectObjects(
        Array.from(bankBoundingBoxes.values()), false
      )
      if (bankIntersects.length === 0) {
        if (onMachineClick) onMachineClick(null, null)
        return
      }

      const bankUserData = bankIntersects[0].object.userData
      const bankMachines = getMachinesByLocation
        ? getMachinesByLocation(bankUserData.zone, bankUserData.location)
        : []
      const bankMeshes = bankMachines
        .map(machine => objectMeshMap.get(machine.blender_id))
        .filter(mesh => mesh !== undefined)

      const machineIntersects = raycaster.intersectObjects(bankMeshes, false)
      if (machineIntersects.length === 0) {
        if (onMachineClick) onMachineClick(null, null)
        return
      }

      const intersectedMesh = machineIntersects[0].object
      const machineData = getMachineMetrics
        ? (getMachineMetrics(intersectedMesh.name, filters) || casinoDataMap.get(intersectedMesh.name))
        : casinoDataMap.get(intersectedMesh.name)
      if (machineData && onMachineClick) {
        onMachineClick(machineData, { x: event.clientX, y: event.clientY })
      }
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [gl, camera, raycaster, objectMeshMap, casinoDataMap, bankBoundingBoxes, getMachinesByLocation, onMachineClick, getMachineMetrics, filters])

  if (!gltf) return null

  return (
    <>
      <group ref={groupRef} />

      {/* Bank Labels (distance-culled inside the layer) */}
      {showBankLabels && (
        <BankLabelLayer
          labels={bankLabels}
          bankRankings={bankRankings}
          labelMode={labelMode}
          labelsOutliersOnly={labelsOutliersOnly}
          labelTrendsByKey={labelTrendsByKey}
        />
      )}
    </>
  )
}

export default CasinoModel