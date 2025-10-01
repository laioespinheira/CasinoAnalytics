/**
 * Casino Analytics Mock Data Generator
 * Generates realistic gaming data for dashboard testing
 */

// Game definitions by segment
const GAMES = {
  Mass: [
    'Lucky Dragon Slots', 'Golden Fortune', 'Buffalo Thunder', 'Wheel of Fortune',
    'Quick Hit Platinum', 'Lightning Link', 'Dancing Drums', 'Cleopatra Gold'
  ],
  Premium: [
    'High Stakes Poker', 'Premium Baccarat', 'Royal Blackjack', 'Diamond Roulette',
    'Platinum Slots', "Fortunes Crown", 'Golden Emperor'
  ],
  VIP: [
    'VIP Baccarat Supreme', 'Private Blackjack Elite', 'Exclusive Roulette',
    'Diamond Dynasty', 'Royal Fortune', 'Platinum Emperor'
  ]
};

// Area configurations
const AREAS = {
  Mass: {
    AA: { machines: 50, avgBet: 2.5, holdPercentage: 0.08 },
    BB: { machines: 40, avgBet: 2.8, holdPercentage: 0.085 },
    CC: { machines: 30, avgBet: 3.2, holdPercentage: 0.09 },
    DD: { machines: 30, avgBet: 2.9, holdPercentage: 0.082 }
  },
  Premium: {
    PA: { machines: 50, avgBet: 12.5, holdPercentage: 0.12 },
    PB: { machines: 40, avgBet: 15.8, holdPercentage: 0.125 }
  },
  VIP: {
    VV: { machines: 20, avgBet: 85.0, holdPercentage: 0.15 },
    XX: { machines: 30, avgBet: 65.0, holdPercentage: 0.148 }
  }
};

// Utility functions
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const getWeekendMultiplier = (date) => {
  const day = new Date(date).getDay();
  return (day === 0 || day === 6) ? randomBetween(1.3, 1.8) : randomBetween(0.8, 1.2);
};

// Get week ending date (Sunday)
const getWeekEnding = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday is day 0
  const sunday = new Date(d.setDate(diff));
  return sunday.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Get day of week name
const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
};

// Generate machine data for a specific area
const generateMachineData = (segment, area, machineCount, startDate, days = 30) => {
  const data = [];
  const areaConfig = AREAS[segment][area];
  const games = GAMES[segment];

  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    const dateString = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const weekEnding = getWeekEnding(currentDate);
    const dayOfWeek = getDayOfWeek(currentDate);
    const weekendMultiplier = getWeekendMultiplier(currentDate);

    for (let machineNum = 1; machineNum <= machineCount; machineNum++) {
      const machineId = `${area}-${machineNum.toString().padStart(3, '0')}`;
      const game = randomChoice(games);

      // Base patron hours (how long machines are played)
      const basePatronHours = randomBetween(8, 16) * weekendMultiplier;

      // Turnover calculation (patron hours * average bet * spins per hour)
      const spinsPerHour = randomBetween(400, 600);
      const actualAvgBet = areaConfig.avgBet * randomBetween(0.7, 1.4);
      const turnover = basePatronHours * actualAvgBet * spinsPerHour;

      // Revenue calculation (turnover * hold percentage)
      const actualHoldPercentage = areaConfig.holdPercentage * randomBetween(0.85, 1.15);
      const revenue = turnover * actualHoldPercentage;

      // Add some realistic variation
      const performanceVariation = randomBetween(0.6, 1.4);

      data.push({
        date: dateString,
        weekEnding: weekEnding,
        dayOfWeek: dayOfWeek,
        segment: segment,
        area: area,
        machine: machineId,
        game: game,
        turnover: Math.round(turnover * performanceVariation * 100) / 100,
        revenue: Math.round(revenue * performanceVariation * 100) / 100,
        patronHours: Math.round(basePatronHours * performanceVariation * 100) / 100
      });
    }
  }

  return data;
};

// Generate complete dataset
export const generateCasinoData = (startDate = '2024-07-01', days = 30) => {
  let allData = [];

  // Generate data for each segment and area
  Object.keys(AREAS).forEach(segment => {
    Object.keys(AREAS[segment]).forEach(area => {
      const machineCount = AREAS[segment][area].machines;
      const areaData = generateMachineData(segment, area, machineCount, startDate, days);
      allData = allData.concat(areaData);
    });
  });

  return allData;
};

// Generate summary statistics
export const generateSummaryStats = (data) => {
  const totalTurnover = data.reduce((sum, record) => sum + record.turnover, 0);
  const totalRevenue = data.reduce((sum, record) => sum + record.revenue, 0);
  const totalPatronHours = data.reduce((sum, record) => sum + record.patronHours, 0);
  const totalMachines = [...new Set(data.map(record => record.machine))].length;

  // Group by segment
  const bySegment = {};
  ['Mass', 'Premium', 'VIP'].forEach(segment => {
    const segmentData = data.filter(record => record.segment === segment);
    bySegment[segment] = {
      turnover: segmentData.reduce((sum, record) => sum + record.turnover, 0),
      revenue: segmentData.reduce((sum, record) => sum + record.revenue, 0),
      patronHours: segmentData.reduce((sum, record) => sum + record.patronHours, 0),
      machines: [...new Set(segmentData.map(record => record.machine))].length,
      holdPercentage: segmentData.length > 0 ?
        (segmentData.reduce((sum, record) => sum + record.revenue, 0) /
         segmentData.reduce((sum, record) => sum + record.turnover, 0)) : 0
    };
  });

  // Group by area
  const byArea = {};
  const areas = [...new Set(data.map(record => record.area))];
  areas.forEach(area => {
    const areaData = data.filter(record => record.area === area);
    byArea[area] = {
      segment: areaData[0]?.segment || '',
      turnover: areaData.reduce((sum, record) => sum + record.turnover, 0),
      revenue: areaData.reduce((sum, record) => sum + record.revenue, 0),
      patronHours: areaData.reduce((sum, record) => sum + record.patronHours, 0),
      machines: [...new Set(areaData.map(record => record.machine))].length,
      holdPercentage: areaData.length > 0 ?
        (areaData.reduce((sum, record) => sum + record.revenue, 0) /
         areaData.reduce((sum, record) => sum + record.turnover, 0)) : 0
    };
  });

  // Daily trends (last 7 days)
  const dailyTrends = {};
  const last7Days = [...new Set(data.map(record => record.date))].slice(-7);
  last7Days.forEach(date => {
    const dayData = data.filter(record => record.date === date);
    dailyTrends[date] = {
      turnover: dayData.reduce((sum, record) => sum + record.turnover, 0),
      revenue: dayData.reduce((sum, record) => sum + record.revenue, 0),
      patronHours: dayData.reduce((sum, record) => sum + record.patronHours, 0)
    };
  });

  return {
    totals: {
      turnover: Math.round(totalTurnover),
      revenue: Math.round(totalRevenue),
      patronHours: Math.round(totalPatronHours * 100) / 100,
      machines: totalMachines,
      holdPercentage: Math.round((totalRevenue / totalTurnover) * 10000) / 100,
      revenuePerMachine: Math.round((totalRevenue / totalMachines) * 100) / 100,
      revenuePerPatronHour: Math.round((totalRevenue / totalPatronHours) * 100) / 100
    },
    bySegment,
    byArea,
    dailyTrends
  };
};

// Export sample data for immediate use
const sampleData = generateCasinoData('2024-07-01', 30);
export const sampleStats = generateSummaryStats(sampleData);
export { sampleData };

export default {
  generateCasinoData,
  generateSummaryStats,
  sampleData,
  sampleStats
};