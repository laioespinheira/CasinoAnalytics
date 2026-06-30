import React from 'react'
import { formatCompactCurrency } from '../utils/format'

const formatHour = (hour) => {
  if (hour === 'all' || hour === undefined || hour === null) return 'All hours'
  const numericHour = parseInt(hour, 10)
  if (numericHour === 0) return '12:00 AM'
  if (numericHour < 12) return `${numericHour}:00 AM`
  if (numericHour === 12) return '12:00 PM'
  return `${numericHour - 12}:00 PM`
}

const DriverBars = ({ title, items, maxValue, valueKey, labelKey, formatValue }) => {
  if (!items?.length) return null
  const max = maxValue || Math.max(...items.map((i) => i[valueKey] || 0), 1)

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
        {title}
      </div>
      {items.map((item) => {
        const val = item[valueKey] || 0
        const width = max > 0 ? Math.max(4, (val / max) * 100) : 0
        const label = item[labelKey] ?? item.label ?? item.name
        return (
          <div key={label} style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: '#374151',
                marginBottom: '3px'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                {label}
              </span>
              <span style={{ fontWeight: '600', color: '#059669' }}>{formatValue(item)}</span>
            </div>
            <div style={{ height: '6px', background: '#ecfdf5', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${width}%`, background: '#10b981', borderRadius: '3px' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const OccupancyPanel = ({ zone = 'Zone DD', hour, day, data }) => {
  if (!data) return null

  const tableRows = data.byBreakdown || []
  const drivers = data.occupancyDrivers
  const topBanks = drivers?.topBanks || []
  const topGames = drivers?.topGames || []
  const maxBankCount = topBanks.length ? Math.max(...topBanks.map((b) => b.occupiedCount)) : 1
  const maxGameTurnover = topGames.length ? Math.max(...topGames.map((g) => g.turnover)) : 1

  const panelStyles = {
    position: 'fixed',
    right: 0,
    top: '110px',
    bottom: 0,
    width: '400px',
    background: '#ffffff',
    borderLeft: '1px solid #e5e7eb',
    boxShadow: '-10px 0 25px -15px rgba(0, 0, 0, 0.35)',
    zIndex: 900,
    overflowY: 'auto'
  }

  const headerStyles = {
    position: 'sticky',
    top: 0,
    background: '#ffffff',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
    zIndex: 1
  }

  const metricCardStyles = {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '14px',
    color: '#ffffff',
    padding: '20px',
    marginBottom: '20px'
  }

  const cellStyles = {
    padding: '10px 12px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.8rem',
    color: '#374151'
  }

  return (
    <div style={panelStyles}>
      <div style={headerStyles}>
        <div style={{
          color: '#6b7280',
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '6px'
        }}>
          Heatmap Occupancy
        </div>
        <h2 style={{
          color: '#111827',
          fontSize: '1.35rem',
          fontWeight: '800',
          margin: 0
        }}>
          Occupancy - {zone}
        </h2>
        <div style={{
          color: '#6b7280',
          fontSize: '0.85rem',
          marginTop: '6px'
        }}>
          {day || 'All days'} at {formatHour(hour)}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={metricCardStyles}>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.9,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Average Occupancy
          </div>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            lineHeight: 1,
            marginBottom: '10px'
          }}>
            {Math.round(data.pct)}%
          </div>
          <div style={{
            fontSize: '0.9rem',
            opacity: 0.95
          }}>
            {(data.totalMachines ?? 0).toLocaleString()} machines total · {(data.saturatedMachines ?? data.occupiedMachines ?? 0).toLocaleString()} in high demand (≥85%)
          </div>
        </div>

        {(topBanks.length > 0 || topGames.length > 0) && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
              What&apos;s driving occupancy?
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '12px', lineHeight: 1.4 }}>
              {data.pct < 25
                ? 'Most machines are below the activity threshold this hour — drivers show where play is concentrated among occupied seats.'
                : 'Occupied machines vs zone median turnover for this hour — top banks and game families on those seats.'}
            </div>
            <DriverBars
              title="Banks (occupied machines)"
              items={topBanks}
              maxValue={maxBankCount}
              valueKey="occupiedCount"
              labelKey="label"
              formatValue={(item) => `${item.occupiedCount} (${item.pctOfOccupied.toFixed(0)}%)`}
            />
            <DriverBars
              title="Game families (occupied play)"
              items={topGames}
              maxValue={maxGameTurnover}
              valueKey="turnover"
              labelKey="name"
              formatValue={(item) => `${item.pctOfOccupiedTurnover.toFixed(0)}% · ${formatCompactCurrency(item.turnover)}`}
            />
          </div>
        )}

        <div style={{
          color: '#111827',
          fontSize: '0.95rem',
          fontWeight: '700',
          marginBottom: '10px'
        }}>
          Occupancy by Bank and Type
        </div>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          overflow: 'hidden',
          background: '#ffffff'
        }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ ...cellStyles, color: '#6b7280', textAlign: 'left', fontWeight: '700' }}>Bank</th>
              <th style={{ ...cellStyles, color: '#6b7280', textAlign: 'left', fontWeight: '700' }}>Machine Type</th>
              <th style={{ ...cellStyles, color: '#6b7280', textAlign: 'right', fontWeight: '700' }}>Machines</th>
              <th style={{ ...cellStyles, color: '#6b7280', textAlign: 'right', fontWeight: '700' }}>Avg Occ %</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => (
              <tr key={`${row.bank}__${row.machineType}`} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={cellStyles}>{row.bank}</td>
                <td style={cellStyles}>{row.machineType}</td>
                <td style={{ ...cellStyles, textAlign: 'right' }}>{row.total.toLocaleString()}</td>
                <td style={{ ...cellStyles, textAlign: 'right', fontWeight: '700', color: '#059669' }}>
                  {row.pct.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tableRows.length === 0 && (
          <div style={{
            color: '#6b7280',
            fontSize: '0.85rem',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderTop: 'none'
          }}>
            No occupancy rows for the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}

export default OccupancyPanel
