import OpenAI from 'openai';
import { query } from '../db.js';
import { scoreProspect } from './signal-scorer.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DiscoveryCriteria {
  industry: string;
  revenue_min?: number;
  revenue_max?: number;
  geography?: string;
  ownership_type?: string;
  max_results?: number;
  additional_criteria?: string;
}

interface DiscoveredProspect {
  company_name: string;
  industry: string;
  sub_industry?: string;
  website?: string;
  location_city?: string;
  location_state?: string;
  estimated_revenue_min?: number;
  estimated_revenue_max?: number;
  employee_count_range?: string;
  year_founded?: number;
  owner_name?: string;
  owner_title?: string;
  owner_estimated_age?: number;
  ownership_type?: string;
  key_signals: string[];
  estimated_score?: number;
}

/**
 * Discover potential acquisition targets using AI.
 * Returns prospect objects that can be saved to the pipeline.
 */
export async function discoverProspects(criteria: DiscoveryCriteria): Promise<DiscoveredProspect[]> {
  const maxResults = Math.min(criteria.max_results || 10, 20);
  const prompt = buildDiscoveryPrompt(criteria, maxResults);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a deal sourcing specialist at Hexagon Capital Alliance, a leading middle-market investment bank with 300+ completed transactions. You identify potential sell-side advisory targets - companies whose owners may be ready to sell.

Your focus areas:
- Industries: Consumer, Healthcare, Industrial, Business Services
- Company size: $10M-$200M revenue, founder-owned or family-owned
- Geography: Primarily US, especially West Coast

Generate realistic company profiles based on the given criteria. Each company should feel like a real middle-market business with plausible details. Return structured JSON only.`
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  const prospects: DiscoveredProspect[] = (result.companies || []).map((c: any) => ({
    company_name: c.company_name || c.name,
    industry: c.industry || criteria.industry,
    sub_industry: c.sub_industry || null,
    website: c.website || null,
    location_city: c.city || c.location_city || null,
    location_state: c.state || c.location_state || null,
    estimated_revenue_min: c.revenue_min || c.estimated_revenue_min || null,
    estimated_revenue_max: c.revenue_max || c.estimated_revenue_max || null,
    employee_count_range: c.employees || c.employee_count_range || null,
    year_founded: c.year_founded || c.founded || null,
    owner_name: c.owner_name || c.ceo || null,
    owner_title: c.owner_title || 'CEO & Founder',
    owner_estimated_age: c.owner_age || c.owner_estimated_age || null,
    ownership_type: c.ownership_type || 'founder',
    key_signals: c.key_signals || c.signals || [],
    estimated_score: c.estimated_score || null,
  }));

  return prospects;
}

/**
 * Save discovered prospects to the database and score them.
 */
export async function saveDiscoveredProspects(
  prospects: DiscoveredProspect[],
  userId: number
): Promise<any[]> {
  const savedProspects = [];

  for (const prospect of prospects) {
    const result = await query(`
      INSERT INTO prospects (
        user_id, company_name, industry, sub_industry, website,
        location_city, location_state, location_country,
        estimated_revenue_min, estimated_revenue_max, employee_count_range, year_founded,
        owner_name, owner_title, owner_estimated_age, ownership_type,
        stage, source
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'US',$8,$9,$10,$11,$12,$13,$14,$15,'lead','ai_discovery')
      RETURNING *
    `, [
      userId, prospect.company_name, prospect.industry, prospect.sub_industry, prospect.website,
      prospect.location_city, prospect.location_state,
      prospect.estimated_revenue_min, prospect.estimated_revenue_max, prospect.employee_count_range, prospect.year_founded,
      prospect.owner_name, prospect.owner_title, prospect.owner_estimated_age, prospect.ownership_type,
    ]);

    const saved = result.rows[0];

    // Log activity
    await query(`
      INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title)
      VALUES ($1, $2, 'created', 'Discovered via AI prospect search')
    `, [saved.id, userId]);

    // Score the prospect
    try {
      await scoreProspect(saved.id);
    } catch (err) {
      console.error(`Failed to score discovered prospect ${saved.id}:`, err);
    }

    // Reload with score
    const reloaded = await query(`SELECT * FROM prospects WHERE id = $1`, [saved.id]);
    savedProspects.push(reloaded.rows[0]);
  }

  return savedProspects;
}

function buildDiscoveryPrompt(criteria: DiscoveryCriteria, maxResults: number): string {
  const revMin = criteria.revenue_min ? `$${(criteria.revenue_min / 1_000_000).toFixed(0)}M` : '$10M';
  const revMax = criteria.revenue_max ? `$${(criteria.revenue_max / 1_000_000).toFixed(0)}M` : '$200M';

  return `Find ${maxResults} middle-market companies that could be potential sell-side advisory targets for Hexagon Capital Alliance. Return JSON with format:

{
  "companies": [
    {
      "company_name": "company name",
      "industry": "${criteria.industry}",
      "sub_industry": "specific sub-sector",
      "website": "company website URL",
      "city": "city",
      "state": "state abbreviation",
      "revenue_min": estimated minimum annual revenue in dollars,
      "revenue_max": estimated maximum annual revenue in dollars,
      "employees": "employee range like 50-200",
      "year_founded": founding year,
      "owner_name": "founder/CEO name",
      "owner_title": "their title",
      "owner_age": estimated age,
      "ownership_type": "founder or family",
      "key_signals": ["signal 1", "signal 2", "signal 3"],
      "estimated_score": estimated sell-likelihood 0-100
    }
  ]
}

Search Criteria:
- Industry: ${criteria.industry}
- Revenue Range: ${revMin} to ${revMax}
- Geography: ${criteria.geography || 'United States'}
- Ownership Type: ${criteria.ownership_type || 'founder-owned or family-owned'}
${criteria.additional_criteria ? `- Additional: ${criteria.additional_criteria}` : ''}

Requirements:
- Companies should be realistic middle-market businesses
- Include a mix of sell-likelihood scores (some hot, some warm, some cold)
- Focus on founder-owned businesses where the owner is 50+ years old
- Include companies showing classic sell signals (owner aging, industry consolidation, revenue plateau, etc.)
- Each company should have 2-4 key signals explaining why they might sell
- Prioritize companies in the ${revMin}-${revMax} revenue sweet spot`;
}
