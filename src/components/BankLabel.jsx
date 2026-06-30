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

const BankLabel = ({
  position,
  bankName,
  zone,
  machineCount,
  tier = null,
  mode = 'name',
  avgTurnover = 0,
  occupancyPct = 0
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
            padding: '6px 10px',
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
            minWidth: '80px'
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
    prev.position === next.position
  )
}

export default React.memo(BankLabel, labelPropsEqual)
