import React from 'react'
import { OCCUPANCY_THRESHOLD } from '../hooks/useCasinoData'

const MachineDetailCard = ({ machineData, onClose }) => {
  if (!machineData) return null

  // No data for this machine under the active filters: show identity + a clear
  // message instead of stale metrics. Metric tiles are hidden entirely.
  if (machineData.noData) {
    const f = machineData.activeFilters || {}
    const parts = []
    if (f.weekEnding && f.weekEnding !== 'all') parts.push(`Week ending ${f.weekEnding}`)
    if (f.dayOfWeek && f.dayOfWeek !== 'all') parts.push(f.dayOfWeek)
    if (f.hourOfDay != null && f.hourOfDay !== 'all') parts.push(`${f.hourOfDay}:00`)
    const filterText = parts.length ? parts.join(' • ') : 'the current filters'

    return (
      <>
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
          <div style={{
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            padding: '24px',
            borderRadius: '16px 16px 0 0',
            position: 'relative'
          }}>
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
              {machineData.machineType || 'Machine'}
            </div>

            <h2 style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '8px'
            }}>
              {machineData.machineFullName || machineData.blender_id}
            </h2>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.875rem',
              color: '#9ca3af'
            }}>
              <span>Location: {machineData.location || 'Unknown'}</span>
              <span>•</span>
              <span>Zone: {machineData.zone || 'Unknown'}</span>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px'
              }}>
                No data for this machine in the selected filters
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '16px'
              }}>
                {filterText}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#9ca3af'
              }}>
                Try a different week or day.
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
            from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>
      </>
    )
  }

  const avgBetSize = machineData.avg_bet != null
    ? Number(machineData.avg_bet).toFixed(2)
    : machineData.stroke > 0
      ? (machineData.turnover / machineData.stroke).toFixed(2)
      : '0.00'

  const occupancyLabel = machineData.occupancy == null
    ? '—'
    : `${Math.round(machineData.occupancy * 100)}%`
  const isOccupied = machineData.occupancy != null && machineData.occupancy >= OCCUPANCY_THRESHOLD
  const winValue = machineData.win
  const dominantTier = machineData.dominant_tier

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
            {machineData.machineType}
          </div>

          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '0.65rem', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Game
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#e0e7ff', lineHeight: 1.35 }}>
              {machineData.game_type || machineData.gameType || 'Unknown'}
            </div>
            {machineData.gameFamily && machineData.gameFamily !== (machineData.game_type || machineData.gameType) && (
              <div style={{ fontSize: '0.8rem', color: '#c7d2fe', marginTop: '4px' }}>
                Family: {machineData.gameFamily}
              </div>
            )}
            {machineData.gamesAtHour && machineData.gamesAtHour.length > 1 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '6px' }}>
                  Multiple titles this hour
                </div>
                {machineData.gamesAtHour.map((g) => (
                  <div key={g.name} style={{ fontSize: '0.75rem', color: '#d1d5db', marginBottom: '4px' }}>
                    {g.name} — ${(g.turnover || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Machine ID */}
          <h2 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px'
          }}>
            {machineData.machineFullName || machineData.blender_id}
          </h2>

          {/* Location, Zone & Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.875rem',
            color: '#9ca3af'
          }}>
            <span>Location: {machineData.location || 'Unknown'}</span>
            <span>•</span>
            <span>Zone: {machineData.zone || 'Unknown'}</span>
            <span>•</span>
            <span style={{
              color: isOccupied ? '#10b981' : '#6b7280'
            }}>
              {occupancyLabel} occupied
            </span>
            {dominantTier && (
              <>
                <span>•</span>
                <span style={{ color: '#fbbf24', fontWeight: 600, letterSpacing: '0.04em' }}>
                  {dominantTier}
                </span>
              </>
            )}
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
            {/* Stroke */}
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
                Stroke (Bets)
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#10b981',
                marginBottom: '4px'
              }}>
                {(machineData.stroke || 0).toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Total Rounds
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

            {/* Average Bet Size */}
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
                Avg Bet Size
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#f59e0b',
                marginBottom: '4px'
              }}>
                ${avgBetSize}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Per Round
              </div>
            </div>

            {/* Location */}
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
                Location
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: '#8b5cf6',
                marginBottom: '4px'
              }}>
                {machineData.location || 'N/A'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Bank/Table
              </div>
            </div>

            {/* Win */}
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
                Win
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: winValue != null && winValue < 0 ? '#ef4444' : '#10b981',
                marginBottom: '4px'
              }}>
                {winValue == null ? '—' : `$${Number(winValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                House Win
              </div>
            </div>

            {/* Occupancy */}
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
                Occupancy
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: isOccupied ? '#10b981' : '#6b7280',
                marginBottom: '4px'
              }}>
                {occupancyLabel}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Seat Utilisation
              </div>
            </div>
          </div>

          {/* Time Info */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#111827' }}>Day:</strong> {machineData.weekday || machineData.day || 'Unknown'}
            </div>
            <div>
              <strong style={{ color: '#111827' }}>Hour:</strong> {machineData.hour || 'N/A'}
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
