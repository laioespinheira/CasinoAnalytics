/**
 * Casino Analytics Engine
 * Generates automated insights and recommendations for gaming machine performance
 */

// Business Rules Configuration
const BUSINESS_RULES = {
  // Performance thresholds
  REVENUE_PER_SQFT: {
    EXCELLENT: 500,
    GOOD: 300,
    POOR: 150,
    CRITICAL: 100
  },
  UTILIZATION_RATE: {
    EXCELLENT: 0.7,
    GOOD: 0.5,
    POOR: 0.3,
    CRITICAL: 0.15
  },
  RPOH: { // Revenue Per Occupied Hour
    EXCELLENT: 75,
    GOOD: 50,
    POOR: 30,
    CRITICAL: 20
  },
  // Anomaly detection sensitivity
  ANOMALY_THRESHOLD: 2.0, // Standard deviations
  TREND_LOOKBACK_DAYS: 7,
  MINIMUM_DATA_POINTS: 5
};

// Insight Priority Levels
const INSIGHT_PRIORITY = {
  CRITICAL: 'critical',    // Immediate action required
  HIGH: 'high',           // Action recommended within 24h
  MEDIUM: 'medium',       // Action recommended within week
  LOW: 'low'             // Informational only
};

class CasinoAnalyticsEngine {
  constructor() {
    this.insights = [];
    this.alerts = [];
  }

  /**
   * Main analysis function - processes all casino data and generates insights
   */
  analyzePerformance(machineData, zoneData, historicalData) {
    this.insights = [];
    this.alerts = [];

    // Core analysis functions
    this.detectPerformanceAnomalies(machineData, historicalData);
    this.analyzeZoneEfficiency(zoneData);
    this.identifyRevenueLoss(machineData, zoneData);
    this.detectOperationalIssues(machineData);
    this.generateStrategicRecommendations(zoneData, historicalData);

    // Sort insights by priority and impact
    this.prioritizeInsights();

    return {
      insights: this.insights,
      alerts: this.alerts,
      summary: this.generateSummary()
    };
  }

  /**
   * Detect machines performing significantly above/below expectations
   */
  detectPerformanceAnomalies(machineData, historicalData) {
    const avgRevenue = this.calculateAverage(machineData.map(m => m.dailyRevenue));
    const stdDev = this.calculateStandardDeviation(machineData.map(m => m.dailyRevenue));

    machineData.forEach(machine => {
      const zScore = Math.abs((machine.dailyRevenue - avgRevenue) / stdDev);

      if (zScore > BUSINESS_RULES.ANOMALY_THRESHOLD) {
        const isOutperforming = machine.dailyRevenue > avgRevenue;
        const impactAmount = Math.abs(machine.dailyRevenue - avgRevenue);

        this.insights.push({
          id: `anomaly-${machine.id}`,
          type: 'performance_anomaly',
          priority: impactAmount > 500 ? INSIGHT_PRIORITY.HIGH : INSIGHT_PRIORITY.MEDIUM,
          title: isOutperforming ? 'High-Performing Machine Detected' : 'Underperforming Machine Alert',
          message: `${machine.name} in ${machine.zone} is ${isOutperforming ? 'exceeding' : 'underperforming'} by $${impactAmount.toFixed(0)} daily`,
          recommendation: isOutperforming
            ? `Study this machine's placement and settings for replication opportunities`
            : `Investigate placement, settings, or maintenance needs for immediate optimization`,
          machineId: machine.id,
          zone: machine.zone,
          impact: impactAmount,
          confidence: Math.min(zScore / BUSINESS_RULES.ANOMALY_THRESHOLD, 1.0)
        });
      }
    });
  }

  /**
   * Analyze revenue per square foot and occupancy density by zone
   */
  analyzeZoneEfficiency(zoneData) {
    const avgRevenuePerSqFt = this.calculateAverage(zoneData.map(z => z.revenuePerSqFt));

    zoneData.forEach(zone => {
      const efficiency = zone.revenuePerSqFt / avgRevenuePerSqFt;
      const occupancyDensity = zone.avgOccupancy / zone.squareFootage;

      // Identify underutilized high-value areas
      if (zone.revenuePerSqFt < BUSINESS_RULES.REVENUE_PER_SQFT.POOR && zone.squareFootage > 1000) {
        this.insights.push({
          id: `zone-underutil-${zone.id}`,
          type: 'zone_optimization',
          priority: INSIGHT_PRIORITY.HIGH,
          title: 'Large Area Underperforming',
          message: `${zone.name} (${zone.squareFootage} sq ft) generating only $${zone.revenuePerSqFt}/sq ft`,
          recommendation: `Consider machine density increase, machine mix changes, or area repurposing. Potential revenue gain: $${((BUSINESS_RULES.REVENUE_PER_SQFT.GOOD - zone.revenuePerSqFt) * zone.squareFootage).toFixed(0)}/day`,
          zone: zone.name,
          impact: (BUSINESS_RULES.REVENUE_PER_SQFT.GOOD - zone.revenuePerSqFt) * zone.squareFootage,
          confidence: 0.85
        });
      }

      // Identify overcrowded areas with expansion potential
      if (occupancyDensity > 0.8 && zone.revenuePerSqFt > BUSINESS_RULES.REVENUE_PER_SQFT.GOOD) {
        this.insights.push({
          id: `zone-expansion-${zone.id}`,
          type: 'expansion_opportunity',
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'High-Demand Area Identified',
          message: `${zone.name} shows high occupancy (${(occupancyDensity * 100).toFixed(0)}%) and strong revenue density`,
          recommendation: `Consider expanding this area or replicating its successful machine mix in underperforming zones`,
          zone: zone.name,
          impact: zone.revenuePerSqFt * 0.2, // Estimated 20% expansion benefit
          confidence: 0.75
        });
      }
    });
  }

  /**
   * Calculate revenue loss from downtime and poor performance
   */
  identifyRevenueLoss(machineData, zoneData) {
    let totalLoss = 0;
    const downtimeMachines = machineData.filter(m => m.isDown || m.uptimePercent < 0.9);

    downtimeMachines.forEach(machine => {
      const zoneAvgRevenue = zoneData.find(z => z.name === machine.zone)?.avgMachineRevenue || 0;
      const estimatedLoss = zoneAvgRevenue * (1 - machine.uptimePercent);
      totalLoss += estimatedLoss;

      if (estimatedLoss > 100) { // Significant daily loss
        this.alerts.push({
          id: `downtime-${machine.id}`,
          type: 'revenue_loss',
          priority: INSIGHT_PRIORITY.CRITICAL,
          title: 'Machine Downtime Revenue Loss',
          message: `${machine.name} downtime costing $${estimatedLoss.toFixed(0)}/day`,
          recommendation: 'Immediate maintenance required',
          machineId: machine.id,
          impact: estimatedLoss
        });
      }
    });

    if (totalLoss > 1000) {
      this.insights.push({
        id: 'total-downtime-loss',
        type: 'operational_efficiency',
        priority: INSIGHT_PRIORITY.HIGH,
        title: 'Significant Downtime Revenue Impact',
        message: `${downtimeMachines.length} machines creating $${totalLoss.toFixed(0)} daily revenue loss`,
        recommendation: 'Review maintenance protocols and implement predictive maintenance',
        impact: totalLoss,
        confidence: 0.9
      });
    }
  }

  /**
   * Detect operational issues requiring immediate attention
   */
  detectOperationalIssues(machineData) {
    // Identify machines with suspicious patterns
    machineData.forEach(machine => {
      // Detect potential technical issues
      if (machine.sessionLength < 2 && machine.utilization > 0.3) {
        this.alerts.push({
          id: `tech-issue-${machine.id}`,
          type: 'technical_alert',
          priority: INSIGHT_PRIORITY.HIGH,
          title: 'Potential Technical Issue',
          message: `${machine.name} has unusually short sessions despite high utilization`,
          recommendation: 'Check for technical malfunctions or player experience issues',
          machineId: machine.id
        });
      }

      // Detect maintenance needs
      if (machine.lastMaintenance && this.daysSince(machine.lastMaintenance) > 30) {
        this.alerts.push({
          id: `maintenance-due-${machine.id}`,
          type: 'maintenance_alert',
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Maintenance Overdue',
          message: `${machine.name} last serviced ${this.daysSince(machine.lastMaintenance)} days ago`,
          recommendation: 'Schedule preventive maintenance',
          machineId: machine.id
        });
      }
    });
  }

  /**
   * Generate strategic recommendations for floor optimization
   */
  generateStrategicRecommendations(zoneData, historicalData) {
    // Machine mix optimization
    const topPerformingTypes = this.identifyTopPerformingMachineTypes(historicalData);
    const underperformingZones = zoneData.filter(z => z.revenuePerSqFt < BUSINESS_RULES.REVENUE_PER_SQFT.POOR);

    underperformingZones.forEach(zone => {
      this.insights.push({
        id: `mix-optimization-${zone.id}`,
        type: 'strategic_recommendation',
        priority: INSIGHT_PRIORITY.MEDIUM,
        title: 'Machine Mix Optimization Opportunity',
        message: `${zone.name} could benefit from adding more ${topPerformingTypes[0]} machines`,
        recommendation: `Replace ${zone.lowestPerformingMachineType} with ${topPerformingTypes[0]} to increase revenue`,
        zone: zone.name,
        impact: zone.squareFootage * 50, // Estimated improvement
        confidence: 0.7
      });
    });

    // Peak hour optimization
    const peakHourData = this.analyzePeakHours(historicalData);
    if (peakHourData.utilizationGap > 0.3) {
      this.insights.push({
        id: 'peak-hour-optimization',
        type: 'strategic_recommendation',
        priority: INSIGHT_PRIORITY.MEDIUM,
        title: 'Peak Hour Capacity Opportunity',
        message: `${(peakHourData.utilizationGap * 100).toFixed(0)}% utilization gap during peak hours (${peakHourData.peakHours})`,
        recommendation: 'Implement targeted promotions or events to increase off-peak utilization',
        impact: peakHourData.utilizationGap * peakHourData.totalRevenuePotential * 0.3,
        confidence: 0.65
      });
    }
  }

  /**
   * Prioritize insights by impact and urgency
   */
  prioritizeInsights() {
    this.insights.sort((a, b) => {
      // Priority order
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      // Then by impact
      return (b.impact || 0) - (a.impact || 0);
    });

    this.alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate executive summary
   */
  generateSummary() {
    const criticalInsights = this.insights.filter(i => i.priority === INSIGHT_PRIORITY.CRITICAL);
    const highPriorityInsights = this.insights.filter(i => i.priority === INSIGHT_PRIORITY.HIGH);
    const totalPotentialImpact = this.insights.reduce((sum, insight) => sum + (insight.impact || 0), 0);

    return {
      totalInsights: this.insights.length,
      criticalAlerts: criticalInsights.length,
      highPriorityItems: highPriorityInsights.length,
      totalPotentialImpact: Math.round(totalPotentialImpact),
      topRecommendation: this.insights.length > 0 ? this.insights[0] : null
    };
  }

  // Utility functions
  calculateAverage(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateStandardDeviation(values) {
    const avg = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.calculateAverage(squaredDiffs));
  }

  daysSince(date) {
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  }

  identifyTopPerformingMachineTypes(historicalData) {
    // Simplified - would implement actual analysis
    return ['Video Poker', 'High-Limit Slots', 'Progressive Slots'];
  }

  analyzePeakHours(historicalData) {
    // Simplified - would implement actual peak hour analysis
    return {
      peakHours: '7PM-10PM',
      utilizationGap: 0.35,
      totalRevenuePotential: 15000
    };
  }
}

export default CasinoAnalyticsEngine;
export { BUSINESS_RULES, INSIGHT_PRIORITY };