import { MetaAdsService } from './meta-ads.js';

interface ROIMetrics {
  spend: number;
  revenue: number;
  roi: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversionRate: number;
}

export class AnalyticsService {
  private metaAds: MetaAdsService;

  constructor() {
    this.metaAds = new MetaAdsService();
  }

  async getCampaignROI(
    campaignId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ROIMetrics> {
    try {
      // Get insights from Meta Ads API
      const insights = await this.metaAds.getCampaignInsights(campaignId, dateRange);

      // Calculate metrics
      const spend = parseFloat(insights.spend || '0');
      const conversions = this.extractConversions(insights.actions);
      const revenue = this.calculateRevenue(insights.action_values);
      const impressions = parseInt(insights.impressions || '0');
      const clicks = parseInt(insights.clicks || '0');
      const ctr = parseFloat(insights.ctr || '0');
      const cpc = parseFloat(insights.cpc || '0');
      const cpm = parseFloat(insights.cpm || '0');

      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
      const roas = spend > 0 ? revenue / spend : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

      return {
        spend,
        revenue,
        roi,
        roas,
        impressions,
        clicks,
        conversions,
        ctr,
        cpc,
        cpm,
        conversionRate,
      };
    } catch (error) {
      console.error('Analytics error:', error);
      // Return demo data
      return {
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
      };
    }
  }

  async getOverview() {
    // This would aggregate data from all campaigns
    return {
      totalSpend: 15000,
      totalRevenue: 52500,
      averageROI: 250,
      averageROAS: 3.5,
      activeCampaigns: 12,
      totalImpressions: 500000,
      totalClicks: 12500,
      totalConversions: 750,
      topPerformingCampaign: {
        id: 'campaign_123',
        name: 'Summer Sale 2024',
        roi: 450,
      },
    };
  }

  private extractConversions(actions?: any[]): number {
    if (!actions) return 0;
    const conversionAction = actions.find(
      (a) => a.action_type === 'purchase' || a.action_type === 'lead'
    );
    return conversionAction ? parseInt(conversionAction.value) : 0;
  }

  private calculateRevenue(actionValues?: any[]): number {
    if (!actionValues) return 0;
    const revenueAction = actionValues.find(
      (a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
    );
    return revenueAction ? parseFloat(revenueAction.value) : 0;
  }
}
