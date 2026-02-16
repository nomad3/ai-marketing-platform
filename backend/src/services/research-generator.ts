import OpenAI from 'openai';
import { query } from '../db.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ResearchBrief {
  executive_summary: string;
  company_overview: {
    description: string;
    products_services: string[];
    key_customers: string[];
  };
  financial_indicators: {
    estimated_revenue: string;
    estimated_ebitda_range: string;
    growth_trajectory: string;
  };
  competitive_landscape: Array<{ name: string; comparison: string }>;
  comparable_transactions: Array<{ target: string; acquirer: string; date: string; multiple: string }>;
  key_personnel: Array<{ name: string; title: string; tenure: string }>;
  signals_summary: string;
  suggested_approach: {
    angle: string;
    reasoning: string;
    talking_points: string[];
  };
  sources: Array<{ url: string; title: string; date: string }>;
}

/**
 * Generate an AI research brief for a prospect.
 * Produces a structured analysis suitable for IB deal sourcing.
 */
export async function generateResearchBrief(prospectId: number): Promise<ResearchBrief> {
  // Load prospect data
  const prospectResult = await query(`SELECT * FROM prospects WHERE id = $1`, [prospectId]);
  if (prospectResult.rows.length === 0) {
    throw new Error('Prospect not found');
  }
  const prospect = prospectResult.rows[0];

  // Load signals
  const signalsResult = await query(
    `SELECT * FROM prospect_signals WHERE prospect_id = $1 AND is_active = true ORDER BY signal_strength DESC`,
    [prospectId]
  );

  const prompt = buildResearchPrompt(prospect, signalsResult.rows);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a senior investment banking research analyst at Hexagon Capital Alliance, a leading middle-market investment bank (formerly Moss Adams Capital) with 300+ completed transactions. You prepare target company briefs for sell-side advisory engagements.

Your research briefs are used by managing directors to evaluate potential deal targets and prepare for outreach. Be thorough, factual, and focus on information relevant to M&A advisory.

Industries of focus: Consumer, Healthcare, Industrial, Business Services.
Target companies: Middle-market, founder-owned, $10M-$200M revenue.

Return structured JSON only.`
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 4000,
  });

  const brief: ResearchBrief = JSON.parse(response.choices[0].message.content || '{}');

  // Store research on prospect
  await query(`
    UPDATE prospects SET ai_research = $1, last_researched_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [JSON.stringify(brief), prospectId]);

  // Log activity
  await query(`
    INSERT INTO prospect_activities (prospect_id, activity_type, title, content)
    VALUES ($1, 'research_updated', 'AI research brief generated', $2)
  `, [prospectId, brief.executive_summary]);

  return brief;
}

function buildResearchPrompt(prospect: any, signals: any[]): string {
  const revenueStr = formatRevenue(prospect.estimated_revenue_min, prospect.estimated_revenue_max);

  let prompt = `Generate a comprehensive research brief for the following target company. Return JSON with this exact structure:
{
  "executive_summary": "2-3 sentence overview of the company and its M&A attractiveness",
  "company_overview": {
    "description": "what the company does",
    "products_services": ["list of main products/services"],
    "key_customers": ["likely customer segments"]
  },
  "financial_indicators": {
    "estimated_revenue": "revenue estimate with context",
    "estimated_ebitda_range": "estimated EBITDA margin range for this industry/size",
    "growth_trajectory": "assessment of growth direction"
  },
  "competitive_landscape": [
    { "name": "competitor name", "comparison": "how they compare" }
  ],
  "comparable_transactions": [
    { "target": "company acquired", "acquirer": "buyer", "date": "approximate date", "multiple": "EV/EBITDA or revenue multiple" }
  ],
  "key_personnel": [
    { "name": "person name", "title": "their title", "tenure": "how long at company" }
  ],
  "signals_summary": "summary of sell-likelihood signals",
  "suggested_approach": {
    "angle": "succession_planning OR growth_capital OR strategic_exit",
    "reasoning": "why this approach angle",
    "talking_points": ["specific talking points for outreach"]
  },
  "sources": [
    { "url": "source URL if available", "title": "source description", "date": "date if known" }
  ]
}

Target Company:
- Name: ${prospect.company_name}
- Industry: ${prospect.industry || 'Unknown'}${prospect.sub_industry ? ` / ${prospect.sub_industry}` : ''}
- Location: ${[prospect.location_city, prospect.location_state, prospect.location_country].filter(Boolean).join(', ') || 'Unknown'}
- Website: ${prospect.website || 'Not provided'}
- Year Founded: ${prospect.year_founded || 'Unknown'}
- Revenue: ${revenueStr}
- Employees: ${prospect.employee_count_range || 'Unknown'}
- Ownership: ${prospect.ownership_type || 'Unknown'}

Owner/CEO:
- Name: ${prospect.owner_name || 'Unknown'}
- Title: ${prospect.owner_title || 'Unknown'}
- Estimated Age: ${prospect.owner_estimated_age || 'Unknown'}`;

  if (signals.length > 0) {
    prompt += `\n\nDetected Signals:`;
    for (const s of signals) {
      prompt += `\n- [${s.signal_category}] ${s.signal_description} (strength: ${s.signal_strength}/10, confidence: ${s.confidence})`;
    }
  }

  if (prospect.notes) {
    prompt += `\n\nNotes: ${prospect.notes}`;
  }

  prompt += `\n\nProvide realistic comparable transactions from the same or adjacent industry and size range. For the suggested approach, consider the owner's likely motivations based on their profile and the detected signals. Talking points should reference HCA's 300+ transaction track record and our expertise in their specific industry.`;

  return prompt;
}

function formatRevenue(min: number | null, max: number | null): string {
  if (!min && !max) return 'Unknown';
  const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}
