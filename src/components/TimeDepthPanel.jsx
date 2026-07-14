import React, { useMemo, useState } from 'react'
import { bankHourlyCurve, bankTierDecomposition } from '../metrics/valueDensity'

// Time-tab depth exploration (4b's explorable views), driven entirely by the
// committed JSON through the verified value-density pure functions - no mock data,
// no Comparison generators. Left-docked so it does not collide with the existing
// Time right-drawers (Insights / Customer Demand).
//
// Tier guardrails are content, not decoration: PLATINUM renders directional-only,
// BLACK is never claimed, and the dominant-tier attribution caveat prints with the
// decomposition it belongs to (re-rendered per bank/window selection), not once.

// Presentation-only floor: below the module's sample threshold a tier is
// "directional"; below this it is too thin to state a value at all ("not claimed").
// BLACK (~1 occ seat-hr) lands here; PLATINUM (7-35) stays directional.
const DIRECTIONAL_FLOOR = 5

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const usd2 = (n) => (n == null ? '—' : `$${n.toFixed(2)}`)
const pct = (n) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`)
const int = (n) => Math.round(n || 0).toLocaleString()
const hh = (h) => `${String(h).padStart(2, '0')}:00`

// top: the Time tab's filter strip (zone/machine-type/week/day + labels + clear)
// renders the nav bar at 148px tall - taller than the 110px other tabs' panels
// assume. 156px clears it with a little breathing room.
const PANEL = {
  position: 'fixed', top: '156px', right: 0, bottom: 0, width: '452px',
  background: '#ffffff', borderLeft: '1px solid #e5e7eb',
  boxShadow: '-4px 0 16px rgba(0,0,0,0.06)', overflowY: 'auto', zIndex: 850,
  padding: '18px 20px 40px', boxSizing: 'border-box'
}

const selectStyle = {
  background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 8,
  color: '#111827', fontSize: '0.8rem', padding: '6px 10px', outline: 'none', cursor: 'pointer'
}

// Compact 24-hour SVG. Each series is scaled to its own peak (a shape view - the
// point is "watch the day breathe"); absolute peak values are labelled in the legend.
const HourlyCurve = ({ curve }) => {
  const W = 344, H = 116, padL = 8, padR = 8, padT = 10, padB = 18
  const plotW = W - padL - padR, plotH = H - padT - padB
  const hours = curve.hours
  const max = (acc) => hours.reduce((m, x) => Math.max(m, acc(x) || 0), 0)
  const maxOcc = max((x) => x.occupancy)
  const maxAv = max((x) => x.theoPerAvailable)
  const maxOc = max((x) => x.theoPerOccupied)
  // Gaming-day axis: display starts at 04:00 and wraps to 03:00 (display rotation
  // only - hour bucketing, peak windows, and analysis math are unchanged). Display
  // index d maps to actual hour (4 + d) % 24.
  const ordered = Array.from({ length: 24 }, (_, d) => hours[(4 + d) % 24])
  const dOfHour = (h) => (h - 4 + 24) % 24
  const px = (d) => padL + (d / 23) * plotW
  const py = (v, m) => padT + plotH - (m > 0 ? v / m : 0) * plotH
  const path = (acc, m) => ordered.map((x, d) => `${d === 0 ? 'M' : 'L'}${px(d).toFixed(1)},${py(acc(x) || 0, m).toFixed(1)}`).join(' ')

  const series = [
    { key: 'occ', color: '#3b82f6', label: 'Occupancy', path: path((x) => x.occupancy, maxOcc), peak: pct(maxOcc) },
    { key: 'av', color: '#f59e0b', label: 'Theo / avail sh', path: path((x) => x.theoPerAvailable, maxAv), peak: usd2(maxAv) },
    { key: 'oc', color: '#10b981', label: 'Theo / occ sh', path: path((x) => x.theoPerOccupied, maxOc), peak: usd2(maxOc) }
  ]

  return (
    <div>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {[0, 6, 12, 18, 23].map((d) => (
          <g key={d}>
            <line x1={px(d)} y1={padT} x2={px(d)} y2={padT + plotH} stroke="#f3f4f6" />
            <text x={px(d)} y={H - 5} fontSize="8" fill="#9ca3af" textAnchor="middle">{(4 + d) % 24}</text>
          </g>
        ))}
        {curve.peakHour != null && (
          <line x1={px(dOfHour(curve.peakHour))} y1={padT} x2={px(dOfHour(curve.peakHour))} y2={padT + plotH} stroke="#c7d2fe" strokeDasharray="3 2" />
        )}
        {series.map((s) => (
          <path key={s.key} d={s.path} fill="none" stroke={s.color} strokeWidth="1.6" />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.66rem', color: '#6b7280' }}>
            <span style={{ width: 9, height: 3, background: s.color, borderRadius: 2 }} />
            {s.label} <span style={{ color: '#9ca3af' }}>peak {s.peak}</span>
          </span>
        ))}
      </div>
      <div style={{ fontSize: '0.62rem', color: '#c4c4c4', marginTop: 3 }}>
        Each line scaled to its own peak · dashed line marks {hh(curve.peakHour)}
      </div>
    </div>
  )
}

const TierBadge = ({ children, color, bg }) => (
  <span style={{ fontSize: '0.6rem', fontWeight: 700, color, background: bg, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
    {children}
  </span>
)

const TierDecomposition = ({ decomp }) => (
  <div>
    <div style={{ fontSize: '0.66rem', color: '#9ca3af', marginBottom: 8 }}>
      Occupied-basis, dominant tier · {decomp.windowLabel} · reliable contrast is GOLD vs SILVER/MEMBER
    </div>
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 0.9fr', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '0.62rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
        <div style={{ padding: '6px 10px' }}>Tier</div>
        <div style={{ padding: '6px 6px', textAlign: 'right' }}>Share</div>
        <div style={{ padding: '6px 10px', textAlign: 'right' }}>Theo / occ</div>
      </div>
      {decomp.tiers.map((t) => {
        // Sample-size state -> how the value is allowed to be presented.
        const reliable = !t.belowSampleThreshold
        const directional = t.belowSampleThreshold && t.occupiedSeatHours >= DIRECTIONAL_FLOOR
        const notClaimed = t.occupiedSeatHours < DIRECTIONAL_FLOOR
        const valueColor = reliable ? '#111827' : directional ? '#9ca3af' : '#d1d5db'
        return (
          <div key={t.tier} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 0.9fr', alignItems: 'center', borderBottom: '1px solid #f3f4f6', background: reliable ? '#ffffff' : '#fcfcfd' }}>
            <div style={{ padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: reliable ? '#111827' : '#6b7280' }}>{t.tier}</span>
              <span style={{ display: 'flex', gap: 4 }}>
                {reliable && <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{int(t.occupiedSeatHours)} occ sh</span>}
                {directional && <TierBadge color="#92400e" bg="#fffbeb">directional only</TierBadge>}
                {notClaimed && <TierBadge color="#9ca3af" bg="#f3f4f6">not claimed · {int(t.occupiedSeatHours)} sh</TierBadge>}
              </span>
            </div>
            <div style={{ padding: '7px 6px', textAlign: 'right', fontSize: '0.74rem', color: reliable ? '#374151' : '#9ca3af' }}>{pct(t.shareOfOccupied)}</div>
            <div style={{ padding: '7px 10px', textAlign: 'right', fontSize: '0.78rem', fontWeight: reliable ? 700 : 500, color: valueColor }}>
              {notClaimed ? '—' : usd2(t.theoPerOccupied)}
            </div>
          </div>
        )
      })}
    </div>
    {/* Attribution caveat printed WITH this decomposition instance (re-renders per selection). */}
    <div style={{ fontSize: '0.64rem', color: '#9ca3af', marginTop: 8, lineHeight: 1.4, fontStyle: 'italic' }}>
      {decomp.attributionCaveat}
    </div>
  </div>
)

const TimeDepthPanel = ({ vd }) => {
  const banks = vd?.banks || []
  const [bankKey, setBankKey] = useState('')
  const [weekday, setWeekday] = useState('all')

  const activeBank = bankKey || banks[0]?.bankKey || null

  const curve = useMemo(
    () => (vd && activeBank ? bankHourlyCurve(vd, activeBank, { weekday }) : null),
    [vd, activeBank, weekday]
  )
  const decomp = useMemo(
    () => (vd && activeBank ? bankTierDecomposition(vd, activeBank, { mode: 'peak' }) : null),
    [vd, activeBank]
  )

  if (!banks.length) return null

  return (
    <div style={PANEL}>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Deep analytics — watch the day breathe</div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>Zone DD · any bank, hour by hour · 13 weeks to 1 Apr 2026 (Q3 FY26)</div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.66rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Bank
          <select style={selectStyle} value={activeBank || ''} onChange={(e) => setBankKey(e.target.value)}>
            {banks.map((b) => <option key={b.bankKey} value={b.bankKey}>{b.bankLabel}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.66rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Day
          <select style={selectStyle} value={weekday} onChange={(e) => setWeekday(e.target.value)}>
            <option value="all">All days</option>
            {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>

      {curve && (
        <>
          <div style={{ marginTop: 18, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Hourly rhythm</div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 8 }}>
            Peak {hh(curve.peakHour)} · {pct(curve.peakOccupancy)} occupancy
          </div>
          <HourlyCurve curve={curve} />
        </>
      )}

      {decomp && (
        <>
          <div style={{ marginTop: 22, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Who is in the seat</div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2, marginBottom: 8 }}>
            {int(decomp.totalOccupiedSeatHours)} occupied seat-hours · bank {usd2(decomp.bankTheoPerOccupied)}/occ
          </div>
          <TierDecomposition decomp={decomp} />
        </>
      )}
    </div>
  )
}

export default TimeDepthPanel
