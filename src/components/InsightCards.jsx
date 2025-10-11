import React from 'react'

const InsightCards = ({ insights, onInsightClick }) => {
  const cardContainerStyles = {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    overflowX: 'auto'
  }

  const cardStyles = (type) => ({
    flex: '1',
    minWidth: '320px',
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: type === 'warning' ? '2px solid #fbbf24' : type === 'success' ? '2px solid #10b981' : '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  })

  const iconStyles = (type) => ({
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    background: type === 'warning' ? '#fef3c7' : type === 'success' ? '#d1fae5' : '#eff6ff',
    color: type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'
  })

  const getIcon = (type) => {
    if (type === 'success') {
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    if (type === 'warning') {
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
    return (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  }

  return (
    <div style={cardContainerStyles}>
      {insights.map((insight, index) => (
        <div
          key={index}
          style={cardStyles(insight.type)}
          onClick={() => onInsightClick && onInsightClick(insight)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {/* Icon */}
          <div style={iconStyles(insight.type)}>
            {getIcon(insight.type)}
          </div>

          {/* Title */}
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#111827',
            lineHeight: '1.4'
          }}>
            {insight.title}
          </h3>

          {/* Description */}
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '0.875rem',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            {insight.description}
          </p>

          {/* Metric */}
          {insight.metric && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: insight.type === 'warning' ? '#f59e0b' : insight.type === 'success' ? '#10b981' : '#3b82f6'
              }}>
                {insight.metric}
              </span>
              {insight.change && (
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: insight.change.startsWith('+') ? '#10b981' : '#ef4444'
                }}>
                  {insight.change}
                </span>
              )}
            </div>
          )}

          {/* CTA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#3b82f6'
          }}>
            {insight.cta}
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}

export default InsightCards
