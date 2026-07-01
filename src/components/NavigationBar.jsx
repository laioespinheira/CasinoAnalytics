import React, { useState, useEffect, useMemo } from 'react'

const NavigationBar = ({ onFilterChange, casinoData, currentView, onViewChange, heatMapEnabled, setHeatMapEnabled, showBankLabels, setShowBankLabels, labelMode, setLabelMode, labelsOutliersOnly, setLabelsOutliersOnly, showInsightPanel, onToggleInsightPanel, showCustomerDemandPanel, onToggleCustomerDemandPanel, selectedTier, onTierChange, tierOptions = [], viewMode, onViewModeChange, externalFilters }) => {
  const [filters, setFilters] = useState({
    zone: 'all',
    machineType: [], // Changed to array for multiple selection
    gameType: 'all',
    occupancy: 'vacant',
    dayOfWeek: 'all',
    hourOfDay: 'all', // Will be converted to number for slider
    weekEnding: 'all'
  })

  const [machineTypeDropdownOpen, setMachineTypeDropdownOpen] = useState(false)
  const [hourChanging, setHourChanging] = useState(false)

  const [zones, setZones] = useState([])
  const [machineTypes, setMachineTypes] = useState([])
  const [gameTypes, setGameTypes] = useState([])
  const [daysOfWeek] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])

  // Unique week-ending dates from the dataset (DD rows only; non-DD have null), newest first.
  const weekEndings = useMemo(() => {
    if (!casinoData) return []
    const set = new Set()
    casinoData.forEach(r => { if (r.week_ending) set.add(r.week_ending) })
    return Array.from(set).sort().reverse()
  }, [casinoData])

  // Sync with external filters (from App.jsx arrow key changes)
  useEffect(() => {
    if (externalFilters) {
      setFilters(externalFilters)
      // Trigger flash effect when hour changes from external source
      setHourChanging(true)
      setTimeout(() => setHourChanging(false), 200)
    }
  }, [externalFilters?.hourOfDay])

  useEffect(() => {
    if (casinoData && casinoData.length > 0) {
      const uniqueZones = [...new Set(casinoData.map(item => item.zone))]
      const uniqueMachineTypes = [...new Set(casinoData.map(item => item.machineType))]
      const uniqueGameTypes = [...new Set(casinoData.map(item => item.game_type))]
      
      setZones(uniqueZones.sort())
      setMachineTypes(uniqueMachineTypes.sort())
      setGameTypes(uniqueGameTypes.sort())
    }
  }, [casinoData])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (machineTypeDropdownOpen && !event.target.closest('.machine-type-dropdown')) {
        setMachineTypeDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [machineTypeDropdownOpen])

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleMachineTypeChange = (machineType, checked) => {
    let newMachineTypes
    if (checked) {
      newMachineTypes = [...filters.machineType, machineType]
    } else {
      newMachineTypes = filters.machineType.filter(type => type !== machineType)
    }
    const newFilters = { ...filters, machineType: newMachineTypes }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const formatHourDisplay = (hour) => {
    const numHour = parseInt(hour)
    if (numHour === 0) return '12:00 AM'
    if (numHour < 12) return `${numHour}:00 AM`
    if (numHour === 12) return '12:00 PM'
    return `${numHour - 12}:00 PM`
  }

  const mapSliderToHour = (sliderValue) => {
    const adjustedHour = (parseInt(sliderValue) + 6) % 24
    return adjustedHour
  }

  const mapHourToSlider = (hour) => {
    const sliderValue = (hour - 6 + 24) % 24
    return sliderValue
  }

  const handleHourChange = (value) => {
    const hourValue = mapSliderToHour(value)
    handleFilterChange('hourOfDay', hourValue)

    // Flash effect when hour changes
    setHourChanging(true)
    setTimeout(() => setHourChanging(false), 200)
  }

  const navStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    padding: '16px 32px'
  }

  const containerStyles = {
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: currentView === '3d' ? 'column' : 'row',
    alignItems: currentView === '3d' ? 'stretch' : 'center',
    gap: currentView === '3d' ? '16px' : '24px',
    flexWrap: 'wrap',
    position: 'relative'
  }

  const titleStyles = {
    color: '#111827',
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '200px',
    letterSpacing: '-0.01em'
  }

  const iconStyles = {
    width: '28px',
    height: '28px',
    background: '#3b82f6',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const filtersContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    flex: 1
  }

  const filterGroupStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }

  const labelStyles = {
    color: '#6b7280',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0
  }

  const selectStyles = {
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#111827',
    fontSize: '0.875rem',
    padding: '8px 12px',
    minWidth: '120px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }

  const buttonStyles = {
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }

  const dropdownContainerStyles = {
    position: 'relative',
    display: 'inline-block'
  }

  const dropdownButtonStyles = {
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#111827',
    fontSize: '0.875rem',
    padding: '8px 12px',
    minWidth: '140px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  const dropdownListStyles = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }

  const dropdownItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    fontSize: '0.875rem',
    color: '#111827',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  }

  const sliderContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '320px',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #d1d5db'
  }

  const sliderStyles = {
    width: '100%',
    height: '6px',
    background: '#e5e7eb',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none',
    transition: 'all 0.2s ease'
  }

  // Add custom CSS for slider thumb
  const sliderCSS = `
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      height: 16px;
      width: 16px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    input[type="range"]::-moz-range-thumb {
      height: 16px;
      width: 16px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    input[type="range"]::-webkit-slider-track {
      background: linear-gradient(to right, #3b82f6 0%, #3b82f6 var(--value), #e5e7eb var(--value), #e5e7eb 100%);
      height: 6px;
      border-radius: 3px;
    }
  `
  const getSliderLabelStyles = (isChanging) => ({
    fontSize: '1rem',
    textAlign: 'center',
    fontWeight: '600',
    padding: '4px 8px',
    background: isChanging ? '#10b981' : '#3b82f6',
    color: '#ffffff',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    transform: isChanging ? 'scale(1.1)' : 'scale(1)',
    boxShadow: isChanging ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none'
  })

  return (
    <>
      <style>{sliderCSS}</style>
      <nav style={navStyles}>
        <div style={containerStyles}>
        {/* Logo on the left */}
        <h1 style={titleStyles}>
          <div style={iconStyles}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'white' }}>
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
          </div>
          Casino Analytics
        </h1>

        {/* View Toggle - Centered (only main tabs) */}
        <div style={{ position: 'absolute', left: '50%', display: 'flex', height: '47px' }}>
          <div style={{ transform: 'translateX(-50%)', display: 'flex', alignItems: 'stretch', height: '100%' }}>
            {/* Main Tabs - Always centered */}
            <button
              onClick={() => onViewChange('3d')}
              style={{
                background: 'transparent',
                color: currentView === '3d' ? '#111827' : '#9ca3af',
                border: 'none',
                borderBottom: '3px solid',
                borderBottomColor: currentView === '3d' ? '#3b82f6' : 'transparent',
                borderRadius: '0',
                padding: '10px 16px',
                fontSize: '1rem',
                fontWeight: currentView === '3d' ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'color 0.2s ease, border-color 0.2s ease',
                height: '100%',
                boxSizing: 'border-box'
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              3D View
            </button>
          </div>

          {/* 3D View Mode Submenu - Appears after centered tabs */}
          {currentView === '3d' && onViewModeChange && (
            <div style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
              <div style={{ width: '2px', background: '#3b82f6', height: '20px', alignSelf: 'center', margin: '0 16px' }} />

              <button
                onClick={() => onViewModeChange('overall')}
                style={{
                  background: viewMode === 'overall' ? '#eff6ff' : 'transparent',
                  color: viewMode === 'overall' ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  borderBottom: '3px solid',
                  borderBottomColor: viewMode === 'overall' ? '#3b82f6' : 'transparent',
                  borderRadius: '0',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'overall' ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box'
                }}
              >
                Overall
              </button>
              <button
                onClick={() => onViewModeChange('heatmap')}
                style={{
                  background: viewMode === 'heatmap' ? '#eff6ff' : 'transparent',
                  color: viewMode === 'heatmap' ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  borderBottom: '3px solid',
                  borderBottomColor: viewMode === 'heatmap' ? '#3b82f6' : 'transparent',
                  borderRadius: '0',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'heatmap' ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box'
                }}
              >
                Heatmap
              </button>
              <button
                onClick={() => onViewModeChange('comparison')}
                style={{
                  background: viewMode === 'comparison' ? '#eff6ff' : 'transparent',
                  color: viewMode === 'comparison' ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  borderBottom: '3px solid',
                  borderBottomColor: viewMode === 'comparison' ? '#3b82f6' : 'transparent',
                  borderRadius: '0',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'comparison' ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box'
                }}
              >
                Comparison
              </button>
              <button
                onClick={() => onViewModeChange('time')}
                style={{
                  background: viewMode === 'time' ? '#eff6ff' : 'transparent',
                  color: viewMode === 'time' ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  borderBottom: '3px solid',
                  borderBottomColor: viewMode === 'time' ? '#3b82f6' : 'transparent',
                  borderRadius: '0',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  fontWeight: viewMode === 'time' ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box'
                }}
              >
                Time
              </button>
            </div>
          )}
        </div>

        {/* Filters - Only show in 3D view */}
        {currentView === '3d' && (
        <div style={filtersContainerStyles}>
          {/* Zone Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Zone</label>
            <div style={dropdownContainerStyles}>
              <select
                value={filters.zone}
                onChange={(e) => handleFilterChange('zone', e.target.value)}
                style={{
                  ...selectStyles,
                  appearance: 'none',
                  paddingRight: '32px',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' fill='none' stroke='%236b7280' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
              >
                <option value="all">All Zones</option>
                {zones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Machine Type Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Machine Type</label>
            <div style={dropdownContainerStyles} className="machine-type-dropdown">
              <button
                style={dropdownButtonStyles}
                onClick={() => setMachineTypeDropdownOpen(!machineTypeDropdownOpen)}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
              >
                <span>
                  {filters.machineType.length === 0
                    ? 'All Types'
                    : filters.machineType.length === 1
                      ? filters.machineType[0]
                      : `${filters.machineType.length} selected`
                  }
                </span>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transform: machineTypeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {machineTypeDropdownOpen && (
                <div style={dropdownListStyles}>
                  {machineTypes.map(type => (
                    <div
                      key={type}
                      style={dropdownItemStyles}
                      onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={filters.machineType.includes(type)}
                        onChange={(e) => handleMachineTypeChange(type, e.target.checked)}
                        style={{ accentColor: '#3b82f6' }}
                      />
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Game Type Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Game Type</label>
            <div style={dropdownContainerStyles}>
              <select
                value={filters.gameType}
                onChange={(e) => handleFilterChange('gameType', e.target.value)}
                style={{
                  ...selectStyles,
                  appearance: 'none',
                  paddingRight: '32px',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' fill='none' stroke='%236b7280' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
              >
                <option value="all">All Games</option>
                {gameTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Tier Filter - Heatmap + Time modes (Customer Demand lens) */}
          {(viewMode === 'heatmap' || viewMode === 'time') && onTierChange && (
            <div style={filterGroupStyles}>
              <label style={labelStyles}>Customer Tier</label>
              <div style={dropdownContainerStyles}>
                <select
                  value={selectedTier || 'all'}
                  onChange={(e) => onTierChange(e.target.value)}
                  style={{
                    ...selectStyles,
                    appearance: 'none',
                    paddingRight: '32px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' fill='none' stroke='%236b7280' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '16px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
                >
                  <option value="all">All Tiers</option>
                  {tierOptions.map(t => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Occupancy Filter - REMOVED FROM UI - Keep filter logic for potential future use */}
          {/* {viewMode === 'heatmap' && (
            <div style={filterGroupStyles}>
              <label style={labelStyles}>Occupancy</label>
              <div style={dropdownContainerStyles}>
                <select
                  value={filters.occupancy}
                  onChange={(e) => handleFilterChange('occupancy', e.target.value)}
                  style={{
                    ...selectStyles,
                    appearance: 'none',
                    paddingRight: '32px',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' fill='none' stroke='%236b7280' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '16px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
                >
                  <option value="all">All</option>
                  <option value="occupied">🔴 Occupied</option>
                  <option value="vacant">⚪ Vacant</option>
                </select>
              </div>
            </div>
          )} */}

          {/* Week Ending Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Week Ending</label>
            <div style={dropdownContainerStyles}>
              <select
                value={typeof filters.weekEnding === 'string' ? filters.weekEnding : 'all'}
                onChange={(e) => handleFilterChange('weekEnding', e.target.value)}
                style={{
                  ...selectStyles,
                  appearance: 'none',
                  paddingRight: '32px',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' fill='none' stroke='%236b7280' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
              >
                <option value="all">All Weeks</option>
                {weekEndings.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Day Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Day</label>
            <div style={dropdownContainerStyles}>
              <select
                value={filters.dayOfWeek}
                onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                style={{
                  ...selectStyles,
                  appearance: 'none',
                  paddingRight: '32px',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' fill='none' stroke='%236b7280' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '16px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#f9fafb'}
              >
                {viewMode !== 'heatmap' && <option value="all">All Days</option>}
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day.slice(0, 3)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hour Filter - Slider - Only show in Heatmap mode */}
          {viewMode === 'heatmap' && (
            <div style={filterGroupStyles}>
              <label style={labelStyles}>Hour</label>
              <div style={sliderContainerStyles}>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={mapHourToSlider(filters.hourOfDay)}
                  onChange={(e) => handleHourChange(e.target.value)}
                  style={sliderStyles}
                />
                <div style={getSliderLabelStyles(hourChanging)}>
                  {formatHourDisplay(filters.hourOfDay)}
                </div>
              </div>
            </div>
          )}

          {/* Heat Map Toggle - Show in both Heatmap and Overall modes */}
          {(viewMode === 'heatmap' || viewMode === 'overall') && (
            <button
              onClick={() => setHeatMapEnabled(!heatMapEnabled)}
              style={{
                ...buttonStyles,
                background: heatMapEnabled ? '#10b981' : '#f3f4f6',
                color: heatMapEnabled ? '#ffffff' : '#6b7280',
                border: heatMapEnabled ? 'none' : '1px solid #d1d5db'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {heatMapEnabled ? 'Heat Map' : 'Heat Map'}
            </button>
          )}

          {/* Combined Insights Panel Toggle - Heatmap + Time modes */}
          {(viewMode === 'heatmap' || viewMode === 'time') && onToggleInsightPanel && (
            <button
              onClick={onToggleInsightPanel}
              style={{
                ...buttonStyles,
                background: showInsightPanel ? '#6366f1' : '#f3f4f6',
                color: showInsightPanel ? '#ffffff' : '#6b7280',
                border: showInsightPanel ? 'none' : '1px solid #d1d5db'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4V7m-9 8v-4m13 8H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z" />
              </svg>
              Insights
            </button>
          )}

          {/* Customer Demand Panel Toggle - Heatmap + Time modes */}
          {(viewMode === 'heatmap' || viewMode === 'time') && onToggleCustomerDemandPanel && (
            <button
              onClick={onToggleCustomerDemandPanel}
              style={{
                ...buttonStyles,
                background: showCustomerDemandPanel ? '#0ea5e9' : '#f3f4f6',
                color: showCustomerDemandPanel ? '#ffffff' : '#6b7280',
                border: showCustomerDemandPanel ? 'none' : '1px solid #d1d5db'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.83-4" />
              </svg>
              Customer Demand
            </button>
          )}

          {/* Bank Labels Toggle */}
          {setShowBankLabels && (
            <button
              onClick={() => setShowBankLabels(!showBankLabels)}
              style={{
                ...buttonStyles,
                background: showBankLabels ? '#3b82f6' : '#f3f4f6',
                color: showBankLabels ? '#ffffff' : '#6b7280',
                border: showBankLabels ? 'none' : '1px solid #d1d5db'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {showBankLabels ? 'Labels' : 'Labels'}
            </button>
          )}

          {showBankLabels && setLabelMode && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginLeft: 4 }}>
              {[
                { id: 'name', label: 'Name' },
                { id: 'avg', label: 'TO/Machine' },
                { id: 'occ', label: 'Occupancy' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLabelMode(opt.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: labelMode === opt.id ? '1px solid #a78bfa' : '1px solid #d1d5db',
                    background: labelMode === opt.id ? 'rgba(167, 139, 250, 0.18)' : '#ffffff',
                    color: labelMode === opt.id ? '#7c3aed' : '#6b7280'
                  }}
                >
                  {opt.label}
                </button>
              ))}
              {setLabelsOutliersOnly && (
                <button
                  type="button"
                  onClick={() => setLabelsOutliersOnly(!labelsOutliersOnly)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: labelsOutliersOnly ? '1px solid #f59e0b' : '1px solid #d1d5db',
                    background: labelsOutliersOnly ? 'rgba(245, 158, 11, 0.2)' : '#ffffff',
                    color: labelsOutliersOnly ? '#b45309' : '#6b7280'
                  }}
                >
                  Outliers only
                </button>
              )}
            </div>
          )}

          {/* Clear Button */}
          <button
            onClick={() => {
              const defaultFilters = {
                zone: 'all',
                machineType: [],
                gameType: 'all',
                occupancy: 'all',
                dayOfWeek: 'all',
                hourOfDay: 'all',
                weekEnding: 'all'
              }
              setFilters(defaultFilters)
              onFilterChange(defaultFilters)
            }}
            style={{
              ...buttonStyles,
              background: '#ef4444',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1'
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
        )}
      </div>
    </nav>
    </>
  )
}

export default NavigationBar