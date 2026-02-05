import { Router } from 'express';
import { getCampaigns, getCampaignById } from '../utils/storage.js';
import { getCampaignMetrics, getAggregateMetrics, getPlatformPerformance, getPerformanceOverTime } from '../utils/metrics.js';

const router = Router();

interface ReportOptions {
  format: 'json' | 'csv' | 'pdf';
  timeRange: string;
  campaigns?: string[];
  platforms?: string[];
  metrics: string[];
}

// Generate campaign performance report
router.post('/performance', async (req, res) => {
  try {
    const options: ReportOptions = req.body;
    
    // TODO: Get user ID from JWT when auth is implemented
    const userId = req.user?.id;
    
    const campaigns = await getCampaigns(userId);
    
    // Filter campaigns based on options
    let filteredCampaigns = campaigns;
    
    if (options.campaigns && options.campaigns.length > 0) {
      filteredCampaigns = campaigns.filter(c => options.campaigns!.includes(c.id));
    }
    
    if (options.platforms && options.platforms.length > 0) {
      filteredCampaigns = filteredCampaigns.filter(c => options.platforms!.includes(c.platform));
    }
    
    // Apply time range filter
    const now = new Date();
    const timeRangeMs = getTimeRangeInMs(options.timeRange);
    const startDate = new Date(now.getTime() - timeRangeMs);
    
    filteredCampaigns = filteredCampaigns.filter(campaign => {
      const createdDate = new Date(campaign.created_at);
      return createdDate >= startDate;
    });
    
    // Generate report data with real metrics
    const reportData = await generateReportData(filteredCampaigns, options.metrics, options.timeRange);
    
    switch (options.format) {
      case 'json':
        res.json(reportData);
        break;
      case 'csv':
        const csv = generateCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=campaign-report.csv');
        res.send(csv);
        break;
      case 'pdf':
        const pdf = await generatePDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=campaign-report.pdf');
        res.send(pdf);
        break;
      default:
        res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get available report templates
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'performance-overview',
      name: 'Performance Overview',
      description: 'Complete campaign performance analysis with ROI, ROAS, and conversion metrics',
      metrics: ['impressions', 'clicks', 'conversions', 'spend', 'revenue', 'roi', 'roas', 'ctr', 'conversionRate'],
      charts: ['performance-trend', 'platform-comparison', 'roi-analysis']
    },
    {
      id: 'roi-analysis',
      name: 'ROI Deep Dive',
      description: 'Detailed return on investment analysis across campaigns and platforms',
      metrics: ['spend', 'revenue', 'roi', 'roas', 'costPerConversion', 'lifetimeValue'],
      charts: ['roi-trend', 'cost-analysis', 'revenue-breakdown']
    },
    {
      id: 'conversion-funnel',
      name: 'Conversion Funnel Report',
      description: 'Analyze the customer journey from impression to conversion',
      metrics: ['impressions', 'clicks', 'conversions', 'ctr', 'conversionRate', 'costPerClick', 'costPerConversion'],
      charts: ['funnel-analysis', 'conversion-trend', 'platform-performance']
    },
    {
      id: 'platform-comparison',
      name: 'Platform Performance Comparison',
      description: 'Compare campaign performance across different advertising platforms',
      metrics: ['spend', 'revenue', 'roi', 'impressions', 'clicks', 'conversions'],
      charts: ['platform-roi', 'platform-volume', 'platform-efficiency']
    },
    {
      id: 'creative-performance',
      name: 'Creative Performance Analysis',
      description: 'Analyze the performance of different ad creatives and content types',
      metrics: ['ctr', 'conversionRate', 'engagement', 'impressions', 'clicks'],
      charts: ['creative-comparison', 'content-performance', 'engagement-analysis']
    }
  ];
  
  res.json({ templates });
});

// Generate A/B test report
router.post('/ab-test', async (req, res) => {
  try {
    const { campaignIds, testType, days = 30 } = req.body;
    
    if (!campaignIds || campaignIds.length !== 2) {
      return res.status(400).json({ error: 'Exactly two campaign IDs are required for A/B testing' });
    }
    
    const [campaignAId, campaignBId] = campaignIds;
    
    // Get campaigns and their metrics
    const campaignA = await getCampaignById(campaignAId);
    const campaignB = await getCampaignById(campaignBId);
    
    if (!campaignA || !campaignB) {
      return res.status(404).json({ error: 'One or both campaigns not found' });
    }
    
    const metricsA = await getCampaignMetrics(campaignAId, days);
    const metricsB = await getCampaignMetrics(campaignBId, days);
    
    const abTestReport = generateABTestReport(
      { campaign: campaignA, metrics: metricsA },
      { campaign: campaignB, metrics: metricsB },
      testType
    );
    
    res.json(abTestReport);
  } catch (error) {
    console.error('A/B test report generation failed:', error);
    res.status(500).json({ error: 'Failed to generate A/B test report' });
  }
});

// Get report insights
router.get('/insights', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // TODO: Get user ID from JWT when auth is implemented
    const userId = req.user?.id;
    
    const aggregateMetrics = await getAggregateMetrics(userId, parseInt(days as string));
    const platformPerformance = await getPlatformPerformance(userId, parseInt(days as string));
    const campaigns = await getCampaigns(userId);
    
    const insights = generateInsights(aggregateMetrics, platformPerformance, campaigns);
    
    res.json({ insights, dateRange: `${days} days` });
  } catch (error) {
    console.error('Insights generation failed:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Helper functions

function getTimeRangeInMs(timeRange: string): number {
  switch (timeRange) {
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    case '90d': return 90 * 24 * 60 * 60 * 1000;
    case '1y': return 365 * 24 * 60 * 60 * 1000;
    default: return 30 * 24 * 60 * 60 * 1000;
  }
}

function getTimeRangeInDays(timeRange: string): number {
  switch (timeRange) {
    case '24h': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
}

async function generateReportData(campaigns: any[], selectedMetrics: string[], timeRange: string) {
  const days = getTimeRangeInDays(timeRange);
  
  const reportData = {
    summary: {
      totalCampaigns: campaigns.length,
      totalSpend: 0,
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      averageROI: 0,
      averageROAS: 0,
      averageCTR: 0,
      averageConversionRate: 0,
      timeRange,
      generatedAt: new Date().toISOString()
    },
    campaigns: [],
    platformBreakdown: {},
    performanceTrends: [],
    insights: []
  };

  // Calculate summary metrics and get detailed campaign data
  for (const campaign of campaigns) {
    const metrics = await getCampaignMetrics(campaign.id, days);
    
    // Aggregate metrics for the time period
    const totals = metrics.reduce((acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      conversions: acc.conversions + day.conversions,
      spend: acc.spend + day.spend,
      revenue: acc.revenue + day.revenue
    }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });
    
    reportData.summary.totalSpend += totals.spend;
    reportData.summary.totalRevenue += totals.revenue;
    reportData.summary.totalImpressions += totals.impressions;
    reportData.summary.totalClicks += totals.clicks;
    reportData.summary.totalConversions += totals.conversions;
    
    // Calculate derived metrics
    const roi = calculateROI(totals.spend, totals.revenue);
    const roas = calculateROAS(totals.spend, totals.revenue);
    const ctr = calculateCTR(totals.impressions, totals.clicks);
    const conversionRate = calculateConversionRate(totals.clicks, totals.conversions);
    
    // Add campaign details
    reportData.campaigns.push({
      id: campaign.id,
      name: campaign.name,
      platform: campaign.platform,
      status: campaign.status,
      budget: campaign.budget,
      createdAt: campaign.created_at,
      metrics: totals,
      dailyMetrics: metrics,
      roi,
      roas,
      ctr,
      conversionRate,
      costPerClick: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      costPerConversion: totals.conversions > 0 ? totals.spend / totals.conversions : 0
    });
  });

  // Calculate overall averages
  if (campaigns.length > 0) {
    reportData.summary.averageROI = calculateROI(reportData.summary.totalSpend, reportData.summary.totalRevenue);
    reportData.summary.averageROAS = calculateROAS(reportData.summary.totalSpend, reportData.summary.totalRevenue);
    reportData.summary.averageCTR = calculateCTR(reportData.summary.totalImpressions, reportData.summary.totalClicks);
    reportData.summary.averageConversionRate = calculateConversionRate(reportData.summary.totalClicks, reportData.summary.totalConversions);
  }

  // Generate platform breakdown
  reportData.platformBreakdown = generatePlatformBreakdown(reportData.campaigns);
  
  // Generate performance trends from actual data
  reportData.performanceTrends = await getPerformanceOverTime(undefined, days);
  
  // Generate insights
  reportData.insights = generateInsights(reportData.summary, Object.values(reportData.platformBreakdown), campaigns);
  
  return reportData;
}

function generateCSV(data: any): string {
  const campaigns = data.campaigns;
  
  const headers = [
    'Campaign Name',
    'Platform',
    'Status',
    'Budget',
    'Spend',
    'Revenue',
    'Impressions',
    'Clicks',
    'Conversions',
    'CTR (%)',
    'Conversion Rate (%)',
    'ROI (%)',
    'ROAS',
    'Cost Per Click',
    'Cost Per Conversion',
    'Created At'
  ];
  
  const rows = campaigns.map((campaign: any) => [
    campaign.name,
    campaign.platform,
    campaign.status,
    campaign.budget,
    campaign.metrics.spend,
    campaign.metrics.revenue,
    campaign.metrics.impressions,
    campaign.metrics.clicks,
    campaign.metrics.conversions,
    campaign.ctr.toFixed(2),
    campaign.conversionRate.toFixed(2),
    campaign.roi.toFixed(2),
    campaign.roas.toFixed(2),
    campaign.costPerClick.toFixed(2),
    campaign.costPerConversion.toFixed(2),
    campaign.createdAt
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
    
  return csvContent;
}

async function generatePDF(data: any): Promise<Buffer> {
  // Mock PDF generation - in a real app, you'd use a library like PDFKit or Puppeteer
  const pdfContent = `
Campaign Performance Report
==========================
Generated: ${new Date().toLocaleString()}
Time Range: ${data.summary.timeRange}

SUMMARY
-------
Total Campaigns: ${data.summary.totalCampaigns}
Total Spend: $${data.summary.totalSpend.toLocaleString()}
Total Revenue: $${data.summary.totalRevenue.toLocaleString()}
Average ROI: ${data.summary.averageROI.toFixed(2)}%
Average ROAS: ${data.summary.averageROAS.toFixed(2)}x
Average CTR: ${data.summary.averageCTR.toFixed(2)}%
Total Conversions: ${data.summary.totalConversions}

CAMPAIGN DETAILS
---------------
${data.campaigns.map((c: any) => 
  `${c.name} (${c.platform})
   - ROI: ${c.roi.toFixed(2)}%
   - ROAS: ${c.roas.toFixed(2)}x
   - Spend: $${c.metrics.spend}
   - Revenue: $${c.metrics.revenue}
   - CTR: ${c.ctr.toFixed(2)}%
`).join('\n')}

INSIGHTS
--------
${data.insights.map((insight: any) => `- ${insight.title}: ${insight.description}`).join('\n')}
  `.trim();
  
  return Buffer.from(pdfContent, 'utf8');
}

function generateABTestReport(variantA: any, variantB: any, testType: string) {
  // Calculate aggregate metrics for each variant
  const totalsA = variantA.metrics.reduce((acc: any, day: any) => ({
    impressions: acc.impressions + day.impressions,
    clicks: acc.clicks + day.clicks,
    conversions: acc.conversions + day.conversions,
    spend: acc.spend + day.spend,
    revenue: acc.revenue + day.revenue
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });
  
  const totalsB = variantB.metrics.reduce((acc: any, day: any) => ({
    impressions: acc.impressions + day.impressions,
    clicks: acc.clicks + day.clicks,
    conversions: acc.conversions + day.conversions,
    spend: acc.spend + day.spend,
    revenue: acc.revenue + day.revenue
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });
  
  // Calculate key metrics for both variants
  const metricsA = {
    impressions: totalsA.impressions,
    clicks: totalsA.clicks,
    conversions: totalsA.conversions,
    ctr: calculateCTR(totalsA.impressions, totalsA.clicks),
    conversionRate: calculateConversionRate(totalsA.clicks, totalsA.conversions),
    cost: totalsA.spend,
    revenue: totalsA.revenue,
    roi: calculateROI(totalsA.spend, totalsA.revenue),
    roas: calculateROAS(totalsA.spend, totalsA.revenue)
  };
  
  const metricsB = {
    impressions: totalsB.impressions,
    clicks: totalsB.clicks,
    conversions: totalsB.conversions,
    ctr: calculateCTR(totalsB.impressions, totalsB.clicks),
    conversionRate: calculateConversionRate(totalsB.clicks, totalsB.conversions),
    cost: totalsB.spend,
    revenue: totalsB.revenue,
    roi: calculateROI(totalsB.spend, totalsB.revenue),
    roas: calculateROAS(totalsB.spend, totalsB.revenue)
  };
  
  // Determine winner based on primary metric
  let primaryMetric = 'conversionRate';
  if (testType === 'roi') primaryMetric = 'roi';
  if (testType === 'ctr') primaryMetric = 'ctr';
  if (testType === 'roas') primaryMetric = 'roas';
  
  const winner = metricsB[primaryMetric] > metricsA[primaryMetric] ? 'B' : 'A';
  const winnerMetrics = winner === 'B' ? metricsB : metricsA;
  const loserMetrics = winner === 'B' ? metricsA : metricsB;
  
  const lift = ((winnerMetrics[primaryMetric] - loserMetrics[primaryMetric]) / loserMetrics[primaryMetric]) * 100;
  const confidence = calculateStatisticalSignificance(metricsA, metricsB);
  
  return {
    testType,
    primaryMetric,
    duration: `${variantA.metrics.length} days`,
    campaigns: {
      variantA: {
        id: variantA.campaign.id,
        name: variantA.campaign.name,
        platform: variantA.campaign.platform
      },
      variantB: {
        id: variantB.campaign.id,
        name: variantB.campaign.name,
        platform: variantB.campaign.platform
      }
    },
    results: {
      winner: winner === 'A' ? variantA.campaign.id : variantB.campaign.id,
      winnerName: winner === 'A' ? variantA.campaign.name : variantB.campaign.name,
      confidence,
      lift: Math.abs(lift),
      significance: confidence >= 95
    },
    metrics: {
      variantA: metricsA,
      variantB: metricsB
    },
    recommendation: generateABTestRecommendation(winner, lift, confidence, primaryMetric)
  };
}

function calculateStatisticalSignificance(metricsA: any, metricsB: any): number {
  // Simplified statistical significance calculation
  // In a real implementation, you'd use proper statistical tests
  const totalSampleSize = metricsA.impressions + metricsB.impressions;
  const effectSize = Math.abs(metricsB.conversionRate - metricsA.conversionRate);
  
  if (totalSampleSize < 1000) return 60;
  if (totalSampleSize < 5000) return 80;
  if (totalSampleSize < 10000) return 90;
  if (effectSize < 0.5) return 85;
  
  return 95;
}

function generateABTestRecommendation(winner: string, lift: number, confidence: number, metric: string): string {
  if (confidence < 80) {
    return 'Test needs more data to reach statistical significance. Continue running the test.';
  }
  
  if (confidence >= 95 && lift > 10) {
    return `Variant ${winner} shows statistically significant improvement in ${metric} (+${lift.toFixed(1)}%). Recommend implementing Variant ${winner} for future campaigns.`;
  }
  
  if (lift < 5) {
    return `Both variants show similar performance. Consider testing different variables or continuing with current approach.`;
  }
  
  return `Variant ${winner} shows moderate improvement (+${lift.toFixed(1)}%). Consider implementing with caution and continued monitoring.`;
}

function calculateROI(spend: number, revenue: number): number {
  if (spend === 0) return 0;
  return ((revenue - spend) / spend) * 100;
}

function calculateROAS(spend: number, revenue: number): number {
  if (spend === 0) return 0;
  return revenue / spend;
}

function calculateCTR(impressions: number, clicks: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

function calculateConversionRate(clicks: number, conversions: number): number {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
}

function generatePlatformBreakdown(campaigns: any[]) {
  const platforms = {};
  
  campaigns.forEach(campaign => {
    const platform = campaign.platform;
    if (!platforms[platform]) {
      platforms[platform] = {
        campaigns: 0,
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0
      };
    }
    
    platforms[platform].campaigns += 1;
    platforms[platform].spend += campaign.metrics.spend;
    platforms[platform].revenue += campaign.metrics.revenue;
    platforms[platform].impressions += campaign.metrics.impressions;
    platforms[platform].clicks += campaign.metrics.clicks;
    platforms[platform].conversions += campaign.metrics.conversions;
  });
  
  return platforms;
}

function generateInsights(summary: any, platformPerformance: any[], campaigns: any[]) {
  const insights = [];
  
  // ROI insights
  if (summary.averageROI > 200) {
    insights.push({
      type: 'positive',
      category: 'roi',
      title: 'Excellent ROI Performance',
      description: `Your campaigns are generating outstanding returns with an average ROI of ${summary.averageROI.toFixed(1)}%.`,
      recommendation: 'Consider increasing budget for top-performing campaigns to scale results.'
    });
  } else if (summary.averageROI < 50) {
    insights.push({
      type: 'warning',
      category: 'roi',
      title: 'ROI Below Target',
      description: `Average ROI of ${summary.averageROI.toFixed(1)}% suggests significant optimization opportunities.`,
      recommendation: 'Review targeting, creative, and bidding strategies. Consider pausing underperforming campaigns.'
    });
  }
  
  // CTR insights
  if (summary.averageCTR > 3) {
    insights.push({
      type: 'positive',
      category: 'engagement',
      title: 'High Engagement Rate',
      description: `Your average CTR of ${summary.averageCTR.toFixed(2)}% indicates strong audience resonance.`,
      recommendation: 'Use successful creative elements in new campaigns.'
    });
  } else if (summary.averageCTR < 1) {
    insights.push({
      type: 'warning',
      category: 'engagement',
      title: 'Low Click-Through Rate',
      description: `Average CTR of ${summary.averageCTR.toFixed(2)}% suggests ad creative or targeting improvements needed.`,
      recommendation: 'A/B test new creative formats and refine audience targeting.'
    });
  }
  
  // Platform insights
  if (platformPerformance.length > 1) {
    const bestPlatform = platformPerformance.reduce((best, platform) => {
      const currentROI = calculateROI(platform.spend, platform.revenue);
      const bestROI = calculateROI(best.spend, best.revenue);
      return currentROI > bestROI ? platform : best;
    });
    
    insights.push({
      type: 'info',
      category: 'platform',
      title: 'Top Performing Platform',
      description: `${bestPlatform.platform} is delivering the best ROI.`,
      recommendation: `Consider reallocating budget to ${bestPlatform.platform} campaigns.`
    });
  }
  
  // Budget efficiency insights
  const totalSpend = summary.totalSpend;
  const totalRevenue = summary.totalRevenue;
  
  if (totalSpend > 0 && totalRevenue / totalSpend < 2) {
    insights.push({
      type: 'warning',
      category: 'efficiency',
      title: 'Budget Efficiency Opportunity',
      description: 'Current ROAS suggests room for optimization.',
      recommendation: 'Focus on highest-converting audiences and pause underperforming segments.'
    });
  }
  
  return insights;
}

export default router;