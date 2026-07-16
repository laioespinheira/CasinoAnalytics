import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useLoader, useThree, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import BankLabel from './BankLabel'

// Pale gray for DD machines that have data somewhere in the dataset but no rows
// in the current filter. Clearly distinct from the dark non-DD MUTED_GRAY and
// from the white-ish floor/walls, so "swapped/off this week" reads differently
// from "averaged" and from "live data".
const NO_DATA_GRAY = '#9ca3af'

// 5-tier bucketing mirroring the hook's getHeatLevel, but applied to whatever
// metric (here: per-machine MEAN turnover) with bounds recomputed over that metric.
const getHeatLevel = (value, percentiles) => {
  if (value <= 0) return 0
  if (value <= percentiles.p25) return 1
  if (value <= percentiles.p75) return 2
  if (value <= percentiles.p90) return 3
  return 4
}

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
  labelsOutliersOnly
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
            avgTheo={entry?.avgTheo ?? 0}
            occupancyPct={entry?.occupancyPct ?? 0}
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
  highlightedMachineIds = null,
  highlightColorMap = null,
  heatValues = null
}) => {
  const gltf = useLoader(GLTFLoader, './models/casino_floor_map.glb')
  const groupRef = useRef()
  const { camera, gl, raycaster, mouse } = useThree()
  const [cubeObjects, setCubeObjects] = useState([])
  const [allMeshes, setAllMeshes] = useState([])
  const [objectMeshMap, setObjectMeshMap] = useState(new Map())
  const [originalMaterials, setOriginalMaterials] = useState(new Map())
  // Per-mesh working materials, created ONCE at model load and mutated in place on
  // every recolor pass (color/emissive/opacity are uniform updates - no shader
  // recompile, no per-machine material allocation):
  //   base - dedicated clone of the mesh's original material (textures/props kept)
  //          used for the original-look paths; baseColor restores its tint.
  //   flat - plain MeshStandardMaterial used for heat / dim / highlight-tint,
  //          matching the defaults of the previous per-pass `new` allocations.
  const [workingMaterials, setWorkingMaterials] = useState(new Map())
  const [bankBoundingBoxes, setBankBoundingBoxes] = useState(new Map())
  const [bankLabels, setBankLabels] = useState([])
  const [nonDdInfo, setNonDdInfo] = useState(null)
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

  // Machines that have at least one DD row (date != null). Machines absent from
  // this set are non-DD (averaged-only) and are not interactive.
  const ddMachineIds = useMemo(() => {
    const set = new Set()
    casinoData.forEach(item => {
      if (item.blender_id && item.date != null) set.add(item.blender_id)
    })
    return set
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
        // Non-DD bank: none of its machines have DD coverage (no date != null rows).
        const isNonDd = !bankMachines.some(m => ddMachineIds.has(m.blender_id))
        boxMesh.userData = { type: 'bank', zone, location, key, isTableZone, isNonDd }

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
  }, [objectMeshMap, getUniqueLocations, getMachinesByLocation, filters, ddMachineIds])

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
      const workingMap = new Map()

      object.traverse((child) => {
        if (child.isMesh) {
          meshes.push(child)

          // Store original material for later restoration
          const originalMaterial = child.material.clone()
          materialMap.set(child.name, originalMaterial)

          // One-time working materials for the recolor passes (mutated, never
          // reallocated). base is its own clone so the pristine original above
          // is never touched.
          workingMap.set(child.name, {
            base: child.material.clone(),
            baseColor: child.material.color ? child.material.color.clone() : new THREE.Color('#ffffff'),
            flat: new THREE.MeshStandardMaterial()
          })

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
      setWorkingMaterials(workingMap)
      
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
    if (casinoData.length > 0 && objectMeshMap.size > 0 && workingMaterials.size > 0) {

      // Mutate-in-place helpers over the per-mesh working materials. Each sets
      // every property the recolor paths ever touch, so a material carries no
      // state over from the previous pass. Same visual output as the previous
      // per-pass `new MeshStandardMaterial` / `originalMaterial.clone()` calls.
      const applyBase = (mesh, w) => {
        const m = w.base
        m.color.copy(w.baseColor)
        m.transparent = false
        m.opacity = 1.0
        mesh.material = m
      }
      const applyFlat = (mesh, w, color) => {
        const m = w.flat
        m.color.set(color)
        m.emissive.set(0x000000)
        m.emissiveIntensity = 1
        m.transparent = false
        m.opacity = 1.0
        mesh.material = m
      }
      const applyDim = (mesh, w) => {
        const m = w.flat
        m.color.set('#d1d5db')
        m.emissive.set(0x000000)
        m.emissiveIntensity = 1
        m.transparent = true
        m.opacity = 0.35
        mesh.material = m
      }
      const applyTint = (mesh, w, tint) => {
        const m = w.flat
        m.color.set(tint)
        m.emissive.set(tint)
        m.emissiveIntensity = 0.35
        m.transparent = false
        m.opacity = 1.0
        mesh.material = m
      }

      // Check which CSV objects are missing from 3D model
      const csvObjects = [...new Set(casinoData.map(item => item.blender_id))]
      const modelObjects = Array.from(objectMeshMap.keys())
      const missingFromModel = csvObjects.filter(csvId => !modelObjects.includes(csvId))

      // Performance: Only log summary
      console.log(`📊 CSV Analysis: ${csvObjects.length} CSV objects, ${modelObjects.length} 3D objects, ${missingFromModel.length} missing`)

      if (heatMapEnabled || heatValues) {
        // Heat map mode: colour by a MEAN per machine-hour, NOT the sum.
        // DD machines have ~14 weeks of real per-hour rows while non-DD have a single
        // weekday-averaged row per (weekday, hour). Summing gives DD a ~14x artificial
        // advantage so every DD machine looks hot. The mean is comparable across both.
        // (Computed here, in-component, because the hook's getHeatMapData sums turnover.)
        //
        // Hourly tab (viewMode 'heatmap'): DD machines colour by theo_win (real $ theo
        // earned), which is what actually matters for floor performance. Non-DD machines
        // have no theo_win (null for every row) so they stay on turnover - they're floor
        // aesthetics only, not part of the DD analysis. Theo and turnover are different
        // scales, so each group gets its own percentile ramp. Overall keeps a single
        // shared turnover ramp across both groups, unchanged.
        //
        // `heatValues` (Time tab): the caller supplies precomputed per-machine means
        // (theo/machine-hour over the panel's selected slice); the ramp, bucketing and
        // material logic are reused with a single shared ramp over those values (they
        // are all DD machines on one metric). Hourly and Overall always enter with
        // heatValues null, so their paths are untouched.
        const useTheoForDD = !heatValues && viewMode === 'heatmap'

        let meanValue
        if (heatValues) {
          meanValue = heatValues
        } else {
          const heatFilters = {
            ...filters,
            occupancy: 'all',
            ...(viewMode === 'overall' ? { hourOfDay: 'all' } : {})
          }
          const rows = getFilteredData(heatFilters)

          const sums = new Map()
          const counts = new Map()
          rows.forEach((r) => {
            const id = r.blender_id
            if (!id) return
            const val = (useTheoForDD && ddMachineIds.has(id)) ? (r.theo_win || 0) : (r.turnover || 0)
            sums.set(id, (sums.get(id) || 0) + val)
            counts.set(id, (counts.get(id) || 0) + 1)
          })
          meanValue = new Map()
          counts.forEach((count, id) => {
            meanValue.set(id, count ? sums.get(id) / count : 0)
          })
        }

        // Recompute the colour-ramp bounds against the per-machine means.
        const computePercentiles = (values) => {
          const len = values.length
          return len > 0
            ? {
                p25: values[Math.floor(len * 0.25)] || 0,
                p75: values[Math.floor(len * 0.75)] || 0,
                p90: values[Math.floor(len * 0.90)] || 0
              }
            : { p25: 0, p75: 0, p90: 0 }
        }

        let theoPercentiles = null
        let turnoverPercentiles = null
        let sharedPercentiles = null
        if (useTheoForDD) {
          const ddMeans = []
          const nonDdMeans = []
          meanValue.forEach((v, id) => {
            if (v <= 0) return
            if (ddMachineIds.has(id)) ddMeans.push(v)
            else nonDdMeans.push(v)
          })
          theoPercentiles = computePercentiles(ddMeans.sort((a, b) => a - b))
          turnoverPercentiles = computePercentiles(nonDdMeans.sort((a, b) => a - b))
        } else {
          const positiveMeans = [...meanValue.values()].filter((v) => v > 0).sort((a, b) => a - b)
          sharedPercentiles = computePercentiles(positiveMeans)
        }

        // Reset all objects to their original colour first.
        objectMeshMap.forEach((mesh, meshName) => {
          const w = workingMaterials.get(meshName)
          if (mesh.isMesh && w) applyBase(mesh, w)
        })

        // Heat-colour every machine (DD and non-DD) that has rows in the slice:
        //   - in slice             -> heat ramp (live data)
        //   - DD, no rows here      -> NO_DATA_GRAY (pale "off this week")
        //   - non-DD, no rows here  -> keep original colour (no grey)
        casinoDataMap.forEach((_data, id) => {
          const mesh = objectMeshMap.get(id)
          const w = workingMaterials.get(id)
          if (!mesh || !mesh.isMesh || !w) return

          let color
          if (meanValue.has(id)) {
            const percentiles = useTheoForDD
              ? (ddMachineIds.has(id) ? theoPercentiles : turnoverPercentiles)
              : sharedPercentiles
            color = getHeatMapColor(getHeatLevel(meanValue.get(id), percentiles))
          } else if (ddMachineIds.has(id)) {
            color = NO_DATA_GRAY
          } else {
            return // non-DD with no data this filter: leave original colour
          }

          applyFlat(mesh, w, color)
        })

        if (highlightedMachineIds && highlightedMachineIds.size > 0) {
          objectMeshMap.forEach((mesh, meshName) => {
            if (!mesh.isMesh) return
            if (highlightedMachineIds.has(meshName)) return
            const w = workingMaterials.get(meshName)
            if (w) applyDim(mesh, w)
          })
        }

      } else if (getFilteredData) {
        // Overall view (no heat map): show every object in its original/base colour
        // (the machine-type colours from the GUI). No occupancy gradient or muted grays.
        objectMeshMap.forEach((mesh, meshName) => {
          const w = workingMaterials.get(meshName)
          if (mesh.isMesh && w) {
            applyBase(mesh, w)

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

        // Floor highlight without heat colour (e.g. Time mode): dim everything that
        // is not part of the highlighted set, mirroring the heat-branch treatment.
        // When a highlightColorMap is supplied (Yield tab), the highlighted machines
        // are additionally tinted by their group colour (validated vs flagged) so the
        // two cohorts read apart at a glance. This block only runs in the no-heat
        // branch, so the Heatmap render path is unchanged.
        if (highlightedMachineIds && highlightedMachineIds.size > 0) {
          objectMeshMap.forEach((mesh, meshName) => {
            if (!mesh.isMesh) return
            const w = workingMaterials.get(meshName)
            if (!w) return
            if (highlightedMachineIds.has(meshName)) {
              const tint = highlightColorMap && highlightColorMap.get(meshName)
              if (tint) applyTint(mesh, w, tint)
              return
            }
            applyDim(mesh, w)
          })
        }
      }
    }
  }, [casinoData, filters, objectMeshMap, workingMaterials, getFilteredData, getHeatMapData, getDailyHeatMapData, heatMapEnabled, viewMode, tableColor, etgColor, specialObjectsColor, casinoDataMap, highlightedMachineIds, highlightColorMap, ddMachineIds, heatValues])

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
      // Dismiss any bank hover tooltip so it never lingers behind the machine
      // detail card / pinned tooltip. Reset the ref so re-hover works afterward.
      if (onBankHover) onBankHover(null, null)
      lastHoveredBankKeyRef.current = null

      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera({ x, y }, camera)

      if (bankBoundingBoxes.size === 0) return

      const bankIntersects = raycaster.intersectObjects(
        Array.from(bankBoundingBoxes.values()), false
      )
      if (bankIntersects.length === 0) {
        setNonDdInfo(null)
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
        setNonDdInfo(null)
        if (onMachineClick) onMachineClick(null, null)
        return
      }

      const intersectedMesh = machineIntersects[0].object

      // Non-DD machines (no DD rows) are visible in the heatmap but not interactive.
      // Swallow the click: clear any pinned DD card and show a minimal name+zone label.
      if (!ddMachineIds.has(intersectedMesh.name)) {
        const catalog = casinoDataMap.get(intersectedMesh.name)
        if (onMachineClick) onMachineClick(null, null)
        setNonDdInfo({
          name: catalog?.machineFullName || intersectedMesh.name,
          zone: catalog?.zone || 'Unknown',
          point: machineIntersects[0].point.clone()
        })
        return
      }

      setNonDdInfo(null)
      const machineData = getMachineMetrics
        ? (getMachineMetrics(intersectedMesh.name, filters) || casinoDataMap.get(intersectedMesh.name))
        : casinoDataMap.get(intersectedMesh.name)
      if (machineData && onMachineClick) {
        onMachineClick(machineData, { x: event.clientX, y: event.clientY })
      }
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [gl, camera, raycaster, objectMeshMap, casinoDataMap, bankBoundingBoxes, getMachinesByLocation, onMachineClick, getMachineMetrics, filters, ddMachineIds, onBankHover])

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
        />
      )}

      {/* Non-DD machine: minimal name + zone label (no metrics, not clickable through) */}
      {nonDdInfo && (
        <Html position={nonDdInfo.point} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div
            style={{
              background: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 10,
              padding: '8px 12px',
              color: '#e5e7eb',
              whiteSpace: 'nowrap',
              boxShadow: '0 12px 24px -10px rgba(0,0,0,0.5)',
              transform: 'translateY(-18px)'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              {nonDdInfo.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2 }}>
              {nonDdInfo.zone}
            </div>
          </div>
        </Html>
      )}
    </>
  )
}

export default CasinoModel