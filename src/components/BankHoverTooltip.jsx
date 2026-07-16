import React from 'react'
import { formatCompactCurrency } from '../utils/format'

// Deliberately minimal hover card: bank name, zone, machine count, rank, and
// Theo/Machine. Everything it shows comes straight off the precomputed
// bankRankings entry - no per-show aggregation or derived math in here.
//
// NOTE on the removed lines: the old card also printed total turnover and
// "stroke $xxK". Stroke is a COUNT of bets placed (see BankPanel "total bets
// placed" and avgBet = turnover / stroke), so running it through the currency
// formatter was a misapplication - removed rather than reformatted.

// Semantic performance palette. Reserved for performance signalling only.
const PERF = {
  highBg: 'rgba(34, 197, 94, 0.16)',
  highFg: '#22c55e',
  midBg: 'rgba(245, 158, 11, 0.16)',
  midFg: '#f59e0b',
  lowBg: 'rgba(239, 68, 68, 0.16)',
  lowFg: '#ef4444'
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
      width: 212,
      background: '#1a1d2a',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderTopColor: 'rgba(255, 255, 255, 0.14)',
      borderRadius: 12,
      padding: 14,
      pointerEvents: 'none',
      zIndex: 10000,
      boxShadow: '0 24px 48px -16px rgba(0,0,0,0.5), 0 8px 16px -8px rgba(0,0,0,0.4)',
      color: '#e5e7eb',
      fontFeatureSettings: '"tnum" 1, "lnum" 1',
      animation: 'tooltipFadeIn 0.15s ease-out'
    }}
  >
    {children}
  </div>
)

const BankIdentity = ({ bankName, zoneLabel, bankData }) => {
  const rankTier = getRankTier(bankData?.rank, bankData?.total)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {bankName || 'Unknown Bank'}
        </div>
        <div style={{
          fontSize: '0.66rem',
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
          gap: 3,
          padding: '4px 8px',
          borderRadius: 999,
          background: rankTier.bg,
          color: rankTier.fg,
          fontSize: '0.74rem',
          fontWeight: 700
        }}>
          <span style={{ opacity: 0.8 }}>#</span>{bankData.rank}
          <span style={{ opacity: 0.5, fontWeight: 500, fontSize: '0.66rem' }}>
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

  // Fallback: no ranking entry for this bank. Two distinct cases:
  //  - Non-DD bank (no DD coverage at all): show a clean "Averaged data only" note.
  //  - DD bank filtered out of the current view: keep the "No data" message.
  if (!bankData) {
    return (
      <CardShell positionStyle={wrapperPositionStyle}>
        <BankIdentity bankName={bankName} zoneLabel={zoneLabel} />
        <div style={{
          marginTop: 10,
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          {bankUserData.isNonDd ? 'Averaged data only' : 'No data for the current filters.'}
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell positionStyle={wrapperPositionStyle}>
      <BankIdentity bankName={bankName} zoneLabel={zoneLabel} bankData={bankData} />

      <div style={{ marginTop: 11 }}>
        <div style={{
          fontSize: '0.64rem',
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          Theo / Machine
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 3
        }}>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1
          }}>
            {formatCompactCurrency(bankData.avgTheo)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>
            {bankData.machineCount || 0} machines
          </div>
        </div>
      </div>

      {!pinned && (
        <div style={{
          marginTop: 10,
          fontSize: '0.62rem',
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
