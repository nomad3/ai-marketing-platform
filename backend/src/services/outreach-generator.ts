import OpenAI from 'openai';
import { query } from '../db.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type OutreachType = 'cold_email' | 'follow_up' | 'linkedin_message' | 'intro_one_pager';

interface OutreachResult {
  subject?: string;
  content: string;
  outreach_type: OutreachType;
}

/**
 * Generate personalized outreach content for a prospect.
 * Uses prospect data, signals, and research to craft HCA-branded messages.
 */
export async function generateOutreach(
  prospectId: number,
  outreachType: OutreachType,
  customInstructions?: string
): Promise<OutreachResult> {
  // Load prospect with all context
  const prospectResult = await query(`SELECT * FROM prospects WHERE id = $1`, [prospectId]);
  if (prospectResult.rows.length === 0) {
    throw new Error('Prospect not found');
  }
  const prospect = prospectResult.rows[0];

  const signalsResult = await query(
    `SELECT * FROM prospect_signals WHERE prospect_id = $1 AND is_active = true ORDER BY signal_strength DESC LIMIT 5`,
    [prospectId]
  );

  const prompt = buildOutreachPrompt(prospect, signalsResult.rows, outreachType, customInstructions);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a senior banker at Hexagon Capital Alliance (HCA), a leading middle-market investment bank with 300+ completed transactions. You write outreach communications to company owners about potential sell-side advisory.

HCA's value proposition:
- 300+ completed M&A transactions
- Deep expertise in Consumer, Healthcare, Industrial, Business Services
- Confidential, owner-focused process
- Maximize exit value through competitive auction processes
- Former Moss Adams Capital team with decades of experience

Tone: Professional, consultative, NOT salesy. Position as a trusted advisor, not a cold caller. Reference specific details about their company to show genuine research. Keep it concise and respect the owner's time.

Return structured JSON only.`
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 2000,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  return {
    subject: result.subject || null,
    content: result.content || result.body || '',
    outreach_type: outreachType,
  };
}

function buildOutreachPrompt(
  prospect: any,
  signals: any[],
  outreachType: OutreachType,
  customInstructions?: string
): string {
  const research = prospect.ai_research || {};
  const ownerFirstName = prospect.owner_name?.split(' ')[0] || 'there';

  let typeInstructions = '';
  switch (outreachType) {
    case 'cold_email':
      typeInstructions = `Write a cold email to ${prospect.owner_name || 'the company owner'}. Return JSON: { "subject": "email subject line", "content": "full email body" }

Guidelines:
- Subject: Short, personal, non-salesy (e.g., "Quick thought on [company]'s next chapter")
- Opening: Reference something specific about their company (a recent milestone, their industry, or their tenure)
- Body: Briefly introduce HCA and why we're reaching out NOW (reference timing signals)
- Include one comparable transaction or industry stat to build credibility
- Close: Low-pressure ask (15-min call, coffee meeting, etc.)
- Keep under 200 words
- Sign from a Managing Director at Hexagon Capital Alliance`;
      break;

    case 'follow_up':
      typeInstructions = `Write a follow-up email (2nd or 3rd touch). Return JSON: { "subject": "email subject line", "content": "full email body" }

Guidelines:
- Reference the initial outreach without being pushy
- Provide NEW value: a relevant industry insight, comparable transaction, or market trend
- Shorter than initial email (under 150 words)
- Different angle than initial outreach
- Low-pressure close`;
      break;

    case 'linkedin_message':
      typeInstructions = `Write a LinkedIn connection message/InMail. Return JSON: { "content": "message text" }

Guidelines:
- Very short (under 100 words)
- Personal and conversational
- Reference a shared connection, industry event, or their company achievement
- Soft ask: "Would love to connect and share some thoughts on the [industry] market"
- No hard sell`;
      break;

    case 'intro_one_pager':
      typeInstructions = `Write a company-specific deal teaser one-pager. Return JSON: { "subject": "one-pager title", "content": "full one-pager text in markdown format" }

Guidelines:
- Title: "[Company Name] - Strategic Advisory Opportunity"
- Sections: Company Overview, Market Opportunity, Why Now (reference signals), HCA Credentials, Next Steps
- Include relevant comparable transactions
- Professional, document-style formatting
- Reference HCA's specific experience in their industry
- Keep to about 400-500 words`;
      break;
  }

  let prompt = `${typeInstructions}

Target Company: ${prospect.company_name}
Industry: ${prospect.industry || 'Unknown'}${prospect.sub_industry ? ` / ${prospect.sub_industry}` : ''}
Location: ${[prospect.location_city, prospect.location_state].filter(Boolean).join(', ') || 'Unknown'}
Revenue: ${formatRevenue(prospect.estimated_revenue_min, prospect.estimated_revenue_max)}
Owner: ${prospect.owner_name || 'Unknown'} (${prospect.owner_title || 'CEO'})${prospect.owner_estimated_age ? `, est. age ${prospect.owner_estimated_age}` : ''}
Ownership: ${prospect.ownership_type || 'founder-owned'}
Sell Score: ${prospect.sell_likelihood_score || 'Not scored'}/100`;

  if (signals.length > 0) {
    prompt += `\n\nKey Signals:`;
    for (const s of signals) {
      prompt += `\n- ${s.signal_description}`;
    }
  }

  if (research.executive_summary) {
    prompt += `\n\nResearch Summary: ${research.executive_summary}`;
  }
  if (research.comparable_transactions?.length) {
    prompt += `\n\nComparable Transactions:`;
    for (const tx of research.comparable_transactions.slice(0, 3)) {
      prompt += `\n- ${tx.target} acquired by ${tx.acquirer} (${tx.date}, ${tx.multiple})`;
    }
  }
  if (research.suggested_approach) {
    prompt += `\n\nSuggested Approach: ${research.suggested_approach.angle} - ${research.suggested_approach.reasoning}`;
  }

  if (customInstructions) {
    prompt += `\n\nAdditional Instructions: ${customInstructions}`;
  }

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
