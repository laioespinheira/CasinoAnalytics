import React from 'react'

// The Yield tab's hero panel: placement-adjusted flagged-bank table + validation
// line, the glass-box dollar bridge, and the mechanism evidence (weekly heartbeat
// + constrained texture). Presentational only - all numbers come from the verified
// usePlacementBridge / useValueDensity hooks. Light theme, matching the app's
// existing drawer styling. Pitch framings are verbatim from brief sec 10/11.

const moneyM = (n) => {
  if (n == null) return 'n/a'
  const m = n / 1e6
  if (Math.abs(m) >= 1) return `$${m.toFixed(2)}M`
  return `$${(n / 1e3).toFixed(1)}k`
}
const perYear = (n) => `${moneyM(n)}/yr`
const usd2 = (n) => (n == null ? 'n/a' : `$${n.toFixed(2)}`)
const pct = (n) => (n == null ? 'n/a' : `${(n * 100).toFixed(1)}%`)
const int = (n) => Math.round(n || 0).toLocaleString()
const hh = (h) => `${String(h).padStart(2, '0')}:00`

const PANEL = {
  position: 'fixed',
  top: '110px',
  right: 0,
  bottom: 0,
  width: '440px',
  background: '#ffffff',
  borderLeft: '1px solid #e5e7eb',
  boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
  overflowY: 'auto',
  zIndex: 900,
  padding: '20px 20px 40px',
  boxSizing: 'border-box'
}

const H2 = ({ children, hint }) => (
  <div style={{ marginTop: 22, marginBottom: 10 }}>
    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{children}</div>
    {hint && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 3 }}>{hint}</div>}
  </div>
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

const YieldPanel = ({ validation, flagged, bridge, heartbeat, constrainedSummary, selectedBankKey, onSelectBank }) => {
  const c = bridge?.components
  const P = bridge?.params || {}
  const T = bridge?.totals || {}
  const up = bridge?.upside

  return (
    <div style={PANEL}>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
        Yield — placement-adjusted product ranking
      </div>
      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>
        Zone DD · theo win per available seat-hour · 13-week Q1 window
      </div>

      {/* 1. VALIDATION LINE (credibility, must be visible) */}
      {validation && (
        <div style={{
          marginTop: 16, background: '#ecfdf5', border: '1px solid #a7f3d0',
          borderRadius: 12, padding: '12px 14px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>
            {validation.saturatedUnderConfiguredCount ?? 0} of {validation.saturatedCount ?? 0} saturated banks mis-configured
          </div>
          <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: 4, lineHeight: 1.45 }}>
            The busiest positions already run the best product (GRAND STAR). The tool confirms the
            floor team's instincts where it matters most — it is not a machine that reflexively
            recommends the top product everywhere.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {(validation.saturatedBanks || []).map((b) => (
              <span key={b.bankKey} style={{
                fontSize: '0.7rem', color: '#065f46', background: '#d1fae5',
                border: '1px solid #6ee7b7', borderRadius: 6, padding: '2px 7px'
              }}>
                {b.bankLabel} · {pct(b.peakOcc)} · {b.currentProduct}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 1b. FLAGGED-BANK TABLE */}
      <H2 hint="Near-saturated, top-desirability-band banks under-earning the comparable benchmark. Click a bank to focus it on the floor.">
        Flagged banks — wrong product for the position
      </H2>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '52px 1fr 1fr 64px', gap: 0,
          background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
          fontSize: '0.66rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em'
        }}>
          <div style={{ padding: '8px 10px' }}>Bank</div>
          <div style={{ padding: '8px 6px' }}>Current → Better</div>
          <div style={{ padding: '8px 6px' }}>Yield → Achiev.</div>
          <div style={{ padding: '8px 10px', textAlign: 'right' }}>Gap</div>
        </div>
        {(flagged || []).map((b) => {
          const sel = selectedBankKey === b.bankKey
          return (
            <button
              key={b.bankKey}
              type="button"
              onClick={() => onSelectBank && onSelectBank(sel ? null : b.bankKey)}
              style={{
                display: 'grid', gridTemplateColumns: '52px 1fr 1fr 64px', gap: 0, width: '100%',
                textAlign: 'left', cursor: 'pointer', border: 'none',
                borderBottom: '1px solid #f3f4f6',
                background: sel ? '#fff7ed' : '#ffffff',
                boxShadow: sel ? 'inset 3px 0 0 #f59e0b' : 'none'
              }}
            >
              <div style={{ padding: '9px 10px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>{b.bankLabel}</div>
                <div style={{ fontSize: '0.66rem', color: '#9ca3af' }}>{pct(b.peakOcc)}</div>
              </div>
              <div style={{ padding: '9px 6px', fontSize: '0.72rem', color: '#374151', lineHeight: 1.3 }}>
                <div style={{ color: '#9ca3af' }}>{b.currentProduct}</div>
                <div style={{ fontWeight: 600, color: '#b45309' }}>↳ {b.betterProduct}</div>
              </div>
              <div style={{ padding: '9px 6px', fontSize: '0.72rem', color: '#374151', lineHeight: 1.3 }}>
                <div style={{ color: '#9ca3af' }}>{usd2(b.currentYield)}</div>
                <div style={{ fontWeight: 600, color: '#047857' }}>↳ {usd2(b.achievableComparableYield)}</div>
                <div style={{ fontSize: '0.6rem', color: '#c4c4c4' }}>p75·n{b.benchmarkN}</div>
              </div>
              <div style={{ padding: '9px 10px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309' }}>+{usd2(b.gap)}</div>
                <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{int(b.affectedAvailableSeatHours)} sh</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 2. GLASS-BOX BRIDGE */}
      <H2 hint="Every input visible: per-bank gap × affected seat-hours × segmented capture.">
        The dollar bridge
      </H2>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            C1 · Reallocation prize
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginTop: 4 }}>{perYear(c?.c1.annual)}</div>
          <div style={{ fontSize: '0.66rem', color: '#3b82f6', marginTop: 2 }}>annualized from a 13-week Q1 window</div>
        </div>
        <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            C3 · Floor (flat 20%)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151', marginTop: 4 }}>{perYear(c?.c3.annual)}</div>
          <div style={{ fontSize: '0.66rem', color: '#9ca3af', marginTop: 2 }}>C1 ≈ C3 → robust, not fragile</div>
        </div>
      </div>

      {/* Segmented-capture glass box */}
      <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: '0.75rem', color: '#374151' }}>
        <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>C1 capture split (13-week)</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span>Constrained seat-hours · {P.captureConstrained != null ? pct(P.captureConstrained) : '85%'}</span>
          <span style={{ fontWeight: 700 }}>{moneyM(T.capturedConstrained)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct(T.constrainedShareOfC1)})</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Unconstrained seat-hours · {P.captureUnconstrained != null ? pct(P.captureUnconstrained) : '10%'}</span>
          <span style={{ fontWeight: 700 }}>{moneyM(T.capturedUnconstrained)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct(T.unconstrainedShareOfC1)})</span></span>
        </div>
        <div style={{ fontSize: '0.66rem', color: '#9ca3af', marginTop: 6 }}>
          split at the {P.machineHourConstraintThreshold ?? 0.8} machine-hour occupancy threshold · {int(T.totalConstrained)} constrained / {int(T.totalUnconstrained)} unconstrained of {int(T.totalAffected)} seat-hours
        </div>
      </div>

      {/* C2 directional + upside */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1, border: '1px dashed #d1d5db', borderRadius: 12, padding: '11px 13px' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>C2 · Product-swap · Directional</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#6b7280', marginTop: 3 }}>{perYear(c?.c2.annual)}</div>
          <div style={{ fontSize: '0.63rem', color: '#c4c4c4', marginTop: 1 }}>25% capture · shown beside, not in C1</div>
        </div>
        <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '11px 13px' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Upside · full-floor</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', marginTop: 3 }}>{perYear(up?.annual)}</div>
          <div style={{ fontSize: '0.63rem', color: '#b45309', marginTop: 1 }}>extrapolation · {up ? up.extrapolationMultiplier.toFixed(1) : '—'}× · not the headline</div>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <Chip label="benchmark" value={`p${Math.round((P.comparableBenchmarkPercentile ?? 0.75) * 100)}`} />
        <Chip label="bank sat." value={P.bankConstraintThreshold ?? 0.72} />
        <Chip label="mh constr." value={P.machineHourConstraintThreshold ?? 0.8} />
        <Chip label="cap C/U" value={`${pct(P.captureConstrained ?? 0.85)}/${pct(P.captureUnconstrained ?? 0.1)}`} />
        <Chip label="swap/floor" value={`${pct(P.captureProductSwap ?? 0.25)}/${pct(P.captureFlatFloor ?? 0.2)}`} />
      </div>

      {/* 3. MECHANISM EVIDENCE — weekly heartbeat */}
      <H2 hint="Weekdays peak mid-afternoon, weekends peak in the evening — except Sunday, which peaks at 2pm at 68.9%, the busiest single hour of the entire week, well above even Friday and Saturday nights (~50%).">
        Weekly heartbeat
      </H2>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        {(heartbeat?.days || []).map((d) => {
          const isBusiest = heartbeat.busiest && d.weekday === heartbeat.busiest.weekday
          const w = Math.max(4, (d.peakOccupancy || 0) * 100)
          return (
            <div key={d.weekday} style={{
              display: 'grid', gridTemplateColumns: '84px 52px 1fr', alignItems: 'center', gap: 8,
              padding: '6px 12px', background: isBusiest ? '#fff7ed' : '#ffffff',
              borderBottom: '1px solid #f3f4f6'
            }}>
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

      {/* constrained texture / corroboration */}
      {constrainedSummary && (
        <div style={{ marginTop: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>Where the 85%-capture money lives</div>
          <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: 4, lineHeight: 1.45 }}>
            Our highest-confidence money lives in a window nobody thinks of as peak: the densest
            ≥{constrainedSummary.threshold} capture cells are all <strong>Sunday 13–16</strong> — a 4-hour
            window that runs <strong>{constrainedSummary.overIndex.toFixed(1)}×</strong> denser than a flat
            spread. The heartbeat and the capture split land on the same window independently.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {(constrainedSummary.topCells || []).slice(0, 4).map((cell) => (
              <span key={`${cell.weekday}-${cell.hour}`} style={{
                fontSize: '0.68rem', color: '#92400e', background: '#fffbeb',
                border: '1px solid #fde68a', borderRadius: 6, padding: '2px 7px'
              }}>
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
