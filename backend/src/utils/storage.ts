import { query } from '../db.js';

export interface Campaign {
  id: string;
  user_id?: number;
  name: string;
  platform: string;
  objective: string;
  budget: number;
  daily_budget?: number;
  target_audience?: any;
  targeting?: any;
  status: 'active' | 'paused' | 'draft' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
  // Computed metrics from database
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr?: number;
    cpc?: number;
    cpm?: number;
    roi?: number;
    roas?: number;
  };
}

export async function getCampaigns(userId?: number): Promise<Campaign[]> {
  try {
    let queryText = `
      SELECT c.*, 
             COALESCE(SUM(cm.impressions), 0) as total_impressions,
             COALESCE(SUM(cm.clicks), 0) as total_clicks,
             COALESCE(SUM(cm.conversions), 0) as total_conversions,
             COALESCE(SUM(cm.spend), 0) as total_spend,
             COALESCE(SUM(cm.revenue), 0) as total_revenue,
             CASE WHEN SUM(cm.impressions) > 0 
                  THEN ROUND((SUM(cm.clicks)::numeric / SUM(cm.impressions)) * 100, 2)
                  ELSE 0 END as ctr,
             CASE WHEN SUM(cm.clicks) > 0 
                  THEN ROUND(SUM(cm.spend) / SUM(cm.clicks), 2)
                  ELSE 0 END as cpc,
             CASE WHEN SUM(cm.spend) > 0 
                  THEN ROUND((SUM(cm.revenue) - SUM(cm.spend)) / SUM(cm.spend) * 100, 2)
                  ELSE 0 END as roi
      FROM campaigns c
      LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id
    `;
    const params = [];
    
    if (userId) {
      queryText += ' WHERE c.user_id = $1';
      params.push(userId);
    }
    
    queryText += ' GROUP BY c.id ORDER BY c.created_at DESC';
    
    const result = await query(queryText, params);
    
    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      platform: row.platform,
      objective: row.objective,
      budget: parseFloat(row.budget),
      daily_budget: row.daily_budget ? parseFloat(row.daily_budget) : undefined,
      targeting: row.targeting,
      status: row.status,
      start_date: row.start_date?.toISOString(),
      end_date: row.end_date?.toISOString(),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at?.toISOString(),
      metrics: {
        impressions: parseInt(row.total_impressions) || 0,
        clicks: parseInt(row.total_clicks) || 0,
        conversions: parseInt(row.total_conversions) || 0,
        spend: parseFloat(row.total_spend) || 0,
        revenue: parseFloat(row.total_revenue) || 0,
        ctr: parseFloat(row.ctr) || 0,
        cpc: parseFloat(row.cpc) || 0,
        roi: parseFloat(row.roi) || 0,
      }
    }));
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  try {
    const queryText = `
      INSERT INTO campaigns (id, user_id, name, platform, objective, budget, daily_budget, targeting, status, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    
    await query(queryText, [
      campaign.id,
      campaign.user_id || 1, // Default to user 1 for demo
      campaign.name,
      campaign.platform,
      campaign.objective,
      campaign.budget,
      campaign.daily_budget || null,
      campaign.targeting || null,
      campaign.status,
      campaign.start_date || null,
      campaign.end_date || null
    ]);
  } catch (error) {
    console.error('Error saving campaign:', error);
    throw error;
  }
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
  try {
    // Build dynamic update query
    const updateFields = [];
    const params = [];
    let paramIndex = 1;
    
    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }
    if (updates.platform !== undefined) {
      updateFields.push(`platform = $${paramIndex++}`);
      params.push(updates.platform);
    }
    if (updates.objective !== undefined) {
      updateFields.push(`objective = $${paramIndex++}`);
      params.push(updates.objective);
    }
    if (updates.budget !== undefined) {
      updateFields.push(`budget = $${paramIndex++}`);
      params.push(updates.budget);
    }
    if (updates.daily_budget !== undefined) {
      updateFields.push(`daily_budget = $${paramIndex++}`);
      params.push(updates.daily_budget);
    }
    if (updates.targeting !== undefined) {
      updateFields.push(`targeting = $${paramIndex++}`);
      params.push(updates.targeting);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }
    if (updates.start_date !== undefined) {
      updateFields.push(`start_date = $${paramIndex++}`);
      params.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      updateFields.push(`end_date = $${paramIndex++}`);
      params.push(updates.end_date);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    
    const queryText = `
      UPDATE campaigns 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await query(queryText, params);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      platform: row.platform,
      objective: row.objective,
      budget: parseFloat(row.budget),
      daily_budget: row.daily_budget ? parseFloat(row.daily_budget) : undefined,
      targeting: row.targeting,
      status: row.status,
      start_date: row.start_date?.toISOString(),
      end_date: row.end_date?.toISOString(),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at?.toISOString()
    };
  } catch (error) {
    console.error('Error updating campaign:', error);
    return null;
  }
}

export async function deleteCampaign(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM campaigns WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return false;
  }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    const campaigns = await getCampaigns();
    return campaigns.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Error fetching campaign by id:', error);
    return null;
  }
}