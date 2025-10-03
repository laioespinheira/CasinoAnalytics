import React from 'react'

const BankPanel = ({ bankData, onClose }) => {
  if (!bankData) return null

  const formatNumber = (num) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(0)}`
  }

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
          zIndex: 9997,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '110px',
          right: 0,
          bottom: 0,
          width: '400px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.1)',
          zIndex: 9998,
          overflow: 'auto',
          animation: 'slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          padding: '24px',
          position: 'sticky',
          top: 0,
          zIndex: 1
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

          {/* Title */}
          <div style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px'
          }}>
            {bankData.isTableZone ? 'Table Zone Performance' : 'Bank Performance'}
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'white'
          }}>
            {bankData.location}
          </h2>
          {!bankData.isTableZone && (
            <div style={{
              fontSize: '0.875rem',
              color: '#9ca3af',
              marginTop: '4px'
            }}>
              Zone: {bankData.zone}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Machine Count */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: '#111827',
              marginBottom: '4px'
            }}>
              {bankData.machineCount}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '600'
            }}>
              {bankData.isTableZone ? 'Total Tables' : 'Total Machines'}
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Stroke */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.9,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total Stroke (Bets)
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '8px'
              }}>
                {(bankData.stroke || 0).toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.875rem',
                opacity: 0.9
              }}>
                Avg: {(bankData.avgStroke || 0).toLocaleString()} per {bankData.isTableZone ? 'table' : 'machine'}
              </div>
            </div>

            {/* Total Turnover */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white'
            }}>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.9,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total Turnover
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '8px'
              }}>
                {formatNumber(bankData.turnover || 0)}
              </div>
              <div style={{
                fontSize: '0.875rem',
                opacity: 0.9
              }}>
                Avg: {formatNumber(bankData.avgTurnover || 0)} per {bankData.isTableZone ? 'table' : 'machine'}
              </div>
            </div>

            {/* Average Bet Size */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600'
              }}>
                Average Bet Size
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#111827'
              }}>
                {bankData.stroke > 0
                  ? formatNumber(bankData.turnover / bankData.stroke)
                  : '$0'}
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div style={{
            background: 'white',
            border: '2px solid #f3f4f6',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Quick Insights
            </h3>

            <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '8px' }}>
                • <strong>{bankData.machineCount}</strong> {bankData.isTableZone ? 'tables' : 'machines'} in this {bankData.isTableZone ? 'zone' : 'location'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                • <strong>{(bankData.stroke || 0).toLocaleString()}</strong> total bets placed
              </div>
              <div>
                • <strong>{formatNumber(bankData.turnover || 0)}</strong> total wagered
              </div>
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

export default BankPanel
