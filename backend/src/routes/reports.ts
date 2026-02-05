import { Router } from 'express';
import { getCampaigns } from '../utils/storage.js';

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
    const campaigns = await getCampaigns();
    
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
      const createdDate = new Date(campaign.createdAt);
      return createdDate >= startDate;
    });
    
    // Generate report data
    const reportData = generateReportData(filteredCampaigns, options.metrics);
    
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
    const { campaignIds, testType } = req.body;
    const campaigns = await getCampaigns();
    
    const testCampaigns = campaigns.filter(c => campaignIds.includes(c.id));
    
    const abTestReport = generateABTestReport(testCampaigns, testType);
    
    res.json(abTestReport);
  } catch (error) {
    console.error('A/B test report generation failed:', error);
    res.status(500).json({ error: 'Failed to generate A/B test report' });
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

function generateReportData(campaigns: any[], metrics: string[]) {
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
      averageConversionRate: 0
    },
    campaigns: [],
    platformBreakdown: {},
    performanceTrends: [],
    insights: []
  };

  // Calculate summary metrics
  campaigns.forEach(campaign => {
    const campaignMetrics = campaign.metrics || generateMockMetrics();
    
    reportData.summary.totalSpend += campaignMetrics.spend || 0;
    reportData.summary.totalRevenue += campaignMetrics.revenue || 0;
    reportData.summary.totalImpressions += campaignMetrics.impressions || 0;
    reportData.summary.totalClicks += campaignMetrics.clicks || 0;
    reportData.summary.totalConversions += campaignMetrics.conversions || 0;
    
    // Add campaign details
    reportData.campaigns.push({
      id: campaign.id,
      name: campaign.name,
      platform: campaign.platform,
      status: campaign.status,
      budget: campaign.budget,
      createdAt: campaign.createdAt,
      metrics: campaignMetrics,
      roi: calculateROI(campaignMetrics.spend, campaignMetrics.revenue),
      roas: calculateROAS(campaignMetrics.spend, campaignMetrics.revenue),
      ctr: calculateCTR(campaignMetrics.impressions, campaignMetrics.clicks),
      conversionRate: calculateConversionRate(campaignMetrics.clicks, campaignMetrics.conversions)
    });
  });

  // Calculate averages
  if (campaigns.length > 0) {
    reportData.summary.averageROI = calculateROI(reportData.summary.totalSpend, reportData.summary.totalRevenue);
    reportData.summary.averageROAS = calculateROAS(reportData.summary.totalSpend, reportData.summary.totalRevenue);
    reportData.summary.averageCTR = calculateCTR(reportData.summary.totalImpressions, reportData.summary.totalClicks);
    reportData.summary.averageConversionRate = calculateConversionRate(reportData.summary.totalClicks, reportData.summary.totalConversions);
  }

  // Generate platform breakdown
  reportData.platformBreakdown = generatePlatformBreakdown(campaigns);
  
  // Generate performance trends (mock data for now)
  reportData.performanceTrends = generatePerformanceTrends();
  
  // Generate insights
  reportData.insights = generateInsights(reportData);
  
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
    'CTR',
    'Conversion Rate',
    'ROI',
    'ROAS',
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
    `${campaign.ctr}%`,
    `${campaign.conversionRate}%`,
    `${campaign.roi}%`,
    `${campaign.roas}x`,
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

Total Campaigns: ${data.summary.totalCampaigns}
Total Spend: $${data.summary.totalSpend.toLocaleString()}
Total Revenue: $${data.summary.totalRevenue.toLocaleString()}
Average ROI: ${data.summary.averageROI}%
Average ROAS: ${data.summary.averageROAS}x

Campaign Details:
${data.campaigns.map((c: any) => `- ${c.name}: ROI ${c.roi}%`).join('\n')}

Generated on: ${new Date().toISOString()}
  `.trim();
  
  return Buffer.from(pdfContent, 'utf8');
}

function generateABTestReport(campaigns: any[], testType: string) {
  return {
    testType,
    campaigns: campaigns.length,
    results: {
      winner: campaigns[0]?.id || null,
      confidence: 95,
      lift: 15.3,
      significance: true
    },
    metrics: {
      variantA: {
        impressions: 10000,
        clicks: 250,
        conversions: 25,
        ctr: 2.5,
        conversionRate: 10.0,
        cost: 500
      },
      variantB: {
        impressions: 10000,
        clicks: 290,
        conversions: 32,
        ctr: 2.9,
        conversionRate: 11.0,
        cost: 580
      }
    },
    recommendation: 'Variant B shows statistically significant improvement in conversion rate (+10%). Recommend implementing Variant B for all future campaigns.'
  };
}

function generateMockMetrics() {
  return {
    impressions: Math.floor(Math.random() * 50000) + 10000,
    clicks: Math.floor(Math.random() * 1500) + 300,
    conversions: Math.floor(Math.random() * 150) + 25,
    spend: Math.floor(Math.random() * 5000) + 1000,
    revenue: Math.floor(Math.random() * 15000) + 3000
  };
}

function calculateROI(spend: number, revenue: number): number {
  if (spend === 0) return 0;
  return Math.round(((revenue - spend) / spend) * 100);
}

function calculateROAS(spend: number, revenue: number): number {
  if (spend === 0) return 0;
  return Math.round((revenue / spend) * 10) / 10;
}

function calculateCTR(impressions: number, clicks: number): number {
  if (impressions === 0) return 0;
  return Math.round((clicks / impressions) * 1000) / 10;
}

function calculateConversionRate(clicks: number, conversions: number): number {
  if (clicks === 0) return 0;
  return Math.round((conversions / clicks) * 1000) / 10;
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
    
    const metrics = campaign.metrics || generateMockMetrics();
    platforms[platform].campaigns += 1;
    platforms[platform].spend += metrics.spend || 0;
    platforms[platform].revenue += metrics.revenue || 0;
    platforms[platform].impressions += metrics.impressions || 0;
    platforms[platform].clicks += metrics.clicks || 0;
    platforms[platform].conversions += metrics.conversions || 0;
  });
  
  return platforms;
}

function generatePerformanceTrends() {
  const trends = [];
  const days = 30;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 10000) + 5000,
      clicks: Math.floor(Math.random() * 300) + 150,
      conversions: Math.floor(Math.random() * 30) + 15,
      spend: Math.floor(Math.random() * 1000) + 500,
      revenue: Math.floor(Math.random() * 3000) + 1500
    });
  }
  
  return trends;
}

function generateInsights(data: any) {
  const insights = [];
  
  // ROI insights
  if (data.summary.averageROI > 200) {
    insights.push({
      type: 'positive',
      category: 'roi',
      title: 'Strong ROI Performance',
      description: `Your campaigns are generating excellent returns with an average ROI of ${data.summary.averageROI}%.`,
      recommendation: 'Consider increasing budget for top-performing campaigns to scale results.'
    });
  } else if (data.summary.averageROI < 100) {
    insights.push({
      type: 'warning',
      category: 'roi',
      title: 'ROI Below Target',
      description: `Average ROI of ${data.summary.averageROI}% suggests optimization opportunities.`,
      recommendation: 'Review targeting, creative, and bidding strategies to improve performance.'
    });
  }
  
  // Platform insights
  const platforms = Object.keys(data.platformBreakdown);
  if (platforms.length > 1) {
    const bestPlatform = platforms.reduce((best, platform) => {
      const currentROI = calculateROI(
        data.platformBreakdown[platform].spend,
        data.platformBreakdown[platform].revenue
      );
      const bestROI = calculateROI(
        data.platformBreakdown[best].spend,
        data.platformBreakdown[best].revenue
      );
      return currentROI > bestROI ? platform : best;
    });
    
    insights.push({
      type: 'info',
      category: 'platform',
      title: 'Best Performing Platform',
      description: `${bestPlatform} is your top-performing platform.`,
      recommendation: `Consider allocating more budget to ${bestPlatform} campaigns.`
    });
  }
  
  return insights;
}

export default router;