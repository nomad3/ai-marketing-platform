import { query } from '../db.js';

export interface CampaignMetrics {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roi: number;
  roas: number;
}

export interface AggregateMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPC: number;
  averageROI: number;
  averageROAS: number;
}

export async function getCampaignMetrics(campaignId: string, days = 30): Promise<CampaignMetrics[]> {
  try {
    const queryText = `
      SELECT 
        date,
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
        ctr,
        cpc,
        cpm,
        roi,
        roas
      FROM campaign_metrics 
      WHERE campaign_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `;
    
    const result = await query(queryText, [campaignId]);
    
    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      impressions: parseInt(row.impressions) || 0,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
      ctr: parseFloat(row.ctr) || 0,
      cpc: parseFloat(row.cpc) || 0,
      cpm: parseFloat(row.cpm) || 0,
      roi: parseFloat(row.roi) || 0,
      roas: parseFloat(row.roas) || 0,
    }));
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    return [];
  }
}

export async function getAggregateMetrics(userId?: number, days = 30): Promise<AggregateMetrics> {
  try {
    let queryText = `
      SELECT 
        COALESCE(SUM(cm.spend), 0) as total_spend,
        COALESCE(SUM(cm.revenue), 0) as total_revenue,
        COALESCE(SUM(cm.impressions), 0) as total_impressions,
        COALESCE(SUM(cm.clicks), 0) as total_clicks,
        COALESCE(SUM(cm.conversions), 0) as total_conversions,
        CASE WHEN SUM(cm.impressions) > 0 
             THEN ROUND((SUM(cm.clicks)::numeric / SUM(cm.impressions)) * 100, 2)
             ELSE 0 END as average_ctr,
        CASE WHEN SUM(cm.clicks) > 0 
             THEN ROUND(SUM(cm.spend) / SUM(cm.clicks), 2)
             ELSE 0 END as average_cpc,
        CASE WHEN SUM(cm.spend) > 0 
             THEN ROUND((SUM(cm.revenue) - SUM(cm.spend)) / SUM(cm.spend) * 100, 2)
             ELSE 0 END as average_roi,
        CASE WHEN SUM(cm.spend) > 0 
             THEN ROUND(SUM(cm.revenue) / SUM(cm.spend), 2)
             ELSE 0 END as average_roas
      FROM campaign_metrics cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE cm.date >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    
    const params = [];
    if (userId) {
      queryText += ' AND c.user_id = $1';
      params.push(userId);
    }
    
    const result = await query(queryText, params);
    
    if (result.rows.length === 0) {
      return {
        totalSpend: 0,
        totalRevenue: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageCTR: 0,
        averageCPC: 0,
        averageROI: 0,
        averageROAS: 0,
      };
    }
    
    const row = result.rows[0];
    
    return {
      totalSpend: parseFloat(row.total_spend) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      totalImpressions: parseInt(row.total_impressions) || 0,
      totalClicks: parseInt(row.total_clicks) || 0,
      totalConversions: parseInt(row.total_conversions) || 0,
      averageCTR: parseFloat(row.average_ctr) || 0,
      averageCPC: parseFloat(row.average_cpc) || 0,
      averageROI: parseFloat(row.average_roi) || 0,
      averageROAS: parseFloat(row.average_roas) || 0,
    };
  } catch (error) {
    console.error('Error fetching aggregate metrics:', error);
    return {
      totalSpend: 0,
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      averageCTR: 0,
      averageCPC: 0,
      averageROI: 0,
      averageROAS: 0,
    };
  }
}

export async function addCampaignMetric(
  campaignId: string,
  date: string,
  metrics: Partial<CampaignMetrics>
): Promise<boolean> {
  try {
    const queryText = `
      INSERT INTO campaign_metrics (
        campaign_id, date, impressions, clicks, conversions, 
        spend, revenue, ctr, cpc, cpm, roi, roas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (campaign_id, date) 
      DO UPDATE SET
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        conversions = EXCLUDED.conversions,
        spend = EXCLUDED.spend,
        revenue = EXCLUDED.revenue,
        ctr = EXCLUDED.ctr,
        cpc = EXCLUDED.cpc,
        cpm = EXCLUDED.cpm,
        roi = EXCLUDED.roi,
        roas = EXCLUDED.roas
    `;
    
    await query(queryText, [
      campaignId,
      date,
      metrics.impressions || 0,
      metrics.clicks || 0,
      metrics.conversions || 0,
      metrics.spend || 0,
      metrics.revenue || 0,
      metrics.ctr || 0,
      metrics.cpc || 0,
      metrics.cpm || 0,
      metrics.roi || 0,
      metrics.roas || 0,
    ]);
    
    return true;
  } catch (error) {
    console.error('Error adding campaign metric:', error);
    return false;
  }
}

export async function getPerformanceOverTime(userId?: number, days = 30): Promise<any[]> {
  try {
    let queryText = `
      SELECT 
        cm.date,
        SUM(cm.impressions) as impressions,
        SUM(cm.clicks) as clicks,
        SUM(cm.conversions) as conversions,
        SUM(cm.spend) as spend,
        SUM(cm.revenue) as revenue
      FROM campaign_metrics cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE cm.date >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    
    const params = [];
    if (userId) {
      queryText += ' AND c.user_id = $1';
      params.push(userId);
    }
    
    queryText += ' GROUP BY cm.date ORDER BY cm.date ASC';
    
    const result = await query(queryText, params);
    
    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      impressions: parseInt(row.impressions) || 0,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
    }));
  } catch (error) {
    console.error('Error fetching performance over time:', error);
    return [];
  }
}

export async function getPlatformPerformance(userId?: number, days = 30): Promise<any[]> {
  try {
    let queryText = `
      SELECT 
        c.platform,
        SUM(cm.impressions) as impressions,
        SUM(cm.clicks) as clicks,
        SUM(cm.conversions) as conversions,
        SUM(cm.spend) as spend,
        SUM(cm.revenue) as revenue,
        CASE WHEN SUM(cm.impressions) > 0 
             THEN ROUND((SUM(cm.clicks)::numeric / SUM(cm.impressions)) * 100, 2)
             ELSE 0 END as ctr
      FROM campaign_metrics cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE cm.date >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    
    const params = [];
    if (userId) {
      queryText += ' AND c.user_id = $1';
      params.push(userId);
    }
    
    queryText += ' GROUP BY c.platform ORDER BY SUM(cm.spend) DESC';
    
    const result = await query(queryText, params);
    
    return result.rows.map(row => ({
      platform: row.platform,
      impressions: parseInt(row.impressions) || 0,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      spend: parseFloat(row.spend) || 0,
      revenue: parseFloat(row.revenue) || 0,
      ctr: parseFloat(row.ctr) || 0,
    }));
  } catch (error) {
    console.error('Error fetching platform performance:', error);
    return [];
  }
}