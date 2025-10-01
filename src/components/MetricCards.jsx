import React from 'react';

// Alternative Card Layout 2: Circular Progress (Gauge Style)
export const CircularMetricsCard = ({ metrics }) => {
  const CircularProgress = ({ value, max, size = 120, strokeWidth = 8, color }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min((value / max) * 100, 100);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
            {percentage.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>vs target</div>
        </div>
      </div>
    );
  };

  const formatValue = (value, type) => {
    if (type === 'revenue' || type === 'turnover') {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(1)}K`;
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        Performance Gauges
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
        justifyItems: 'center'
      }}>
        {/* Revenue Gauge */}
        <div style={{ textAlign: 'center' }}>
          <CircularProgress
            value={metrics.current7Days.revenue}
            max={metrics.weeklyAverage.revenue}
            color="#10b981"
          />
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginTop: '1rem' }}>
            Revenue
          </h4>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
            {formatValue(metrics.current7Days.revenue, 'revenue')}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Target: {formatValue(metrics.weeklyAverage.revenue, 'revenue')}
          </div>
        </div>

        {/* Turnover Gauge */}
        <div style={{ textAlign: 'center' }}>
          <CircularProgress
            value={metrics.current7Days.turnover}
            max={metrics.weeklyAverage.turnover}
            color="#3b82f6"
          />
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginTop: '1rem' }}>
            Turnover
          </h4>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
            {formatValue(metrics.current7Days.turnover, 'turnover')}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Target: {formatValue(metrics.weeklyAverage.turnover, 'turnover')}
          </div>
        </div>

        {/* Patron Hours Gauge */}
        <div style={{ textAlign: 'center' }}>
          <CircularProgress
            value={metrics.current7Days.patronHours}
            max={metrics.weeklyAverage.patronHours}
            color="#8b5cf6"
          />
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginTop: '1rem' }}>
            Patron Hours
          </h4>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
            {formatValue(metrics.current7Days.patronHours, 'patronHours')}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Target: {formatValue(metrics.weeklyAverage.patronHours, 'patronHours')}
          </div>
        </div>
      </div>
    </div>
  );
};

// Alternative Card Layout 3: Minimalist Cards with Big Numbers
export const MinimalistMetricsCard = ({ metrics }) => {
  const formatValue = (value, type) => {
    if (type === 'revenue' || type === 'turnover') {
      return {
        main: (value / 1000000).toFixed(1),
        suffix: 'M'
      };
    }
    return {
      main: (value / 1000).toFixed(1),
      suffix: 'K'
    };
  };

  const getChangeColor = (current, previous) => {
    return current > previous ? '#10b981' : '#ef4444';
  };

  const getChangeIcon = (current, previous) => {
    return current > previous ? '↗' : '↘';
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Revenue Card */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #f3f4f6',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
        ':hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
          REVENUE (7 DAYS)
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: '800', color: '#111827' }}>
            ${formatValue(metrics.current7Days.revenue, 'revenue').main}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6b7280', marginLeft: '0.25rem' }}>
            {formatValue(metrics.current7Days.revenue, 'revenue').suffix}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', 
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: getChangeColor(metrics.current7Days.revenue, metrics.previousYear.revenue),
          }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getChangeIcon(metrics.current7Days.revenue, metrics.previousYear.revenue)}
          </span>
          {Math.abs(((metrics.current7Days.revenue / metrics.previousYear.revenue - 1) * 100)).toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          vs previous year
        </div>
      </div>
        
          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: getChangeColor(metrics.current7Days.revenue, metrics.weeklyBudgets.revenue),
          }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getChangeIcon(metrics.current7Days.revenue, metrics.weeklyBudgets.revenue)}
          </span>
          {Math.abs(((metrics.current7Days.revenue / metrics.weeklyBudgets.revenue - 1) * 100)).toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          vs budget
        </div>
      </div> 
    </div>

    </div>

      {/* Turnover Card */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #f3f4f6',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
        ':hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
          TURNOVER (7 DAYS)
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: '800', color: '#111827' }}>
            ${formatValue(metrics.current7Days.turnover, 'turnover').main}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6b7280', marginLeft: '0.25rem' }}>
            {formatValue(metrics.current7Days.turnover, 'turnover').suffix}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: getChangeColor(metrics.current7Days.turnover, metrics.previousYear.turnover),
          }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getChangeIcon(metrics.current7Days.turnover, metrics.previousYear.turnover)}
          </span>
          {Math.abs(((metrics.current7Days.turnover / metrics.previousYear.turnover - 1) * 100)).toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          vs previous year
        </div>
      </div>

          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: getChangeColor(metrics.current7Days.turnover, metrics.weeklyBudgets.turnover),
          }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getChangeIcon(metrics.current7Days.turnover, metrics.weeklyBudgets.turnover)}
          </span>
          {Math.abs(((metrics.current7Days.turnover / metrics.weeklyBudgets.turnover - 1) * 100)).toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          vs budget
        </div>
      </div>
    </div>
      </div>

      {/* Patron Hours Card */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #f3f4f6',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
        ':hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
          PATRON HOURS (7 DAYS)
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: '800', color: '#111827' }}>
            {formatValue(metrics.current7Days.patronHours, 'patronHours').main}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6b7280', marginLeft: '0.25rem' }}>
            {formatValue(metrics.current7Days.patronHours, 'patronHours').suffix}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: getChangeColor(metrics.current7Days.patronHours, metrics.previousYear.patronHours),
          }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getChangeIcon(metrics.current7Days.patronHours, metrics.previousYear.patronHours)}
          </span>
          {Math.abs(((metrics.current7Days.patronHours / metrics.previousYear.patronHours - 1) * 100)).toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          vs previous year
        </div>
      </div>

          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: getChangeColor(metrics.current7Days.patronHours, metrics.weeklyBudgets.patronHours),
          }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getChangeIcon(metrics.current7Days.patronHours, metrics.weeklyBudgets.patronHours)}
          </span>
          {Math.abs(((metrics.current7Days.patronHours / metrics.weeklyBudgets.patronHours - 1) * 100)).toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          vs budget
        </div>
      </div>
    </div>
      </div>
    </div>

    {/* Second Row - Additional Metrics (Hold %, WPM, TPM) */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Hold % Card */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #f3f4f6',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
        ':hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
          HOLD % (7 DAYS)
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: '800', color: '#111827' }}>
            {metrics.holdPercent.current.toFixed(1)}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6b7280', marginLeft: '0.25rem' }}>
            %
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: getChangeColor(metrics.holdPercent.current, metrics.holdPercent.previousYear),
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {getChangeIcon(metrics.holdPercent.current, metrics.holdPercent.previousYear)}
              </span>
              {Math.abs(((metrics.holdPercent.current / metrics.holdPercent.previousYear - 1) * 100)).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              vs previous year
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: getChangeColor(metrics.holdPercent.current, metrics.holdPercent.budget),
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {getChangeIcon(metrics.holdPercent.current, metrics.holdPercent.budget)}
              </span>
              {Math.abs(((metrics.holdPercent.current / metrics.holdPercent.budget - 1) * 100)).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              vs budget
            </div>
          </div>
        </div>
      </div>

      {/* WPM Card */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #f3f4f6',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
        ':hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
          WPM (7 DAYS)
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: '800', color: '#111827' }}>
            ${(metrics.wpm.current / 1000).toFixed(1)}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6b7280', marginLeft: '0.25rem' }}>
            K
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: getChangeColor(metrics.wpm.current, metrics.wpm.previousYear),
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {getChangeIcon(metrics.wpm.current, metrics.wpm.previousYear)}
              </span>
              {Math.abs(((metrics.wpm.current / metrics.wpm.previousYear - 1) * 100)).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              vs previous year
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: getChangeColor(metrics.wpm.current, metrics.wpm.budget),
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {getChangeIcon(metrics.wpm.current, metrics.wpm.budget)}
              </span>
              {Math.abs(((metrics.wpm.current / metrics.wpm.budget - 1) * 100)).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              vs budget
            </div>
          </div>
        </div>
      </div>

      {/* TPM Card */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #f3f4f6',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
        ':hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500', marginBottom: '0.5rem' }}>
          TPM (7 DAYS)
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: '800', color: '#111827' }}>
            ${(metrics.tpm.current / 1000).toFixed(1)}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6b7280', marginLeft: '0.25rem' }}>
            K
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: getChangeColor(metrics.tpm.current, metrics.tpm.previousYear),
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {getChangeIcon(metrics.tpm.current, metrics.tpm.previousYear)}
              </span>
              {Math.abs(((metrics.tpm.current / metrics.tpm.previousYear - 1) * 100)).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              vs previous year
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1}}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: getChangeColor(metrics.tpm.current, metrics.tpm.budget),
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {getChangeIcon(metrics.tpm.current, metrics.tpm.budget)}
              </span>
              {Math.abs(((metrics.tpm.current / metrics.tpm.budget - 1) * 100)).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              vs budget
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};