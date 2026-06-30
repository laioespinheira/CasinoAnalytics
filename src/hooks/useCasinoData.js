import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { parseGameFamily, buildTwoWordFamilyIndex } from '../utils/gameFamilies'

// Data-derived: 85% knee in peak-hour occupancy distribution (Fri/Sat 19-23, Sun 13-16).
// 22.7% of peak DD machine-hours run >= 0.85 - these are the demand-constrained slots.
export const OCCUPANCY_THRESHOLD = 0.85

const getBankKey = (row) => (
  row.machineType === 'Tables'
    ? `TABLE_${row.zone}`
    : `${row.zone}_${row.location}`
)

const bankLabelFromRow = (row) => (
  row.machineType === 'Tables' ? row.zone : (row.location || row.zone || 'Unknown')
)

const buildOccupancyDrivers = (rows, familyIndex) => {
  const occupiedRows = rows.filter((r) => r.occupancy != null && r.occupancy >= OCCUPANCY_THRESHOLD)
  const occupiedMachines = new Map()

  occupiedRows.forEach((r) => {
    if (!r.blender_id) return
    const label = bankLabelFromRow(r)
    if (!occupiedMachines.has(label)) occupiedMachines.set(label, new Set())
    occupiedMachines.get(label).add(r.blender_id)
  })

  const totalOccupied = new Set(
    occupiedRows.map((r) => r.blender_id).filter(Boolean)
  ).size

  const topBanks = Array.from(occupiedMachines.entries())
    .map(([label, machines]) => ({
      label,
      occupiedCount: machines.size,
      pctOfOccupied: totalOccupied > 0 ? (machines.size / totalOccupied) * 100 : 0
    }))
    .sort((a, b) => b.occupiedCount - a.occupiedCount)
    .slice(0, 5)

  let occupiedTurnover = 0
  const familyTurnover = new Map()
  occupiedRows.forEach((r) => {
    const t = r.turnover || 0
    if (t <= 0) return
    occupiedTurnover += t
    const fam = parseGameFamily(r.game_type, familyIndex)
    familyTurnover.set(fam, (familyTurnover.get(fam) || 0) + t)
  })

  const topGames = Array.from(familyTurnover.entries())
    .map(([name, turnover]) => ({
      name,
      turnover,
      pctOfOccupiedTurnover: occupiedTurnover > 0 ? (turnover / occupiedTurnover) * 100 : 0
    }))
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 5)

  return { topBanks, topGames, totalOccupied }
}

// 5-tier heat level (used by heat map helpers)
const getHeatLevel = (turnover, percentiles) => {
  if (turnover === 0) return 0
  if (turnover <= percentiles.p25) return 1
  if (turnover <= percentiles.p75) return 2
  if (turnover <= percentiles.p90) return 3
  return 4
}

const useCasinoData = () => {
  const [casinoData, setCasinoData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const filterCacheRef = useRef(new Map())

  useEffect(() => {
    filterCacheRef.current.clear()
  }, [casinoData])

  const familyIndex = useMemo(() => {
    const types = [...new Set(casinoData.map((r) => r.game_type).filter(Boolean))]
    return buildTwoWordFamilyIndex(types)
  }, [casinoData])

  useEffect(() => {
    const loadCasinoData = async () => {
      try {
        const response = await fetch('/assets/casino_data.json')
        if (!response.ok) {
          throw new Error('Failed to fetch casino data (run npm run build:data)')
        }

        const cols = await response.json()
        const MERGED_ZONES = new Set(['Zone D', 'Zone E', 'Zone F'])

        // The dataset is column-oriented ({ field: [...values] }). Reshape into
        // an array of row objects, one per index, preserving every field.
        const keys = Object.keys(cols)
        const n = keys.length > 0 && Array.isArray(cols[keys[0]]) ? cols[keys[0]].length : 0

        const normalized = new Array(n)
        for (let i = 0; i < n; i++) {
          const row = {}
          for (let k = 0; k < keys.length; k++) {
            const key = keys[k]
            row[key] = cols[key][i]
          }
          if (MERGED_ZONES.has(row.zone)) row.zone = 'Zone DD'
          row.turnover = parseFloat(row.turnover) || 0
          row.stroke = parseFloat(row.stroke) || 0
          normalized[i] = row
        }

        setCasinoData(normalized)
      } catch (err) {
        setError(err.message)
        console.error('Error loading casino data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCasinoData()
  }, [])

  const getDataByBlenderId = useCallback((blenderId) => {
    return casinoData.find(item => item.blender_id === blenderId)
  }, [casinoData])

  const getFilteredData = useCallback((filters) => {
    const key = JSON.stringify({
      zone: filters.zone ?? 'all',
      mt: (filters.machineType ?? []).slice().sort(),
      gt: filters.gameType ?? 'all',
      day: filters.dayOfWeek ?? 'all',
      hour: filters.hourOfDay,
      occ: filters.occupancy ?? 'all',
      we: filters.weekEnding ?? 'all'
    })
    const cache = filterCacheRef.current
    if (cache.has(key)) return cache.get(key)

    const baseFilteredData = casinoData.filter(item => {
      const zoneMatch = filters.zone === 'all' || item.zone === filters.zone
      const machineTypeMatch = !filters.machineType ||
        filters.machineType.length === 0 ||
        filters.machineType.includes(item.machineType)
      const gameTypeMatch = filters.gameType === 'all' || item.game_type === filters.gameType
      const dayOfWeekMatch = filters.dayOfWeek === 'all' || item.weekday === filters.dayOfWeek
      // A specific week-ending naturally excludes non-DD rows (their week_ending is null).
      const weekEndingMatch = !filters.weekEnding ||
        filters.weekEnding === 'all' ||
        item.week_ending === filters.weekEnding
      const hourOfDayMatch = filters.hourOfDay === 'all' ||
        item.hour === filters.hourOfDay ||
        item.hour === `${filters.hourOfDay}:00` ||
        item.hour === filters.hourOfDay.toString()

      return zoneMatch && machineTypeMatch && gameTypeMatch && dayOfWeekMatch && weekEndingMatch && hourOfDayMatch
    })

    // Occupancy is the measured field (fraction in [0,1]); non-DD rows have null
    // occupancy and are dropped whenever a specific occupancy filter is applied.
    const result = filters.occupancy && filters.occupancy !== 'all'
      ? baseFilteredData.filter(item => {
          if (item.occupancy == null) return false
          const occupied = item.occupancy >= OCCUPANCY_THRESHOLD
          return filters.occupancy === 'occupied' ? occupied : !occupied
        })
      : baseFilteredData

    if (cache.size > 16) cache.delete(cache.keys().next().value)
    cache.set(key, result)
    return result
  }, [casinoData])

  const aggregateRowsByBlenderId = useCallback((rows) => {
    const machineMap = new Map()
    for (let i = 0; i < rows.length; i++) {
      const item = rows[i]
      const k = item.blender_id
      if (!machineMap.has(k)) {
        machineMap.set(k, {
          ...item,
          turnover: 0,
          stroke: 0
        })
      }
      const machine = machineMap.get(k)
      machine.turnover += item.turnover
      machine.stroke += item.stroke
    }
    return Array.from(machineMap.values())
  }, [])

  const getHeatMapData = useCallback((filters) => {
    const heatMapFilters = { ...filters, occupancy: 'all' }
    const filteredData = getFilteredData(heatMapFilters)

    if (filteredData.length === 0) return { data: [], percentiles: null }

    const aggregatedData = aggregateRowsByBlenderId(filteredData)

    const turnovers = []
    for (let i = 0; i < aggregatedData.length; i++) {
      const turnover = aggregatedData[i].turnover
      if (turnover > 0) turnovers.push(turnover)
    }

    if (turnovers.length === 0) return { data: aggregatedData, percentiles: null }

    turnovers.sort((a, b) => a - b)

    const len = turnovers.length
    const percentiles = {
      p25: turnovers[Math.floor(len * 0.25)] || 0,
      p75: turnovers[Math.floor(len * 0.75)] || 0,
      p90: turnovers[Math.floor(len * 0.90)] || 0,
      max: turnovers[len - 1] || 0
    }

    const dataWithHeat = new Array(aggregatedData.length)
    for (let i = 0; i < aggregatedData.length; i++) {
      const item = aggregatedData[i]
      dataWithHeat[i] = {
        ...item,
        heatLevel: getHeatLevel(item.turnover, percentiles)
      }
    }

    return { data: dataWithHeat, percentiles }
  }, [getFilteredData, aggregateRowsByBlenderId])

  const getDailyHeatMapData = useCallback((filters) => {
    const dailyFilters = { ...filters, occupancy: 'all', hourOfDay: 'all' }
    const filteredData = getFilteredData(dailyFilters)

    if (filteredData.length === 0) return { data: [], percentiles: null }

    const aggregatedData = aggregateRowsByBlenderId(filteredData)

    const turnovers = []
    for (let i = 0; i < aggregatedData.length; i++) {
      const turnover = aggregatedData[i].turnover
      if (turnover > 0) turnovers.push(turnover)
    }

    if (turnovers.length === 0) return { data: aggregatedData, percentiles: null }

    turnovers.sort((a, b) => a - b)

    const len = turnovers.length
    const percentiles = {
      p25: turnovers[Math.floor(len * 0.25)] || 0,
      p75: turnovers[Math.floor(len * 0.75)] || 0,
      p90: turnovers[Math.floor(len * 0.90)] || 0,
      max: turnovers[len - 1] || 0
    }

    const dataWithHeat = new Array(aggregatedData.length)
    for (let i = 0; i < aggregatedData.length; i++) {
      const item = aggregatedData[i]
      dataWithHeat[i] = {
        ...item,
        heatLevel: getHeatLevel(item.turnover, percentiles)
      }
    }

    return { data: dataWithHeat, percentiles }
  }, [getFilteredData, aggregateRowsByBlenderId])

  const getZoneAggregates = useCallback((filters) => {
    const filteredData = getFilteredData(filters).filter(r => r.date != null)
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

    return Array.from(zoneMap.values()).map(zone => ({
      ...zone,
      machineCount: zone.machines.size,
      bankCount: zone.locations.size,
      avgStroke: zone.stroke / zone.machineCount,
      avgTurnover: zone.turnover / zone.machineCount,
      machines: Array.from(zone.machines),
      locations: Array.from(zone.locations)
    }))
  }, [getFilteredData])

  const getBankAggregates = useCallback((filters, zoneFilter = null) => {
    let filteredData = getFilteredData(filters).filter(r => r.date != null)

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
  }, [getFilteredData])

  const getDDBankRanking = useCallback((filters) => {
    const ddFilters = { ...filters, zone: 'Zone DD', occupancy: 'all' }
    const banks = getBankAggregates(ddFilters, 'Zone DD')
      .filter(bank => bank.machineCount > 0)
      .sort((a, b) => b.avgTurnover - a.avgTurnover)

    const ranking = new Map()
    banks.forEach((bank, index) => {
      const k = bank.location ? `Zone DD_${bank.location}` : 'TABLE_Zone DD'
      ranking.set(k, {
        ...bank,
        rank: index + 1,
        total: banks.length,
        percentile: banks.length > 1 ? 1 - (index / (banks.length - 1)) : 1
      })
    })

    return ranking
  }, [getBankAggregates])

  const getBankRankings = useCallback((filters) => {
    const rows = getFilteredData({ ...filters, occupancy: 'all' }).filter(r => r.date != null)
    const bankMap = new Map()

    rows.forEach(row => {
      const isTable = row.machineType === 'Tables'
      const key = getBankKey(row)
      if (!bankMap.has(key)) {
        bankMap.set(key, {
          key,
          zone: row.zone,
          location: isTable ? null : row.location,
          isTableZone: isTable,
          machines: new Set(),
          turnover: 0,
          stroke: 0,
          occSum: 0,
          occCount: 0
        })
      }
      const bank = bankMap.get(key)
      bank.machines.add(row.blender_id)
      bank.turnover += row.turnover
      bank.stroke += row.stroke || 0
      // Real fill rate: mean of measured occupancy fractions, matching the
      // Occupancy panel headline (not "share of machine-hours with any turnover").
      if (row.occupancy != null) {
        bank.occSum += row.occupancy
        bank.occCount += 1
      }
    })

    const banks = Array.from(bankMap.values()).map(bank => ({
      key: bank.key,
      zone: bank.zone,
      location: bank.location,
      isTableZone: bank.isTableZone,
      machineCount: bank.machines.size,
      turnover: bank.turnover,
      stroke: bank.stroke,
      avgTurnover: bank.machines.size > 0 ? bank.turnover / bank.machines.size : 0,
      occupancyPct: bank.occCount > 0 ? (bank.occSum / bank.occCount) * 100 : 0
    }))

    const byZone = new Map()
    banks.forEach(bank => {
      if (!byZone.has(bank.zone)) byZone.set(bank.zone, [])
      byZone.get(bank.zone).push(bank)
    })

    const rankings = new Map()
    byZone.forEach(zoneBanks => {
      zoneBanks.sort((a, b) => b.avgTurnover - a.avgTurnover)
      const sorted = zoneBanks.map(b => b.avgTurnover).slice().sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const median = sorted.length === 0
        ? 0
        : sorted.length % 2 === 1
          ? sorted[mid]
          : (sorted[mid - 1] + sorted[mid]) / 2

      zoneBanks.forEach((bank, index) => {
        rankings.set(bank.key, {
          ...bank,
          rank: index + 1,
          total: zoneBanks.length,
          zoneMedianAvgTurnover: median
        })
      })
    })

    return rankings
  }, [getFilteredData])

  const getZoneOccupancy = useCallback((zone, filters) => {
    const rows = (zone === 'all' || zone === 'All zones'
      ? getFilteredData({ ...filters, occupancy: 'all' })
      : getFilteredData({ ...filters, zone, occupancy: 'all' })
    ).filter(r => r.date != null)
    // Headline: mean of actual occupancy fractions across the filtered DD rows.
    const validOccupancy = rows.filter(r => r.occupancy != null).map(r => r.occupancy)
    const avgOccupancy = validOccupancy.length
      ? validOccupancy.reduce((s, x) => s + x, 0) / validOccupancy.length
      : null

    // Per-machine mean occupancy (for distinct counts + the saturation stat).
    const machineMean = (m) => (m && m.n ? m.sum / m.n : null)
    const machineAgg = new Map() // id -> { sum, n }
    rows.forEach(row => {
      const id = row.blender_id
      if (id == null || id === '') return
      const m = machineAgg.get(id) || { sum: 0, n: 0 }
      if (row.occupancy != null) { m.sum += row.occupancy; m.n += 1 }
      machineAgg.set(id, m)
    })
    const totalMachines = machineAgg.size
    const saturatedMachines = [...machineAgg.values()]
      .filter(m => { const v = machineMean(m); return v != null && v >= OCCUPANCY_THRESHOLD })
      .length

    // Per (bank, machineType): distinct machines + mean of their machine-means.
    const groups = new Map()
    rows.forEach(row => {
      const id = row.blender_id
      if (id == null || id === '') return
      const machineType = row.machineType || 'Unknown'
      const bank = row.location || row.zone || 'Unknown'
      const gkey = `${bank}__${machineType}`

      if (!groups.has(gkey)) {
        groups.set(gkey, { bank, machineType, machines: new Map() })
      }
      const group = groups.get(gkey)
      const rec = group.machines.get(id) || { sum: 0, n: 0 }
      if (row.occupancy != null) { rec.sum += row.occupancy; rec.n += 1 }
      group.machines.set(id, rec)
    })

    const occupancyDrivers = buildOccupancyDrivers(rows, familyIndex)

    return {
      zone,
      totalMachines,
      saturatedMachines,
      occupiedMachines: saturatedMachines,
      avgOccupancy,
      pct: avgOccupancy != null ? avgOccupancy * 100 : 0,
      occupancyDrivers,
      byBreakdown: Array.from(groups.values())
        .map(group => {
          const means = [...group.machines.values()].map(machineMean).filter(v => v != null)
          const avg = means.length ? means.reduce((s, x) => s + x, 0) / means.length : null
          return {
            bank: group.bank,
            machineType: group.machineType,
            total: group.machines.size,
            avgOccupancy: avg,
            pct: avg != null ? avg * 100 : 0
          }
        })
        .sort((a, b) => {
          if (a.bank !== b.bank) return a.bank.localeCompare(b.bank)
          return a.machineType.localeCompare(b.machineType)
        })
    }
  }, [getFilteredData, familyIndex])

  const getMachineMetrics = useCallback((blenderId, filters) => {
    const catalog = casinoData.find((r) => r.blender_id === blenderId)
    const rows = getFilteredData({ ...filters, occupancy: 'all' })
      .filter((r) => r.date != null && r.blender_id === blenderId)
    if (!catalog) return null
    const primaryFromCatalog = catalog.game_type || 'Unknown'

    // No rows in the current filter: return a truthy sentinel rather than a
    // stale catalog/row[0] representative. Truthy so the `|| fallback` guards in
    // App.handleMachineClick / CasinoModel don't substitute stale data. Carries
    // the active filters because the detail card has no `filters` prop.
    if (!rows.length) {
      return {
        noData: true,
        blender_id: blenderId,
        machineFullName: catalog.machineFullName,
        location: catalog.location,
        zone: catalog.zone,
        machineType: catalog.machineType,
        game_type: primaryFromCatalog,
        gameType: primaryFromCatalog,
        activeFilters: {
          weekEnding: filters?.weekEnding ?? 'all',
          dayOfWeek: filters?.dayOfWeek ?? 'all',
          hourOfDay: filters?.hourOfDay ?? 'all'
        }
      }
    }

    const turnover = rows.reduce((s, r) => s + (r.turnover || 0), 0)
    const stroke = rows.reduce((s, r) => s + (r.stroke || 0), 0)
    const byGame = new Map()
    rows.forEach((r) => {
      const g = r.game_type || 'Unknown'
      byGame.set(g, (byGame.get(g) || 0) + (r.turnover || 0))
    })

    const gamesAtHour = Array.from(byGame.entries())
      .map(([name, t]) => ({ name, turnover: t }))
      .sort((a, b) => b.turnover - a.turnover)

    const primaryGame = gamesAtHour[0]?.name || rows[0].game_type || 'Unknown'

    return {
      ...rows[0],
      turnover,
      stroke,
      game_type: primaryGame,
      gameType: primaryGame,
      gameFamily: parseGameFamily(primaryGame, familyIndex),
      gamesAtHour: gamesAtHour.length > 1 ? gamesAtHour : undefined
    }
  }, [getFilteredData, casinoData, familyIndex])

  const getZoneGameMix = useCallback((zone, filters) => {
    const base = { ...filters, occupancy: 'all' }
    const rows = (zone && zone !== 'All'
      ? getFilteredData({ ...base, zone })
      : getFilteredData(base)
    ).filter(r => r.date != null)

    const gameMap = new Map()
    const machinesByGame = new Map()
    let totalTurnover = 0
    rows.forEach((r) => {
      const g = r.game_type || 'Unknown'
      const t = r.turnover || 0
      gameMap.set(g, (gameMap.get(g) || 0) + t)
      totalTurnover += t
      if (t > 0 && r.blender_id) {
        if (!machinesByGame.has(g)) machinesByGame.set(g, new Set())
        machinesByGame.get(g).add(r.blender_id)
      }
    })

    const games = Array.from(gameMap.entries())
      .map(([name, turnover]) => {
        const machineCount = machinesByGame.get(name)?.size ?? 0
        return {
          name,
          turnover,
          machineCount,
          machineIds: machinesByGame.has(name) ? [...machinesByGame.get(name)] : [],
          pct: totalTurnover > 0 ? (turnover / totalTurnover) * 100 : 0,
          turnoverPerMachine: machineCount > 0 ? turnover / machineCount : 0
        }
      })
      .sort((a, b) => b.turnover - a.turnover)

    const distinctMachines = new Set()
    rows.forEach((r) => {
      if (r.blender_id) distinctMachines.add(r.blender_id)
    })

    return {
      zone: zone || 'All',
      totalTurnover,
      totalMachines: distinctMachines.size,
      games
    }
  }, [getFilteredData])

  const getPerformanceInsights = useCallback((zone, filters) => {
    const base = { ...filters, occupancy: 'all' }
    const zoneFilter = zone && zone !== 'All' && zone !== 'All zones' ? zone : null
    const rows = (zoneFilter
      ? getFilteredData({ ...base, zone: zoneFilter })
      : getFilteredData(base)
    ).filter(r => r.date != null)

    let totalTurnover = 0
    const bankMap = new Map()
    const familyMap = new Map()
    const machineOccupancy = new Map()

    rows.forEach((r) => {
      const t = r.turnover || 0
      totalTurnover += t
      const key = getBankKey(r)
      const label = bankLabelFromRow(r)

      if (!bankMap.has(key)) {
        bankMap.set(key, {
          key,
          label,
          zone: r.zone,
          turnover: 0,
          machines: new Set(),
          occupiedRows: 0,
          totalRows: 0,
          familyTurnover: new Map()
        })
      }
      const bank = bankMap.get(key)
      bank.turnover += t
      bank.totalRows += 1
      if (t > 0) bank.occupiedRows += 1
      if (r.blender_id) bank.machines.add(r.blender_id)

      const fam = parseGameFamily(r.game_type, familyIndex)
      bank.familyTurnover.set(fam, (bank.familyTurnover.get(fam) || 0) + t)

      if (!familyMap.has(fam)) {
        familyMap.set(fam, {
          name: fam,
          turnover: 0,
          machines: new Set(),
          titles: new Set()
        })
      }
      const family = familyMap.get(fam)
      family.turnover += t
      if (r.game_type) family.titles.add(r.game_type)
      if (r.blender_id && t > 0) family.machines.add(r.blender_id)

      if (r.blender_id && !machineOccupancy.has(r.blender_id)) {
        machineOccupancy.set(r.blender_id, r.occupancy)
      }
    })

    const totalMachines = machineOccupancy.size
    const occupiedCount = [...machineOccupancy.values()].filter((o) => o != null && o >= OCCUPANCY_THRESHOLD).length
    const zoneOccupancyPct = totalMachines > 0 ? (occupiedCount / totalMachines) * 100 : 0

    const rankings = getBankRankings(filters)
    const banks = Array.from(bankMap.values())
      .map((bank) => {
        const rankEntry = rankings.get(bank.key)
        const machineCount = bank.machines.size
        return {
          key: bank.key,
          label: bank.label,
          turnover: bank.turnover,
          pct: totalTurnover > 0 ? (bank.turnover / totalTurnover) * 100 : 0,
          // Mean occupancy fill rate (matches getBankRankings / Occupancy panel).
          // Falls back to the old machine-hours-with-turnover share only if the
          // ranking entry is unavailable.
          occupancyPct: rankEntry?.occupancyPct
            ?? (bank.totalRows > 0 ? (bank.occupiedRows / bank.totalRows) * 100 : 0),
          machineCount,
          machineIds: [...bank.machines],
          avgTurnover: machineCount > 0 ? bank.turnover / machineCount : 0,
          rank: rankEntry?.rank ?? null,
          totalBanksInZone: rankEntry?.total ?? null,
          zoneMedianAvgTurnover: rankEntry?.zoneMedianAvgTurnover ?? 0
        }
      })
      .sort((a, b) => b.turnover - a.turnover)

    const gameFamilies = Array.from(familyMap.values())
      .map((f) => ({
        name: f.name,
        turnover: f.turnover,
        pct: totalTurnover > 0 ? (f.turnover / totalTurnover) * 100 : 0,
        machineCount: f.machines.size,
        machineIds: [...f.machines],
        titleCount: f.titles.size
      }))
      .sort((a, b) => b.turnover - a.turnover)

    const sortedBankTurnovers = banks.map((b) => b.turnover).sort((a, b) => b - a)
    const medianBankTurnover = sortedBankTurnovers.length > 0
      ? sortedBankTurnovers[Math.floor(sortedBankTurnovers.length / 2)]
      : 0

    const pockets = []
    banks.forEach((bank) => {
      const bankEntry = bankMap.get(bank.key)
      if (!bankEntry || bank.turnover <= 0) return
      let dominantName = ''
      let dominantTurnover = 0
      bankEntry.familyTurnover.forEach((ft, name) => {
        if (ft > dominantTurnover) {
          dominantTurnover = ft
          dominantName = name
        }
      })
      const dominantPct = bank.turnover > 0 ? (dominantTurnover / bank.turnover) * 100 : 0
      const inTopHalf = bank.turnover >= medianBankTurnover
      if (dominantPct >= 50 && inTopHalf) {
        pockets.push({
          bankKey: bank.key,
          bankLabel: bank.label,
          dominantName,
          dominantPct,
          bankTurnover: bank.turnover,
          bankPctOfZone: bank.pct,
          machineIds: bank.machineIds
        })
      }
    })
    pockets.sort((a, b) => b.bankTurnover - a.bankTurnover)
    const pocketsTop = pockets.slice(0, 5)

    const top3Pct = banks.slice(0, 3).reduce((s, b) => s + b.pct, 0)
    let verdict = 'mixed'
    let verdictDetail = 'Turnover is spread across many banks and game families.'

    if (top3Pct >= 60) {
      verdict = 'area'
      verdictDetail = `Top 3 banks = ${top3Pct.toFixed(0)}% of turnover — area is the main driver.`
    } else if (pocketsTop.length >= 2) {
      verdict = 'game_pockets'
      verdictDetail = `${pocketsTop.length} banks where one game family dominates play (see pockets below).`
    }

    const occupancyDrivers = buildOccupancyDrivers(rows, familyIndex)

    return {
      zone: zoneFilter || 'All',
      totalTurnover,
      totalMachines,
      zoneOccupancyPct,
      verdict,
      verdictDetail,
      banks,
      gameFamilies,
      pockets: pocketsTop,
      occupancyDrivers,
      games: getZoneGameMix(zone, filters).games
    }
  }, [getFilteredData, getBankRankings, getZoneGameMix, familyIndex])

  const getUniqueLocations = useCallback((filters = null) => {
    const rows = !filters || filters.zone === 'all' || filters.zone === undefined
      ? casinoData
      : getFilteredData({ ...filters, occupancy: 'all' })

    const locations = new Set()
    const seenZones = new Set()

    rows.forEach((item) => {
      if (item.machineType === 'Tables') {
        if (item.zone && !seenZones.has(item.zone)) {
          const key = `TABLE_${item.zone}`
          locations.add(key)
          seenZones.add(item.zone)
        }
      } else if (item.location) {
        const key = `${item.zone}_${item.location}`
        locations.add(key)
      }
    })

    return Array.from(locations).map((key) => {
      if (key.startsWith('TABLE_')) {
        const zone = key.replace('TABLE_', '')
        return { zone, location: null, key, isTableZone: true }
      }
      const idx = key.indexOf('_')
      const zone = key.slice(0, idx)
      const location = key.slice(idx + 1)
      return { zone, location, key, isTableZone: false }
    })
  }, [casinoData, getFilteredData])

  const getMachinesByLocation = useCallback((zone, location) => {
    if (location === null) {
      return casinoData.filter(item => item.zone === zone && item.machineType === 'Tables')
    }
    return casinoData.filter(item => item.zone === zone && item.location === location)
  }, [casinoData])

  const getUniqueZones = useCallback(() => {
    const zones = new Set()
    casinoData.forEach(item => {
      if (item.zone) zones.add(item.zone)
    })
    return Array.from(zones)
  }, [casinoData])

  const getMachinesByZone = useCallback((zone) => {
    return casinoData.filter(item => item.zone === zone)
  }, [casinoData])

  return {
    casinoData,
    loading,
    error,
    getDataByBlenderId,
    getFilteredData,
    getHeatMapData,
    getDailyHeatMapData,
    getZoneAggregates,
    getBankAggregates,
    getDDBankRanking,
    getBankRankings,
    getZoneOccupancy,
    getZoneGameMix,
    getPerformanceInsights,
    getMachineMetrics,
    getUniqueZones,
    getMachinesByZone,
    getUniqueLocations,
    getMachinesByLocation
  }
}

export default useCasinoData
