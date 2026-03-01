import OpenAI from 'openai';
import { query } from '../db.js';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured — scoring is handled by ServiceTsunami agents');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Signal category weights for score calculation
const CATEGORY_WEIGHTS: Record<string, number> = {
  ownership_succession: 0.30,
  market_timing: 0.25,
  company_performance: 0.20,
  external_triggers: 0.15,
  negative: -0.10,
};

interface Signal {
  signal_category: string;
  signal_type: string;
  signal_description: string;
  signal_strength: number; // 1-10
  confidence: number; // 0.00-1.00
  source_type: string;
}

interface ScoringResult {
  score: number;
  signals: Signal[];
  score_breakdown: Record<string, number>;
}

/**
 * Score a prospect's sell-likelihood using AI analysis.
 * Analyzes all available data about the company and owner to detect
 * signals that indicate readiness to sell.
 */
export async function scoreProspect(prospectId: number): Promise<ScoringResult> {
  // Load prospect data
  const prospectResult = await query(`SELECT * FROM prospects WHERE id = $1`, [prospectId]);
  if (prospectResult.rows.length === 0) {
    throw new Error('Prospect not found');
  }
  const prospect = prospectResult.rows[0];

  // Load any existing manual signals
  const existingSignals = await query(
    `SELECT * FROM prospect_signals WHERE prospect_id = $1 AND source_type = 'manual' AND is_active = true`,
    [prospectId]
  );

  const prompt = buildScoringPrompt(prospect, existingSignals.rows);

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert M&A analyst specializing in middle-market sell-side advisory. You evaluate companies for their likelihood of being acquired or sold. You work for Hexagon Capital Alliance, a leading middle-market investment bank with 300+ completed transactions.

Your job is to analyze available data about a company and its owner to identify signals that indicate the company may be ready for a sale or transaction. Return structured JSON only.`
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const aiResult = JSON.parse(response.choices[0].message.content || '{}');
  const signals: Signal[] = (aiResult.signals || []).map((s: any) => ({
    signal_category: s.category || 'external_triggers',
    signal_type: s.type || 'unknown',
    signal_description: s.description || '',
    signal_strength: Math.min(10, Math.max(1, parseInt(s.strength) || 5)),
    confidence: Math.min(1, Math.max(0, parseFloat(s.confidence) || 0.5)),
    source_type: 'ai_analysis',
  }));

  // Calculate score from signals
  const scoreBreakdown = calculateScore(signals);
  const totalScore = Math.round(
    Object.entries(scoreBreakdown).reduce((sum, [category, catScore]) => {
      const weight = CATEGORY_WEIGHTS[category] || 0;
      return sum + (catScore * weight);
    }, 0)
  );
  const normalizedScore = Math.min(100, Math.max(0, totalScore));

  // Clear old AI signals and insert new ones
  await query(
    `UPDATE prospect_signals SET is_active = false WHERE prospect_id = $1 AND source_type = 'ai_analysis'`,
    [prospectId]
  );

  for (const signal of signals) {
    await query(`
      INSERT INTO prospect_signals (prospect_id, signal_category, signal_type, signal_description, signal_strength, confidence, source_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [prospectId, signal.signal_category, signal.signal_type, signal.signal_description, signal.signal_strength, signal.confidence, signal.source_type]);
  }

  // Update prospect score
  await query(`
    UPDATE prospects SET sell_likelihood_score = $1, score_breakdown = $2, last_scored_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
  `, [normalizedScore, JSON.stringify(scoreBreakdown), prospectId]);

  // Log scoring activity
  await query(`
    INSERT INTO prospect_activities (prospect_id, activity_type, title, content, metadata)
    VALUES ($1, 'score_updated', 'Sell likelihood score updated', $2, $3)
  `, [prospectId, `Score: ${normalizedScore}/100 based on ${signals.length} signals`, JSON.stringify({ score: normalizedScore, signal_count: signals.length })]);

  return {
    score: normalizedScore,
    signals,
    score_breakdown: scoreBreakdown,
  };
}

function buildScoringPrompt(prospect: any, manualSignals: any[]): string {
  let prompt = `Analyze the following company for sell-likelihood signals. For each signal detected, provide:
- category: one of "ownership_succession", "market_timing", "company_performance", "external_triggers", "negative"
- type: a specific signal type (e.g., "owner_age", "industry_ma_activity", "revenue_plateau", "recent_leadership_change", "recent_pe_acquisition")
- description: a human-readable explanation of the signal
- strength: 1-10 (how strong this signal is)
- confidence: 0.0-1.0 (how confident you are this signal is accurate based on available data)

Return JSON with format: { "signals": [...], "analysis_summary": "brief overall assessment" }

Company Data:
- Name: ${prospect.company_name}
- Industry: ${prospect.industry || 'Unknown'}${prospect.sub_industry ? ` / ${prospect.sub_industry}` : ''}
- Location: ${[prospect.location_city, prospect.location_state, prospect.location_country].filter(Boolean).join(', ') || 'Unknown'}
- Website: ${prospect.website || 'Unknown'}
- Year Founded: ${prospect.year_founded || 'Unknown'}
- Estimated Revenue: ${formatRevenue(prospect.estimated_revenue_min, prospect.estimated_revenue_max)}
- Employee Range: ${prospect.employee_count_range || 'Unknown'}
- Ownership Type: ${prospect.ownership_type || 'Unknown'}

Owner/CEO:
- Name: ${prospect.owner_name || 'Unknown'}
- Title: ${prospect.owner_title || 'Unknown'}
- Estimated Age: ${prospect.owner_estimated_age || 'Unknown'}
- LinkedIn: ${prospect.owner_linkedin || 'N/A'}`;

  if (manualSignals.length > 0) {
    prompt += `\n\nManually identified signals (consider these in your analysis):`;
    for (const s of manualSignals) {
      prompt += `\n- [${s.signal_category}] ${s.signal_description} (strength: ${s.signal_strength})`;
    }
  }

  if (prospect.notes) {
    prompt += `\n\nAdditional Notes: ${prospect.notes}`;
  }

  prompt += `\n\nBased on all available data, identify ALL relevant sell-likelihood signals. Consider ownership/succession dynamics, market timing, company performance indicators, and external triggers. Also identify any negative signals that would reduce sell likelihood. Be thorough but realistic about confidence levels when data is limited.`;

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

function calculateScore(signals: Signal[]): Record<string, number> {
  const categoryScores: Record<string, { total: number; count: number }> = {};

  for (const signal of signals) {
    const cat = signal.signal_category;
    if (!categoryScores[cat]) {
      categoryScores[cat] = { total: 0, count: 0 };
    }
    // Score contribution = strength * confidence, scaled to 0-100 per category
    categoryScores[cat].total += signal.signal_strength * signal.confidence * 10;
    categoryScores[cat].count++;
  }

  const breakdown: Record<string, number> = {};
  for (const [category, data] of Object.entries(categoryScores)) {
    // Average score per category, capped at 100
    breakdown[category] = Math.min(100, Math.round(data.total / Math.max(data.count, 1)));
  }

  return breakdown;
}
