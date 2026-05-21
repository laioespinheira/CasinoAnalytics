import React, { useRef, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { formatCompactCurrency } from '../utils/format'

// World-space lift above bank anchor (~⅓ lower than the previous 10-unit offset)
const LABEL_HEIGHT = 10 * (2 / 3)

const TIER_BG = {
  high: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
  mid: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  low: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  null: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
}

const TIER_LINE = {
  high: '#22c55e',
  mid: '#f59e0b',
  low: '#ef4444',
  null: '#3b82f6'
}

const TIER_ARROW = {
  high: '#15803d',
  mid: '#b45309',
  low: '#b91c1c',
  null: '#2563eb'
}

const FORM_PALETTE = {
  high: { bg: 'rgba(34, 197, 94, 0.35)', fg: '#22c55e' },
  mid: { bg: 'rgba(245, 158, 11, 0.35)', fg: '#f59e0b' },
  low: { bg: 'rgba(239, 68, 68, 0.35)', fg: '#ef4444' },
  empty: { bg: 'rgba(255,255,255,0.12)', fg: 'rgba(255,255,255,0.35)' }
}

const BankLabel = ({
  position,
  bankName,
  zone,
  machineCount,
  tier = null,
  mode = 'name',
  avgTurnover = 0,
  occupancyPct = 0,
  trend = []
}) => {
  const lineRef = useRef()
  const tierKey = tier ?? 'null'

  const labelPosition = useMemo(
    () => [position[0], position[1] + LABEL_HEIGHT, position[2]],
    [position]
  )
  const linePositions = useMemo(
    () => new Float32Array([
      position[0], position[1], position[2],
      labelPosition[0], labelPosition[1], labelPosition[2]
    ]),
    [position, labelPosition]
  )

  const cardBg = TIER_BG[tierKey] || TIER_BG.null
  const lineColor = TIER_LINE[tierKey] || TIER_LINE.null
  const arrowColor = TIER_ARROW[tierKey] || TIER_ARROW.null

  const bucketMax = useMemo(() => (
    trend.length ? Math.max(...trend.map(b => b.avgTurnover || 0), 1) : 1
  ), [trend])

  const renderBody = () => {
    if (mode === 'avg') {
      return (
        <>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.95, marginBottom: 2 }}>
            {bankName}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.1 }}>
            {formatCompactCurrency(avgTurnover)}
          </div>
          <div style={{ fontSize: '0.52rem', opacity: 0.85, marginTop: 2 }}>/ machine</div>
        </>
      )
    }
    if (mode === 'occ') {
      return (
        <>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.95, marginBottom: 2 }}>
            {bankName}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.1 }}>
            {Math.round(occupancyPct)}%
          </div>
          <div style={{ fontSize: '0.52rem', opacity: 0.85, marginTop: 2 }}>occupancy</div>
        </>
      )
    }
    if (mode === 'form' && trend.length > 0) {
      return (
        <>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.95, marginBottom: 3 }}>
            {bankName}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 2,
            alignItems: 'end',
            height: 18,
            minWidth: 60
          }}>
            {trend.map(bucket => {
              const pal = FORM_PALETTE[bucket.tier] || FORM_PALETTE.empty
              const h = bucketMax > 0
                ? Math.max(10, ((bucket.avgTurnover || 0) / bucketMax) * 100)
                : 10
              return (
                <div key={bucket.label} style={{ height: '100%', display: 'flex', alignItems: 'end' }}>
                  <div
                    title={`${bucket.label}: ${formatCompactCurrency(bucket.avgTurnover)}`}
                    style={{
                      width: '100%',
                      height: `${h}%`,
                      background: pal.bg,
                      borderTop: `2px solid ${pal.fg}`,
                      borderRadius: '2px 2px 0 0'
                    }}
                  />
                </div>
              )
            })}
          </div>
        </>
      )
    }
    return (
      <>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: '700',
          marginBottom: '2px'
        }}>
          {bankName}
        </div>
        <div style={{
          fontSize: '0.58rem',
          opacity: 0.9,
          fontWeight: '400'
        }}>
          {zone} • {machineCount} machines
        </div>
      </>
    )
  }

  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} linewidth={2} />
      </line>

      <Html
        position={labelPosition}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            background: cardBg,
            color: 'white',
            padding: mode === 'form' ? '5px 8px' : '6px 10px',
            borderRadius: '6px',
            fontSize: '0.625rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: mode === 'form' ? '72px' : '80px'
          }}
        >
          {renderBody()}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${arrowColor}`
            }}
          />
        </div>
      </Html>
    </group>
  )
}

function labelPropsEqual(prev, next) {
  return (
    prev.bankName === next.bankName &&
    prev.zone === next.zone &&
    prev.machineCount === next.machineCount &&
    prev.tier === next.tier &&
    prev.mode === next.mode &&
    prev.avgTurnover === next.avgTurnover &&
    prev.occupancyPct === next.occupancyPct &&
    prev.position === next.position &&
    prev.trend === next.trend
  )
}

export default React.memo(BankLabel, labelPropsEqual)
