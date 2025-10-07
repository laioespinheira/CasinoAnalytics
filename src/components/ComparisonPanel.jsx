import React from 'react'

const ComparisonPanel = ({
  comparisonPeriod,
  onComparisonChange,
  metrics,
  onMetricsChange,
  displayOptions,
  onDisplayOptionsChange
}) => {
  const panelStyles = {
    position: 'fixed',
    right: '20px',
    top: '120px',
    width: '320px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '20px',
    zIndex: 1000,
    maxHeight: 'calc(100vh - 140px)',
    overflowY: 'auto'
  }

  const sectionTitleStyles = {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
    marginTop: '16px'
  }

  const radioGroupStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  }

  const radioLabelStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background 0.2s ease',
    fontSize: '0.875rem'
  }

  const checkboxLabelStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginBottom: '8px'
  }

  const buttonStyles = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    marginRight: '8px',
    marginBottom: '8px'
  }

  return (
    <div style={panelStyles}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '2px solid #f3f4f6'
      }}>
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 style={{
          margin: 0,
          fontSize: '1rem',
          fontWeight: '600',
          color: '#111827'
        }}>
          Comparison Mode
        </h3>
      </div>

      {/* Compare To Section */}
      <div style={sectionTitleStyles}>Compare Current Period To:</div>
      <div style={radioGroupStyles}>
        <label
          style={{
            ...radioLabelStyles,
            background: comparisonPeriod === 'previousYear' ? '#eff6ff' : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (comparisonPeriod !== 'previousYear') e.currentTarget.style.background = '#f9fafb'
          }}
          onMouseLeave={(e) => {
            if (comparisonPeriod !== 'previousYear') e.currentTarget.style.background = 'transparent'
          }}
        >
          <input
            type="radio"
            name="comparison"
            value="previousYear"
            checked={comparisonPeriod === 'previousYear'}
            onChange={(e) => onComparisonChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: comparisonPeriod === 'previousYear' ? '#3b82f6' : '#111827', fontWeight: comparisonPeriod === 'previousYear' ? '600' : '400' }}>
            Previous Year
          </span>
        </label>

        <label
          style={{
            ...radioLabelStyles,
            background: comparisonPeriod === '4weekAvg' ? '#eff6ff' : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (comparisonPeriod !== '4weekAvg') e.currentTarget.style.background = '#f9fafb'
          }}
          onMouseLeave={(e) => {
            if (comparisonPeriod !== '4weekAvg') e.currentTarget.style.background = 'transparent'
          }}
        >
          <input
            type="radio"
            name="comparison"
            value="4weekAvg"
            checked={comparisonPeriod === '4weekAvg'}
            onChange={(e) => onComparisonChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: comparisonPeriod === '4weekAvg' ? '#3b82f6' : '#111827', fontWeight: comparisonPeriod === '4weekAvg' ? '600' : '400' }}>
            4-Week Average
          </span>
        </label>

        <label
          style={{
            ...radioLabelStyles,
            background: comparisonPeriod === 'budget' ? '#eff6ff' : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (comparisonPeriod !== 'budget') e.currentTarget.style.background = '#f9fafb'
          }}
          onMouseLeave={(e) => {
            if (comparisonPeriod !== 'budget') e.currentTarget.style.background = 'transparent'
          }}
        >
          <input
            type="radio"
            name="comparison"
            value="budget"
            checked={comparisonPeriod === 'budget'}
            onChange={(e) => onComparisonChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: comparisonPeriod === 'budget' ? '#3b82f6' : '#111827', fontWeight: comparisonPeriod === 'budget' ? '600' : '400' }}>
            Budget/Target
          </span>
        </label>

        <label
          style={{
            ...radioLabelStyles,
            background: comparisonPeriod === 'custom' ? '#eff6ff' : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (comparisonPeriod !== 'custom') e.currentTarget.style.background = '#f9fafb'
          }}
          onMouseLeave={(e) => {
            if (comparisonPeriod !== 'custom') e.currentTarget.style.background = 'transparent'
          }}
        >
          <input
            type="radio"
            name="comparison"
            value="custom"
            checked={comparisonPeriod === 'custom'}
            onChange={(e) => onComparisonChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: comparisonPeriod === 'custom' ? '#3b82f6' : '#111827', fontWeight: comparisonPeriod === 'custom' ? '600' : '400' }}>
            Custom Period
          </span>
        </label>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

      {/* Show Metrics Section */}
      <div style={sectionTitleStyles}>Show Metrics:</div>
      <div>
        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={metrics.turnover}
            onChange={(e) => onMetricsChange({ ...metrics, turnover: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: '#111827' }}>Turnover</span>
        </label>

        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={metrics.revenue}
            onChange={(e) => onMetricsChange({ ...metrics, revenue: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: '#111827' }}>Revenue</span>
        </label>

        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={metrics.theoWin}
            onChange={(e) => onMetricsChange({ ...metrics, theoWin: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: '#111827' }}>Theoretical Win</span>
        </label>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

      {/* Display Options Section */}
      <div style={sectionTitleStyles}>Display Options:</div>
      <div>
        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={displayOptions.showPercentageLabels}
            onChange={(e) => onDisplayOptionsChange({ ...displayOptions, showPercentageLabels: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: '#111827' }}>Show % change labels</span>
        </label>

        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={displayOptions.showArrows}
            onChange={(e) => onDisplayOptionsChange({ ...displayOptions, showArrows: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: '#111827' }}>Show improvement arrows</span>
        </label>

        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={displayOptions.highlightSignificant}
            onChange={(e) => onDisplayOptionsChange({ ...displayOptions, highlightSignificant: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: '#111827' }}>Highlight significant changes (&gt;15%)</span>
        </label>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

      {/* Quick Filters Section */}
      <div style={sectionTitleStyles}>Quick Filters:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <button
          style={{
            ...buttonStyles,
            background: displayOptions.filter === 'improved' ? '#3b82f6' : 'white',
            color: displayOptions.filter === 'improved' ? 'white' : '#111827',
            borderColor: displayOptions.filter === 'improved' ? '#3b82f6' : '#d1d5db'
          }}
          onClick={() => onDisplayOptionsChange({ ...displayOptions, filter: displayOptions.filter === 'improved' ? 'all' : 'improved' })}
          onMouseEnter={(e) => {
            if (displayOptions.filter !== 'improved') {
              e.currentTarget.style.background = '#f9fafb'
              e.currentTarget.style.borderColor = '#3b82f6'
            }
          }}
          onMouseLeave={(e) => {
            if (displayOptions.filter !== 'improved') {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#d1d5db'
            }
          }}
        >
          Show Only Improved
        </button>

        <button
          style={{
            ...buttonStyles,
            background: displayOptions.filter === 'declined' ? '#ef4444' : 'white',
            color: displayOptions.filter === 'declined' ? 'white' : '#111827',
            borderColor: displayOptions.filter === 'declined' ? '#ef4444' : '#d1d5db'
          }}
          onClick={() => onDisplayOptionsChange({ ...displayOptions, filter: displayOptions.filter === 'declined' ? 'all' : 'declined' })}
          onMouseEnter={(e) => {
            if (displayOptions.filter !== 'declined') {
              e.currentTarget.style.background = '#fef2f2'
              e.currentTarget.style.borderColor = '#ef4444'
            }
          }}
          onMouseLeave={(e) => {
            if (displayOptions.filter !== 'declined') {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#d1d5db'
            }
          }}
        >
          Show Only Declined
        </button>

        <button
          style={{
            ...buttonStyles,
            background: displayOptions.filter === 'all' ? '#10b981' : 'white',
            color: displayOptions.filter === 'all' ? 'white' : '#111827',
            borderColor: displayOptions.filter === 'all' ? '#10b981' : '#d1d5db'
          }}
          onClick={() => onDisplayOptionsChange({ ...displayOptions, filter: 'all' })}
          onMouseEnter={(e) => {
            if (displayOptions.filter !== 'all') {
              e.currentTarget.style.background = '#f0fdf4'
              e.currentTarget.style.borderColor = '#10b981'
            }
          }}
          onMouseLeave={(e) => {
            if (displayOptions.filter !== 'all') {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#d1d5db'
            }
          }}
        >
          Show All
        </button>
      </div>
    </div>
  )
}

export default ComparisonPanel
