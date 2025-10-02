import React from 'react'

const MachineDetailCard = ({ machineData, onClose }) => {
  if (!machineData) return null

  const holdPercent = machineData.turnover > 0
    ? ((machineData.revenue / machineData.turnover) * 100).toFixed(2)
    : '0.00'

  const wpm = machineData.patronHours > 0
    ? (machineData.revenue / machineData.patronHours).toFixed(2)
    : '0.00'

  const tpm = machineData.patronHours > 0
    ? (machineData.turnover / machineData.patronHours).toFixed(2)
    : '0.00'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflow: 'auto',
          animation: 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          padding: '24px',
          borderRadius: '16px 16px 0 0',
          position: 'relative'
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

          {/* Machine Type Badge */}
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
            {machineData.machineType} • {machineData.gameType}
          </div>

          {/* Machine ID */}
          <h2 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px'
          }}>
            {machineData.blender_id}
          </h2>

          {/* Zone & Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.875rem',
            color: '#9ca3af'
          }}>
            <span>Zone: {machineData.zone || 'Unknown'}</span>
            <span>•</span>
            <span style={{
              color: machineData.occupancy === 1 ? '#10b981' : '#6b7280'
            }}>
              {machineData.occupancy === 1 ? '🟢 Active' : '⚪ Idle'}
            </span>
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
            {/* Revenue */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Revenue
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#10b981',
                marginBottom: '4px'
              }}>
                ${(machineData.revenue || 0).toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Current Period
              </div>
            </div>

            {/* Turnover */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Turnover
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>
                ${(machineData.turnover || 0).toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Total Wagered
              </div>
            </div>

            {/* Hold % */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Hold %
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#f59e0b',
                marginBottom: '4px'
              }}>
                {holdPercent}%
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Win Rate
              </div>
            </div>

            {/* Patron Hours */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Patron Hours
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#8b5cf6',
                marginBottom: '4px'
              }}>
                {(machineData.patronHours || 0).toFixed(1)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Play Time
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div style={{
            background: 'white',
            border: '2px solid #f3f4f6',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Performance Metrics
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {/* WPM */}
              <div style={{
                padding: '12px',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fbbf24'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#92400e', marginBottom: '4px' }}>
                  Win Per Machine (WPM)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#78350f' }}>
                  ${wpm}
                </div>
              </div>

              {/* TPM */}
              <div style={{
                padding: '12px',
                background: '#dbeafe',
                borderRadius: '8px',
                border: '1px solid #3b82f6'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#1e3a8a', marginBottom: '4px' }}>
                  Turnover Per Machine (TPM)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e40af' }}>
                  ${tpm}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#111827' }}>Day:</strong> {machineData.dayOfWeek || 'Unknown'}
            </div>
            <div>
              <strong style={{ color: '#111827' }}>Hour:</strong> {machineData.hourOfDay || 'N/A'}:00
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  )
}

export default MachineDetailCard
