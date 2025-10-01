import React from 'react';
import { sampleData } from '../data/casinoMockData';

// Days of Week Card - Bar Chart Style
export const DaysOfWeekBarCard = () => {
  const calculateDayData = () => {
    const dayStats = {};
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    daysOrder.forEach(day => {
      const dayData = sampleData.filter(record => record.dayOfWeek === day);
      dayStats[day] = {
        revenue: dayData.reduce((sum, r) => sum + (r.revenue || 0), 0),
        turnover: dayData.reduce((sum, r) => sum + (r.turnover || 0), 0),
        patronHours: dayData.reduce((sum, r) => sum + (r.patronHours || 0), 0)
      };
    });

    const maxRevenue = Math.max(...Object.values(dayStats).map(d => d.revenue));
    return { dayStats, maxRevenue, daysOrder };
  };

  const { dayStats, maxRevenue, daysOrder } = calculateDayData();

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        Performance by Day of Week
      </h3>

      <div style={{ display: 'flex', alignItems: 'end', gap: '1rem', height: '250px', padding: '1rem 0' }}>
        {daysOrder.map((day) => {
          const dayData = dayStats[day];
          const height = (dayData.revenue / maxRevenue) * 200;

          return (
            <div key={day} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                <div>${(dayData.revenue / 1000).toFixed(0)}K</div>
                <div>{(dayData.patronHours / 1000).toFixed(1)}K hrs</div>
              </div>

              <div style={{
                width: '100%',
                maxWidth: '40px',
                height: `${height}px`,
                backgroundColor: day === 'Saturday' || day === 'Sunday' ? '#10b981' : '#3b82f6',
                borderRadius: '4px 4px 0 0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                minHeight: '10px'
              }} />

              <div style={{
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#374151',
                textAlign: 'center',
                transform: 'rotate(-45deg)',
                transformOrigin: 'center',
                width: '60px',
                marginTop: '1rem'
              }}>
                {day.substring(0, 3)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Weekdays</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Weekends</span>
        </div>
      </div>
    </div>
  );
};

// Games Performance Card - Grid Layout
export const GamesGridCard = () => {
  const calculateGameData = () => {
    const gameStats = {};

    sampleData.forEach(record => {
      if (!gameStats[record.game]) {
        gameStats[record.game] = {
          revenue: 0,
          turnover: 0,
          patronHours: 0,
          sessions: 0
        };
      }
      gameStats[record.game].revenue += record.revenue || 0;
      gameStats[record.game].turnover += record.turnover || 0;
      gameStats[record.game].patronHours += record.patronHours || 0;
      gameStats[record.game].sessions += 1;
    });

    // Sort by revenue and take top 8
    const sortedGames = Object.entries(gameStats)
      .map(([game, stats]) => ({
        game,
        ...stats,
        avgRevenue: stats.revenue / stats.sessions,
        holdPercentage: (stats.revenue / stats.turnover) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return sortedGames;
  };

  const gameData = calculateGameData();

  const getPerformanceColor = (holdPercentage) => {
    if (holdPercentage >= 12) return '#10b981';
    if (holdPercentage >= 8) return '#3b82f6';
    if (holdPercentage >= 5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        Top Performing Games
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {gameData.map((game, index) => (
          <div key={game.game} style={{
            border: '1px solid #f3f4f6',
            borderRadius: '12px',
            padding: '1rem',
            backgroundColor: index < 3 ? '#fefce8' : '#f9fafb',
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            {index < 3 && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#f97316',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {index + 1}
              </div>
            )}

            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem',
              lineHeight: '1.2'
            }}>
              {game.game}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Revenue</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                  ${(game.revenue / 1000).toFixed(0)}K
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Hold %</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                    {game.holdPercentage.toFixed(1)}%
                  </span>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getPerformanceColor(game.holdPercentage)
                  }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sessions</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                  {game.sessions.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '1rem',
        fontSize: '0.75rem',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
          <span>Excellent (12%+)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
          <span>Good (8-12%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
          <span>Fair (5-8%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
          <span>Poor (&lt;5%)</span>
        </div>
      </div>
    </div>
  );
};

// Areas Performance Card - Heatmap Style
export const AreasHeatmapCard = () => {
  const calculateAreaData = () => {
    const areaStats = {};

    sampleData.forEach(record => {
      if (!areaStats[record.area]) {
        areaStats[record.area] = {
          revenue: 0,
          turnover: 0,
          patronHours: 0,
          sessions: 0,
          segment: record.segment
        };
      }
      areaStats[record.area].revenue += record.revenue || 0;
      areaStats[record.area].turnover += record.turnover || 0;
      areaStats[record.area].patronHours += record.patronHours || 0;
      areaStats[record.area].sessions += 1;
    });

    // Calculate normalized scores for heatmap
    const areas = Object.entries(areaStats).map(([area, stats]) => {
      const revenuePerSession = stats.revenue / stats.sessions;
      const utilizationRate = stats.patronHours / stats.sessions;
      const holdPercentage = (stats.revenue / stats.turnover) * 100;

      return {
        area,
        ...stats,
        revenuePerSession,
        utilizationRate,
        holdPercentage,
        // Composite performance score (0-100)
        performanceScore: Math.min(
          (revenuePerSession / 500) * 30 + // Revenue weight: 30%
          (utilizationRate / 20) * 40 + // Utilization weight: 40%
          (holdPercentage / 15) * 30, // Hold weight: 30%
          100
        )
      };
    });

    return areas.sort((a, b) => b.performanceScore - a.performanceScore);
  };

  const areaData = calculateAreaData();

  const getHeatmapColor = (score) => {
    if (score >= 80) return { bg: '#dcfce7', text: '#166534', border: '#22c55e' };
    if (score >= 60) return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
    if (score >= 40) return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
    return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
  };

  const getSegmentIcon = (segment) => {
    switch (segment) {
      case 'VIP': return '👑';
      case 'Premium': return '💎';
      case 'Mass': return '🎯';
      default: return '🎰';
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        Area Performance Heatmap
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        {areaData.map((area) => {
          const colors = getHeatmapColor(area.performanceScore);

          return (
            <div key={area.area} style={{
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '1rem',
              backgroundColor: colors.bg,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '1rem' }}>{getSegmentIcon(area.segment)}</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: colors.text
                  }}>
                    {area.area}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: colors.text,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px'
                }}>
                  {area.performanceScore.toFixed(0)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: colors.text, opacity: 0.8 }}>Revenue</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: colors.text }}>
                    ${(area.revenue / 1000).toFixed(0)}K
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: colors.text, opacity: 0.8 }}>Hold %</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: colors.text }}>
                    {area.holdPercentage.toFixed(1)}%
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: colors.text, opacity: 0.8 }}>Utilization</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: colors.text }}>
                    {area.utilizationRate.toFixed(1)}h
                  </span>
                </div>
              </div>

              {/* Performance bar */}
              <div style={{
                marginTop: '0.75rem',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${area.performanceScore}%`,
                  height: '100%',
                  backgroundColor: colors.border,
                  borderRadius: '2px',
                  transition: 'width 1s ease-in-out'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: '#6b7280'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Performance Score Breakdown:</div>
        <div>• Revenue per Session (30%) + Utilization Rate (40%) + Hold Percentage (30%)</div>
      </div>
    </div>
  );
};

// Alternative Areas Card - Table Style with Sorting
export const AreasTableCard = () => {
  const [sortField, setSortField] = React.useState('revenue');
  const [sortOrder, setSortOrder] = React.useState('desc');

  const calculateAreaData = () => {
    const areaStats = {};

    sampleData.forEach(record => {
      if (!areaStats[record.area]) {
        areaStats[record.area] = {
          revenue: 0,
          turnover: 0,
          patronHours: 0,
          sessions: 0,
          segment: record.segment
        };
      }
      areaStats[record.area].revenue += record.revenue || 0;
      areaStats[record.area].turnover += record.turnover || 0;
      areaStats[record.area].patronHours += record.patronHours || 0;
      areaStats[record.area].sessions += 1;
    });

    return Object.entries(areaStats).map(([area, stats]) => ({
      area,
      ...stats,
      revenuePerSession: stats.revenue / stats.sessions,
      holdPercentage: (stats.revenue / stats.turnover) * 100,
      utilizationRate: stats.patronHours / stats.sessions
    }));
  };

  const areaData = calculateAreaData();

  const sortedData = [...areaData].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortField] - b[sortField];
    }
    return b[sortField] - a[sortField];
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem' }}>
      {sortField === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕️'}
    </span>
  );

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        Detailed Area Performance
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Area
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Segment
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('revenue')}
              >
                Revenue <SortIcon field="revenue" />
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('holdPercentage')}
              >
                Hold % <SortIcon field="holdPercentage" />
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('utilizationRate')}
              >
                Avg Hours <SortIcon field="utilizationRate" />
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => handleSort('sessions')}
              >
                Sessions <SortIcon field="sessions" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((area, index) => (
              <tr
                key={area.area}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                }}
              >
                <td style={{ padding: '0.75rem', fontWeight: '500', color: '#111827' }}>
                  {area.area}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: area.segment === 'VIP' ? '#fef3c7' : area.segment === 'Premium' ? '#dbeafe' : '#f3f4f6',
                    color: area.segment === 'VIP' ? '#92400e' : area.segment === 'Premium' ? '#1e40af' : '#374151'
                  }}>
                    {area.segment}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                  ${(area.revenue / 1000).toFixed(0)}K
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                  {area.holdPercentage.toFixed(1)}%
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                  {area.utilizationRate.toFixed(1)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                  {area.sessions.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};