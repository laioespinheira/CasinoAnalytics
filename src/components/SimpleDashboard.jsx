import React from 'react';

const SimpleDashboard = () => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Casino Analytics Dashboard
          </h1>
          <p style={{ color: '#6b7280' }}>
            Gaming machine performance insights and recommendations
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #10b981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>
                  Total Revenue
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>
                  $124.5K
                </p>
              </div>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Daily performance
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>
                  Active Machines
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>
                  247
                </p>
              </div>
              <span style={{ fontSize: '1.5rem' }}>🎰</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              94% uptime
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>
                  Avg Utilization
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>
                  68%
                </p>
              </div>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              +5% vs yesterday
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: 0 }}>
                  Critical Alerts
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>
                  3
                </p>
              </div>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Need immediate attention
            </p>
          </div>
        </div>

        {/* Sample Zone Performance Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
              Zone Performance Overview
            </h2>
            <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              Revenue and utilization by casino area
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                    Zone
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                    Revenue/Sq Ft
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                    Total Revenue
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                    Utilization
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                    Machines
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'white' }}>
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>High-Limit Room</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>800 sq ft</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>$425.30</div>
                    <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '9999px' }}>
                      Excellent
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>$8.5K</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>78%</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>12</td>
                </tr>

                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>Main Floor East</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>3,200 sq ft</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>$312.45</div>
                    <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '9999px' }}>
                      Good
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>$15.2K</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>65%</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>45</td>
                </tr>

                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>Penny Paradise</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>2,800 sq ft</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>$185.20</div>
                    <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '9999px' }}>
                      Fair
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>$11.8K</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>52%</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>85</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Simple Insights Panel */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Key Insights
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              borderRadius: '0.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🚨</span>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>
                    Machine Downtime Alert
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                    3 machines in Main Floor West have been down for over 2 hours, causing an estimated $450 revenue loss.
                  </p>
                  <button style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}>
                    View Details
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '0.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>💡</span>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0 0 0.5rem 0' }}>
                    Revenue Optimization Opportunity
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                    High-Limit Room shows excellent performance. Consider adding 2 more machines to capture additional revenue potential of $1,200/day.
                  </p>
                  <button style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}>
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimpleDashboard;