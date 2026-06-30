import React, { useMemo } from 'react'
import { formatCompactCurrency } from '../utils/format'

const formatHour = (hour) => {
  if (hour === 'all' || hour === undefined || hour === null) return 'All hours'
  const numericHour = parseInt(hour, 10)
  if (Number.isNaN(numericHour)) return 'All hours'
  if (numericHour === 0) return '12:00 AM'
  if (numericHour < 12) return `${numericHour}:00 AM`
  if (numericHour === 12) return '12:00 PM'
  return `${numericHour - 12}:00 PM`
}

const formatMoney = (n) => `$${Math.round(n || 0).toLocaleString()}`
const formatPct = (frac) => `${Math.round((frac || 0) * 100)}%`

const truncate = (name, max = 34) => {
  if (!name || name.length <= max) return name
  return `${name.slice(0, max - 1)}…`
}

const titleCase = (tier) => {
  if (!tier || tier === 'all') return 'All tiers'
  return tier.charAt(0) + tier.slice(1).toLowerCase()
}

const FLAG_COPY = {
  fully_occupied_low_avg_bet: 'Fully occupied at a lower average bet — possible product supply constraint',
  product_supply_constraint: 'High utilisation — bank may be capacity constrained',
  tier_demand_hotspot: 'High utilisation demand hotspot',
  premium_underutilised: 'High-value demand soft despite available product',
  neutral: ''
}

const FLAG_TONE = {
  fully_occupied_low_avg_bet: '#b45309',
  product_supply_constraint: '#b45309',
  tier_demand_hotspot: '#047857',
  premium_underutilised: '#4338ca',
  neutral: '#6b7280'
}

const SectionTitle = ({ title, hint }) => (
  <div style={{ marginTop: 20, marginBottom: 10 }}>
    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{title}</div>
    {hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{hint}</div>}
  </div>
)

const NoteBox = ({ accent = false, muted = false, children }) => (
  <div
    style={{
      background: accent ? '#eef2ff' : muted ? '#fffbeb' : '#f9fafb',
      border: `1px solid ${accent ? '#c7d2fe' : muted ? '#fde68a' : '#e5e7eb'}`,
      borderRadius: 12,
      padding: '14px 16px',
      fontSize: '0.85rem',
      color: accent ? '#3730a3' : muted ? '#92400e' : '#374151',
      lineHeight: 1.45
    }}
  >
    {children}
  </div>
)

const SelectableBar = ({ item, maxValue, selected, onSelect, subline }) => {
  const label = item.label ?? item.name
  const value = item._value ?? 0
  const barWidth = maxValue > 0 ? Math.max(2, (value / maxValue) * 100) : 0
  const isSelected = selected?.type === item._type && selected?.key === item._key

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        marginBottom: '6px',
        border: isSelected ? '1px solid #6366f1' : '1px solid #e5e7eb',
        borderLeft: isSelected ? '4px solid #6366f1' : '1px solid #e5e7eb',
        borderRadius: '10px',
        background: isSelected ? '#eef2ff' : '#ffffff',
        cursor: 'pointer'
      }}
    >
      <div
        style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 600, color: '#111827', marginBottom: '4px' }}
        title={label}
      >
        {truncate(label)}
      </div>
      <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: isSelected ? '#6366f1' : '#a5b4fc', borderRadius: '3px' }} />
      </div>
      {subline}
    </button>
  )
}

const panelStyles = {
  position: 'fixed',
  right: 0,
  top: '110px',
  bottom: 0,
  width: '400px',
  maxWidth: '100vw',
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

const heroStyles = {
  background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
  borderRadius: 14,
  color: '#ffffff',
  padding: 20,
  marginBottom: 20
}

const StatCard = ({ label, value }) => (
  <div style={{ flex: '1 1 45%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
    <div style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', marginTop: 2 }}>{value}</div>
  </div>
)

const buildReadout = (data, tierLabel) => {
  const hotspots = data.hotspots ?? []
  const constraints = data.constraints ?? []
  const products = data.products ?? []
  const top = hotspots.slice(0, 2).map((b) => b.label).filter(Boolean)
  if (!top.length) return null

  const lead =
    top.length === 1
      ? `${tierLabel} demand is concentrated in ${top[0]}.`
      : `${tierLabel} demand is concentrated in ${top[0]} and ${top[1]}.`

  let constraintSentence = ''
  if (constraints.length) {
    const lowBet = constraints.some((c) => c.flag === 'fully_occupied_low_avg_bet')
    constraintSentence = lowBet
      ? ` ${constraints.length} bank${constraints.length > 1 ? 's show' : ' shows'} high utilisation despite a lower average bet, suggesting the product may be capacity constrained and worth reviewing for additional supply.`
      : ` ${constraints.length} bank${constraints.length > 1 ? 's are' : ' is'} running near capacity and may warrant a product-mix review.`
  } else {
    constraintSentence = ' No banks are running near capacity for this tier under the current filters.'
  }

  const productSentence = products[0]?.name ? ` Strongest product: ${products[0].name}.` : ''

  return `${lead}${constraintSentence}${productSentence}`
}

const CustomerDemandPanel = ({
  zone,
  hour,
  day,
  tier,
  insights,
  loading,
  ready,
  highlightTarget,
  onHighlightChange
}) => {
  const zoneLabel = zone && zone !== 'all' && zone !== 'All' ? zone : 'All zones'
  const tierLabel = titleCase(tier)

  const hotspots = useMemo(() => insights?.hotspots ?? [], [insights])
  const constraints = useMemo(() => insights?.constraints ?? [], [insights])
  const products = useMemo(() => insights?.products ?? [], [insights])

  const maxHotspot = useMemo(() => Math.max(...hotspots.map((b) => b.turnover || 0), 0), [hotspots])
  const maxProduct = useMemo(() => Math.max(...products.map((p) => p.turnover || 0), 0), [products])

  const isSelected = (type, key) =>
    highlightTarget?.type === type && highlightTarget?.key === key

  const toggle = (target) => {
    if (!onHighlightChange) return
    if (isSelected(target.type, target.key)) {
      onHighlightChange(null)
      return
    }
    onHighlightChange(target)
  }

  const isLoading = loading || insights?.loading
  const notConnected = !isLoading && (insights?.error || (!ready && !insights))
  const noMatch = insights?.empty && insights?.noMatch
  const fileEmpty = insights?.empty && !insights?.noMatch

  const snapshot = insights?.snapshot
  const readout = insights && !insights.empty ? buildReadout(insights, tierLabel) : null

  return (
    <div style={panelStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {tierLabel}
        </div>
        <h2 style={{ color: '#111827', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Customer Demand</h2>
        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 6 }}>
          {zoneLabel} · {(day && day !== 'all' ? day : 'All days')} at {formatHour(hour)}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
          Loading customer demand data…
        </div>
      ) : notConnected || fileEmpty ? (
        <div style={{ padding: 24 }}>
          <NoteBox muted>
            Customer demand data is not connected yet. Generate it with
            {' '}<code>scripts/build_customer_tier_data.py</code> to populate this view.
          </NoteBox>
        </div>
      ) : noMatch ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
          No {tierLabel.toLowerCase()} demand for the current filters. Try a different tier, day, or hour.
        </div>
      ) : (
        <div style={{ padding: 24 }}>
          {/* Tier snapshot hero */}
          <div style={heroStyles}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tier snapshot · turnover
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, marginBottom: 10 }}>
              {formatMoney(snapshot?.turnover)}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
              {`${formatPct(snapshot?.utilisation)} utilisation · $${Math.round(snapshot?.avgBet || 0).toLocaleString()} avg bet`}
            </div>
          </div>

          {/* Snapshot stat cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
            <StatCard label="Average bet" value={`$${Math.round(snapshot?.avgBet || 0).toLocaleString()}`} />
            <StatCard label="Utilisation" value={formatPct(snapshot?.utilisation)} />
            <StatCard label="Active machines" value={(snapshot?.machineCount ?? 0).toLocaleString()} />
            <StatCard label="Turnover / occ. hour" value={formatCompactCurrency(snapshot?.turnoverPerOccupiedHour)} />
          </div>

          {tier && tier !== 'all' && (
            <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: 10 }}>
              Machines serving {tierLabel} guests in this slot are highlighted on the floor.
            </div>
          )}

          {/* Commercial readout */}
          {readout && (
            <>
              <SectionTitle title="Commercial readout" />
              <NoteBox accent>{readout}</NoteBox>
            </>
          )}

          {/* Reset highlight */}
          {highlightTarget && (
            <button
              type="button"
              onClick={() => onHighlightChange?.(null)}
              style={{ width: '100%', marginTop: 16, padding: '8px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Show all machines on floor
            </button>
          )}

          {/* Demand hotspots */}
          <SectionTitle title="Demand hotspots" hint="Where this tier is most active · click to highlight on floor" />
          {hotspots.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No banks match the current filters.</div>
          )}
          {hotspots.map((bank) => (
            <SelectableBar
              key={bank.key}
              item={{ _type: 'tier_hotspot', _key: bank.key, _value: bank.turnover, label: bank.label, machineIds: bank.machineIds }}
              maxValue={maxHotspot}
              selected={highlightTarget}
              onSelect={(item) => toggle({ type: item._type, key: item._key, label: item.label, machineIds: item.machineIds })}
              subline={
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {`${formatCompactCurrency(bank.turnover)} · ${formatPct(bank.utilisation)} utilisation · $${Math.round(bank.avgBet || 0).toLocaleString()} avg bet · ${bank.machineCount} machines`}
                </div>
              }
            />
          ))}

          {/* Capacity constraints */}
          <SectionTitle title="Capacity constraints" hint="Banks running near capacity for this tier · review priority" />
          {constraints.length === 0 ? (
            <NoteBox>No banks are running near capacity (≥{Math.round((insights.saturationThreshold ?? 0.85) * 100)}% utilisation) for this tier under the current filters.</NoteBox>
          ) : (
            constraints.map((bank) => {
              const selected = isSelected('tier_hotspot', bank.key)
              return (
                <button
                  key={`con-${bank.key}`}
                  type="button"
                  onClick={() => toggle({ type: 'tier_hotspot', key: bank.key, label: bank.label, machineIds: bank.machineIds })}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    marginBottom: 8,
                    border: selected ? '1px solid #6366f1' : '1px solid #e5e7eb',
                    borderLeft: `4px solid ${selected ? '#6366f1' : FLAG_TONE[bank.flag] || '#e5e7eb'}`,
                    borderRadius: 10,
                    background: selected ? '#eef2ff' : '#fafafa',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{bank.label}</div>
                  <div style={{ fontSize: '0.78rem', color: FLAG_TONE[bank.flag] || '#6b7280', marginTop: 4 }}>
                    {FLAG_COPY[bank.flag] || 'High utilisation'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                    {`${formatPct(bank.utilisation)} utilisation · $${Math.round(bank.avgBet || 0).toLocaleString()} avg bet · ${formatCompactCurrency(bank.turnover)}`}
                  </div>
                </button>
              )
            })
          )}

          {/* Product drivers */}
          <SectionTitle title="Product drivers" hint="Top products for this tier · click to highlight on floor" />
          {products.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No products match the current filters.</div>
          )}
          {products.map((p) => (
            <SelectableBar
              key={p.name}
              item={{ _type: 'tier_family', _key: p.name, _value: p.turnover, label: p.name, machineIds: p.machineIds }}
              maxValue={maxProduct}
              selected={highlightTarget}
              onSelect={(item) => toggle({ type: item._type, key: item._key, label: item.label, machineIds: item.machineIds })}
              subline={
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {`${(p.pct ?? 0).toFixed(1)}% of tier play · ${formatCompactCurrency(p.turnover)} · ${p.machineCount} machines`}
                </div>
              }
            />
          ))}

          {/* Important note */}
          <SectionTitle title="Important" />
          <NoteBox muted>
            This is an indicative demand signal based on aggregated customer-tier data.
            It does not prove guaranteed uplift and should be validated with product
            changes, test/control analysis, and operational review.
          </NoteBox>
        </div>
      )}
    </div>
  )
}

export default CustomerDemandPanel
