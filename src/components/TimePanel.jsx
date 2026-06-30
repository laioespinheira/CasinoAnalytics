import React, { useMemo } from 'react'
import InsightPanel from './InsightPanel'
import CustomerDemandPanel from './CustomerDemandPanel'

// "Deep analytics" home for the Time tab. It does NOT re-implement any metric:
// it reuses the exact descriptive panels and data sources that feed the heatmap
// drawer (getPerformanceInsights / getZoneOccupancy / the customer-tier hook),
// rendered in-flow off the shared App.filters so the readouts reconcile with the
// floor. There is no floor-highlight interaction here (the floor is not visible
// behind this view), so the panels run read-only.

const formatHour = (hour) => {
  if (hour === 'all' || hour === undefined || hour === null) return 'All hours'
  const n = parseInt(hour, 10)
  if (Number.isNaN(n)) return 'All hours'
  if (n === 0) return '12:00 AM'
  if (n < 12) return `${n}:00 AM`
  if (n === 12) return '12:00 PM'
  return `${n - 12}:00 PM`
}

const containerStyles = {
  position: 'fixed',
  top: '110px',
  left: 0,
  right: 0,
  bottom: 0,
  background: '#f3f4f6',
  overflowY: 'auto',
  zIndex: 900
}

const innerStyles = {
  maxWidth: 1600,
  margin: '0 auto',
  padding: '24px 32px 48px'
}

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: 24,
  alignItems: 'start'
}

const TimePanel = ({
  filters,
  selectedTier,
  getPerformanceInsights,
  getZoneOccupancy,
  getCustomerDemandInsights,
  tierLoading,
  tierReady
}) => {
  // Non-DD machines only have valid aggregates when all weeks are selected (they
  // have no per-week breakdown). So under a specific-week filter, Time is forced
  // to Zone DD; with all weeks, it follows the shared zone filter and defaults to
  // Zone DD when that filter is "all". This guarantees no non-DD numbers ever
  // render under a specific week.
  const weekScoped = Boolean(filters.weekEnding && filters.weekEnding !== 'all')
  const timeZone = weekScoped
    ? 'Zone DD'
    : (filters.zone && filters.zone !== 'all' ? filters.zone : 'Zone DD')

  const timeFilters = useMemo(
    () => ({ ...filters, zone: timeZone }),
    [filters, timeZone]
  )

  const insights = useMemo(
    () => getPerformanceInsights(timeZone, timeFilters),
    [getPerformanceInsights, timeZone, timeFilters]
  )

  const occupancy = useMemo(
    () => getZoneOccupancy(timeZone, timeFilters),
    [getZoneOccupancy, timeZone, timeFilters]
  )

  const customerInsights = useMemo(
    () => getCustomerDemandInsights(timeFilters, selectedTier),
    [getCustomerDemandInsights, timeFilters, selectedTier]
  )

  const dayLabel = filters.dayOfWeek && filters.dayOfWeek !== 'all' ? filters.dayOfWeek : 'All days'
  const weekLabel = weekScoped ? filters.weekEnding : 'All weeks'

  return (
    <div style={containerStyles}>
      <div style={innerStyles}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Deep Analytics
          </h1>
          <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 6 }}>
            {`${timeZone} · ${weekLabel} · ${dayLabel} at ${formatHour(filters.hourOfDay)}`}
          </div>
          {weekScoped && (
            <div
              style={{
                marginTop: 12,
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '0.8rem',
                lineHeight: 1.4
              }}
            >
              Showing <strong>Zone DD only</strong>. Non-DD machines have no weekly
              breakdown, so they are excluded while a specific week is selected.
              Switch the Week filter to “All Weeks” to include other zones.
            </div>
          )}
        </div>

        {/* Reused real-data descriptive panels, in-flow and read-only */}
        <div style={gridStyles}>
          <InsightPanel
            embedded
            zone={timeZone}
            hour={filters.hourOfDay}
            day={filters.dayOfWeek}
            insights={insights}
            occupancy={occupancy}
            highlightTarget={null}
            onHighlightChange={undefined}
          />
          <CustomerDemandPanel
            embedded
            zone={timeZone}
            hour={filters.hourOfDay}
            day={filters.dayOfWeek}
            tier={selectedTier}
            insights={customerInsights}
            loading={tierLoading}
            ready={tierReady}
            highlightTarget={null}
            onHighlightChange={undefined}
          />
        </div>
      </div>
    </div>
  )
}

export default TimePanel
