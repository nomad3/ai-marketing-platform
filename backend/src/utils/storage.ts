import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  objective: string;
  budget: number;
  dailyBudget?: number;
  targetAudience?: any;
  status: 'active' | 'paused' | 'draft' | 'completed';
  createdAt: string;
  // Simulated performance metrics
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  };
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const data = await fs.readFile(CAMPAIGNS_FILE, 'utf-8');
    return JSON.parse(data).campaigns;
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  const campaigns = await getCampaigns();
  campaigns.unshift(campaign);
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify({ campaigns }, null, 2));
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
  const campaigns = await getCampaigns();
  const index = campaigns.findIndex(c => c.id === id);

  if (index === -1) return null;

  campaigns[index] = { ...campaigns[index], ...updates };
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify({ campaigns }, null, 2));

  return campaigns[index];
}

// Helper to generate realistic mock metrics based on campaign details
export function generateCampaignMetrics(campaign: Campaign) {
  // Base metrics on budget and platform
  const spendRatio = Math.random() * 0.8 + 0.2; // Spent 20-100% of budget
  const spend = Math.round(campaign.budget * spendRatio);

  // CPM varies by platform
  let cpm = 10;
  if (campaign.platform === 'linkedin') cpm = 35;
  if (campaign.platform === 'tiktok') cpm = 5;
  if (campaign.platform === 'google') cpm = 15;

  const impressions = Math.round((spend / cpm) * 1000);

  // CTR varies by platform and objective
  let ctr = 0.015; // 1.5% base
  if (campaign.platform === 'meta') ctr = 0.02;
  if (campaign.platform === 'google') ctr = 0.035;

  const clicks = Math.round(impressions * ctr);

  // Conversion rate
  let cvr = 0.02; // 2% base
  if (campaign.objective === 'leads') cvr = 0.05;
  if (campaign.objective === 'awareness') cvr = 0.001;

  const conversions = Math.round(clicks * cvr);

  // Revenue (ROAS)
  const roas = Math.random() * 3 + 1; // 1x to 4x ROAS
  const revenue = Math.round(spend * roas);

  return {
    impressions,
    clicks,
    conversions,
    spend,
    revenue
  };
}
