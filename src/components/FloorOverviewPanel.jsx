import React from 'react'

const FloorOverviewPanel = ({ metrics, zones, onZoneClick }) => {
  const panelStyles = {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }

  const sectionTitleStyles = {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px'
  }

  const metricCardStyles = {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb'
  }

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getChangeColor = (value) => {
    if (value > 0) return '#10b981'
    if (value < 0) return '#ef4444'
    return '#6b7280'
  }

  return (
    <div style={panelStyles}>
      {/* Overall Metrics */}
      <div>
        <div style={sectionTitleStyles}>Floor Performance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={metricCardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                  Turnover
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                  {formatCurrency(metrics.turnover.current)}
                </div>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: getChangeColor(metrics.turnover.change) }}>
                {formatPercentage(metrics.turnover.change)}
              </div>
            </div>
          </div>

          <div style={metricCardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                  Revenue
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                  {formatCurrency(metrics.revenue.current)}
                </div>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: getChangeColor(metrics.revenue.change) }}>
                {formatPercentage(metrics.revenue.change)}
              </div>
            </div>
          </div>

          <div style={metricCardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                  Theoretical Win
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                  {formatCurrency(metrics.theoWin.current)}
                </div>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: getChangeColor(metrics.theoWin.change) }}>
                {formatPercentage(metrics.theoWin.change)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Performance List */}
      <div>
        <div style={sectionTitleStyles}>Zone Performance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {zones.map((zone) => (
            <div
              key={zone.id}
              onClick={() => onZoneClick && onZoneClick(zone)}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.background = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.background = 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: zone.change >= 10 ? '#d1fae5' : zone.change >= 0 ? '#fef3c7' : '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  color: zone.change >= 10 ? '#10b981' : zone.change >= 0 ? '#f59e0b' : '#ef4444'
                }}>
                  {zone.name}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                    Zone {zone.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {formatCurrency(zone.revenue)}
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: getChangeColor(zone.change)
                }}>
                  {formatPercentage(zone.change)}
                </span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FloorOverviewPanel
