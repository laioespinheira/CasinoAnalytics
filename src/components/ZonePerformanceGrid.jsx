import React, { useState } from 'react';

const ZonePerformanceGrid = ({ zones, onZoneSelect }) => {
  const [sortBy, setSortBy] = useState('revenuePerSqFt');
  const [sortOrder, setSortOrder] = useState('desc');

  const getPerformanceLevel = (value, type) => {
    if (type === 'revenuePerSqFt') {
      if (value >= 500) return { level: 'excellent', color: 'bg-green-100 text-green-800' };
      if (value >= 300) return { level: 'good', color: 'bg-blue-100 text-blue-800' };
      if (value >= 150) return { level: 'fair', color: 'bg-yellow-100 text-yellow-800' };
      return { level: 'poor', color: 'bg-red-100 text-red-800' };
    }
    if (type === 'utilization') {
      if (value >= 0.7) return { level: 'excellent', color: 'bg-green-100 text-green-800' };
      if (value >= 0.5) return { level: 'good', color: 'bg-blue-100 text-blue-800' };
      if (value >= 0.3) return { level: 'fair', color: 'bg-yellow-100 text-yellow-800' };
      return { level: 'poor', color: 'bg-red-100 text-red-800' };
    }
    return { level: 'neutral', color: 'bg-gray-100 text-gray-800' };
  };

  const sortedZones = [...zones].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle string values
    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Handle numeric values
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }) => (
    <span className="ml-1">
      {sortBy === field ? (
        sortOrder === 'asc' ? '↑' : '↓'
      ) : (
        '↕️'
      )}
    </span>
  );

  const formatCurrency = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${Math.round(value)}`;
  };

  const formatPercentage = (value) => `${Math.round(value * 100)}%`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Zone Performance Overview</h2>
        <p className="text-gray-600 mt-1">Click on any zone for detailed analysis</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Zone <SortIcon field="name" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('revenuePerSqFt')}
              >
                Revenue/Sq Ft <SortIcon field="revenuePerSqFt" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalRevenue')}
              >
                Total Revenue <SortIcon field="totalRevenue" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avgUtilization')}
              >
                Utilization <SortIcon field="avgUtilization" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('machineCount')}
              >
                Machines <SortIcon field="machineCount" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avgMachineRevenue')}
              >
                Avg Machine Revenue <SortIcon field="avgMachineRevenue" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedZones.map((zone, index) => {
              const revPerSqFtLevel = getPerformanceLevel(zone.revenuePerSqFt, 'revenuePerSqFt');
              const utilizationLevel = getPerformanceLevel(zone.avgUtilization, 'utilization');

              return (
                <tr
                  key={zone.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onZoneSelect && onZoneSelect(zone)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{zone.name}</div>
                        <div className="text-sm text-gray-500">{zone.squareFootage.toLocaleString()} sq ft</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${zone.revenuePerSqFt.toFixed(2)}
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${revPerSqFtLevel.color}`}>
                      {revPerSqFtLevel.level}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{formatCurrency(zone.totalRevenue)}</div>
                    <div className="text-xs text-gray-500">daily</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPercentage(zone.avgUtilization)}
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${utilizationLevel.color}`}>
                      {utilizationLevel.level}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{zone.machineCount}</div>
                    <div className="text-xs text-gray-500">
                      {(zone.avgOccupancy / zone.machineCount * 100).toFixed(0)}% occupied
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{formatCurrency(zone.avgMachineRevenue)}</div>
                    <div className="text-xs text-gray-500">per machine/day</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            zone.revenuePerSqFt >= 400 ? 'bg-green-500' :
                            zone.revenuePerSqFt >= 250 ? 'bg-blue-500' :
                            zone.revenuePerSqFt >= 150 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min((zone.revenuePerSqFt / 600) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Revenue Score: {Math.round((zone.revenuePerSqFt / 600) * 100)}%
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1 bg-blue-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoneSelect && onZoneSelect(zone);
                        }}
                      >
                        Analyze
                      </button>
                      <button className="text-green-600 hover:text-green-900 text-xs px-2 py-1 bg-green-100 rounded">
                        Optimize
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {zones.length}
            </div>
            <div className="text-sm text-gray-600">Total Zones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(zones.reduce((sum, zone) => sum + zone.totalRevenue, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Daily Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${(zones.reduce((sum, zone) => sum + zone.revenuePerSqFt * zone.squareFootage, 0) / zones.reduce((sum, zone) => sum + zone.squareFootage, 0)).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Avg Revenue/Sq Ft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(zones.reduce((sum, zone) => sum + zone.avgUtilization, 0) / zones.length)}
            </div>
            <div className="text-sm text-gray-600">Avg Utilization</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZonePerformanceGrid;