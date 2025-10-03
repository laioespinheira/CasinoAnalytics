import React, { useState, useEffect } from 'react'

const NavigationBar = ({ onFilterChange, casinoData, currentView, onViewChange, heatMapEnabled, setHeatMapEnabled, showBankLabels, setShowBankLabels }) => {
  const [filters, setFilters] = useState({
    zone: 'all',
    machineType: [], // Changed to array for multiple selection
    gameType: 'all',
    occupancy: 'vacant',
    dayOfWeek: 'all',
    hourOfDay: 'all' // Will be converted to number for slider
  })

  const [machineTypeDropdownOpen, setMachineTypeDropdownOpen] = useState(false)

  const [zones, setZones] = useState([])
  const [machineTypes, setMachineTypes] = useState([])
  const [gameTypes, setGameTypes] = useState([])
  const [daysOfWeek] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])

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
    if (hour === 'all') return 'All Hours'
    const numHour = parseInt(hour)
    if (numHour === 0) return '12:00 AM'
    if (numHour < 12) return `${numHour}:00 AM`
    if (numHour === 12) return '12:00 PM'
    return `${numHour - 12}:00 PM`
  }

  const mapSliderToHour = (sliderValue) => {
    if (sliderValue === '24') return 'all'
    const adjustedHour = (parseInt(sliderValue) + 6) % 24
    return adjustedHour
  }

  const mapHourToSlider = (hour) => {
    if (hour === 'all') return 24
    const sliderValue = (hour - 6 + 24) % 24
    return sliderValue
  }

  const handleHourChange = (value) => {
    const hourValue = mapSliderToHour(value)
    handleFilterChange('hourOfDay', hourValue)
  }

  const navStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
    borderBottom: '2px solid #475569',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '12px 20px'
  }

  const containerStyles = {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: currentView === '3d' ? 'column' : 'row',
    alignItems: currentView === '3d' ? 'stretch' : 'center',
    gap: currentView === '3d' ? '12px' : '20px',
    flexWrap: 'wrap'
  }

  const titleStyles = {
    color: '#ffffff',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '200px'
  }

  const iconStyles = {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    borderRadius: '8px',
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
    color: '#cbd5e1',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0
  }

  const selectStyles = {
    background: '#475569',
    border: '1px solid #64748b',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '0.875rem',
    padding: '6px 12px',
    minWidth: '120px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }

  const buttonStyles = {
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    border: 'none',
    borderRadius: '6px',
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
    background: '#475569',
    border: '1px solid #64748b',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '0.875rem',
    padding: '6px 12px',
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
    top: '100%',
    left: 0,
    right: 0,
    background: '#475569',
    border: '1px solid #64748b',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px',
    zIndex: 1000,
    maxHeight: '120px',
    overflowY: 'auto'
  }

  const dropdownItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  }

  const sliderContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '160px'
  }

  const sliderStyles = {
    width: '100%',
    height: '6px',
    background: '#64748b',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none'
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
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    input[type="range"]::-moz-range-thumb {
      height: 16px;
      width: 16px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    input[type="range"]::-webkit-slider-track {
      background: linear-gradient(to right, #3b82f6 0%, #3b82f6 var(--value), #64748b var(--value), #64748b 100%);
      height: 6px;
      border-radius: 3px;
    }
  `

  const sliderLabelStyles = {
    color: '#cbd5e1',
    fontSize: '0.875rem',
    textAlign: 'center',
    fontWeight: '500'
  }

  return (
    <>
      <style>{sliderCSS}</style>
      <nav style={navStyles}>
        <div style={containerStyles}>
        {/* Title and View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={titleStyles}>
            <div style={iconStyles}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'white' }}>
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            Casino Analytics
          </h1>

          {/* View Toggle Buttons */}
          <div style={{ display: 'flex', background: '#475569', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => onViewChange('analytics')}
              style={{
                background: currentView === 'analytics' ? '#3b82f6' : 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => onViewChange('3d')}
              style={{
                background: currentView === '3d' ? '#3b82f6' : 'transparent',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              🏢 3D View
            </button>
          </div>
        </div>

        {/* Filters - Only show in 3D view */}
        {currentView === '3d' && (
        <div style={filtersContainerStyles}>
          {/* Zone Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Zone</label>
            <select
              value={filters.zone}
              onChange={(e) => handleFilterChange('zone', e.target.value)}
              style={selectStyles}
              onMouseEnter={(e) => e.target.style.background = '#64748b'}
              onMouseLeave={(e) => e.target.style.background = '#475569'}
            >
              <option value="all">All Zones</option>
              {zones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Machine Type Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Machine Type</label>
            <div style={dropdownContainerStyles} className="machine-type-dropdown">
              <button
                style={dropdownButtonStyles}
                onClick={() => setMachineTypeDropdownOpen(!machineTypeDropdownOpen)}
                onMouseEnter={(e) => e.target.style.background = '#64748b'}
                onMouseLeave={(e) => e.target.style.background = '#475569'}
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
                      onMouseEnter={(e) => e.target.style.background = '#64748b'}
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
            <select
              value={filters.gameType}
              onChange={(e) => handleFilterChange('gameType', e.target.value)}
              style={selectStyles}
              onMouseEnter={(e) => e.target.style.background = '#64748b'}
              onMouseLeave={(e) => e.target.style.background = '#475569'}
            >
              <option value="all">All Games</option>
              {gameTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Occupancy Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Occupancy</label>
            <select
              value={filters.occupancy}
              onChange={(e) => handleFilterChange('occupancy', e.target.value)}
              style={selectStyles}
              onMouseEnter={(e) => e.target.style.background = '#64748b'}
              onMouseLeave={(e) => e.target.style.background = '#475569'}
            >
              <option value="all">All</option>
              <option value="occupied">🔴 Occupied</option>
              <option value="vacant">⚪ Vacant</option>
            </select>
          </div>

          {/* Day Filter */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Day</label>
            <select
              value={filters.dayOfWeek}
              onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
              style={selectStyles}
              onMouseEnter={(e) => e.target.style.background = '#64748b'}
              onMouseLeave={(e) => e.target.style.background = '#475569'}
            >
              <option value="all">All Days</option>
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day.slice(0, 3)}</option>
              ))}
            </select>
          </div>

          {/* Hour Filter - Slider */}
          <div style={filterGroupStyles}>
            <label style={labelStyles}>Hour</label>
            <div style={sliderContainerStyles}>
              <input
                type="range"
                min="0"
                max="24"
                value={mapHourToSlider(filters.hourOfDay)}
                onChange={(e) => handleHourChange(e.target.value)}
                style={sliderStyles}
              />
              <div style={sliderLabelStyles}>
                {formatHourDisplay(filters.hourOfDay)}
              </div>
            </div>
          </div>

          {/* Heat Map Toggle */}
          <button
            onClick={() => setHeatMapEnabled(!heatMapEnabled)}
            style={{
              ...buttonStyles,
              background: heatMapEnabled
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'linear-gradient(135deg, #64748b, #475569)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {heatMapEnabled ? 'Heat Map ON' : 'Heat Map OFF'}
          </button>

          {/* Bank Labels Toggle */}
          {setShowBankLabels && (
            <button
              onClick={() => setShowBankLabels(!showBankLabels)}
              style={{
                ...buttonStyles,
                background: showBankLabels
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : 'linear-gradient(135deg, #64748b, #475569)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {showBankLabels ? 'Labels ON' : 'Labels OFF'}
            </button>
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
                hourOfDay: 'all'
              }
              setFilters(defaultFilters)
              onFilterChange(defaultFilters)
            }}
            style={buttonStyles}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #b91c1c, #991b1b)'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)'
              e.target.style.transform = 'translateY(0)'
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