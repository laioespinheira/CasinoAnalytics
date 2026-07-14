import React from 'react'

// Yield-tab bank tooltip. DD banks only (App disables it for non-DD banks).
// Four-to-five plain-language lines, no jargon: bank id, machine count + product
// mix, peak occupancy (with the window), and for flagged banks the recommended
// product swap and its per-seat-hour gap.

const usd1 = (n) => (n == null ? '—' : `$${n.toFixed(1)}`)
const pct = (n) => (n == null ? '—' : `${(n * 100).toFixed(0)}%`)

const YieldBankTooltip = ({ position, info, fallbackLabel, weeks }) => {
  if (!position) return null
  const label = info?.bankLabel || fallbackLabel || 'Bank'
  const mix = info && info.parts && info.parts.length
    ? `${info.total} machines: ${info.parts.slice(0, 3).map((p) => `${p.count} ${p.family}`).join(', ')}${info.parts.length > 3 ? ', …' : ''}`
    : null

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
        width: 250,
        background: '#1a1d2a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTopColor: 'rgba(255,255,255,0.16)',
        borderRadius: 12,
        padding: '13px 15px',
        pointerEvents: 'none',
        zIndex: 10000,
        boxShadow: '0 24px 48px -16px rgba(0,0,0,0.5)',
        color: '#e5e7eb',
        fontFeatureSettings: '"tnum" 1'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{label}</span>
        {info?.flagged && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Flagged</span>
        )}
      </div>
      {mix && <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.35 }}>{mix}</div>}
      {info?.peakOcc != null && (
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: 5 }}>
          {pct(info.peakOcc)} full at peak · {weeks} wk
        </div>
      )}
      {info?.flagged && (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.76rem', color: '#e5e7eb' }}>
            {info.currentProduct} <span style={{ color: '#f59e0b', fontWeight: 700 }}>→ {info.betterProduct}</span>
          </div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>
            +{usd1(info.gap)} more per seat-hour
          </div>
        </div>
      )}
    </div>
  )
}

export default YieldBankTooltip
