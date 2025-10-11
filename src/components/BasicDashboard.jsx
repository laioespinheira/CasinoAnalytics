
import React, { useState } from 'react';
import { sampleData } from '../data/casinoMockData';
import { MinimalistMetricsCard } from './MetricCards';

const BasicDashboard = () => {
  const calculatePeriodMetrics = () => {
    if (!sampleData || sampleData.length === 0) {
      return {
        current7Days: { turnover: 0, revenue: 0, patronHours: 0 },
        previousYear: { turnover: 0, revenue: 0, patronHours: 0 },
        weeklyAverage: { turnover: 0, revenue: 0, patronHours: 0 },
        mtd: { turnover: 0, revenue: 0, patronHours: 0 },
        ytd: { turnover: 0, revenue: 0, patronHours: 0 },
        mtdPreviousYear: { turnover: 0, revenue: 0, patronHours: 0 },
        ytdPreviousYear: { turnover: 0, revenue: 0, patronHours: 0 },
        mtdBudget: { turnover: 0, revenue: 0, patronHours: 0 },
        ytdBudget: { turnover: 0, revenue: 0, patronHours: 0 }
      };
    }

    try {
      const dates = [...new Set(sampleData.map(r => r.date))].sort();
      const last7Dates = dates.slice(-7);
      const last7Days = sampleData.filter(record => last7Dates.includes(record.date));

      const allData = sampleData;
      const weeklyAverage = {
        turnover: allData.reduce((sum, r) => sum + (r.turnover || 0), 0) / 4,
        revenue: allData.reduce((sum, r) => sum + (r.revenue || 0), 0) / 4,
        patronHours: allData.reduce((sum, r) => sum + (r.patronHours || 0), 0) / 4
      };

      const weeklyBudgets = {
        revenue: weeklyAverage.revenue * 1.1,
        turnover: weeklyAverage.turnover * 1.05,
        patronHours: weeklyAverage.patronHours * 1.08
      };

      const current7DayTotals = {
        turnover: last7Days.reduce((sum, r) => sum + (r.turnover || 0), 0),
        revenue: last7Days.reduce((sum, r) => sum + (r.revenue || 0), 0),
        patronHours: last7Days.reduce((sum, r) => sum + (r.patronHours || 0), 0)
      };

      const previousYear = {
        turnover: current7DayTotals.turnover * (0.8 + Math.random() * 0.4),
        revenue: current7DayTotals.revenue * (0.8 + Math.random() * 0.4),
        patronHours: current7DayTotals.patronHours * (0.8 + Math.random() * 0.4)
      };

      const mtd = {
        turnover: allData.reduce((sum, r) => sum + (r.turnover || 0), 0),
        revenue: allData.reduce((sum, r) => sum + (r.revenue || 0), 0),
        patronHours: allData.reduce((sum, r) => sum + (r.patronHours || 0), 0)
      };

      const ytd = {
        turnover: mtd.turnover * 12,
        revenue: mtd.revenue * 12,
        patronHours: mtd.patronHours * 12
      };

      const mtdPreviousYear = {
        turnover: mtd.turnover * (0.85 + Math.random() * 0.3),
        revenue: mtd.revenue * (0.85 + Math.random() * 0.3),
        patronHours: mtd.patronHours * (0.85 + Math.random() * 0.3)
      };

      const ytdPreviousYear = {
        turnover: ytd.turnover * (0.85 + Math.random() * 0.3),
        revenue: ytd.revenue * (0.85 + Math.random() * 0.3),
        patronHours: ytd.patronHours * (0.85 + Math.random() * 0.3)
      };

      const mtdBudget = {
        revenue: mtd.revenue * 1.1,
        turnover: mtd.turnover * 1.08,
        patronHours: mtd.patronHours * 1.09
      };

      const ytdBudget = {
        revenue: ytd.revenue * 1.12,
        turnover: ytd.turnover * 1.1,
        patronHours: ytd.patronHours * 1.11
      };

      const machineCount = 500;
      const current7DaysHoldPercent = (current7DayTotals.revenue / current7DayTotals.turnover) * 100;
      const previousYearHoldPercent = (previousYear.revenue / previousYear.turnover) * 100;
      const budgetHoldPercent = current7DaysHoldPercent * 1.02;

      const current7DaysWPM = current7DayTotals.revenue / machineCount;
      const previousYearWPM = previousYear.revenue / machineCount;
      const budgetWPM = current7DaysWPM * 1.08;

      const current7DaysTPM = current7DayTotals.turnover / machineCount;
      const previousYearTPM = previousYear.turnover / machineCount;
      const budgetTPM = current7DaysTPM * 1.06;

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dailyMetrics = daysOfWeek.map((day, index) => {
        const dayMultiplier = 0.12 + (index * 0.02) + (Math.random() * 0.05);
        const dailyRevenue = current7DayTotals.revenue * dayMultiplier;
        const dailyTurnover = current7DayTotals.turnover * dayMultiplier;
        const dailyPatronHours = current7DayTotals.patronHours * dayMultiplier;

        const avg4Week = {
          revenue: dailyRevenue * (0.9 + Math.random() * 0.2),
          turnover: dailyTurnover * (0.9 + Math.random() * 0.2),
          patronHours: dailyPatronHours * (0.9 + Math.random() * 0.2)
        };

        const prevYear = {
          revenue: dailyRevenue * (0.85 + Math.random() * 0.3),
          turnover: dailyTurnover * (0.85 + Math.random() * 0.3),
          patronHours: dailyPatronHours * (0.85 + Math.random() * 0.3)
        };

        const budget = {
          revenue: dailyRevenue * 1.1,
          turnover: dailyTurnover * 1.05,
          patronHours: dailyPatronHours * 1.08
        };

        return {
          day,
          current: {
            revenue: dailyRevenue,
            turnover: dailyTurnover,
            patronHours: dailyPatronHours
          },
          avg4Week,
          prevYear,
          budget
        };
      });

      return {
        current7Days: current7DayTotals,
        current7DayTotals,
        previousYear,
        weeklyAverage,
        avg4WeekTotals: weeklyAverage,
        weeklyBudgets,
        prevYearTotals: previousYear,
        budgetTotals: weeklyBudgets,
        mtd,
        ytd,
        mtdPreviousYear,
        ytdPreviousYear,
        mtdBudget,
        ytdBudget,
        holdPercent: {
          current: current7DaysHoldPercent,
          previousYear: previousYearHoldPercent,
          budget: budgetHoldPercent
        },
        wpm: {
          current: current7DaysWPM,
          previousYear: previousYearWPM,
          budget: budgetWPM
        },
        tpm: {
          current: current7DaysTPM,
          previousYear: previousYearTPM,
          budget: budgetTPM
        },
        dailyMetrics
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        current7Days: { turnover: 0, revenue: 0, patronHours: 0 },
        previousYear: { turnover: 0, revenue: 0, patronHours: 0 },
        weeklyAverage: { turnover: 0, revenue: 0, patronHours: 0 }
      };
    }
  };
  const metrics = calculatePeriodMetrics();
  const [activeTab, setActiveTab] = useState('summary');

  if (!metrics) {
    return (
      <div style={{ padding: '2rem' }}>Loading data...</div>
    );
  }

  const formatValue = (value, type = 'currency') => {
    if (type === 'percentage') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    }
    if (type === 'hours') {
      return `${value.toFixed(0)} hrs`;
    }
    return `$${(value / 1000).toFixed(1)}K`;
  };
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f8fafc',
      paddingTop: '100px'
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '2rem 0',
        position: 'fixed',
        left: 0,
        top: '100px',
        bottom: 0,
        overflowY: 'auto'
      }}>
        <div style={{
          padding: '0 1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: '700',
            margin: 0,
            color: '#111827'
          }}>
            Analytics
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'summary' ? '#f3f4f6' : 'transparent',
              color: activeTab === 'summary' ? '#111827' : '#6b7280',
              fontWeight: activeTab === 'summary' ? '600' : '500',
              fontSize: '0.875rem',
              textAlign: 'left',
              cursor: 'pointer',
              borderLeft: activeTab === 'summary' ? '3px solid #111827' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'summary') {
                e.currentTarget.style.background = '#f9fafb'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'summary') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('dayOfWeek')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'dayOfWeek' ? '#f3f4f6' : 'transparent',
              color: activeTab === 'dayOfWeek' ? '#111827' : '#6b7280',
              fontWeight: activeTab === 'dayOfWeek' ? '600' : '500',
              fontSize: '0.875rem',
              textAlign: 'left',
              cursor: 'pointer',
              borderLeft: activeTab === 'dayOfWeek' ? '3px solid #111827' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'dayOfWeek') {
                e.currentTarget.style.background = '#f9fafb'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'dayOfWeek') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            Day of Week
          </button>
          <button
            onClick={() => setActiveTab('game')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'game' ? '#f3f4f6' : 'transparent',
              color: activeTab === 'game' ? '#111827' : '#6b7280',
              fontWeight: activeTab === 'game' ? '600' : '500',
              fontSize: '0.875rem',
              textAlign: 'left',
              cursor: 'pointer',
              borderLeft: activeTab === 'game' ? '3px solid #111827' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'game') {
                e.currentTarget.style.background = '#f9fafb'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'game') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            Game
          </button>
          <button
            onClick={() => setActiveTab('area')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'area' ? '#f3f4f6' : 'transparent',
              color: activeTab === 'area' ? '#111827' : '#6b7280',
              fontWeight: activeTab === 'area' ? '600' : '500',
              fontSize: '0.875rem',
              textAlign: 'left',
              cursor: 'pointer',
              borderLeft: activeTab === 'area' ? '3px solid #111827' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'area') {
                e.currentTarget.style.background = '#f9fafb'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'area') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            Area
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: '240px',
        flex: 1,
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>

        {activeTab === 'summary' && (
          <div>
            <MinimalistMetricsCard metrics={metrics} />
          </div>
        )}
        {activeTab === 'dayOfWeek' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Option 1: Elegant Compact Table with Weekend Highlighting */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
                Day of Week Performance - Option 1
              </h3>
              <p style={{ margin: 0, marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Weekly performance with year-over-year and budget comparisons
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        textAlign: 'left',
                        padding: '1rem',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '2px solid #e5e7eb',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 10
                      }}>Metric</th>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        return (
                          <th key={day.day} style={{
                            textAlign: 'right',
                            padding: '1rem 0.875rem',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            color: isWeekend ? '#7c3aed' : '#111827',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '2px solid #e5e7eb',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>{day.day.slice(0, 3)}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Revenue Row */}
                    <tr>
                      <td style={{
                        padding: '1.25rem 1rem',
                        fontWeight: '700',
                        color: '#111827',
                        borderBottom: '1px solid #f3f4f6',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>Revenue</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const value = day.current.revenue;
                        const formatted = value >= 1000000
                          ? `$${(value / 1000000).toFixed(2)}M`
                          : `$${(value / 1000).toFixed(0)}K`;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '1.25rem 0.875rem',
                            color: '#111827',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            borderBottom: '1px solid #f3f4f6',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Revenue vs Last Year */}
                    <tr>
                      <td style={{
                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        borderBottom: '1px solid #f3f4f6',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>vs Last Year</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.revenue / day.prevYear.revenue - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.875rem',
                            fontSize: '0.8125rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            borderBottom: '1px solid #f3f4f6',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>
                              {isPositive ? '↗' : '↘'}
                            </span>
                            {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    {/* Revenue vs Budget */}
                    <tr>
                      <td style={{
                        padding: '0.625rem 1rem 1.25rem 2.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        borderBottom: '3px solid #e5e7eb',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>vs Budget</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.revenue / day.budget.revenue - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.875rem 1.25rem',
                            fontSize: '0.8125rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            borderBottom: '3px solid #e5e7eb',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>
                              {isPositive ? '↗' : '↘'}
                            </span>
                            {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>

                    {/* Turnover Row */}
                    <tr>
                      <td style={{
                        padding: '1.25rem 1rem',
                        fontWeight: '700',
                        color: '#111827',
                        borderBottom: '1px solid #f3f4f6',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>Turnover</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const value = day.current.turnover;
                        const formatted = value >= 1000000
                          ? `$${(value / 1000000).toFixed(2)}M`
                          : `$${(value / 1000).toFixed(0)}K`;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '1.25rem 0.875rem',
                            color: '#111827',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            borderBottom: '1px solid #f3f4f6',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Turnover vs Last Year */}
                    <tr>
                      <td style={{
                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        borderBottom: '1px solid #f3f4f6',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>vs Last Year</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.turnover / day.prevYear.turnover - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.875rem',
                            fontSize: '0.8125rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            borderBottom: '1px solid #f3f4f6',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>
                              {isPositive ? '↗' : '↘'}
                            </span>
                            {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    {/* Turnover vs Budget */}
                    <tr>
                      <td style={{
                        padding: '0.625rem 1rem 1.25rem 2.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        borderBottom: '3px solid #e5e7eb',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>vs Budget</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.turnover / day.budget.turnover - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.875rem 1.25rem',
                            fontSize: '0.8125rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            borderBottom: '3px solid #e5e7eb',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>
                              {isPositive ? '↗' : '↘'}
                            </span>
                            {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>

                    {/* Patron Hours Row */}
                    <tr>
                      <td style={{
                        padding: '1.25rem 1rem',
                        fontWeight: '700',
                        color: '#111827',
                        borderBottom: '1px solid #f3f4f6',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>Patron Hours</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const value = day.current.patronHours;
                        const formatted = value >= 1000000
                          ? `${(value / 1000000).toFixed(2)}M`
                          : `${(value / 1000).toFixed(1)}K`;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '1.25rem 0.875rem',
                            color: '#111827',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            borderBottom: '1px solid #f3f4f6',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Patron Hours vs Last Year */}
                    <tr>
                      <td style={{
                        padding: '0.625rem 1rem 0.625rem 2.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        borderBottom: '1px solid #f3f4f6',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>vs Last Year</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.patronHours / day.prevYear.patronHours - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.875rem',
                            fontSize: '0.8125rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            borderBottom: '1px solid #f3f4f6',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>
                              {isPositive ? '↗' : '↘'}
                            </span>
                            {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    {/* Patron Hours vs Budget */}
                    <tr>
                      <td style={{
                        padding: '0.625rem 1rem 1rem 2.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        background: 'white',
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}>vs Budget</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.patronHours / day.budget.patronHours - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.875rem 1rem',
                            fontSize: '0.8125rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            <span style={{ fontSize: '1rem', marginRight: '0.25rem' }}>
                              {isPositive ? '↗' : '↘'}
                            </span>
                            {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Option 2: Modern Striped Table with Bold Weekend Columns */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
                Day of Week Performance - Option 2
              </h3>
              <p style={{ margin: 0, marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Striped rows for easy scanning with weekend emphasis
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ background: '#111827' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '1rem',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Metric</th>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        return (
                          <th key={day.day} style={{
                            textAlign: 'right',
                            padding: '1rem 0.875rem',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: isWeekend ? '#7c3aed' : '#111827'
                          }}>{day.day.slice(0, 3)}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Revenue Section */}
                    <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <td colSpan={8} style={{
                        padding: '0.75rem',
                        fontWeight: '700',
                        color: '#111827',
                        fontSize: '0.95rem'
                      }}>REVENUE</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#111827', fontWeight: '600' }}>Current Week</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#111827', fontWeight: '700' }}>
                          ${(day.current.revenue / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>Last Year</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280' }}>
                          ${(day.prevYear.revenue / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>vs Last Year</td>
                      {metrics.dailyMetrics.map(day => {
                        const diff = ((day.current.revenue / day.prevYear.revenue - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>Budget</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280' }}>
                          ${(day.budget.revenue / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 0.75rem 1rem', color: '#6b7280', paddingLeft: '1.5rem' }}>vs Budget</td>
                      {metrics.dailyMetrics.map(day => {
                        const diff = ((day.current.revenue / day.budget.revenue - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem 0.75rem 1rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>

                    {/* Turnover Section */}
                    <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <td colSpan={8} style={{
                        padding: '0.75rem',
                        fontWeight: '700',
                        color: '#111827',
                        fontSize: '0.95rem'
                      }}>TURNOVER</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#111827', fontWeight: '600' }}>Current Week</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#111827', fontWeight: '700' }}>
                          ${(day.current.turnover / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>Last Year</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280' }}>
                          ${(day.prevYear.turnover / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>vs Last Year</td>
                      {metrics.dailyMetrics.map(day => {
                        const diff = ((day.current.turnover / day.prevYear.turnover - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>Budget</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280' }}>
                          ${(day.budget.turnover / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 0.75rem 1rem', color: '#6b7280', paddingLeft: '1.5rem' }}>vs Budget</td>
                      {metrics.dailyMetrics.map(day => {
                        const diff = ((day.current.turnover / day.budget.turnover - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem 0.75rem 1rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>

                    {/* Patron Hours Section */}
                    <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <td colSpan={8} style={{
                        padding: '0.75rem',
                        fontWeight: '700',
                        color: '#111827',
                        fontSize: '0.95rem'
                      }}>PATRON HOURS</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#111827', fontWeight: '600' }}>Current Week</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#111827', fontWeight: '700' }}>
                          {(day.current.patronHours / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>Last Year</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280' }}>
                          {(day.prevYear.patronHours / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>vs Last Year</td>
                      {metrics.dailyMetrics.map(day => {
                        const diff = ((day.current.patronHours / day.prevYear.patronHours - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>Budget</td>
                      {metrics.dailyMetrics.map(day => (
                        <td key={day.day} style={{ textAlign: 'right', padding: '0.75rem', color: '#6b7280' }}>
                          {(day.budget.patronHours / 1000).toFixed(1)}K
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', color: '#6b7280', paddingLeft: '1.5rem' }}>vs Budget</td>
                      {metrics.dailyMetrics.map(day => {
                        const diff = ((day.current.patronHours / day.budget.patronHours - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Option 3: Minimalist Dense Table */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
                Day of Week Performance - Option 3
              </h3>
              <p style={{ margin: 0, marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Dense data view with maximum information
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.8125rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #111827' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '0.875rem 1rem',
                        fontWeight: '700',
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'white'
                      }}>Metric</th>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        return (
                          <th key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.875rem 0.75rem',
                            fontWeight: '700',
                            fontSize: '0.8125rem',
                            color: isWeekend ? '#7c3aed' : '#111827',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '2px solid #111827',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>{day.day}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Revenue Section */}
                    <tr style={{ background: '#f9fafb', borderTop: '8px solid white' }}>
                      <td colSpan={8} style={{
                        padding: '0.625rem 1rem',
                        fontWeight: '700',
                        color: '#111827',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>REVENUE</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.75rem 1rem 0.75rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>Current</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const value = day.current.revenue;
                        const formatted = value >= 1000000
                          ? `$${(value / 1000000).toFixed(2)}M`
                          : `$${(value / 1000).toFixed(0)}K`;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            color: '#111827',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.625rem 1rem 0.625rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>vs LY</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.revenue / day.prevYear.revenue - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.75rem',
                            fontSize: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.625rem 1rem 0.875rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>vs Budget</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.revenue / day.budget.revenue - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.75rem 0.875rem',
                            fontSize: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>

                    {/* Turnover Section */}
                    <tr style={{ background: '#f9fafb', borderTop: '8px solid white' }}>
                      <td colSpan={8} style={{
                        padding: '0.625rem 1rem',
                        fontWeight: '700',
                        color: '#111827',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>TURNOVER</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.75rem 1rem 0.75rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>Current</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const value = day.current.turnover;
                        const formatted = value >= 1000000
                          ? `$${(value / 1000000).toFixed(2)}M`
                          : `$${(value / 1000).toFixed(0)}K`;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            color: '#111827',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.625rem 1rem 0.625rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>vs LY</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.turnover / day.prevYear.turnover - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.75rem',
                            fontSize: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.625rem 1rem 0.875rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>vs Budget</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.turnover / day.budget.turnover - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.75rem 0.875rem',
                            fontSize: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>

                    {/* Patron Hours Section */}
                    <tr style={{ background: '#f9fafb', borderTop: '8px solid white' }}>
                      <td colSpan={8} style={{
                        padding: '0.625rem 1rem',
                        fontWeight: '700',
                        color: '#111827',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>PATRON HOURS</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.75rem 1rem 0.75rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>Current</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const value = day.current.patronHours;
                        const formatted = value >= 1000000
                          ? `${(value / 1000000).toFixed(2)}M`
                          : `${(value / 1000).toFixed(1)}K`;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.75rem',
                            color: '#111827',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{
                        padding: '0.625rem 1rem 0.625rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>vs LY</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.patronHours / day.prevYear.patronHours - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.75rem',
                            fontSize: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td style={{
                        padding: '0.625rem 1rem 0.75rem 2rem',
                        color: '#6b7280',
                        fontSize: '0.75rem'
                      }}>vs Budget</td>
                      {metrics.dailyMetrics.map((day, index) => {
                        const isWeekend = index >= 5;
                        const diff = ((day.current.patronHours / day.budget.patronHours - 1) * 100);
                        const isPositive = diff >= 0;
                        return (
                          <td key={day.day} style={{
                            textAlign: 'right',
                            padding: '0.625rem 0.75rem 0.75rem',
                            fontSize: '0.75rem',
                            color: isPositive ? '#10b981' : '#ef4444',
                            fontWeight: '700',
                            background: isWeekend ? '#faf5ff' : 'white'
                          }}>
                            {isPositive ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'game' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{
              background: 'white',
              padding: '1.75rem',
              borderRadius: '12px',
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
              border: '2px solid #f3f4f6'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
                Top Performing Games
              </h3>
              <p style={{ margin: '0.5rem 0 1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Comparing current week performance vs 4-week average, previous year, and budget expectations
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0 0.75rem'
                }}>
                  <thead>
                    <tr style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem' }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 1rem' }}>Game</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>Revenue</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>vs 4W Avg</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>vs Prev Year</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>vs Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sampleData]
                      .slice(0, 8)
                      .map((game, idx) => {
                        const gameRevenue = game.revenue || 0;
                        const gameAvgRevenue = gameRevenue * (0.9 + Math.random() * 0.2);
                        const gamePrevYearRevenue = gameRevenue * (0.85 + Math.random() * 0.3);
                        const gameBudgetRevenue = gameRevenue * 1.1;

                        const vs4W = ((gameRevenue / gameAvgRevenue - 1) * 100);
                        const vsPY = ((gameRevenue / gamePrevYearRevenue - 1) * 100);
                        const vsBudget = ((gameRevenue / gameBudgetRevenue - 1) * 100);

                        return (
                          <tr key={idx} style={{
                            background: 'white',
                            boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
                            borderRadius: '0.75rem'
                          }}>
                            <td style={{ padding: '1rem', fontWeight: '700', color: '#0f172a', borderRadius: '0.75rem 0 0 0.75rem' }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600', color: '#0f172a' }}>{game.game}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>{game.segment}</div>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                              ${(gameRevenue / 1000).toFixed(0)}K
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: vs4W >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>
                              {vs4W >= 0 ? 'Up' : 'Down'} {Math.abs(vs4W).toFixed(0)}%
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: vsPY >= 0 ? '#059669' : '#dc2626', fontWeight: '600' }}>
                              {vsPY >= 0 ? 'Up' : 'Down'} {Math.abs(vsPY).toFixed(0)}%
                            </td>
                            <td style={{
                              padding: '1rem',
                              textAlign: 'right',
                              color: vsBudget >= 0 ? '#059669' : '#dc2626',
                              fontWeight: '600',
                              borderRadius: '0 0.75rem 0.75rem 0'
                            }}>
                              {vsBudget >= 0 ? 'Up' : 'Down'} {Math.abs(vsBudget).toFixed(0)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'area' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{
              background: 'white',
              padding: '1.75rem',
              borderRadius: '12px',
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.075)',
              border: '2px solid #f3f4f6'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
                Area Performance
              </h3>
              <p style={{ margin: '0.5rem 0 1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Revenue share and variance vs 4-week average by floor area
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {[
                  { name: 'Main Floor', zone: 'Zone A-D', revenueShare: 0.40 },
                  { name: 'High Limit Area', zone: 'Zone E', revenueShare: 0.25 },
                  { name: 'VIP Room', zone: 'Zone F', revenueShare: 0.20 },
                  { name: 'Table Games', zone: 'Zone G-H', revenueShare: 0.15 }
                ].map((area, idx) => {
                  const areaRevenue = metrics.current7DayTotals.revenue * area.revenueShare;
                  const areaTurnover = metrics.current7DayTotals.turnover * area.revenueShare;
                  const areaPatronHours = metrics.current7DayTotals.patronHours * area.revenueShare;

                  const areaAvg4WRevenue = metrics.avg4WeekTotals.revenue * area.revenueShare;
                  const vs4W = ((areaRevenue / areaAvg4WRevenue - 1) * 100);

                  const getPerformanceColor = (variance) => {
                    if (variance >= 10) return '#dcfce7';
                    if (variance >= 5) return '#fef3c7';
                    if (variance >= 0) return '#fefce8';
                    if (variance >= -5) return '#fef2f2';
                    return '#fee2e2';
                  };

                  return (
                    <div key={idx} style={{
                      backgroundColor: getPerformanceColor(vs4W),
                      padding: '1.5rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
                            {area.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                            {area.zone}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: vs4W >= 0 ? '#059669' : '#dc2626' }}>
                          {vs4W >= 0 ? 'Up' : 'Down'} {Math.abs(vs4W).toFixed(0)}%
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Revenue</div>
                          <div style={{ fontWeight: '700', color: '#111827' }}>{formatValue(areaRevenue)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Turnover</div>
                          <div style={{ fontWeight: '700', color: '#111827' }}>{formatValue(areaTurnover)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Patron Hours</div>
                          <div style={{ fontWeight: '700', color: '#111827' }}>{areaPatronHours.toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicDashboard;


