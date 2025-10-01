import React, { useState } from 'react';

const ModernDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">CA</span>
              </div>
              <h1 className="text-white text-xl font-semibold">Casino Analytics</h1>
            </div>

            {/* Top Menu Items */}
            <div className="flex items-center space-x-6">
              {['Overview', 'Zones', 'Machines', 'Reports', 'Analytics', 'Settings'].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item.toLowerCase())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === item.toLowerCase()
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              <button className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </button>
              <div className="text-xs text-slate-400">
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Left Sidebar - Messages/Alerts */}
          <div className="col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Messages Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-purple-600 text-lg font-semibold">Critical Alerts</h2>
                <div className="flex space-x-4 mt-3">
                  <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm">All</button>
                  <button className="text-slate-400 hover:text-white px-3 py-1 rounded text-sm">New</button>
                  <button className="text-slate-400 hover:text-white px-3 py-1 rounded text-sm">Tasks (0)</button>
                </div>
              </div>

              {/* Alert Items */}
              <div className="p-4 space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">Machine Downtime Alert</p>
                      <span className="text-xs text-slate-400">16:20</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">5 machines offline - Main Floor West</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">Revenue Target Hit</p>
                      <span className="text-xs text-slate-400">15:35</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">High-Limit Room exceeded daily target</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">Maintenance Due</p>
                      <span className="text-xs text-slate-400">12:00</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">15 machines require scheduled maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Content */}
          <div className="col-span-6 space-y-6">

            {/* Featured Insight Card */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-purple-400 text-sm font-medium">🔥 See All Insights</h3>
                <button className="text-purple-400 hover:text-purple-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="text-center py-8">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h4 className="text-white text-xl font-bold mb-2">Zone Performance Leader</h4>
                <p className="text-slate-300 text-sm mb-2">High-Limit Room achieving 120% of revenue target</p>
                <p className="text-slate-400 text-xs">Today • 1 hour ago</p>

                <div className="bg-purple-600 h-2 rounded-full mt-4 mb-2"></div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Zone Revenue</span>
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">MU</span>
                  </div>
                </div>
                <div className="text-white text-2xl font-bold">$124.5K</div>
                <div className="flex items-center mt-2">
                  <span className="text-green-400 text-xs">↗ Better</span>
                  <div className="ml-auto flex space-x-1">
                    <div className="w-1 bg-green-400 h-4 rounded"></div>
                    <div className="w-1 bg-green-400 h-6 rounded"></div>
                    <div className="w-1 bg-green-400 h-8 rounded"></div>
                    <div className="w-1 bg-green-400 h-6 rounded"></div>
                    <div className="w-1 bg-green-400 h-4 rounded"></div>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">8th in Casino Network • Today</div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-purple-400 text-sm mb-2">Live Performance</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">🏠 High-Limit Room</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm">2-1</span>
                      <span className="text-purple-400 text-sm">⬆ Target</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">💰 Main Floor</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm">1-1</span>
                      <span className="text-blue-400 text-sm">⭐ Peak</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar/Schedule Widget */}
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-purple-400 text-sm font-medium mb-4">Performance Calendar 2025</h3>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-slate-400 text-xs text-center p-2">{day}</div>
                ))}

                {/* Calendar days */}
                {[29, 30, 31, 1, 2, 3, 4].map((date, index) => (
                  <div key={index} className="relative">
                    <div className={`text-center p-2 rounded text-sm ${
                      index === 6 ? 'bg-purple-600 text-white' : 'text-slate-300'
                    }`}>
                      {date}
                    </div>
                    {index === 6 && (
                      <div className="absolute -bottom-2 left-0 right-0 bg-purple-600 text-white text-xs px-1 py-0.5 rounded text-center">
                        16:30
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6">

            {/* Performance Schedule */}
            <div className="bg-slate-800 rounded-lg">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-purple-400 text-lg font-semibold">Performance Schedule</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Fri 26/12</span>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-white text-sm">4.2</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Sun 28/12</span>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span className="text-white text-sm">2-1</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Sun 04/01</span>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    <span className="text-white text-sm">16:30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* League Table Style Stats */}
            <div className="bg-slate-800 rounded-lg">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-purple-400 text-lg font-semibold">Zone Rankings</h3>
              </div>
              <div className="p-2">
                {[
                  { pos: 1, name: 'High-Limit', revenue: '$40K', trend: 'up' },
                  { pos: 2, name: 'Main East', revenue: '$38K', trend: 'up' },
                  { pos: 3, name: 'VIP Section', revenue: '$33K', trend: 'down' },
                  { pos: 4, name: 'Progressive', revenue: '$29K', trend: 'up' },
                  { pos: 5, name: 'Video Poker', revenue: '$26K', trend: 'down' }
                ].map((zone) => (
                  <div key={zone.pos} className="flex items-center justify-between p-2 hover:bg-slate-700 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 text-sm w-6">{zone.pos}</span>
                      <span className={`text-xs px-1 ${zone.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {zone.trend === 'up' ? '↗' : '↘'}
                      </span>
                      <span className="text-white text-sm">{zone.name}</span>
                    </div>
                    <div className="text-slate-300 text-sm">{zone.revenue}</div>
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

export default ModernDashboard;