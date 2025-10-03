import React, { useRef } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

const BankLabel = ({ position, bankName, zone, machineCount }) => {
  const lineRef = useRef()

  // Calculate label position (above the bank)
  const labelHeight = 15
  const labelPosition = [position[0], position[1] + labelHeight, position[2]]

  return (
    <group>
      {/* Vertical line/pole from bank to label */}
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              position[0], position[1], position[2],
              labelPosition[0], labelPosition[1], labelPosition[2]
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={2} />
      </line>

      {/* HTML Label at top of pole */}
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
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '100px'
          }}
        >
          {/* Bank Name */}
          <div style={{
            fontSize: '0.95rem',
            fontWeight: '700',
            marginBottom: '2px'
          }}>
            {bankName}
          </div>

          {/* Zone Info */}
          <div style={{
            fontSize: '0.7rem',
            opacity: 0.9,
            fontWeight: '400'
          }}>
            {zone} • {machineCount} machines
          </div>

          {/* Arrow pointing down */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #2563eb'
            }}
          />
        </div>
      </Html>
    </group>
  )
}

export default BankLabel
