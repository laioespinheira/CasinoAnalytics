import React from 'react'

// The Yield tab's hero panel. In DEMO_MODE it shows the pared-down pitch surface
// (constrained-hours headline, machine mix, plain words); with demoMode=false the
// full analytical surface is restored (C1/C3/C2, capture split, parameter chips,
// scenarios expander, constrained-texture section). Numbers come from the verified
// hooks. Period language: Q3 FY26.

const moneyLabel = (n) => {
  if (n == null) return 'n/a'
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${Math.round(n / 1e3)}k`
}
const perYear = (n) => `${moneyLabel(n)}/yr`
const usd1 = (n) => (n == null ? '—' : `$${n.toFixed(1)}`)
const pct = (n) => (n == null ? 'n/a' : `${(n * 100).toFixed(1)}%`)
const int = (n) => Math.round(n || 0).toLocaleString()
const hh = (h) => `${String(h).padStart(2, '0')}:00`

const REVPAR_HOVER = 'Theoretical win (luck-adjusted expected earnings) per hour of seat availability — the floor\'s RevPAR.'

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

const Chip = ({ label, value }) => (
  <div style={{ display: 'inline-flex', gap: 5, alignItems: 'baseline', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 999, padding: '3px 9px', fontSize: '0.68rem', color: '#6b7280', marginRight: 6, marginTop: 6 }}>
    <span>{label}</span><span style={{ fontWeight: 700, color: '#374151' }}>{value}</span>
  </div>
)

const mixText = (info) => {
  if (!info || !info.parts || !info.parts.length) return null
  const head = info.parts.slice(0, 4).map((p) => `${p.count} ${p.family}`).join(', ')
  return `${info.total} machines: ${head}${info.parts.length > 4 ? ', …' : ''}`
}

const YieldPanel = ({ demoMode, windowInfo, onWindowChange, validation, flagged, bankInfo, bridge, demoHeadline, firstBite, heartbeat, constrainedSummary, selectedBankKey, onSelectBank }) => {
  const c = bridge?.components
  const P = bridge?.params || {}
  const T = bridge?.totals || {}
  const up = bridge?.upside
  const weeks = windowInfo?.weeks || 13
  const shFactor = 52 / weeks
  const capFactor = c && c.c1.window > 0 ? c.c1.annual / c.c1.window : 4

  return (
    <div style={PANEL}>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
        Yield — placement-adjusted product ranking
      </div>
      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>
        Zone DD · earnings per available seat-hour · Q3 FY26 ({windowInfo?.basisLabel})
      </div>

      {/* Data-window selector (descriptive layers only) */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Window</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(windowInfo?.options || [13, 8]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWindowChange && onWindowChange(w)}
              style={{
                padding: '4px 11px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                border: weeks === w ? '1px solid #3b82f6' : '1px solid #d1d5db',
                background: weeks === w ? '#eff6ff' : '#ffffff', color: weeks === w ? '#1d4ed8' : '#6b7280'
              }}
            >
              {w} wk
            </button>
          ))}
        </div>
        {windowInfo?.spanLabel && <span style={{ fontSize: '0.66rem', color: '#9ca3af' }}>{windowInfo.spanLabel}</span>}
      </div>
      {windowInfo?.peakOccNote && (
        <div style={{ fontSize: '0.66rem', color: '#9ca3af', marginTop: 6, lineHeight: 1.4 }}>{windowInfo.peakOccNote}</div>
      )}

      {/* Validation */}
      {validation && (
        <div style={{ marginTop: 14, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>
            {validation.saturatedUnderConfiguredCount ?? 0} of {validation.saturatedCount ?? 0} saturated banks mis-configured
          </div>
          <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: 4, lineHeight: 1.45 }}>
            {(validation.saturatedUnderConfiguredCount ?? 0) === 0
              ? "The busiest positions already run the best product (GRAND STAR). The tool confirms the floor team's instincts where it matters most — it is not a machine that reflexively recommends the top product everywhere."
              : `${validation.message} At shorter windows this is a thin-sample signal — check the comparable count in the flagged list.`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {(validation.saturatedBanks || []).map((b) => {
              const info = bankInfo && bankInfo.get(b.bankKey)
              return (
                <div key={b.bankKey} style={{ background: '#ffffff', border: '1px solid #a7f3d0', borderRadius: 10, padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46' }}>
                    {b.bankLabel} <span style={{ fontSize: '0.66rem', fontWeight: 500, color: '#059669' }}>{pct(b.peakOcc)} full at peak · runs {b.currentProduct}</span>
                  </div>
                  {mixText(info) && <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 3 }}>{mixText(info)}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Flagged-bank table (windowed) */}
      <H2 hint="Near-saturated banks under-earning comparable positions. Click a bank to focus it on the floor.">
        Flagged banks — wrong product for the position
      </H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(flagged || []).length === 0 && (
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', padding: '8px 2px' }}>No banks flagged at this window.</div>
        )}
        {(flagged || []).map((b) => {
          const sel = selectedBankKey === b.bankKey
          const info = bankInfo && bankInfo.get(b.bankKey)
          const mix = mixText(info)
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
                  {b.bankLabel} <span style={{ fontSize: '0.66rem', fontWeight: 500, color: '#9ca3af' }}>{pct(b.peakOcc)} full at peak</span>
                </span>
                <span title={REVPAR_HOVER} style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309' }}>
                  +{usd1(b.gap)}<span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#d1a06a' }}> /seat-hr</span>
                </span>
              </div>
              <div title={REVPAR_HOVER} style={{ fontSize: '0.74rem', color: '#374151', marginTop: 5, lineHeight: 1.35 }}>
                <span style={{ color: '#9ca3af' }}>{b.currentProduct}</span> earns {usd1(b.currentYield)}
                <span style={{ color: '#b45309', fontWeight: 600 }}> → {b.betterProduct}</span> {usd1(b.achievableComparableYield)}
                <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}> per seat-hour</span>
              </div>
              {mix && (
                <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 4 }}>
                  {mix}<span style={{ color: info.grandStar > 0 ? '#047857' : '#c4c4c4' }}> · GRAND STAR: {info.grandStar}</span>
                </div>
              )}
              <div title={`75th percentile of ${b.benchmarkN} comparable positions running the better product`} style={{ fontSize: '0.63rem', color: '#9ca3af', marginTop: 3 }}>
                achievable = 75th pct of {b.benchmarkN} comparable positions
                {!demoMode && <> · {int(b.affectedAvailableSeatHours * shFactor)} avail seat-hrs/yr</>}
              </div>
            </button>
          )
        })}
      </div>

      {/* ===== Bridge ===== */}
      {demoMode ? (
        <>
          <H2>The prize</H2>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a' }}>
              ~{moneyLabel(demoHeadline?.annual)}<span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6' }}>/yr</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', marginTop: 6, lineHeight: 1.45 }}>
              measured only in the hours the floor is <strong>effectively full</strong> — counting {pct(demoHeadline?.capture)} of
              the observed earnings gap. Annualized from {windowInfo?.basisLabel} (Q3 FY26).
            </div>
          </div>
          {firstBite && (
            <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Executable first bite</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>~{perYear(firstBite.annual)}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: 3, lineHeight: 1.4 }}>
                Zero capex: top {firstBite.nBanks} banks, {firstBite.machinesPerBank} machines each
                ({firstBite.banks.map((b) => `${b.bankLabel} ${b.take}/${b.curCount}`).join(', ')}), relocated from lower-yield positions. Same effectively-full basis.
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <H2 hint="Every input visible: per-bank gap × affected seat-hours × segmented capture.">The dollar bridge</H2>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>C1 · Reallocation prize</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a', marginTop: 2 }}>
              {moneyLabel(c?.c1.annual)}<span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6' }}>/yr</span>
            </div>
            <div style={{ fontSize: '0.66rem', color: '#3b82f6' }}>Q3 FY26 · verified basis, annualized ×52/13</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 6 }}>Holds at <strong>{moneyLabel(c?.c3.annual)}/yr</strong> under a flat-20% capture floor (C3).</div>
          </div>
          {firstBite && (
            <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Executable first bite</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>{perYear(firstBite.annual)}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: 3, lineHeight: 1.4 }}>
                Zero capex: top {firstBite.nBanks} banks, {firstBite.machinesPerBank} machines each
                ({firstBite.banks.map((b) => `${b.bankLabel} ${b.take}/${b.curCount}`).join(', ')}).
              </div>
            </div>
          )}
          <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: '0.75rem', color: '#374151' }}>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>The {moneyLabel(c?.c1.annual)} split by where the seat-hours sit</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span>Constrained · {pct(P.captureConstrained ?? 0.85)} capture</span>
              <span style={{ fontWeight: 700 }}>{perYear(T.capturedConstrained * capFactor)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct(T.constrainedShareOfC1)})</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Unconstrained · {pct(P.captureUnconstrained ?? 0.10)} capture</span>
              <span style={{ fontWeight: 700 }}>{perYear(T.capturedUnconstrained * capFactor)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({pct(T.unconstrainedShareOfC1)})</span></span>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Chip label="benchmark" value={`p${Math.round((P.comparableBenchmarkPercentile ?? 0.75) * 100)}`} />
            <Chip label="bank sat." value={P.bankConstraintThreshold ?? 0.72} />
            <Chip label="mh constr." value={P.machineHourConstraintThreshold ?? 0.8} />
            <Chip label="cap C/U" value={`${pct(P.captureConstrained ?? 0.85)}/${pct(P.captureUnconstrained ?? 0.1)}`} />
            <Chip label="swap/floor" value={`${pct(P.captureProductSwap ?? 0.25)}/${pct(P.captureFlatFloor ?? 0.2)}`} />
          </div>
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' }}>Scenarios &amp; upside</summary>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1, border: '1px dashed #d1d5db', borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>C2 · Product-swap · Directional</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#6b7280', marginTop: 3 }}>{perYear(c?.c2.annual)}</div>
              </div>
              <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Upside · full-floor</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', marginTop: 3 }}>{perYear(up?.annual)}</div>
                <div style={{ fontSize: '0.63rem', color: '#b45309', marginTop: 1 }}>extrapolation · {up ? up.extrapolationMultiplier.toFixed(1) : '—'}×</div>
              </div>
            </div>
          </details>
        </>
      )}

      {/* Weekly heartbeat (window-inherited, table stands alone) */}
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

      {/* Constrained-texture corroboration — full surface only */}
      {!demoMode && constrainedSummary && (
        <div style={{ marginTop: 10, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>Where the 85%-capture money lives</div>
          <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: 4, lineHeight: 1.45 }}>
            The densest ≥{constrainedSummary.threshold} capture cells are all <strong>Sunday 13–16</strong> — a 4-hour
            window that runs <strong>{constrainedSummary.overIndex.toFixed(1)}×</strong> denser than a flat spread.
          </div>
        </div>
      )}
    </div>
  )
}

export default YieldPanel
