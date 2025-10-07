import React from 'react'

const ViewModeSelector = ({ currentMode, onModeChange }) => {
  const modes = [
    {
      id: 'heatmap',
      label: 'Performance Heatmap',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'time',
      label: 'Time Analysis',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'comparison',
      label: 'Comparison',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'overall',
      label: 'Overall Performance',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ]

  const containerStyles = {
    position: 'fixed',
    top: '90px',
    right: '20px',
    zIndex: 1001,
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: '1px solid #e5e7eb'
  }

  const headerStyles = {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    paddingLeft: '4px'
  }

  const buttonStyles = (isActive) => ({
    background: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#ffffff' : '#6b7280',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    whiteSpace: 'nowrap'
  })

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>View Mode</div>
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          style={buttonStyles(currentMode === mode.id)}
          onMouseEnter={(e) => {
            if (currentMode !== mode.id) {
              e.target.style.background = '#f3f4f6'
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== mode.id) {
              e.target.style.background = 'transparent'
            }
          }}
        >
          {mode.icon}
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ViewModeSelector
