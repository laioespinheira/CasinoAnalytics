import React from 'react'
import InsightCards from './InsightCards'

const DashboardLayout = ({
  insights,
  onInsightClick,
  breadcrumb,
  leftPanel,
  rightPanel3D,
  showInsights = true
}) => {
  const layoutStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#ffffff'
  }

  const breadcrumbStyles = {
    padding: '12px 20px',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    color: '#6b7280'
  }

  const contentStyles = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  }

  const leftPanelStyles = {
    width: '450px',
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  }

  const rightPanelStyles = {
    flex: 1,
    position: 'relative',
    background: '#f9fafb'
  }

  return (
    <div style={layoutStyles}>
      {/* Insight Cards - Always visible */}
      {showInsights && (
        <InsightCards insights={insights} onInsightClick={onInsightClick} />
      )}

      {/* Breadcrumb Navigation */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div style={breadcrumbStyles}>
          <button
            onClick={breadcrumb[0].onBack}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: '#6b7280'
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              <span
                style={{
                  cursor: item.onClick ? 'pointer' : 'default',
                  color: index === breadcrumb.length - 1 ? '#111827' : '#6b7280',
                  fontWeight: index === breadcrumb.length - 1 ? '600' : '400'
                }}
                onClick={item.onClick}
              >
                {item.label}
              </span>
              {index < breadcrumb.length - 1 && (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#d1d5db' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div style={contentStyles}>
        {/* Left Panel - Data, Analytics, Insights */}
        <div style={leftPanelStyles}>
          {leftPanel}
        </div>

        {/* Right Panel - 3D View */}
        <div style={rightPanelStyles}>
          {rightPanel3D}
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
