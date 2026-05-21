import React from 'react'
import { formatCompactCurrency, formatDeltaPct } from '../utils/format'

// Semantic performance palette. Reserved for performance signalling only.
const PERF = {
  highBg: 'rgba(34, 197, 94, 0.16)',
  highFg: '#22c55e',
  midBg: 'rgba(245, 158, 11, 0.16)',
  midFg: '#f59e0b',
  lowBg: 'rgba(239, 68, 68, 0.16)',
  lowFg: '#ef4444',
  emptyBg: 'rgba(255, 255, 255, 0.06)',
  emptyFg: 'rgba(255, 255, 255, 0.2)'
}

// Affordance / focus color. Never used for performance.
const ACCENT = '#a78bfa'

const getRankTier = (rank, total) => {
  if (!rank || !total) return { bg: PERF.midBg, fg: PERF.midFg }
  const pct = rank / total
  if (pct <= 0.25) return { bg: PERF.highBg, fg: PERF.highFg }
  if (pct >= 0.75) return { bg: PERF.lowBg, fg: PERF.lowFg }
  return { bg: PERF.midBg, fg: PERF.midFg }
}

const CardShell = ({ positionStyle, children }) => (
  <div
    style={{
      position: 'fixed',
      ...positionStyle,
      width: 272,
      background: '#1a1d2a',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderTopColor: 'rgba(255, 255, 255, 0.14)',
      borderRadius: 14,
      padding: 18,
      pointerEvents: 'none',
      zIndex: 10000,
      boxShadow: '0 24px 48px -16px rgba(0,0,0,0.5), 0 8px 16px -8px rgba(0,0,0,0.4)',
      color: '#e5e7eb',
      fontFeatureSettings: '"tnum" 1, "lnum" 1',
      animation: 'tooltipFadeIn 0.15s ease-out'
    }}
  >
    {children}
    <style>{`
      @keyframes tooltipFadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
)

const BankIdentity = ({ bankName, zoneLabel, bankData }) => {
  const rankTier = getRankTier(bankData?.rank, bankData?.total)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {bankName || 'Unknown Bank'}
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.5)',
          marginTop: 2,
          letterSpacing: '0.04em'
        }}>
          {zoneLabel.toUpperCase()}
        </div>
      </div>

      {bankData && (
        <div style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 4,
          padding: '5px 10px',
          borderRadius: 999,
          background: rankTier.bg,
          color: rankTier.fg,
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <span style={{ opacity: 0.8 }}>#</span>{bankData.rank}
          <span style={{ opacity: 0.5, fontWeight: 500, fontSize: '0.7rem' }}>
            / {bankData.total}
          </span>
        </div>
      )}
    </div>
  )
}

const BankHoverTooltip = ({ position, bankUserData, ranking, pinned = false }) => {
  if (!bankUserData) return null
  // When pinned we render at a fixed corner and don't need a cursor position.
  if (!pinned && !position) return null

  const bankName = bankUserData.isTableZone ? bankUserData.zone : bankUserData.location
  const zoneLabel = bankUserData.zone || 'Unknown Zone'
  const bankData = ranking ? ranking.get(bankUserData.key) : null

  // Anchor: top-right corner when a machine is pinned (so it never overlaps
  // the pinned MachineTooltip), otherwise follow the cursor.
  const wrapperPositionStyle = pinned
    ? { top: '96px', right: '24px', left: 'auto' }
    : { left: `${position.x + 15}px`, top: `${position.y + 15}px` }

  // Fallback: bank exists in 3D but filtered out of the current data view.
  if (!bankData) {
    return (
      <CardShell positionStyle={wrapperPositionStyle}>
        <BankIdentity bankName={bankName} zoneLabel={zoneLabel} />
        <div style={{
          marginTop: 14,
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          No data for the current filters.
        </div>
      </CardShell>
    )
  }

  const total = bankData.total || 1
  const rank = bankData.rank || total
  const rankTier = getRankTier(rank, total)
  const deltaPctLabel = formatDeltaPct(bankData.avgTurnover, bankData.zoneMedianAvgTurnover)
  const deltaColor = bankData.avgTurnover > bankData.zoneMedianAvgTurnover
    ? PERF.highFg
    : bankData.avgTurnover < bankData.zoneMedianAvgTurnover
      ? PERF.lowFg
      : 'rgba(255,255,255,0.55)'
  const markerLeft = total > 1 ? ((rank - 1) / (total - 1)) * 100 : 0

  return (
    <CardShell positionStyle={wrapperPositionStyle}>
      <BankIdentity bankName={bankName} zoneLabel={zoneLabel} bankData={bankData} />

      <div style={{ marginTop: 14 }}>
        <div style={{
          fontSize: '0.68rem',
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          Turnover / Machine
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginTop: 4
        }}>
          <div style={{
            fontSize: '1.7rem',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1
          }}>
            {formatCompactCurrency(bankData.avgTurnover)}
          </div>
          {deltaPctLabel && (
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: deltaColor }}>
              {deltaPctLabel}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{
          position: 'relative',
          height: 8,
          borderRadius: 999,
          overflow: 'visible',
          background: 'linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)'
        }}>
          <div style={{
            position: 'absolute',
            left: `${markerLeft}%`,
            top: -3,
            transform: 'translateX(-50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 0 3px #1a1d2a, 0 0 0 4px ${rankTier.fg}`
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.05em'
        }}>
          <span>BEST IN {zoneLabel.toUpperCase()}</span>
          <span>WORST</span>
        </div>
      </div>

      <div style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        fontSize: '0.72rem',
        color: 'rgba(255,255,255,0.55)'
      }}>
        <span>{formatCompactCurrency(bankData.turnover)} total</span>
        <span>{bankData.machineCount || 0} machines</span>
        {bankData.stroke != null && (
          <span>stroke {formatCompactCurrency(bankData.stroke)}</span>
        )}
      </div>

      {!pinned && (
        <div style={{
          marginTop: 10,
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.04em'
        }}>
          <span style={{ color: ACCENT }}>Click</span> any machine to inspect.
        </div>
      )}
    </CardShell>
  )
}

export default BankHoverTooltip
