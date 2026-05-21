import React from 'react'

const MachineTooltip = ({ position, machineData, metricNote }) => {
  if (!machineData || !position) return null

  const gameTitle = machineData.game_type || machineData.gameType || 'Unknown'
  const gameFamily = machineData.gameFamily
  const gamesAtHour = machineData.gamesAtHour

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        pointerEvents: 'none',
        zIndex: 10000,
        minWidth: '220px',
        maxWidth: '320px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        animation: 'tooltipFadeIn 0.15s ease-out',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px',
        }}
      >
        {machineData.machineType}
      </div>

      <div
        style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '10px',
        }}
      >
        {machineData.machineFullName || machineData.blender_id}
      </div>

      <div
        style={{
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '4px' }}>Game</div>
        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#e0e7ff', lineHeight: 1.35 }}>
          {gameTitle}
        </div>
        {gameFamily && gameFamily !== gameTitle && (
          <div style={{ fontSize: '0.72rem', color: '#a5b4fc', marginTop: '4px' }}>
            Family: {gameFamily}
          </div>
        )}
        {gamesAtHour && gamesAtHour.length > 1 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '4px' }}>
              Multiple titles this hour
            </div>
            {gamesAtHour.slice(0, 3).map((g) => (
              <div
                key={g.name}
                style={{
                  fontSize: '0.68rem',
                  color: g.name === gameTitle ? '#c7d2fe' : '#6b7280',
                  lineHeight: 1.4,
                }}
              >
                {g.name === gameTitle ? '▸ ' : '· '}
                {g.name.length > 32 ? `${g.name.slice(0, 31)}…` : g.name}
                {' '}
                <span style={{ color: '#9ca3af' }}>
                  ${(g.turnover || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px' }}>Stroke</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#10b981' }}>
            {(machineData.stroke || 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px' }}>Turnover</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#3b82f6' }}>
            ${(machineData.turnover || 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px' }}>Location</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f59e0b' }}>
            {machineData.location || 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px' }}>Zone</div>
          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#8b5cf6' }}>
            {machineData.zone || 'N/A'}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.7rem',
          color: '#6b7280',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {machineData.day} • {machineData.hour} • {machineData.occupancy === 1 ? '🟢 Active' : '⚪ Idle'}
      </div>

      {metricNote && (
        <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '6px', lineHeight: 1.35 }}>
          {metricNote}
        </div>
      )}

      <div
        style={{
          fontSize: '0.65rem',
          color: '#6b7280',
          marginTop: '6px',
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        Click again for detailed view
      </div>

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default MachineTooltip