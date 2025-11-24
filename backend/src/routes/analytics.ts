import { Router } from 'express';
import { Campaign, getCampaigns } from '../utils/storage.js';

const router = Router();

// Get campaign analytics
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement analytics via MCP server
    res.json({
      campaignId: id,
      metrics: {
        spend: 1000,
        revenue: 3500,
        roi: 250,
        roas: 3.5,
        impressions: 50000,
        clicks: 1250,
        conversions: 75,
        ctr: 2.5,
        cpc: 0.8,
        cpm: 20,
        conversionRate: 6,
      },
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

// Get overview analytics
router.get('/overview', async (req, res) => {
  try {
    const { range } = req.query;
    const campaigns = await getCampaigns();

    // Calculate totals from all campaigns
    const totals = campaigns.reduce((acc: any, campaign: Campaign) => {
      const metrics = campaign.metrics || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0
      };

      return {
        spend: acc.spend + metrics.spend,
        revenue: acc.revenue + metrics.revenue,
        impressions: acc.impressions + metrics.impressions,
        clicks: acc.clicks + metrics.clicks,
        conversions: acc.conversions + metrics.conversions,
      };
    }, {
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0
    });

    // Apply time range multiplier (simulation)
    const multiplier = range === '7d' ? 0.25 : range === '90d' ? 3 : range === '1y' ? 12 : 1;

    const adjustedTotals = {
      spend: Math.round(totals.spend * multiplier),
      revenue: Math.round(totals.revenue * multiplier),
      impressions: Math.round(totals.impressions * multiplier),
      clicks: Math.round(totals.clicks * multiplier),
      conversions: Math.round(totals.conversions * multiplier),
    };

    // Calculate derived metrics
    const roi = adjustedTotals.spend > 0
      ? ((adjustedTotals.revenue - adjustedTotals.spend) / adjustedTotals.spend) * 100
      : 0;

    const roas = adjustedTotals.spend > 0
      ? adjustedTotals.revenue / adjustedTotals.spend
      : 0;

    const ctr = adjustedTotals.impressions > 0
      ? (adjustedTotals.clicks / adjustedTotals.impressions) * 100
      : 0;

    const conversionRate = adjustedTotals.clicks > 0
      ? (adjustedTotals.conversions / adjustedTotals.clicks) * 100
      : 0;

    const cpc = adjustedTotals.clicks > 0
      ? adjustedTotals.spend / adjustedTotals.clicks
      : 0;

    const cpa = adjustedTotals.conversions > 0
      ? adjustedTotals.spend / adjustedTotals.conversions
      : 0;

    res.json({
      totalSpend: adjustedTotals.spend,
      totalRevenue: adjustedTotals.revenue,
      averageROI: Math.round(roi),
      averageROAS: Number(roas.toFixed(2)),
      activeCampaigns: campaigns.filter((c: Campaign) => c.status === 'active').length,
      totalImpressions: adjustedTotals.impressions,
      totalClicks: adjustedTotals.clicks,
      totalConversions: adjustedTotals.conversions,
      ctr: Number(ctr.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(2)),
      costPerClick: Number(cpc.toFixed(2)),
      costPerConversion: Number(cpa.toFixed(2)),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// Get all campaigns performance
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await getCampaigns();

    const campaignsData = campaigns.map((campaign: Campaign) => {
      const metrics = campaign.metrics || {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0
      };

      const roi = metrics.spend > 0
        ? ((metrics.revenue - metrics.spend) / metrics.spend) * 100
        : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        spend: metrics.spend,
        revenue: metrics.revenue,
        roi: Math.round(roi),
      };
    });

    res.json({ campaigns: campaignsData });
  } catch (error) {
    console.error('Campaigns analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns analytics' });
  }
});

export default router;
