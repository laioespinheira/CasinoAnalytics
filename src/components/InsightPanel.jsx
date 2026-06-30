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

const truncate = (name, max = 34) => {
  if (!name || name.length <= max) return name
  return `${name.slice(0, max - 1)}…`
}

const SectionTitle = ({ title, hint }) => (
  <div style={{ marginTop: 20, marginBottom: 10 }}>
    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{title}</div>
    {hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{hint}</div>}
  </div>
)

const NoteBox = ({ accent = false, children }) => (
  <div
    style={{
      background: accent ? '#eef2ff' : '#f9fafb',
      border: `1px solid ${accent ? '#c7d2fe' : '#e5e7eb'}`,
      borderRadius: 12,
      padding: '14px 16px',
      fontSize: '0.85rem',
      color: accent ? '#3730a3' : '#374151',
      lineHeight: 1.45
    }}
  >
    {children}
  </div>
)

const SelectableBar = ({ item, maxPct, selected, onSelect, subline }) => {
  const label = item.label ?? item.name
  const pct = item.pct ?? 0
  const barWidth = maxPct > 0 ? Math.max(2, (pct / maxPct) * 100) : 0
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

const DriverBars = ({ title, items, maxValue, valueKey, labelKey, formatValue }) => {
  if (!items?.length) return null
  const max = maxValue || Math.max(...items.map((i) => i[valueKey] || 0), 1)

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
        {title}
      </div>
      {items.map((item) => {
        const val = item[valueKey] || 0
        const width = max > 0 ? Math.max(4, (val / max) * 100) : 0
        const label = item[labelKey] ?? item.label ?? item.name
        return (
          <div key={label} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#374151', marginBottom: '3px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }} title={label}>
                {truncate(label, 28)}
              </span>
              <span style={{ fontWeight: 600, color: '#059669' }}>{formatValue(item)}</span>
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

const buildSummary = (insights, occupancy, zoneLabel) => {
  const banks = insights.banks ?? []
  const top = banks.slice(0, 2).map((b) => b.label).filter(Boolean)
  if (!top.length) return null

  const lead =
    top.length === 1
      ? `${zoneLabel} is led by ${top[0]}.`
      : `${zoneLabel} is led by ${top[0]} and ${top[1]}.`

  const occGame =
    (occupancy?.occupancyDrivers || insights.occupancyDrivers)?.topGames?.[0]?.name
  const occSentence = occGame ? ` Occupancy is concentrated around ${occGame}.` : ''

  const concentrated =
    insights.verdict === 'area' || (insights.pockets?.length ?? 0) >= 2
  const dist = concentrated
    ? ' Performance appears concentrated rather than evenly distributed.'
    : ' Performance is spread fairly evenly across banks and games.'

  return `${lead}${occSentence}${dist}`
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

// In-flow variant for hosting the panel inside a tab layout (e.g. the Time tab)
// rather than as the fixed right-hand drawer. Presentation only.
const embeddedPanelStyles = {
  position: 'relative',
  width: '100%',
  maxWidth: 'none',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  overflow: 'visible'
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
  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  borderRadius: 14,
  color: '#ffffff',
  padding: 20,
  marginBottom: 20
}

const InsightPanel = ({
  zone,
  hour,
  day,
  insights,
  occupancy,
  highlightTarget,
  onHighlightChange,
  embedded = false
}) => {
  const zoneLabel = zone && zone !== 'all' && zone !== 'All' ? zone : 'All zones'

  const banks = useMemo(() => (insights?.banks ?? []).slice(0, 5), [insights])
  const families = useMemo(() => (insights?.gameFamilies ?? []).slice(0, 5), [insights])
  const pockets = useMemo(() => insights?.pockets ?? [], [insights])

  const drivers = occupancy?.occupancyDrivers || insights?.occupancyDrivers || {}
  const topDriverBanks = (drivers.topBanks ?? []).slice(0, 5)
  const topDriverGames = (drivers.topGames ?? []).slice(0, 5)

  const maxBankPct = useMemo(() => Math.max(...banks.map((b) => b.pct ?? 0), 0), [banks])
  const maxFamilyPct = useMemo(() => Math.max(...families.map((f) => f.pct ?? 0), 0), [families])
  const maxDriverBank = Math.max(...topDriverBanks.map((b) => b.occupiedCount || 0), 0)
  const maxDriverGame = Math.max(...topDriverGames.map((g) => g.turnover || 0), 0)

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

  const handleSelect = (item) => {
    toggle({
      type: item._type,
      key: item._key,
      label: item.label ?? item.name,
      machineIds: item.machineIds || []
    })
  }

  if (!insights) return null

  const hasData = banks.length > 0 || (insights.totalTurnover ?? 0) > 0
  const avgOcc = occupancy?.pct
  const occupiedSeats = occupancy?.saturatedMachines ?? occupancy?.occupiedMachines
  const summary = buildSummary(insights, occupancy, zoneLabel)

  return (
    <div style={embedded ? embeddedPanelStyles : panelStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {zoneLabel}
        </div>
        <h2 style={{ color: '#111827', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Performance Insights</h2>
        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 6 }}>
          {(day && day !== 'all' ? day : 'All days')} at {formatHour(hour)}
        </div>
      </div>

      {!hasData ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
          No data for the current filters. Try a different zone, day, or hour.
        </div>
      ) : (
        <div style={{ padding: 24 }}>
          {/* Area snapshot hero */}
          <div style={heroStyles}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Area snapshot
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, marginBottom: 10 }}>
              {formatMoney(insights.totalTurnover)}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
              {`${(insights.totalMachines ?? 0).toLocaleString()} machines · ${avgOcc != null ? Math.round(avgOcc) + '%' : '—'} occupancy · ${occupiedSeats != null ? occupiedSeats.toLocaleString() : '—'} in high demand (≥85%)`}
            </div>
          </div>

          {/* Area verdict */}
          {insights.verdictDetail && (
            <div style={{ marginBottom: 20 }}>
              <NoteBox>{insights.verdictDetail}</NoteBox>
            </div>
          )}

          {/* Commercial readout */}
          {summary && (
            <>
              <SectionTitle title="Commercial readout" />
              <NoteBox accent>{summary}</NoteBox>
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

          {/* Revenue-leading banks */}
          <SectionTitle title="Revenue-leading banks" hint="Highest revenue · click to highlight on floor" />
          {banks.map((bank) => (
            <SelectableBar
              key={bank.key}
              item={{ ...bank, _type: 'bank', _key: bank.key, label: bank.label }}
              maxPct={maxBankPct}
              selected={highlightTarget}
              onSelect={handleSelect}
              subline={
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {`${(bank.pct ?? 0).toFixed(1)}% of zone · ${formatCompactCurrency(bank.turnover)}${bank.occupancyPct != null ? ` · ${Math.round(bank.occupancyPct)}% occupied` : ''}${bank.rank != null && bank.totalBanksInZone != null ? ` · #${bank.rank}/${bank.totalBanksInZone}` : ''}`}
                </div>
              }
            />
          ))}

          {/* Product drivers */}
          <SectionTitle title="Product drivers" hint="Top products by play · click to highlight on floor" />
          {families.map((fam) => (
            <SelectableBar
              key={fam.name}
              item={{ ...fam, _type: 'family', _key: fam.name, label: fam.name }}
              maxPct={maxFamilyPct}
              selected={highlightTarget}
              onSelect={handleSelect}
              subline={
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {`${(fam.pct ?? 0).toFixed(1)}% zone · ${formatCompactCurrency(fam.turnover)} · ${fam.machineCount ?? 0} machines${fam.titleCount != null ? ` · ${fam.titleCount} titles` : ''}`}
                </div>
              }
            />
          ))}

          {/* Demand drivers */}
          {(topDriverBanks.length > 0 || topDriverGames.length > 0) && (
            <>
              <SectionTitle title="Demand drivers" hint="Where guest demand is concentrated" />
              <DriverBars
                title="Busiest banks"
                items={topDriverBanks}
                maxValue={maxDriverBank}
                valueKey="occupiedCount"
                labelKey="label"
                formatValue={(item) => `${item.occupiedCount} (${(item.pctOfOccupied ?? 0).toFixed(0)}%)`}
              />
              <DriverBars
                title="Most-played products"
                items={topDriverGames}
                maxValue={maxDriverGame}
                valueKey="turnover"
                labelKey="name"
                formatValue={(item) => `${(item.pctOfOccupiedTurnover ?? 0).toFixed(0)}% · ${formatCompactCurrency(item.turnover)}`}
              />
            </>
          )}

          {/* Revenue concentration */}
          {pockets.length > 0 && (
            <>
              <SectionTitle title="Revenue concentration" hint="Banks where a single product dominates play" />
              {pockets.map((p) => {
                const key = `pocket:${p.bankKey}`
                const selected = isSelected('pocket', key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      toggle({ type: 'pocket', key, label: p.bankLabel, machineIds: p.machineIds || [] })
                    }
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      marginBottom: 8,
                      border: selected ? '1px solid #6366f1' : '1px solid #e5e7eb',
                      borderLeft: selected ? '4px solid #6366f1' : '1px solid #e5e7eb',
                      borderRadius: 10,
                      background: selected ? '#eef2ff' : '#fafafa',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{p.bankLabel}</div>
                    <div style={{ fontSize: '0.78rem', color: '#4f46e5', marginTop: 4 }}>
                      {`${Math.round(p.dominantPct)}% of play is ${truncate(p.dominantName, 36)}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                      {`${(p.bankPctOfZone ?? 0).toFixed(1)}% of zone · ${formatCompactCurrency(p.bankTurnover)}`}
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {/* Why this matters */}
          <SectionTitle title="Why this matters" />
          <NoteBox>
            This view combines revenue intensity, occupancy, product mix, and bank
            concentration so the team can quickly identify where performance is strong,
            where demand is concentrated, and which banks may need further review.
          </NoteBox>
        </div>
      )}
    </div>
  )
}

export default InsightPanel
