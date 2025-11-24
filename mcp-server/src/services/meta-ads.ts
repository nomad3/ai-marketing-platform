import axios from 'axios';

export class MetaAdsService {
  private accessToken: string;
  private apiVersion = 'v21.0';
  private baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
  }

  async createCampaign(params: {
    name: string;
    objective: string;
    budget: number;
    adAccountId: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${params.adAccountId}/campaigns`,
        {
          name: params.name,
          objective: params.objective.toUpperCase(),
          status: 'PAUSED',
          special_ad_categories: [],
        },
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Meta Ads API error:', error);
      throw error;
    }
  }

  async createAdSet(params: {
    campaignId: string;
    name: string;
    budget: number;
    targeting: any;
    adAccountId: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${params.adAccountId}/adsets`,
        {
          name: params.name,
          campaign_id: params.campaignId,
          daily_budget: params.budget * 100, // Convert to cents
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
          bid_amount: 2,
          targeting: params.targeting,
          status: 'PAUSED',
        },
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Meta Ads API error:', error);
      throw error;
    }
  }

  async getCampaignInsights(campaignId: string, dateRange?: { start: string; end: string }) {
    try {
      const params: any = {
        access_token: this.accessToken,
        fields: 'impressions,clicks,spend,actions,action_values,cpc,cpm,ctr',
      };

      if (dateRange) {
        params.time_range = JSON.stringify({
          since: dateRange.start,
          until: dateRange.end,
        });
      }

      const response = await axios.get(
        `${this.baseUrl}/${campaignId}/insights`,
        { params }
      );

      return response.data.data[0] || {};
    } catch (error) {
      console.error('Meta Ads API error:', error);
      throw error;
    }
  }
}
