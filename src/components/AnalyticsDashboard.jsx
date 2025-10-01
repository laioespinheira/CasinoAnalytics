import React, { useState, useEffect } from 'react';
import CasinoAnalyticsEngine from '../utils/analyticsEngine';
import { generateMockData } from '../utils/mockDataGenerator';
import MetricsChart from './MetricsChart';
import ZonePerformanceGrid from './ZonePerformanceGrid';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [mockData, setMockData] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading and analysis
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        // Generate mock data (replace with real API calls)
        const data = generateMockData();
        setMockData(data);

        // Run analytics engine
        const engine = new CasinoAnalyticsEngine();
        const results = engine.analyzePerformance(
          data.machines,
          data.zones,
          data.historical
        );

        setAnalytics(results);
      } catch (error) {
        console.error('Analytics loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '💡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Casino Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Automated insights and actionable recommendations</p>
          </div>
          <div className="flex space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export Report
            </button>
          </div>
        </div>

        {/* Critical Alerts Bar */}
        {analytics.alerts.filter(a => a.priority === 'critical').length > 0 && (
          <div className="mb-8 p-4 bg-red-100 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  {analytics.alerts.filter(a => a.priority === 'critical').length} Critical Issues Require Immediate Attention
                </h3>
                <p className="text-red-700">
                  Estimated daily revenue impact: ${analytics.alerts
                    .filter(a => a.priority === 'critical')
                    .reduce((sum, alert) => sum + (alert.impact || 0), 0).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Insights</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalInsights}</p>
              </div>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Opportunities identified</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority Items</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.summary.highPriorityItems}</p>
              </div>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Require action within 24h</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                <p className="text-3xl font-bold text-gray-900">${(analytics.summary.totalPotentialImpact / 1000).toFixed(0)}K</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Daily potential increase</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.summary.criticalAlerts}</p>
              </div>
              <span className="text-2xl">🚨</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Need immediate action</p>
          </div>
        </div>

        {/* Zone Performance Overview */}
        {mockData && (
          <div className="mb-8">
            <ZonePerformanceGrid
              zones={mockData.zones}
              onZoneSelect={setSelectedZone}
            />
          </div>
        )}

        {/* Charts Section */}
        {mockData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue by Zone Chart */}
            <MetricsChart
              title="Revenue by Zone"
              data={mockData.zones.map(zone => ({
                label: zone.name.split(' ')[0], // Shortened for display
                value: zone.totalRevenue
              }))}
              type="bar"
              height={300}
            />

            {/* Machine Type Performance */}
            <MetricsChart
              title="Revenue by Machine Type"
              data={[
                { label: 'High-Limit Slots', value: 25000 },
                { label: 'Video Poker', value: 18500 },
                { label: 'Progressive Slots', value: 16200 },
                { label: 'Dollar Slots', value: 14800 },
                { label: 'Quarter Slots', value: 12600 },
                { label: 'Penny Slots', value: 8900 }
              ]}
              type="pie"
            />

            {/* Utilization Trends */}
            <MetricsChart
              title="Weekly Utilization Trend"
              data={[
                { label: 'Mon', value: 0.52 },
                { label: 'Tue', value: 0.48 },
                { label: 'Wed', value: 0.51 },
                { label: 'Thu', value: 0.58 },
                { label: 'Fri', value: 0.72 },
                { label: 'Sat', value: 0.85 },
                { label: 'Sun', value: 0.79 }
              ]}
              type="line"
              height={300}
            />

            {/* Revenue per Square Foot by Zone */}
            <MetricsChart
              title="Revenue Density ($/sq ft)"
              data={mockData.zones
                .sort((a, b) => b.revenuePerSqFt - a.revenuePerSqFt)
                .slice(0, 8)
                .map(zone => ({
                  label: zone.name.split(' ')[0],
                  value: zone.revenuePerSqFt
                }))}
              type="bar"
              height={300}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Insights Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Automated Insights & Recommendations</h2>
                <p className="text-gray-600">Prioritized by revenue impact and urgency</p>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {analytics.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedInsight?.id === insight.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">{getPriorityIcon(insight.priority)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            insight.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {insight.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-2">{insight.message}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-500">
                            {insight.impact && (
                              <span>Impact: <strong>${insight.impact.toFixed(0)}/day</strong></span>
                            )}
                            {insight.confidence && (
                              <span className="ml-4">Confidence: <strong>{(insight.confidence * 100).toFixed(0)}%</strong></span>
                            )}
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">

            {/* Top Recommendation */}
            {analytics.summary.topRecommendation && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Priority Action</h2>
                <div className={`p-4 rounded-lg border-2 ${getPriorityColor(analytics.summary.topRecommendation.priority)}`}>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getPriorityIcon(analytics.summary.topRecommendation.priority)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{analytics.summary.topRecommendation.title}</h3>
                      <p className="text-sm text-gray-700 mt-2">{analytics.summary.topRecommendation.recommendation}</p>
                      {analytics.summary.topRecommendation.impact && (
                        <p className="text-sm font-medium text-green-700 mt-2">
                          Potential: +${analytics.summary.topRecommendation.impact.toFixed(0)}/day
                        </p>
                      )}
                      <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Take Action
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Critical Alerts */}
            {analytics.alerts.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h2>
                <div className="space-y-3">
                  {analytics.alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                      <div className="flex items-start space-x-2">
                        <span className="text-sm">{getPriorityIcon(alert.priority)}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                          <p className="text-xs text-gray-700 mt-1">{alert.message}</p>
                          <button className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {analytics.alerts.length > 5 && (
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                    View All {analytics.alerts.length} Alerts →
                  </button>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Machines Analyzed</span>
                  <span className="text-sm font-semibold">247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Casino Zones</span>
                  <span className="text-sm font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Data Confidence</span>
                  <span className="text-sm font-semibold text-green-600">94%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-semibold">2 min ago</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed Insight Modal */}
        {selectedInsight && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedInsight.title}</h2>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-2 ${
                      selectedInsight.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      selectedInsight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedInsight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedInsight.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Situation</h3>
                    <p className="text-gray-700">{selectedInsight.message}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">Recommended Action</h3>
                    <p className="text-gray-700">{selectedInsight.recommendation}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Estimated Impact</p>
                      <p className="text-lg font-bold text-green-600">
                        ${selectedInsight.impact ? selectedInsight.impact.toFixed(0) : 'TBD'}/day
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Confidence Level</p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedInsight.confidence ? (selectedInsight.confidence * 100).toFixed(0) : 'N/A'}%
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Implement Recommendation
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      Schedule for Later
                    </button>
                    <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AnalyticsDashboard;