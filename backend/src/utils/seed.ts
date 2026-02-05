import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/marketing_platform',
});

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create demo user
    await createDemoUser();
    
    // Create campaigns
    const campaigns = await createCampaigns();
    
    // Seed metrics for campaigns
    await seedCampaignMetrics(campaigns);
    
    // Seed ad creatives
    await seedAdCreatives(campaigns);
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await pool.end();
  }
}

async function createDemoUser() {
  console.log('Creating demo user...');
  
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const query = `
    INSERT INTO users (email, password_hash, name, company, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;
  
  await pool.query(query, [
    'demo@ai.com',
    hashedPassword,
    'Demo User',
    'AI Marketing Co',
    'admin'
  ]);
  
  console.log('✓ Demo user created');
}

async function createCampaigns(): Promise<string[]> {
  console.log('Creating demo campaigns...');
  
  const campaigns = [
    {
      id: 'camp_meta_ecommerce_2024',
      name: 'E-commerce Holiday Sales - Meta',
      platform: 'meta',
      objective: 'conversions',
      budget: 5000,
      daily_budget: 167,
      targeting: {
        ageRange: [25, 45],
        interests: ['online shopping', 'fashion', 'technology'],
        locations: ['United States', 'Canada'],
        placements: ['feed', 'stories', 'reels']
      },
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-03-01')
    },
    {
      id: 'camp_google_b2b_leads_2024',
      name: 'B2B Lead Generation - Google Ads',
      platform: 'google',
      objective: 'leads',
      budget: 8000,
      daily_budget: 267,
      targeting: {
        keywords: ['marketing software', 'crm solutions', 'business automation'],
        locations: ['United States', 'United Kingdom'],
        networks: ['search', 'display']
      },
      status: 'active',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-03-15')
    },
    {
      id: 'camp_tiktok_gen_z_awareness',
      name: 'Brand Awareness - TikTok Gen Z',
      platform: 'tiktok',
      objective: 'awareness',
      budget: 3000,
      daily_budget: 100,
      targeting: {
        ageRange: [18, 28],
        interests: ['music', 'entertainment', 'lifestyle'],
        locations: ['United States', 'Canada', 'Australia']
      },
      status: 'active',
      start_date: new Date('2024-02-10'),
      end_date: new Date('2024-03-10')
    },
    {
      id: 'camp_linkedin_professional_services',
      name: 'Professional Services - LinkedIn',
      platform: 'linkedin',
      objective: 'leads',
      budget: 6000,
      daily_budget: 200,
      targeting: {
        jobTitles: ['Marketing Manager', 'CMO', 'VP Marketing'],
        industries: ['Software', 'Technology', 'Professional Services'],
        companySizes: ['51-200', '201-500', '501-1000']
      },
      status: 'active',
      start_date: new Date('2024-01-20'),
      end_date: new Date('2024-03-20')
    },
    {
      id: 'camp_meta_retargeting_q1',
      name: 'Q1 Retargeting Campaign - Meta',
      platform: 'meta',
      objective: 'conversions',
      budget: 4000,
      daily_budget: 133,
      targeting: {
        customAudiences: ['website visitors', 'previous customers'],
        ageRange: [22, 55],
        placements: ['feed', 'stories']
      },
      status: 'paused',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-02-29')
    },
    {
      id: 'camp_google_local_business',
      name: 'Local Business Promotion - Google',
      platform: 'google',
      objective: 'traffic',
      budget: 2500,
      daily_budget: 83,
      targeting: {
        locations: ['San Francisco', 'Los Angeles', 'San Diego'],
        radius: '25 miles',
        keywords: ['local services', 'near me', 'best in area']
      },
      status: 'draft',
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-04-01')
    }
  ];
  
  const campaignIds: string[] = [];
  
  for (const campaign of campaigns) {
    const query = `
      INSERT INTO campaigns (
        id, user_id, name, platform, objective, budget, daily_budget, 
        targeting, status, start_date, end_date, created_at
      )
      VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(query, [
      campaign.id,
      campaign.name,
      campaign.platform,
      campaign.objective,
      campaign.budget,
      campaign.daily_budget,
      JSON.stringify(campaign.targeting),
      campaign.status,
      campaign.start_date,
      campaign.end_date
    ]);
    
    campaignIds.push(campaign.id);
  }
  
  console.log(`✓ Created ${campaigns.length} campaigns`);
  return campaignIds;
}

async function seedCampaignMetrics(campaignIds: string[]) {
  console.log('Seeding campaign metrics for 30 days...');
  
  const platformMetrics = {
    meta: { baseCTR: 2.8, baseCPC: 1.25, baseCPM: 15, baseConversionRate: 4.2 },
    google: { baseCTR: 3.5, baseCPC: 2.15, baseCPM: 25, baseConversionRate: 5.8 },
    tiktok: { baseCTR: 4.2, baseCPC: 0.95, baseCPM: 8, baseConversionRate: 3.1 },
    linkedin: { baseCTR: 2.1, baseCPC: 4.85, baseCPM: 35, baseConversionRate: 8.5 }
  };
  
  for (const campaignId of campaignIds) {
    // Get campaign details
    const campaignResult = await pool.query('SELECT platform, budget, daily_budget, objective FROM campaigns WHERE id = $1', [campaignId]);
    const campaign = campaignResult.rows[0];
    
    if (!campaign) continue;
    
    const platformData = platformMetrics[campaign.platform] || platformMetrics.meta;
    
    // Generate 30 days of metrics
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Skip future dates for draft campaigns
      if (campaign.objective === 'draft' && date > new Date()) continue;
      
      // Generate realistic daily metrics with some variation
      const variation = 0.8 + (Math.random() * 0.4); // 80-120% variation
      const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.85 : 1.0; // Lower performance on weekends
      
      const dailySpend = Math.round(campaign.daily_budget * variation * weekendMultiplier);
      const impressions = Math.round((dailySpend / platformData.baseCPM) * 1000 * (0.9 + Math.random() * 0.2));
      const clicks = Math.round(impressions * (platformData.baseCTR / 100) * (0.85 + Math.random() * 0.3));
      const conversions = Math.round(clicks * (platformData.baseConversionRate / 100) * (0.8 + Math.random() * 0.4));
      
      // Calculate derived metrics
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? dailySpend / clicks : 0;
      const cpm = impressions > 0 ? (dailySpend / impressions) * 1000 : 0;
      
      // Revenue calculation based on objective
      let revenue = 0;
      if (campaign.objective === 'conversions') {
        // E-commerce: $50-200 average order value
        revenue = conversions * (50 + Math.random() * 150);
      } else if (campaign.objective === 'leads') {
        // Lead value: $30-100 per lead
        revenue = conversions * (30 + Math.random() * 70);
      } else if (campaign.objective === 'traffic') {
        // Page views to sales conversion: 1-3%
        revenue = clicks * 0.02 * (20 + Math.random() * 80);
      } else {
        // Awareness campaigns: minimal direct revenue
        revenue = conversions * (10 + Math.random() * 20);
      }
      
      const roi = dailySpend > 0 ? ((revenue - dailySpend) / dailySpend) * 100 : 0;
      const roas = dailySpend > 0 ? revenue / dailySpend : 0;
      
      const query = `
        INSERT INTO campaign_metrics (
          campaign_id, date, impressions, clicks, conversions, spend, revenue,
          ctr, cpc, cpm, roi, roas
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (campaign_id, date) DO NOTHING
      `;
      
      await pool.query(query, [
        campaignId,
        date.toISOString().split('T')[0],
        impressions,
        clicks,
        conversions,
        dailySpend,
        Math.round(revenue),
        Math.round(ctr * 100) / 100,
        Math.round(cpc * 100) / 100,
        Math.round(cpm * 100) / 100,
        Math.round(roi * 100) / 100,
        Math.round(roas * 100) / 100
      ]);
    }
  }
  
  console.log('✓ Seeded 30 days of metrics for all campaigns');
}

async function seedAdCreatives(campaignIds: string[]) {
  console.log('Creating ad creatives...');
  
  const creatives = [
    {
      campaign_id: 'camp_meta_ecommerce_2024',
      type: 'image',
      headline: 'Holiday Sale - Up to 50% Off!',
      body: 'Shop now and save big on our bestselling products. Limited time offer!',
      cta: 'Shop Now',
      generated_by_ai: true
    },
    {
      campaign_id: 'camp_meta_ecommerce_2024',
      type: 'video',
      headline: 'Product Showcase Video',
      body: 'See our products in action. Quality you can trust.',
      cta: 'Learn More',
      generated_by_ai: true
    },
    {
      campaign_id: 'camp_google_b2b_leads_2024',
      type: 'copy',
      headline: 'Boost Your Sales with Our CRM',
      body: 'Increase productivity by 40% with our all-in-one marketing platform.',
      cta: 'Get Free Demo',
      generated_by_ai: false
    },
    {
      campaign_id: 'camp_tiktok_gen_z_awareness',
      type: 'video',
      headline: 'Trending Now! #BrandChallenge',
      body: 'Join the movement and show us your style!',
      cta: 'Join Challenge',
      generated_by_ai: true
    },
    {
      campaign_id: 'camp_linkedin_professional_services',
      type: 'image',
      headline: 'Transform Your Marketing Strategy',
      body: 'Join 10,000+ marketing professionals who trust our solutions.',
      cta: 'Download Whitepaper',
      generated_by_ai: false
    }
  ];
  
  for (const creative of creatives) {
    const query = `
      INSERT INTO ad_creatives (
        campaign_id, type, headline, body, cta, generated_by_ai
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await pool.query(query, [
      creative.campaign_id,
      creative.type,
      creative.headline,
      creative.body,
      creative.cta,
      creative.generated_by_ai
    ]);
  }
  
  console.log(`✓ Created ${creatives.length} ad creatives`);
}

// Run the seed function immediately
seed();

export default seed;