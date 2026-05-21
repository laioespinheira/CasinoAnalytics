import React, { useMemo, useState } from 'react'
import { formatCompactCurrency } from '../utils/format'

const formatHour = (hour) => {
  if (hour === 'all' || hour === undefined || hour === null) return 'All hours'
  const numericHour = parseInt(hour, 10)
  if (numericHour === 0) return '12:00 AM'
  if (numericHour < 12) return `${numericHour}:00 AM`
  if (numericHour === 12) return '12:00 PM'
  return `${numericHour - 12}:00 PM`
}

const TOP_N = 8

const SectionTitle = ({ title, hint }) => (
  <div style={{ marginTop: 20, marginBottom: 10 }}>
    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{title}</div>
    {hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{hint}</div>}
  </div>
)

const truncateName = (name, max = 34) => {
  if (!name || name.length <= max) return name
  return `${name.slice(0, max - 1)}…`
}

const SelectableBar = ({ item, maxPct, selected, onSelect, labelKey = 'label', subline }) => {
  const label = item[labelKey] ?? item.name
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
      <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 600, color: '#111827', marginBottom: '4px' }} title={label}>
        {truncateName(label)}
      </div>
      <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: isSelected ? '#6366f1' : '#a5b4fc', borderRadius: '3px' }} />
      </div>
      {subline}
    </button>
  )
}

const GameMixPanel = ({
  zone = 'All',
  hour,
  day,
  insights,
  highlightTarget,
  onHighlightChange
}) => {
  const [showAllTitles, setShowAllTitles] = useState(false)
  const [titleSearch, setTitleSearch] = useState('')

  const banks = insights?.banks || []
  const families = insights?.gameFamilies || []
  const pockets = insights?.pockets || []
  const games = insights?.games || []

  const topBanks = useMemo(() => banks.slice(0, TOP_N), [banks])
  const topFamilies = useMemo(() => {
    const head = families.slice(0, TOP_N)
    const tail = families.slice(TOP_N)
    if (!tail.length) return head
    const other = {
      _type: 'family',
      _key: '__other__',
      name: `Other (${tail.length} families)`,
      turnover: tail.reduce((s, f) => s + f.turnover, 0),
      pct: tail.reduce((s, f) => s + f.pct, 0),
      machineCount: tail.reduce((s, f) => s + f.machineCount, 0),
      machineIds: tail.flatMap((f) => f.machineIds),
      notSelectable: true
    }
    return [...head, other]
  }, [families])

  const maxBankPct = useMemo(() => Math.max(...topBanks.map((b) => b.pct), 0), [topBanks])
  const maxFamilyPct = useMemo(() => Math.max(...topFamilies.map((f) => f.pct), 0), [topFamilies])

  const filteredTitles = useMemo(() => {
    const q = titleSearch.trim().toLowerCase()
    if (!q) return games
    return games.filter((g) => g.name.toLowerCase().includes(q))
  }, [games, titleSearch])

  const handleSelect = (item) => {
    if (!onHighlightChange) return
    if (item.notSelectable) return
    const type = item._type
    const key = item._key
    if (highlightTarget?.type === type && highlightTarget?.key === key) {
      onHighlightChange(null)
      return
    }
    onHighlightChange({
      type,
      key,
      label: item.label || item.name,
      machineIds: item.machineIds || []
    })
  }

  const handlePocketSelect = (pocket) => {
    if (!onHighlightChange) return
    const key = `pocket:${pocket.bankKey}`
    if (highlightTarget?.type === 'pocket' && highlightTarget?.key === key) {
      onHighlightChange(null)
      return
    }
    onHighlightChange({
      type: 'pocket',
      key,
      label: pocket.bankLabel,
      machineIds: pocket.machineIds || []
    })
  }

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

  if (!insights) return null

  return (
    <div style={panelStyles}>
      <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', zIndex: 1 }}>
        <div style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Heatmap performance
        </div>
        <h2 style={{ color: '#111827', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Performance — {zone}</h2>
        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 6 }}>{day || 'All days'} at {formatHour(hour)}</div>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: 14, color: '#fff', padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: 8, textTransform: 'uppercase' }}>Zone turnover</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, marginBottom: 10 }}>
            ${(insights.totalTurnover || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
            {(insights.totalMachines ?? 0).toLocaleString()} machines · {insights.zoneOccupancyPct?.toFixed(0) ?? 0}% occupied
          </div>
        </div>

        {insights.verdictDetail && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#374151', lineHeight: 1.45 }}>
            {insights.verdictDetail}
          </div>
        )}

        {highlightTarget && (
          <button
            type="button"
            onClick={() => onHighlightChange?.(null)}
            style={{ width: '100%', marginBottom: 16, padding: '8px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Show all machines on floor
          </button>
        )}

        <SectionTitle title="Areas (banks)" hint="Click to highlight bank on floor" />
        {topBanks.map((bank) => (
          <SelectableBar
            key={bank.key}
            item={{ ...bank, _type: 'bank', _key: bank.key, label: bank.label }}
            maxPct={maxBankPct}
            selected={highlightTarget}
            onSelect={handleSelect}
            subline={
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                {bank.pct.toFixed(1)}% zone · {formatCompactCurrency(bank.turnover)} · {bank.occupancyPct.toFixed(0)}% occ
                {bank.rank != null && ` · #${bank.rank}/${bank.totalBanksInZone}`}
              </div>
            }
          />
        ))}

        <SectionTitle title="Game families" hint="Aggregated titles · click to highlight" />
        {topFamilies.map((fam) => (
          <SelectableBar
            key={fam._key || fam.name}
            item={{ ...fam, _type: 'family', _key: fam._key || fam.name, label: fam.name }}
            maxPct={maxFamilyPct}
            selected={highlightTarget}
            onSelect={handleSelect}
            subline={
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                {fam.pct.toFixed(1)}% zone · {formatCompactCurrency(fam.turnover)} · {fam.machineCount} machines
                {fam.titleCount != null && ` · ${fam.titleCount} titles`}
              </div>
            }
          />
        ))}

        {pockets.length > 0 && (
          <>
            <SectionTitle title="Game pockets" hint="Banks where one family dominates play" />
            {pockets.map((p) => {
              const key = `pocket:${p.bankKey}`
              const isSelected = highlightTarget?.type === 'pocket' && highlightTarget?.key === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePocketSelect(p)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    marginBottom: 8,
                    border: isSelected ? '1px solid #6366f1' : '1px solid #e5e7eb',
                    borderLeft: isSelected ? '4px solid #6366f1' : '1px solid #e5e7eb',
                    borderRadius: 10,
                    background: isSelected ? '#eef2ff' : '#fafafa',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{p.bankLabel}</div>
                  <div style={{ fontSize: '0.78rem', color: '#4f46e5', marginTop: 4 }}>
                    {truncateName(p.dominantName, 36)} — {p.dominantPct.toFixed(0)}% of bank
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                    {p.bankPctOfZone.toFixed(1)}% of zone · {formatCompactCurrency(p.bankTurnover)}
                  </div>
                </button>
              )
            })}
          </>
        )}

        <button
          type="button"
          onClick={() => setShowAllTitles((v) => !v)}
          style={{
            width: '100%',
            marginTop: 8,
            marginBottom: showAllTitles ? 10 : 0,
            padding: '10px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#4f46e5',
            background: 'transparent',
            border: '1px dashed #c7d2fe',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          {showAllTitles ? 'Hide all game titles' : `All game titles (${games.length})`}
        </button>

        {showAllTitles && (
          <div style={{ marginTop: 8 }}>
            <input
              type="search"
              placeholder="Search titles…"
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', marginBottom: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
            {filteredTitles.slice(0, 50).map((g) => (
              <SelectableBar
                key={g.name}
                item={{ ...g, _type: 'game', _key: g.name, label: g.name }}
                maxPct={Math.max(...filteredTitles.map((x) => x.pct), 1)}
                selected={highlightTarget}
                onSelect={handleSelect}
                subline={
                  <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                    {formatCompactCurrency(g.turnover)} total · {g.pct.toFixed(1)}% · {g.machineCount} machines
                    {g.turnoverPerMachine != null && ` · ${formatCompactCurrency(g.turnoverPerMachine)}/machine`}
                  </div>
                }
              />
            ))}
            {filteredTitles.length > 50 && (
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', padding: 8 }}>
                Showing first 50 of {filteredTitles.length} matches
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameMixPanel
