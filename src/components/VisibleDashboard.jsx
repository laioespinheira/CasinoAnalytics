import React, { useState } from 'react';

const VisibleDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Dark header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">CA</span>
              </div>
              <h1 className="text-white text-xl font-semibold">Casino Analytics</h1>
            </div>

            {/* Navigation Menu */}
            <div className="flex items-center space-x-6">
              {['Overview', 'Zones', 'Machines', 'Reports', 'Analytics', 'Settings'].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item.toLowerCase())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === item.toLowerCase()
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-300">
                <div>4 Jan 2026</div>
                <div>Sun 16:30</div>
              </div>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">

          {/* Left Sidebar - Alerts */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-purple-600 text-lg font-semibold">Critical Alerts</h2>
                <div className="flex space-x-2 mt-3">
                  <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm">All</button>
                  <button className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded text-sm">New</button>
                </div>
              </div>

              {/* Alert Items */}
              <div className="p-4 space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">!</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 text-sm font-medium">Machine Downtime</p>
                      <span className="text-xs text-gray-500">16:20</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">5 machines offline - Main Floor West</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 text-sm font-medium">Target Achieved</p>
                      <span className="text-xs text-gray-500">15:35</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">High-Limit Room exceeded target</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">⚠</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-900 text-sm font-medium">Maintenance Due</p>
                      <span className="text-xs text-gray-500">12:00</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">15 machines need maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Content */}
          <div className="col-span-6 space-y-6">

            {/* Featured Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⭐</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Top Performing Zone</h3>
                <p className="text-gray-600 mb-2">High-Limit Room achieving 120% of revenue target</p>
                <p className="text-gray-500 text-sm">Today • 1 hour ago</p>
                <div className="bg-purple-600 h-2 rounded-full mt-4"></div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Daily Revenue</span>
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                </div>
                <div className="text-gray-900 text-2xl font-bold">$124.5K</div>
                <div className="flex items-center mt-2">
                  <span className="text-green-600 text-xs font-medium">↗ +12% Better</span>
                </div>
                <div className="text-gray-500 text-xs mt-1">vs yesterday</div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Active Machines</span>
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🎰</span>
                  </div>
                </div>
                <div className="text-gray-900 text-2xl font-bold">247</div>
                <div className="flex items-center mt-2">
                  <span className="text-blue-600 text-xs font-medium">94% Uptime</span>
                </div>
                <div className="text-gray-500 text-xs mt-1">15 under maintenance</div>
              </div>
            </div>

            {/* Performance Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Zone Performance</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-500 text-lg">🏆</span>
                      <span className="text-gray-900 font-medium">High-Limit Room</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-bold">$8.5K</div>
                      <div className="text-green-600 text-xs">+15%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-500 text-lg">💰</span>
                      <span className="text-gray-900 font-medium">Main Floor East</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-bold">$15.2K</div>
                      <div className="text-blue-600 text-xs">+8%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-orange-500 text-lg">🎲</span>
                      <span className="text-gray-900 font-medium">Progressive Plaza</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-bold">$11.8K</div>
                      <div className="text-orange-600 text-xs">-2%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6">

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">68%</div>
                  <div className="text-sm text-gray-600">Avg Utilization</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">$425</div>
                  <div className="text-sm text-gray-600">Revenue/Sq Ft</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">3</div>
                  <div className="text-sm text-gray-600">Critical Alerts</div>
                </div>
              </div>
            </div>

            {/* Top Zones */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Zones Today</h3>
              </div>
              <div className="p-2 space-y-2">
                {[
                  { rank: 1, name: 'High-Limit Room', revenue: '$8.5K', change: '+15%', trend: 'up' },
                  { rank: 2, name: 'Main Floor East', revenue: '$15.2K', change: '+8%', trend: 'up' },
                  { rank: 3, name: 'VIP Section', revenue: '$6.1K', change: '-2%', trend: 'down' },
                  { rank: 4, name: 'Progressive Plaza', revenue: '$11.8K', change: '+3%', trend: 'up' },
                ].map((zone) => (
                  <div key={zone.rank} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 text-sm w-6">{zone.rank}</span>
                      <span className={`text-xs ${zone.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {zone.trend === 'up' ? '↗' : '↘'}
                      </span>
                      <span className="text-gray-900 text-sm">{zone.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 text-sm font-medium">{zone.revenue}</div>
                      <div className={`text-xs ${zone.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {zone.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default VisibleDashboard;