import { Router } from 'express';
import { getCampaigns, getCampaignById } from '../utils/storage.js';
import { getCampaignMetrics, getAggregateMetrics, getPerformanceOverTime, getPlatformPerformance } from '../utils/metrics.js';

const router = Router();

// Get campaign analytics with detailed metrics
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const campaign = await getCampaignById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get detailed metrics for this campaign
    const metrics = await getCampaignMetrics(id, parseInt(days as string));
    
    // Calculate aggregated metrics
    const totals = metrics.reduce((acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      conversions: acc.conversions + day.conversions,
      spend: acc.spend + day.spend,
      revenue: acc.revenue + day.revenue
    }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });

    // Calculate derived metrics
    const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
    const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;

    res.json({
      campaignId: id,
      campaignName: campaign.name,
      platform: campaign.platform,
      dateRange: `${days} days`,
      metrics: {
        spend: totals.spend,
        revenue: totals.revenue,
        roi: Math.round(roi * 100) / 100,
        roas: Math.round(roas * 100) / 100,
        impressions: totals.impressions,
        clicks: totals.clicks,
        conversions: totals.conversions,
        ctr: Math.round(ctr * 100) / 100,
        cpc: Math.round(cpc * 100) / 100,
        cpm: Math.round(cpm * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      dailyMetrics: metrics
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

// Get overview analytics
router.get('/overview', async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range as string);
    
    // TODO: Get user ID from JWT when auth is implemented
    const userId = req.user?.id;
    
    // Get aggregate metrics from database
    const aggregateMetrics = await getAggregateMetrics(userId, days);
    const campaigns = await getCampaigns(userId);
    
    // Get active campaigns count
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    
    // Calculate derived metrics
    const cpm = aggregateMetrics.totalImpressions > 0
      ? (aggregateMetrics.totalSpend / aggregateMetrics.totalImpressions) * 1000
      : 0;
    
    const costPerConversion = aggregateMetrics.totalConversions > 0
      ? aggregateMetrics.totalSpend / aggregateMetrics.totalConversions
      : 0;

    res.json({
      totalSpend: aggregateMetrics.totalSpend,
      totalRevenue: aggregateMetrics.totalRevenue,
      averageROI: aggregateMetrics.averageROI,
      averageROAS: aggregateMetrics.averageROAS,
      activeCampaigns,
      totalImpressions: aggregateMetrics.totalImpressions,
      totalClicks: aggregateMetrics.totalClicks,
      totalConversions: aggregateMetrics.totalConversions,
      ctr: aggregateMetrics.averageCTR,
      conversionRate: aggregateMetrics.totalClicks > 0 
        ? Math.round((aggregateMetrics.totalConversions / aggregateMetrics.totalClicks) * 100 * 100) / 100
        : 0,
      costPerClick: aggregateMetrics.averageCPC,
      costPerConversion: Math.round(costPerConversion * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      dateRange: `${days} days`
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// Get all campaigns performance
router.get('/campaigns', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // TODO: Get user ID from JWT when auth is implemented
    const userId = req.user?.id;
    
    const campaigns = await getCampaigns(userId);

    const campaignsData = campaigns.map((campaign: any) => {
      const metrics = campaign.metrics || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
        roi: 0
      };

      return {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        budget: campaign.budget,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        spend: metrics.spend,
        revenue: metrics.revenue,
        roi: metrics.roi,
        ctr: metrics.ctr,
        createdAt: campaign.created_at
      };
    });

    res.json({ campaigns: campaignsData });
  } catch (error) {
    console.error('Campaigns analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns analytics' });
  }
});

// Get performance over time
router.get('/performance-over-time', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // TODO: Get user ID from JWT when auth is implemented
    const userId = req.user?.id;
    
    const performanceData = await getPerformanceOverTime(userId, parseInt(days as string));
    
    res.json({
      performanceData,
      dateRange: `${days} days`
    });
  } catch (error) {
    console.error('Performance over time error:', error);
    res.status(500).json({ error: 'Failed to fetch performance over time' });
  }
});

// Get platform performance comparison
router.get('/platform-performance', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // TODO: Get user ID from JWT when auth is implemented
    const userId = req.user?.id;
    
    const platformData = await getPlatformPerformance(userId, parseInt(days as string));
    
    res.json({
      platformData,
      dateRange: `${days} days`
    });
  } catch (error) {
    console.error('Platform performance error:', error);
    res.status(500).json({ error: 'Failed to fetch platform performance' });
  }
});

// Get campaign comparison
router.get('/compare', async (req, res) => {
  try {
    const { campaignIds, days = 30 } = req.query;
    
    if (!campaignIds) {
      return res.status(400).json({ error: 'Campaign IDs are required' });
    }
    
    const ids = (campaignIds as string).split(',');
    const campaigns = [];
    
    for (const id of ids) {
      const campaign = await getCampaignById(id.trim());
      if (campaign) {
        const metrics = await getCampaignMetrics(id.trim(), parseInt(days as string));
        
        // Calculate aggregated metrics
        const totals = metrics.reduce((acc, day) => ({
          impressions: acc.impressions + day.impressions,
          clicks: acc.clicks + day.clicks,
          conversions: acc.conversions + day.conversions,
          spend: acc.spend + day.spend,
          revenue: acc.revenue + day.revenue
        }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });
        
        campaigns.push({
          id: campaign.id,
          name: campaign.name,
          platform: campaign.platform,
          metrics: totals,
          roi: totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0,
          roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
          ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
          conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
        });
      }
    }
    
    res.json({
      campaigns,
      dateRange: `${days} days`
    });
  } catch (error) {
    console.error('Campaign comparison error:', error);
    res.status(500).json({ error: 'Failed to compare campaigns' });
  }
});

export default router;