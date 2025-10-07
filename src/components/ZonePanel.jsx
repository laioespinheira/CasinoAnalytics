import React from 'react'

const ZonePanel = ({ zoneData, onClose }) => {
  if (!zoneData) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Side Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: '110px',
          bottom: 0,
          width: '420px',
          maxWidth: '90vw',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          overflowY: 'auto',
          animation: 'slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          padding: '24px',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.25rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ×
          </button>

          {/* Zone Badge */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#60a5fa',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px'
          }}>
            Zone Performance
          </div>

          {/* Zone Name */}
          <h2 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px'
          }}>
            {zoneData.zone}
          </h2>

          {/* Machine Count */}
          <div style={{
            fontSize: '0.875rem',
            color: '#9ca3af'
          }}>
            {zoneData.machineCount} Machines • {zoneData.bankCount} Banks
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Main Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Revenue */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid #f3f4f6'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Total Revenue
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#10b981',
                marginBottom: '4px'
              }}>
                ${(zoneData.revenue || 0).toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#6b7280'
              }}>
                Avg: ${(zoneData.avgRevenue || 0).toLocaleString()}
              </div>
            </div>

            {/* Total Turnover */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid #f3f4f6'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Total Turnover
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>
                ${(zoneData.turnover || 0).toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#6b7280'
              }}>
                Avg: ${(zoneData.avgTurnover || 0).toLocaleString()}
              </div>
            </div>

            {/* Hold % */}
            <div style={{
              background: '#fef3c7',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid #fbbf24'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#92400e',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Hold %
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#78350f'
              }}>
                {(zoneData.holdPercent || 0).toFixed(2)}%
              </div>
            </div>

            {/* Patron Hours */}
            <div style={{
              background: '#ede9fe',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid #8b5cf6'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#5b21b6',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Patron Hours
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#6b21a8'
              }}>
                {(zoneData.patronHours || 0).toFixed(0)}
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div style={{
            background: 'white',
            border: '2px solid #f3f4f6',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Performance Metrics
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Revenue per Machine */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>
                    Revenue per Machine
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
                    ${(zoneData.avgRevenue || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Turnover per Machine */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2px' }}>
                    Turnover per Machine
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
                    ${(zoneData.avgTurnover || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insight Box */}
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #3b82f6'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#1e40af',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              💡 Quick Insight
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#1e40af',
              lineHeight: '1.5'
            }}>
              This zone has <strong>{zoneData.machineCount} machines</strong> across <strong>{zoneData.bankCount} banks</strong> with an average hold percentage of <strong>{(zoneData.holdPercent || 0).toFixed(1)}%</strong>.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}

export default ZonePanel
