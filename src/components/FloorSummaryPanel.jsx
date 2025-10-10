import React from 'react'

const FloorSummaryPanel = ({ metrics, comparisonPeriod }) => {
  const panelStyles = {
    position: 'fixed',
    left: '20px',
    top: '120px',
    width: '380px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '20px',
    zIndex: 1000
  }

  const getComparisonLabel = () => {
    switch (comparisonPeriod) {
      case 'previousYear':
        return 'Previous Year (Oct 2024)'
      case '4weekAvg':
        return '4-Week Average'
      case 'budget':
        return 'Budget/Target'
      case 'custom':
        return 'Custom Period'
      default:
        return 'Previous Year'
    }
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
    if (value > 0) return '#10b981' // green
    if (value < 0) return '#ef4444' // red
    return '#6b7280' // gray
  }

  const getArrowIcon = (value) => {
    if (value > 0) {
      return (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    }
    if (value < 0) {
      return (
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    }
    return (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b7280' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
      </svg>
    )
  }

  return (
    <div style={panelStyles}>
      {/* Header */}
      <div style={{
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f3f4f6'
      }}>
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#3b82f6' }}>
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
          Floor Performance
        </h3>
        <p style={{
          margin: 0,
          fontSize: '0.75rem',
          color: '#6b7280'
        }}>
          Comparing to: {getComparisonLabel()}
        </p>
      </div>

      {/* Metrics */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Turnover */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '4px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Turnover
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827'
            }}>
              {formatCurrency(metrics.turnover.current)}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: getChangeColor(metrics.turnover.change)
          }}>
            {getArrowIcon(metrics.turnover.change)}
            {formatPercentage(metrics.turnover.change)}
          </div>
        </div>

        {/* Revenue */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '4px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Revenue
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827'
            }}>
              {formatCurrency(metrics.revenue.current)}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: getChangeColor(metrics.revenue.change)
          }}>
            {getArrowIcon(metrics.revenue.change)}
            {formatPercentage(metrics.revenue.change)}
          </div>
        </div>

        {/* Theoretical Win */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '4px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Theo Win
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827'
            }}>
              {formatCurrency(metrics.theoWin.current)}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: getChangeColor(metrics.theoWin.change)
          }}>
            {getArrowIcon(metrics.theoWin.change)}
            {formatPercentage(metrics.theoWin.change)}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

      {/* Best/Worst Zones */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              marginBottom: '4px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              Best Zone
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#10b981'
            }}>
              {metrics.bestZone.name}
              <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>
                ({formatPercentage(metrics.bestZone.change)})
              </span>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              marginBottom: '4px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              Worst Zone
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#ef4444'
            }}>
              {metrics.worstZone.name}
              <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>
                ({formatPercentage(metrics.worstZone.change)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FloorSummaryPanel
