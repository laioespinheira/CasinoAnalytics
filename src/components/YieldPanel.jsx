import React from 'react'

// The Yield tab's hero panel: placement-adjusted flagged-bank table + validation
// line, the single-headline glass-box dollar bridge, and the mechanism evidence
// (weekly heartbeat + constrained texture). Presentational only - numbers come
// from the verified usePlacementBridge / useValueDensity hooks (App re-aggregates
// the ranking/table/heartbeat for the selected data window; the bridge stays
// pinned to the full verified basis). Period language: Q3 FY26.

// All dollar figures to 1 decimal place.
const moneyM = (n) => {
  if (n == null) return 'n/a'
  return Math.abs(n / 1e6) >= 1 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(1)}k`
}
const perYear = (n) => `${moneyM(n)}/yr`
const usd1 = (n) => (n == null ? '—' : `$${n.toFixed(1)}`)
const pct = (n) => (n == null ? 'n/a' : `${(n * 100).toFixed(1)}%`)
const int = (n) => Math.round(n || 0).toLocaleString()

const hh = (h) => `${String(h).padStart(2, '0')}:00`

const PANEL = {
  position: 'fixed', top: '110px', right: 0, bottom: 0, width: '452px',
  background: '#ffffff', borderLeft: '1px solid #e5e7eb',
  boxShadow: '-4px 0 16px rgba(0,0,0,0.06)', overflowY: 'auto', zIndex: 900,
  padding: '18px 20px 40px', boxSizing: 'border-box'
}

const H2 = ({ children, hint }) => (
  <div style={{ marginTop: 22, marginBottom: 10 }}>
    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{children}</div>
    {hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 3 }}>{hint}</div>}
  </div>
)

// Explicit basis tag next to a dollar figure.
const Basis = ({ children }) => (
  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 4 }}>{children}</span>
)

const Chip = ({ label, value }) => (
  <div style={{
    display: 'inline-flex', gap: 5, alignItems: 'baseline',
    background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 999,
    padding: '3px 9px', fontSize: '0.68rem', color: '#6b7280', marginRight: 6, marginTop: 6
  }}>
    <span>{label}</span><span style={{ fontWeight: 700, color: '#374151' }}>{value}</span>
  </div>
)

const YieldPanel = ({ windowInfo, onWindowChange, validation, flagged, machineMix, bridge, firstBite, heartbeat, constrainedSummary, selectedBankKey, onSelectBank }) => {
  const c = bridge?.components
  const P = bridge?.params || {}
  const T = bridge?.totals || {}
  const up = bridge?.upside
  const weeks = windowInfo?.weeks || 13
  const shFactor = 52 / weeks                 // annualize windowed seat-hours
  const capFactor = c && c.c1.window > 0 ? c.c1.annual / c.c1.window : 4 // window $ -> /yr

  return (
    <div style={PANEL}>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
        Yield — placement-adjusted product ranking
      </div>
      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>
        Zone DD · theo win per available seat-hour · Q3 FY26
      </div>

      {/* Data-window selector (descriptive layers only) */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Window</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(windowInfo?.options || [13, 8, 4]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWindowChange && onWindowChange(w)}
              style={{
                padding: '4px 11px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                border: weeks === w ? '1px solid #3b82f6' : '1px solid #d1d5db',
                background: weeks === w ? '#eff6ff' : '#ffffff',
                color: weeks === w ? '#1d4ed8' : '#6b7280'
              }}
            >
              {w} wk
            </button>
          ))}
        </div>
        {windowInfo?.startLabel && (
          <span style={{ fontSize: '0.66rem', color: '#9ca3af' }}>{windowInfo.startLabel} – {windowInfo.endLabel}</span>
        )}
      </div>

      {/* Validation line */}
      {validation && (
        <div style={{ marginTop: 14, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>
            {validation.saturatedUnderConfiguredCount ?? 0} of {validation.saturatedCount ?? 0} saturated banks mis-configured
          </div>
          <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: 4, lineHeight: 1.45 }}>
            {(validation.saturatedUnderConfiguredCount ?? 0) === 0
              ? "The busiest positions already run the best product (GRAND STAR). The tool confirms the floor team's instincts where it matters most — it is not a machine that reflexively recommends the top product everywhere."
              : `${validation.message} At shorter windows this is a thin-sample signal — check benchmarkN in the flagged list.`}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {(validation.saturatedBanks || []).map((b) => (
              <span key={b.bankKey} style={{ fontSize: '0.7rem', color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 6, padding: '2px 7px' }}>
                {b.bankLabel} · peak occ {pct(b.peakOcc)} · {b.currentProduct}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flagged-bank table (windowed) */}
      <H2 hint="Near-saturated, top-desirability-band banks under-earning the comparable benchmark. Click a bank to focus it on the floor.">
        Flagged banks — wrong product for the position
      </H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(flagged || []).length === 0 && (
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', padding: '8px 2px' }}>No banks flagged at this window.</div>
        )}
        {(flagged || []).map((b) => {
          const sel = selectedBankKey === b.bankKey
          const mix = machineMix && machineMix.get(b.bankKey)
          return (
            <button
              key={b.bankKey}
              type="button"
              onClick={() => onSelectBank && onSelectBank(sel ? null : b.bankKey)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                border: sel ? '1px solid #f59e0b' : '1px solid #e5e7eb', borderRadius: 12,
                background: sel ? '#fff7ed' : '#ffffff', padding: '10px 12px',
                boxShadow: sel ? 'inset 3px 0 0 #f59e0b' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                  {b.bankLabel} <span style={{ fontSize: '0.66rem', fontWeight: 500, color: '#9ca3af' }}>peak occ {pct(b.peakOcc)}</span>
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309' }}>+{usd1(b.gap)}<span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#d1a06a' }}> /avail sh</span></span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#374151', marginTop: 5, lineHeight: 1.35 }}>
                <span style={{ color: '#9ca3af' }}>{b.currentProduct}</span> {usd1(b.currentYield)}
                <span style={{ color: '#b45309', fontWeight: 600 }}> → {b.betterProduct}</span> {usd1(b.achievableComparableYield)}
                <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}> theo/avail sh</span>
              </div>
              {mix && (
                <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 4 }}>
                  {mix.total} machines: {mix.parts.slice(0, 4).map((p) => `${p.count} ${p.family}`).join(', ')}{mix.parts.length > 4 ? ', …' : ''}
                  <span style={{ color: mix.grandStar > 0 ? '#047857' : '#c4c4c4' }}> · GRAND STAR: {mix.grandStar}</span>
                </div>
              )}
              <div style={{ fontSize: '0.63rem', color: '#9ca3af', marginTop: 3 }}>
                {int(b.affectedAvailableSeatHours * shFactor)} avail seat-hrs/yr · benchmark: 75th pct of {b.benchmarkN} comparable positions
              </div>
            </button>
          )
        })}
      </div>

      {/* Glass-box bridge — one headline + first bite */}
      <H2 hint="Every input visible: per-bank gap × affected seat-hours × segmented capture.">
        The dollar bridge
      </H2>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          C1 · Reallocation prize
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a', marginTop: 2 }}>
          {moneyM(c?.c1.annual)}<span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6' }}>/yr</span>
        </div>
        <div style={{ fontSize: '0.66rem', color: '#3b82f6' }}>Q3 FY26 · verified 13-wk basis, annualized ×52/13</div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 6 }}>
          Holds at <strong>{moneyM(c?.c3.annual)}/yr</strong> under a flat-20% capture floor (C3).
        </div>
      </div>

      {/* Executable first bite */}
      {firstBite && (
        <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Executable first bite</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>{moneyM(firstBite.annual)}<span style={{ fontSize: '0.75rem' }}>/yr</span></span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: 3, lineHeight: 1.4 }}>
            Partial reallocation, zero capex: top {firstBite.nBanks} banks, {firstBite.machinesPerBank} machines each
            ({firstBite.banks.map((b) => `${b.bankLabel} ${b.take}/${b.curCount}`).join(', ')}), relocated from lower-yield positions.
          </div>
        </div>
      )}

      {/* Segmented-capture glass box, annualized so the two lines sum to the headline */}
      <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: '0.75rem', color: '#374151' }}>
        <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          The {moneyM(c?.c1.annual)} split by where the seat-hours sit
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span>Constrained seat-hours · {pct(P.captureConstrained ?? 0.85)} capture</span>
          <span style={{ fontWeight: 700 }}>{perYear(T.capturedConstrained * capFactor)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct(T.constrainedShareOfC1)})</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Unconstrained seat-hours · {pct(P.captureUnconstrained ?? 0.10)} capture</span>
          <span style={{ fontWeight: 700 }}>{perYear(T.capturedUnconstrained * capFactor)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct(T.unconstrainedShareOfC1)})</span></span>
        </div>
        <div style={{ fontSize: '0.66rem', color: '#9ca3af', marginTop: 6 }}>
          split at the {P.machineHourConstraintThreshold ?? 0.8} machine-hour occupancy threshold · {int(T.totalConstrained)} constrained / {int(T.totalUnconstrained)} unconstrained seat-hours (13-wk basis)
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <Chip label="benchmark" value={`p${Math.round((P.comparableBenchmarkPercentile ?? 0.75) * 100)}`} />
        <Chip label="bank sat." value={P.bankConstraintThreshold ?? 0.72} />
        <Chip label="mh constr." value={P.machineHourConstraintThreshold ?? 0.8} />
        <Chip label="cap C/U" value={`${pct(P.captureConstrained ?? 0.85)}/${pct(P.captureUnconstrained ?? 0.1)}`} />
        <Chip label="swap/floor" value={`${pct(P.captureProductSwap ?? 0.25)}/${pct(P.captureFlatFloor ?? 0.2)}`} />
      </div>

      {/* Scenarios & upside — collapsed by default */}
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' }}>Scenarios &amp; upside</summary>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1, border: '1px dashed #d1d5db', borderRadius: 12, padding: '11px 13px' }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>C2 · Product-swap · Directional</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#6b7280', marginTop: 3 }}>{perYear(c?.c2.annual)}</div>
            <div style={{ fontSize: '0.63rem', color: '#c4c4c4', marginTop: 1 }}>25% capture · not summed into C1</div>
          </div>
          <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '11px 13px' }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Upside · full-floor</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', marginTop: 3 }}>{perYear(up?.annual)}</div>
            <div style={{ fontSize: '0.63rem', color: '#b45309', marginTop: 1 }}>extrapolation · {up ? up.extrapolationMultiplier.toFixed(1) : '—'}× · not the headline</div>
          </div>
        </div>
      </details>

      {/* Mechanism evidence — weekly heartbeat (window-inherited, table stands alone) */}
      <H2>Weekly heartbeat</H2>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '84px 52px 1fr', gap: 8, padding: '6px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '0.62rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          <span>Day</span><span>Peak hr</span><span>Peak-hour occupancy</span>
        </div>
        {(heartbeat?.days || []).map((d) => {
          const isBusiest = heartbeat.busiest && d.weekday === heartbeat.busiest.weekday
          const w = Math.max(4, (d.peakOccupancy || 0) * 100)
          return (
            <div key={d.weekday} style={{ display: 'grid', gridTemplateColumns: '84px 52px 1fr', alignItems: 'center', gap: 8, padding: '6px 12px', background: isBusiest ? '#fff7ed' : '#ffffff', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: isBusiest ? 700 : 500, color: isBusiest ? '#b45309' : '#374151' }}>{d.weekday}</span>
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{hh(d.peakHour)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                  <div style={{ width: `${w}%`, height: '100%', background: isBusiest ? '#f59e0b' : '#93c5fd', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: isBusiest ? 800 : 600, color: isBusiest ? '#b45309' : '#6b7280', width: 44, textAlign: 'right' }}>{pct(d.peakOccupancy)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* constrained texture / corroboration (pinned to the verified basis) */}
      {constrainedSummary && (
        <div style={{ marginTop: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>Where the 85%-capture money lives</div>
          <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: 4, lineHeight: 1.45 }}>
            The densest ≥{constrainedSummary.threshold} capture cells are all <strong>Sunday 13–16</strong> — a 4-hour
            window that runs <strong>{constrainedSummary.overIndex.toFixed(1)}×</strong> denser than a flat spread.
            The heartbeat and the capture split land on the same window independently.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {(constrainedSummary.topCells || []).slice(0, 4).map((cell) => (
              <span key={`${cell.weekday}-${cell.hour}`} style={{ fontSize: '0.68rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '2px 7px' }}>
                {cell.weekday.slice(0, 3)} {hh(cell.hour)} · {int(cell.constrainedHours)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default YieldPanel
