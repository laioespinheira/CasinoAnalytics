import { useState, useEffect } from 'react'

const useCasinoData = () => {
  const [casinoData, setCasinoData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCasinoData = async () => {
      try {
        const response = await fetch('/assets/casino_data.csv')
        if (!response.ok) {
          throw new Error('Failed to fetch CSV data')
        }
        
        const csvText = await response.text()
        const lines = csvText.split('\n')
        const headers = lines[0].split(',').map(header => header.trim())
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(value => value.trim())
            const obj = {}
            headers.forEach((header, index) => {
              obj[header] = values[index] || ''
            })
            
            // Convert numeric fields
            obj.turnover = parseFloat(obj.turnover) || 0
            obj.stroke = parseFloat(obj.stroke) || 0

            return obj
          })
        
        setCasinoData(data)
      } catch (err) {
        setError(err.message)
        console.error('Error loading casino data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCasinoData()
  }, [])

  // Helper function to get data by blender_id
  const getDataByBlenderId = (blenderId) => {
    return casinoData.find(item => item.blender_id === blenderId)
  }

  // Helper function to filter data based on criteria
  const getFilteredData = (filters) => {
    const baseFilteredData = casinoData.filter(item => {
      const zoneMatch = filters.zone === 'all' || item.zone === filters.zone
      const machineTypeMatch = !filters.machineType || 
        filters.machineType.length === 0 || 
        filters.machineType.includes(item.machineType)
      const gameTypeMatch = filters.gameType === 'all' || item.game_type === filters.gameType
      const dayOfWeekMatch = filters.dayOfWeek === 'all' || item.day === filters.dayOfWeek
      const hourOfDayMatch = filters.hourOfDay === 'all' || 
        item.hour === filters.hourOfDay || 
        item.hour === `${filters.hourOfDay}:00` ||
        item.hour === filters.hourOfDay.toString()
      
      return zoneMatch && machineTypeMatch && gameTypeMatch && dayOfWeekMatch && hourOfDayMatch
    })
    
    // Calculate 25th percentile for occupancy determination
    const turnovers = baseFilteredData
      .map(item => item.turnover)
      .filter(t => t > 0)
      .sort((a, b) => a - b)
    
    const p25 = turnovers.length > 0 ? turnovers[Math.floor(turnovers.length * 0.25)] || 0 : 0
    
    // Add occupancy status based on turnover
    const dataWithOccupancy = baseFilteredData.map(item => ({
      ...item,
      occupancy: item.turnover >= p25 ? 1 : 0,
      occupancyStatus: item.turnover >= p25 ? 'occupied' : 'vacant'
    }))
    
    // Apply occupancy filter if specified
    if (filters.occupancy !== 'all') {
      return dataWithOccupancy.filter(item => item.occupancyStatus === filters.occupancy)
    }
    
    return dataWithOccupancy
  }

  // Optimized heat map data calculation with memoization
  const getHeatMapData = (filters) => {
    // For heat map, ignore occupancy filter completely
    const heatMapFilters = { ...filters, occupancy: 'all' }
    const filteredData = getFilteredData(heatMapFilters)
    
    if (filteredData.length === 0) return { data: [], percentiles: null }
    
    // Get all turnover values for the filtered dataset (optimized)
    const turnovers = []
    for (let i = 0; i < filteredData.length; i++) {
      const turnover = filteredData[i].turnover
      if (turnover > 0) turnovers.push(turnover)
    }
    
    if (turnovers.length === 0) return { data: filteredData, percentiles: null }
    
    // Sort once
    turnovers.sort((a, b) => a - b)
    
    // Calculate percentiles for 3-tier system
    const len = turnovers.length
    const percentiles = {
      p33: turnovers[Math.floor(len * 0.33)] || 0,
      p67: turnovers[Math.floor(len * 0.67)] || 0,
      max: turnovers[len - 1] || 0
    }
    
    // Add heat level to each item (avoid object spread for performance)
    const dataWithHeat = new Array(filteredData.length)
    for (let i = 0; i < filteredData.length; i++) {
      const item = filteredData[i]
      dataWithHeat[i] = {
        ...item,
        heatLevel: getHeatLevel(item.turnover, percentiles)
      }
    }
    
    return { data: dataWithHeat, percentiles }
  }

  const getHeatLevel = (turnover, percentiles) => {
    if (turnover === 0) return 0 // No activity
    if (turnover <= percentiles.p33) return 1 // Low performance
    if (turnover <= percentiles.p67) return 2 // Mid performance  
    return 3 // Strong performance
  }

  // Aggregate data by zone
  const getZoneAggregates = (filters) => {
    const filteredData = getFilteredData(filters)
    const zoneMap = new Map()

    filteredData.forEach(item => {
      const zone = item.zone || 'Unknown'
      if (!zoneMap.has(zone)) {
        zoneMap.set(zone, {
          zone,
          machines: new Set(),
          locations: new Set(),
          stroke: 0,
          turnover: 0,
          count: 0
        })
      }

      const zoneData = zoneMap.get(zone)
      zoneData.machines.add(item.blender_id)
      zoneData.locations.add(item.location)
      zoneData.stroke += item.stroke
      zoneData.turnover += item.turnover
      zoneData.count++
    })

    // Convert to array and calculate additional metrics
    return Array.from(zoneMap.values()).map(zone => ({
      ...zone,
      machineCount: zone.machines.size,
      bankCount: zone.locations.size,
      avgStroke: zone.stroke / zone.machineCount,
      avgTurnover: zone.turnover / zone.machineCount,
      machines: Array.from(zone.machines),
      locations: Array.from(zone.locations)
    }))
  }

  // Aggregate data by bank (location)
  const getBankAggregates = (filters, zoneFilter = null) => {
    let filteredData = getFilteredData(filters)

    if (zoneFilter) {
      filteredData = filteredData.filter(item => item.zone === zoneFilter)
    }

    const bankMap = new Map()

    filteredData.forEach(item => {
      const bankKey = `${item.zone}_${item.location}`
      if (!bankMap.has(bankKey)) {
        bankMap.set(bankKey, {
          location: item.location,
          zone: item.zone,
          machines: new Set(),
          stroke: 0,
          turnover: 0,
          count: 0
        })
      }

      const bankData = bankMap.get(bankKey)
      bankData.machines.add(item.blender_id)
      bankData.stroke += item.stroke
      bankData.turnover += item.turnover
      bankData.count++
    })

    return Array.from(bankMap.values()).map(bank => ({
      ...bank,
      machineCount: bank.machines.size,
      avgStroke: bank.stroke / bank.machineCount,
      avgTurnover: bank.turnover / bank.machineCount,
      machines: Array.from(bank.machines)
    }))
  }

  // Get unique locations for creating bank bounding boxes
  // For Tables: group by zone (e.g., "Pit 3")
  // For Slots/ETGs: group by location (e.g., "05F1")
  const getUniqueLocations = () => {
    const locations = new Set()
    const seenZones = new Set() // Track table zones we've already added

    casinoData.forEach(item => {
      if (item.machineType === 'Tables') {
        // For tables, group by zone only
        if (item.zone && !seenZones.has(item.zone)) {
          const key = `TABLE_${item.zone}` // Use special prefix to identify table zones
          locations.add(key)
          seenZones.add(item.zone)
        }
      } else {
        // For slots/ETGs, group by location
        if (item.location) {
          const key = `${item.zone}_${item.location}`
          locations.add(key)
        }
      }
    })

    return Array.from(locations).map(key => {
      if (key.startsWith('TABLE_')) {
        // This is a table zone
        const zone = key.replace('TABLE_', '')
        return { zone, location: null, key, isTableZone: true }
      } else {
        // This is a slot/ETG location
        const [zone, location] = key.split('_')
        return { zone, location, key, isTableZone: false }
      }
    })
  }

  // Get machines by location for spatial optimization
  const getMachinesByLocation = (zone, location) => {
    // Check if this is a table zone (location will be null for table zones)
    if (location === null) {
      // Return all tables in this zone
      return casinoData.filter(item => item.zone === zone && item.machineType === 'Tables')
    } else {
      // Return all machines in this specific location
      return casinoData.filter(item => item.zone === zone && item.location === location)
    }
  }

  // Get unique zones for creating bounding boxes
  const getUniqueZones = () => {
    const zones = new Set()
    casinoData.forEach(item => {
      if (item.zone) zones.add(item.zone)
    })
    return Array.from(zones)
  }

  // Get machines by zone for spatial optimization
  const getMachinesByZone = (zone) => {
    return casinoData.filter(item => item.zone === zone)
  }

  return {
    casinoData,
    loading,
    error,
    getDataByBlenderId,
    getFilteredData,
    getHeatMapData,
    getZoneAggregates,
    getBankAggregates,
    getUniqueZones,
    getMachinesByZone,
    getUniqueLocations,
    getMachinesByLocation
  }
}

export default useCasinoData