import React from 'react';

const MetricsChart = ({ title, data, type = 'bar', height = 200, showValues = true }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 60; // Account for labels

  const getColor = (index, value) => {
    const colors = [
      '#3b82f6', '#8b5cf6', '#06d6a0', '#ffd166', '#f72585',
      '#4cc9f0', '#7209b7', '#f77f00', '#fcbf49', '#d62828'
    ];
    return colors[index % colors.length];
  };

  const formatValue = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    if (value >= 100) return `$${Math.round(value)}`;
    return `$${value.toFixed(1)}`;
  };

  if (type === 'pie') {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;
    const centerX = 100;
    const centerY = 100;
    const radius = 80;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-start justify-between">
          <svg width="200" height="200" className="flex-shrink-0">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (item.value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;

              const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;

              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              currentAngle += angle;

              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={getColor(index)}
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            <circle
              cx={centerX}
              cy={centerY}
              r="35"
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="text-sm font-semibold fill-gray-900"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {formatValue(total)}
            </text>
          </svg>

          <div className="ml-6 flex-1">
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: getColor(index) }}
                    />
                    <span className="text-sm text-gray-700 truncate">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatValue(item.value)}</div>
                    <div className="text-xs text-gray-500">
                      {((item.value / total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 300;
      const y = chartHeight - (item.value / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <svg width="320" height={height}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => (
            <line
              key={index}
              x1="0"
              y1={chartHeight * fraction}
              x2="300"
              y2={chartHeight * fraction}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            points={points}
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 300;
            const y = chartHeight - (item.value / maxValue) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Labels */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 300;
            return (
              <text
                key={index}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.label.length > 6 ? item.label.substring(0, 6) + '...' : item.label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }

  // Default bar chart
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-end justify-between space-x-2" style={{ height: `${chartHeight}px` }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="relative flex items-end justify-center w-full">
                {showValues && (
                  <div className="absolute -top-6 text-xs font-medium text-gray-700">
                    {formatValue(item.value)}
                  </div>
                )}
                <div
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: getColor(index, item.value),
                    minHeight: '2px'
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center w-full truncate">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsChart;