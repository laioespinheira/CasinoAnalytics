/**
 * Mock Data Generator for Casino Analytics Dashboard
 * Generates realistic gaming machine and zone performance data
 */

const MACHINE_TYPES = [
  'Penny Slots',
  'Quarter Slots',
  'Dollar Slots',
  'High-Limit Slots',
  'Video Poker',
  'Progressive Slots',
  'Multi-Game',
  'Skill-Based Games'
];

const CASINO_ZONES = [
  { name: 'Main Floor East', squareFootage: 3200, machineCount: 45 },
  { name: 'Main Floor West', squareFootage: 3500, machineCount: 52 },
  { name: 'High-Limit Room', squareFootage: 800, machineCount: 12 },
  { name: 'Penny Paradise', squareFootage: 2800, machineCount: 85 },
  { name: 'Video Poker Lounge', squareFootage: 1200, machineCount: 24 },
  { name: 'Progressive Plaza', squareFootage: 2200, machineCount: 38 },
  { name: 'Entertainment Zone', squareFootage: 1800, machineCount: 32 },
  { name: 'VIP Section', squareFootage: 600, machineCount: 8 },
  { name: 'Sports Bar Gaming', squareFootage: 1500, machineCount: 28 },
  { name: 'Lobby Slots', squareFootage: 900, machineCount: 18 },
  { name: 'Back Wall', squareFootage: 2000, machineCount: 35 },
  { name: 'Center Island', squareFootage: 1600, machineCount: 24 }
];

// Utility functions
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// Generate machine performance data with realistic patterns
const generateMachineData = () => {
  const machines = [];
  let machineId = 1;

  CASINO_ZONES.forEach(zone => {
    for (let i = 0; i < zone.machineCount; i++) {
      const machineType = randomChoice(MACHINE_TYPES);
      const baseRevenue = getBaseRevenueForType(machineType, zone.name);
      const performanceMultiplier = generatePerformanceMultiplier();

      // Create some intentional anomalies for insight generation
      let actualRevenue = baseRevenue * performanceMultiplier;
      let utilization = randomBetween(0.15, 0.85);
      let sessionLength = randomBetween(8, 45);
      let uptimePercent = randomBetween(0.92, 1.0);

      // Introduce specific patterns for analytics engine to detect
      if (Math.random() < 0.05) {
        // 5% chance of high performer
        actualRevenue *= randomBetween(1.8, 2.5);
        utilization = randomBetween(0.7, 0.95);
      } else if (Math.random() < 0.08) {
        // 8% chance of underperformer
        actualRevenue *= randomBetween(0.3, 0.6);
        utilization = randomBetween(0.05, 0.3);
      }

      // Some machines have maintenance issues
      if (Math.random() < 0.03) {
        uptimePercent = randomBetween(0.7, 0.89);
        actualRevenue *= uptimePercent;
      }

      // Occasional technical issues
      const hasTechnicalIssue = Math.random() < 0.02;
      if (hasTechnicalIssue) {
        sessionLength = randomBetween(1, 5); // Very short sessions
        utilization = Math.max(utilization, 0.4); // But still gets play attempts
      }

      machines.push({
        id: `M${machineId.toString().padStart(3, '0')}`,
        name: `${machineType} ${machineId}`,
        type: machineType,
        zone: zone.name,
        dailyRevenue: Math.round(actualRevenue),
        utilization: Math.round(utilization * 100) / 100,
        sessionLength: Math.round(sessionLength * 10) / 10,
        avgBetSize: getAvgBetForType(machineType),
        rpoh: Math.round(actualRevenue / (utilization * 12)), // Revenue per occupied hour (12 hour day)
        uptimePercent: Math.round(uptimePercent * 1000) / 1000,
        isDown: uptimePercent < 0.8,
        lastMaintenance: generateMaintenanceDate(),
        coinIn: Math.round(actualRevenue * randomBetween(8, 15)),
        coinOut: Math.round(actualRevenue * randomBetween(7, 13)),
        jackpotCount: randomInt(0, 3),
        uniquePlayers: randomInt(15, 120)
      });

      machineId++;
    }
  });

  return machines;
};

// Generate zone performance data
const generateZoneData = (machines) => {
  return CASINO_ZONES.map(zone => {
    const zoneMachines = machines.filter(m => m.zone === zone.name);
    const totalRevenue = zoneMachines.reduce((sum, m) => sum + m.dailyRevenue, 0);
    const avgUtilization = zoneMachines.reduce((sum, m) => sum + m.utilization, 0) / zoneMachines.length;
    const avgOccupancy = avgUtilization * zone.machineCount;
    const revenuePerSqFt = totalRevenue / zone.squareFootage;

    // Determine lowest performing machine type in this zone
    const machineTypePerformance = {};
    zoneMachines.forEach(machine => {
      if (!machineTypePerformance[machine.type]) {
        machineTypePerformance[machine.type] = [];
      }
      machineTypePerformance[machine.type].push(machine.dailyRevenue);
    });

    let lowestType = null;
    let lowestAvg = Infinity;
    Object.keys(machineTypePerformance).forEach(type => {
      const avg = machineTypePerformance[type].reduce((a, b) => a + b, 0) / machineTypePerformance[type].length;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        lowestType = type;
      }
    });

    return {
      id: zone.name.replace(/\s+/g, '-').toLowerCase(),
      name: zone.name,
      squareFootage: zone.squareFootage,
      machineCount: zone.machineCount,
      totalRevenue: Math.round(totalRevenue),
      revenuePerSqFt: Math.round(revenuePerSqFt * 100) / 100,
      avgUtilization: Math.round(avgUtilization * 100) / 100,
      avgOccupancy: Math.round(avgOccupancy * 100) / 100,
      avgMachineRevenue: Math.round(totalRevenue / zone.machineCount),
      lowestPerformingMachineType: lowestType,
      peakHours: generatePeakHours(),
      footTraffic: randomInt(200, 800)
    };
  });
};

// Generate historical trend data
const generateHistoricalData = () => {
  const days = 30;
  const historical = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Generate realistic daily patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseMultiplier = isWeekend ? 1.3 : 1.0;

    historical.push({
      date: date.toISOString().split('T')[0],
      totalRevenue: Math.round(randomBetween(45000, 75000) * baseMultiplier),
      avgUtilization: randomBetween(0.4, 0.8) * baseMultiplier,
      uniqueVisitors: Math.round(randomBetween(800, 1500) * baseMultiplier),
      avgSessionLength: randomBetween(22, 38),
      machineDowntime: randomBetween(0.02, 0.08),
      topPerformingZone: randomChoice(CASINO_ZONES).name,
      weatherImpact: generateWeatherImpact(date)
    });
  }

  return historical;
};

// Helper functions
const getBaseRevenueForType = (machineType, zoneName) => {
  const baseRates = {
    'Penny Slots': { base: 150, zoneMultipliers: { 'Penny Paradise': 1.2, 'Lobby Slots': 0.8 } },
    'Quarter Slots': { base: 280, zoneMultipliers: { 'Main Floor East': 1.1, 'Main Floor West': 1.1 } },
    'Dollar Slots': { base: 420, zoneMultipliers: { 'Main Floor East': 1.2, 'Main Floor West': 1.2 } },
    'High-Limit Slots': { base: 850, zoneMultipliers: { 'High-Limit Room': 1.4, 'VIP Section': 1.3 } },
    'Video Poker': { base: 320, zoneMultipliers: { 'Video Poker Lounge': 1.3, 'Sports Bar Gaming': 1.1 } },
    'Progressive Slots': { base: 380, zoneMultipliers: { 'Progressive Plaza': 1.25, 'Center Island': 1.1 } },
    'Multi-Game': { base: 290, zoneMultipliers: {} },
    'Skill-Based Games': { base: 200, zoneMultipliers: { 'Entertainment Zone': 1.2 } }
  };

  const machineData = baseRates[machineType] || { base: 250, zoneMultipliers: {} };
  const zoneMultiplier = machineData.zoneMultipliers[zoneName] || 1.0;

  return machineData.base * zoneMultiplier;
};

const getAvgBetForType = (machineType) => {
  const betSizes = {
    'Penny Slots': randomBetween(0.40, 1.25),
    'Quarter Slots': randomBetween(1.25, 3.75),
    'Dollar Slots': randomBetween(4.00, 12.00),
    'High-Limit Slots': randomBetween(25.00, 100.00),
    'Video Poker': randomBetween(1.25, 5.00),
    'Progressive Slots': randomBetween(2.00, 10.00),
    'Multi-Game': randomBetween(0.75, 4.00),
    'Skill-Based Games': randomBetween(1.00, 5.00)
  };

  return Math.round((betSizes[machineType] || randomBetween(1.00, 5.00)) * 100) / 100;
};

const generatePerformanceMultiplier = () => {
  // Most machines perform around average, with some outliers
  const rand = Math.random();
  if (rand < 0.7) {
    return randomBetween(0.8, 1.2); // 70% perform normally
  } else if (rand < 0.9) {
    return randomBetween(1.2, 1.6); // 20% above average
  } else if (rand < 0.95) {
    return randomBetween(0.4, 0.8); // 5% below average
  } else {
    return randomBetween(1.8, 2.8); // 5% exceptional performers
  }
};

const generateMaintenanceDate = () => {
  const daysAgo = randomInt(1, 45);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const generatePeakHours = () => {
  const peakPatterns = [
    '6PM-9PM',
    '7PM-10PM',
    '8PM-11PM',
    '9PM-12AM',
    '2PM-5PM',
    '12PM-3PM'
  ];
  return randomChoice(peakPatterns);
};

const generateWeatherImpact = (date) => {
  // Simulate weather impact on casino visits
  const weatherTypes = ['sunny', 'rainy', 'cloudy', 'stormy'];
  const weather = randomChoice(weatherTypes);
  const impact = weather === 'stormy' ? 1.2 : weather === 'rainy' ? 1.1 : 1.0;
  return { weather, impact };
};

// Main export function
export const generateMockData = () => {
  const machines = generateMachineData();
  const zones = generateZoneData(machines);
  const historical = generateHistoricalData();

  return {
    machines,
    zones,
    historical,
    lastUpdated: new Date().toISOString(),
    metadata: {
      totalMachines: machines.length,
      totalZones: zones.length,
      dataQuality: 0.94,
      coverage: 0.98
    }
  };
};

export default generateMockData;