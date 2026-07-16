import React, { useMemo } from 'react'
import { bankHourlyCurve, bankTierDecomposition, ALL_BANKS } from '../metrics/valueDensity'
import { DEMO_MODE } from '../config'

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

// Per-point sample floor for the hourly curves, in occupied seat-hours at that
// hour-of-day. Same spirit as the 50-hour tier guardrail scaled to per-hour
// granularity: 2x the DIRECTIONAL_FLOOR (the panel's "too thin to state" line),
// ~1/5 of the reliable floor. Below the threshold a point renders provisional
// (hollow marker + dashed segment) and is excluded from dollar-axis scaling.
const THIN_POINT_FLOOR = 10

// Capacity-relative cap on that floor. A point's max possible occupied
// seat-hours is its availableSeatHours (machine count x day-instances in the
// slice); a 4-machine bank on a single-day slice can never reach 10 even at
// 100% occupancy, and dashing it forever reads as "unreliable data" when the
// truth is "small bank, fully sampled". So the requirement is
//   occ_sh >= min(THIN_POINT_FLOOR, ALPHA x availableSeatHours)
// - the absolute floor stays wherever the bank could supply more data (the cap
// only binds below 10 when a point has < 14 available seat-hours), and a point
// that captured >= 75% of everything achievable at its grain renders solid.
const THIN_CAPACITY_ALPHA = 0.75

// Hybrid thin rule (display-layer only). The epsilon keeps a zero-capacity /
// zero-sample point provisional rather than vacuously solid.
const isThinPoint = (x) => {
  const threshold = Math.max(
    Math.min(THIN_POINT_FLOOR, THIN_CAPACITY_ALPHA * (x.availableSeatHours || 0)),
    1e-9
  )
  return (x.occupiedSeatHours || 0) < threshold
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Decimal convention (matches Yield / detail card): numerics 1 dp, counts 0 dp.
const usd1 = (n) => (n == null ? '—' : `$${n.toFixed(1)}`)
const pct = (n) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`)
const int = (n) => Math.round(n || 0).toLocaleString()
const hh = (h) => `${String(h).padStart(2, '0')}:00`
const isoToShort = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

// top: with the full filter strip the Time nav renders 148px tall, so the panel
// needs 156px to clear it. In demo mode the strip is hidden on Time (the panel
// carries its own controls), leaving the short nav - same as Yield, whose panel
// sits at 110px. Conditional so restoring the strip restores the clearance.
const PANEL = {
  position: 'fixed', top: DEMO_MODE ? '110px' : '156px', right: 0, bottom: 0, width: '452px',
  background: '#ffffff', borderLeft: '1px solid #e5e7eb',
  boxShadow: '-4px 0 16px rgba(0,0,0,0.06)', overflowY: 'auto', zIndex: 850,
  padding: '18px 20px 40px', boxSizing: 'border-box'
}

const selectStyle = {
  background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 8,
  color: '#111827', fontSize: '0.8rem', padding: '6px 10px', outline: 'none', cursor: 'pointer'
}

// Compact 24-hour SVG, dual-axis. The two dollar series share the LEFT $/hr axis
// (one true scale, so their gap is meaningful); occupancy renders as muted
// background context against the RIGHT 0-100% axis. Display change only - hour
// bucketing, peak windows, and every series value are identical to the previous
// single-scale version; only how they map to pixels changed.
const HourlyCurve = ({ curve }) => {
  const W = 400, H = 158, padL = 42, padR = 40, padT = 18, padB = 18
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

  // Thin-sample flag per hourly point (hybrid floor - see isThinPoint). The
  // dollar axis is scaled on RELIABLE points only, so one thin overnight spike
  // cannot compress the whole evening story; thin values beyond the max clip at
  // the top edge with a ▲ indicator instead of stretching the scale. The same
  // flag drives styling, axis scaling, and clipping, so a point solid under the
  // capacity cap also participates in the axis.
  const isThin = isThinPoint
  const reliableMax = hours.reduce(
    (m, x) => (isThin(x) ? m : Math.max(m, x.theoPerAvailable || 0, x.theoPerOccupied || 0)),
    0
  )
  const dollarMax = reliableMax > 0 ? reliableMax : Math.max(maxAv, maxOc)

  const px = (d) => padL + (d / 23) * plotW
  const pyD = (v) => padT + plotH - (dollarMax > 0 ? Math.min((v || 0) / dollarMax, 1) : 0) * plotH
  const pyO = (v) => padT + plotH - (v || 0) * plotH

  // Dollar series drawn segment-wise: solid where both endpoints are reliable,
  // dashed (provisional) where either endpoint is thin.
  const segPaths = (acc) => {
    let solid = ''
    let dashed = ''
    for (let d = 0; d < 23; d++) {
      const a = ordered[d]
      const b = ordered[d + 1]
      const seg = `M${px(d).toFixed(1)},${pyD(acc(a)).toFixed(1)}L${px(d + 1).toFixed(1)},${pyD(acc(b)).toFixed(1)}`
      if (isThin(a) || isThin(b)) dashed += seg
      else solid += seg
    }
    return { solid, dashed }
  }
  const accAv = (x) => x.theoPerAvailable || 0
  const accOc = (x) => x.theoPerOccupied || 0
  const av = segPaths(accAv)
  const oc = segPaths(accOc)
  const thinIdx = ordered.map((x, d) => (isThin(x) ? d : -1)).filter((d) => d >= 0)
  const clipped = []
  ordered.forEach((x, d) => {
    if (accAv(x) > dollarMax * 1.0001 || accOc(x) > dollarMax * 1.0001) clipped.push(d)
  })

  const occLine = ordered
    .map((x, d) => `${d === 0 ? 'M' : 'L'}${px(d).toFixed(1)},${pyO(x.occupancy).toFixed(1)}`)
    .join('')
  const occArea = `${occLine}L${px(23).toFixed(1)},${(padT + plotH).toFixed(1)}L${px(0).toFixed(1)},${(padT + plotH).toFixed(1)}Z`

  const legend = [
    { key: 'av', color: '#f59e0b', label: 'Theo / avail sh', peak: usd1(maxAv) },
    { key: 'oc', color: '#10b981', label: 'Theo / occ sh', peak: usd1(maxOc) },
    { key: 'occ', color: '#93c5fd', label: 'Occupancy', peak: pct(maxOcc), dotted: true }
  ]

  return (
    <div>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* horizontal gridlines double as ticks for both axes */}
        {[0, 0.5, 1].map((f) => {
          const y = padT + plotH - f * plotH
          return (
            <g key={f}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f3f4f6" />
              <text x={padL - 4} y={y + 3} fontSize="8" fill="#9ca3af" textAnchor="end">{usd1(dollarMax * f)}</text>
              <text x={W - padR + 4} y={y + 3} fontSize="8" fill="#93c5fd">{`${Math.round(f * 100)}%`}</text>
            </g>
          )
        })}
        <text x={padL - 4} y={9} fontSize="8" fill="#6b7280" textAnchor="end" fontWeight="700">$ / hr</text>
        <text x={W - padR + 4} y={9} fontSize="8" fill="#93c5fd" fontWeight="700">occ</text>
        {[0, 6, 12, 18, 23].map((d) => (
          <g key={d}>
            <line x1={px(d)} y1={padT} x2={px(d)} y2={padT + plotH} stroke="#f3f4f6" />
            <text x={px(d)} y={H - 5} fontSize="8" fill="#9ca3af" textAnchor="middle">{(4 + d) % 24}</text>
          </g>
        ))}
        {/* occupancy: muted filled area + dotted outline, visually subordinate */}
        <path d={occArea} fill="rgba(59,130,246,0.07)" stroke="none" />
        <path d={occLine} fill="none" stroke="#93c5fd" strokeWidth="1.2" strokeDasharray="2 3" />
        {curve.peakHour != null && (
          <line x1={px(dOfHour(curve.peakHour))} y1={padT} x2={px(dOfHour(curve.peakHour))} y2={padT + plotH} stroke="#c7d2fe" strokeDasharray="3 2" />
        )}
        {/* dollar series: solid where the sample is real, dashed where thin */}
        <path d={av.solid} fill="none" stroke="#f59e0b" strokeWidth="1.6" />
        <path d={av.dashed} fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.75" />
        <path d={oc.solid} fill="none" stroke="#10b981" strokeWidth="1.6" />
        <path d={oc.dashed} fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.75" />
        {/* hollow markers on thin points */}
        {thinIdx.map((d) => (
          <g key={d}>
            <circle cx={px(d)} cy={pyD(accAv(ordered[d]))} r="2.2" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" />
            <circle cx={px(d)} cy={pyD(accOc(ordered[d]))} r="2.2" fill="#ffffff" stroke="#10b981" strokeWidth="1" />
          </g>
        ))}
        {/* thin values above the reliable-scaled axis clip at the top edge */}
        {clipped.map((d) => (
          <path key={d} d={`M${(px(d) - 3).toFixed(1)},${padT + 6}L${(px(d) + 3).toFixed(1)},${padT + 6}L${px(d).toFixed(1)},${padT + 1}Z`} fill="#9ca3af" />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        {legend.map((s) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.66rem', color: '#6b7280' }}>
            <span style={{ width: 9, height: 0, borderTop: s.dotted ? `2px dotted ${s.color}` : `3px solid ${s.color}` }} />
            {s.label} <span style={{ color: '#9ca3af' }}>peak {s.peak}</span>
          </span>
        ))}
      </div>
      <div style={{ fontSize: '0.62rem', color: '#c4c4c4', marginTop: 3, lineHeight: 1.5 }}>
        $ series share the left axis · occupancy on the right (0–100%) · dashed vertical marks {hh(curve.peakHour)}
        <br />
        hollow / dashed = thin sample — under min({THIN_POINT_FLOOR} occ seat-hrs, {Math.round(THIN_CAPACITY_ALPHA * 100)}% of the hour's possible capacity)
        {clipped.length > 0 && <> · ▲ {clipped.length} thin point{clipped.length > 1 ? 's' : ''} above the axis (clipped, not scaled to)</>}
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
              {notClaimed ? '—' : usd1(t.theoPerOccupied)}
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

const labelColStyle = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.66rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }

// Amber caveat block for statistically thin slices - flagged, not silently rendered.
const ThinSliceNote = ({ children }) => (
  <div style={{ marginTop: 12, padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.68rem', color: '#92400e', lineHeight: 1.45 }}>
    {children}
  </div>
)

// Controlled by App (bank / weekday / week live there so the floor highlight and
// slice heat track the panel). `vd` is already week-sliced by the caller;
// `bankOptions` come from the full basis so the list is stable across slices.
const TimeDepthPanel = ({ vd, bankOptions = [], weekEndings = [], bankKey, weekday, week, onBankChange, onWeekdayChange, onWeekChange }) => {
  const curve = useMemo(
    () => (vd && bankKey ? bankHourlyCurve(vd, bankKey, { weekday }) : null),
    [vd, bankKey, weekday]
  )
  const decomp = useMemo(
    () => (vd && bankKey ? bankTierDecomposition(vd, bankKey, { mode: 'peak' }) : null),
    [vd, bankKey]
  )

  if (!bankOptions.length) return null

  const singleWeek = week !== 'all'
  const singleDay = singleWeek && weekday !== 'all'
  const windowText = singleWeek ? `week ending ${isoToShort(week)}` : '13 weeks to 1 Apr 2026 (Q3 FY26)'
  // No played hours in this slice (e.g. a bank absent from the selected week).
  const curveEmpty = !curve || curve.peakHour == null || curve.totalOccupiedSeatHours === 0

  return (
    <div style={PANEL}>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Deep analytics — watch the day breathe</div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>Zone DD · any bank, hour by hour · {windowText}</div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <label style={labelColStyle}>
          Bank
          <select style={selectStyle} value={bankKey} onChange={(e) => onBankChange(e.target.value)}>
            <option value={ALL_BANKS}>All banks</option>
            {bankOptions.map((b) => <option key={b.bankKey} value={b.bankKey}>{b.bankLabel}</option>)}
          </select>
        </label>
        <label style={labelColStyle}>
          Day
          <select style={selectStyle} value={weekday} onChange={(e) => onWeekdayChange(e.target.value)}>
            <option value="all">All days</option>
            {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label style={labelColStyle}>
          Week
          <select style={selectStyle} value={week} onChange={(e) => onWeekChange(e.target.value)}>
            <option value="all">All weeks</option>
            {weekEndings.map((w) => <option key={w} value={w}>w/e {isoToShort(w)}</option>)}
          </select>
        </label>
      </div>

      {singleDay ? (
        <ThinSliceNote>
          <strong>Single week × single day{bankKey !== ALL_BANKS ? ' × single bank' : ''}:</strong> this
          slice is one gaming day{bankKey !== ALL_BANKS ? ' of one bank' : ''} — each hourly point is a
          single observation, not a pattern. Read it as "what happened", not "what happens".
        </ThinSliceNote>
      ) : singleWeek ? (
        <ThinSliceNote>
          <strong>Single-week window:</strong> samples are ~1/13 of the full basis. The tier guardrail
          badges below reflect the reduced sample.
        </ThinSliceNote>
      ) : null}

      <div style={{ marginTop: 18, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Hourly rhythm</div>
      {curveEmpty ? (
        <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: 6 }}>
          No played hours in this selection — pick another bank, day or week.
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 8 }}>
            Peak {hh(curve.peakHour)} · {pct(curve.peakOccupancy)} occupancy
          </div>
          <HourlyCurve curve={curve} />
        </>
      )}

      {decomp && decomp.totalOccupiedSeatHours > 0 && (
        <>
          <div style={{ marginTop: 22, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Who is in the seat</div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2, marginBottom: 8 }}>
            {int(decomp.totalOccupiedSeatHours)} occupied seat-hours · {bankKey === ALL_BANKS ? 'all banks' : 'bank'} {usd1(decomp.bankTheoPerOccupied)}/occ
          </div>
          <TierDecomposition decomp={decomp} />
        </>
      )}
    </div>
  )
}

// Memoized: hover-tooltip renders in App must not re-render the panel.
export default React.memo(TimeDepthPanel)
