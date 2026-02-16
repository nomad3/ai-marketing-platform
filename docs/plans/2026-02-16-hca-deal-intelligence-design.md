# HCA Deal Intelligence Module - Design Document

> **Date:** 2026-02-16
> **Status:** Approved
> **Client:** Hexagon Capital Alliance (Corona del Mar, CA)
> **Repo:** ai-marketing-platform
> **Deployed at:** marketing.agentprovision.com

---

## 1. Context

### The Client

Hexagon Capital Alliance (HCA) is a middle-market investment bank (formerly Moss Adams Capital) with 300+ completed transactions. They specialize in:

- **Sell-Side Advisory** - helping founder-owned businesses find buyers and maximize exit value
- **Leveraged Recapitalization** - securing equity-based loans for companies
- **Strategic Advisory** - valuation, succession planning, long-term value optimization

**Industries:** Consumer, Healthcare, Industrial, Business Services
**Target companies:** Middle-market, founder-owned, $10M-$200M revenue

### Tools They Currently Use

- **Seamless.ai** - generic B2B lead generation (contacts/emails). Works for finding people but doesn't understand IB-specific signals like likelihood to sell.
- **NextNow.ai** - evaluating, not committed yet. We need to ship before they sign.

### What They Need

1. **Lead generation** - finding companies likely to sell (their #1 need)
2. **Company intelligence** - research briefs on prospects
3. **Outreach automation** - personalized pitch emails/materials
4. **Deal pipeline** - track prospects through deal stages
5. **Eventually:** financial modeling tools (Phase 2+)

### Our Advantage

We're building inside a platform that already has AI content generation, campaign management, and analytics. Marketing and deal sourcing are complementary - awareness campaigns soften prospects before cold outreach, and deal signals inform targeting. No competitor integrates both.

---

## 2. The Product: Signal-Based Deal Intelligence

### Core Thesis

The IB market is moving toward **signal-based** deal origination. Instead of cold-calling from generic lists, the best banks identify companies showing *intent signals* that indicate readiness to sell. Our platform's differentiator is an AI engine that scores companies on sell-likelihood using multiple signal categories.

### Signal Categories

#### Ownership & Succession Signals (Weight: High)
- **Owner age** - founders 55+ are 3x more likely to consider exit
- **Years in business** - 20+ years = lifestyle business maturation
- **No visible succession plan** - no family members in leadership
- **Owner reducing involvement** - stepping back from day-to-day
- **Key person risk** - single founder with no management team depth

#### Market & Timing Signals (Weight: High)
- **Industry M&A activity trending up** - comparable deals happening
- **Multiples at cycle highs** - favorable valuation environment
- **Competitor exits** - peers selling creates FOMO / validates exit path
- **Industry consolidation** - PE roll-ups active in their space
- **Regulatory changes** - upcoming regulation creating sell pressure

#### Company Performance Signals (Weight: Medium)
- **Revenue plateau** - growth stalled after strong run (good time to sell on trailing metrics)
- **Revenue at attractive size** - hit the middle-market sweet spot ($10M-$200M)
- **Profitability improving** - EBITDA margins expanding (peak valuation)
- **Customer concentration decreasing** - business becoming more sellable
- **Recurring revenue growing** - SaaS-ification increasing multiples

#### External Trigger Signals (Weight: Medium)
- **Recent leadership changes** - new CFO/COO could signal prep for sale
- **Hiring for corp dev / M&A roles** - actively exploring
- **Capital expenditure slowdown** - not reinvesting = possible exit mindset
- **Debt maturity approaching** - refinance event = natural transaction window
- **Recent press / awards** - heightened visibility = good timing

#### Negative Signals (Reduce Score)
- **Recent acquisition by PE** - already has financial sponsor, unlikely near-term exit
- **Recent capital raise** - just funded, not selling soon
- **Founder very young** - likely still building
- **Rapid hiring** - growth mode, not exit mode
- **New product launches** - investing in future, not winding down

### Sell Likelihood Score (0-100)

```
Score = Σ(signal_weight × signal_confidence) normalized to 0-100

90-100: Hot prospect - multiple strong signals aligned
70-89:  Warm prospect - several indicators, worth pursuing
50-69:  Monitor - some signals but not urgent
30-49:  Low priority - few indicators
0-29:   Cold - strong negative signals or insufficient data
```

Each signal is stored individually so bankers can see WHY a company scored high, not just that it did.

---

## 3. Data Model

### New Tables (added to existing marketing_platform database)

```sql
-- Companies identified as potential sell-side clients
CREATE TABLE prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    -- Company info
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),          -- consumer, healthcare, industrial, business_services
    sub_industry VARCHAR(200),
    website VARCHAR(500),
    location_city VARCHAR(200),
    location_state VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'US',

    -- Size indicators
    estimated_revenue_min BIGINT,   -- in dollars
    estimated_revenue_max BIGINT,
    employee_count_range VARCHAR(50), -- '10-50', '50-200', '200-500', '500+'
    year_founded INTEGER,

    -- Ownership
    owner_name VARCHAR(255),
    owner_title VARCHAR(200),
    owner_linkedin VARCHAR(500),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(50),
    owner_estimated_age INTEGER,
    ownership_type VARCHAR(50),     -- founder, family, pe_backed, public

    -- AI scoring
    sell_likelihood_score INTEGER DEFAULT 0,  -- 0-100
    score_breakdown JSONB,          -- individual signal scores
    last_scored_at TIMESTAMPTZ,

    -- AI research
    ai_research JSONB,              -- full research brief (competitors, news, comps, etc.)
    last_researched_at TIMESTAMPTZ,

    -- Pipeline
    stage VARCHAR(50) DEFAULT 'lead',  -- lead, contacted, engaged, active_deal, closed_won, closed_lost
    stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID REFERENCES users(id),

    -- Source tracking (ties to marketing module)
    source VARCHAR(50),             -- ai_discovery, manual, csv_import, campaign, referral
    source_campaign_id UUID REFERENCES campaigns(id),

    -- Meta
    tags TEXT[],
    notes TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual signals detected for each prospect
CREATE TABLE prospect_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,

    signal_category VARCHAR(50) NOT NULL,  -- ownership, market, performance, trigger, negative
    signal_type VARCHAR(100) NOT NULL,     -- owner_age, industry_ma_activity, revenue_plateau, etc.
    signal_description TEXT NOT NULL,       -- human-readable: "Owner John Smith is estimated 63 years old"
    signal_strength INTEGER NOT NULL,       -- 1-10
    confidence DECIMAL(3,2),               -- 0.00-1.00
    source_url VARCHAR(1000),              -- where we found this signal
    source_type VARCHAR(50),               -- linkedin, news, sec_filing, web_scrape, manual

    detected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                -- some signals are time-sensitive
    is_active BOOLEAN DEFAULT true
);

-- Timeline of interactions with prospects
CREATE TABLE prospect_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    activity_type VARCHAR(50) NOT NULL,  -- note, email_sent, call, meeting, stage_change, signal_detected, research_updated
    title VARCHAR(255),
    content TEXT,
    metadata JSONB,                      -- stage_from/stage_to for stage changes, email subject, etc.

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated outreach content for prospects
CREATE TABLE outreach_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    outreach_type VARCHAR(50) NOT NULL,  -- cold_email, follow_up, intro_one_pager, teaser, linkedin_message
    subject VARCHAR(500),
    content TEXT NOT NULL,
    ai_prompt TEXT,                       -- the prompt used to generate this

    status VARCHAR(50) DEFAULT 'draft',  -- draft, approved, sent
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prospects_user_id ON prospects(user_id);
CREATE INDEX idx_prospects_stage ON prospects(stage);
CREATE INDEX idx_prospects_industry ON prospects(industry);
CREATE INDEX idx_prospects_sell_score ON prospects(sell_likelihood_score DESC);
CREATE INDEX idx_prospects_source_campaign ON prospects(source_campaign_id);
CREATE INDEX idx_prospect_signals_prospect ON prospect_signals(prospect_id);
CREATE INDEX idx_prospect_signals_category ON prospect_signals(signal_category);
CREATE INDEX idx_prospect_activities_prospect ON prospect_activities(prospect_id);
CREATE INDEX idx_outreach_drafts_prospect ON outreach_drafts(prospect_id);
```

---

## 4. API Routes

All new routes under `/api/prospects/` and `/api/outreach/`:

```
# Prospect CRUD
GET    /api/prospects                    # List prospects (filter: stage, industry, score_min, assigned_to, tags, source)
POST   /api/prospects                    # Create prospect (manual entry)
POST   /api/prospects/import             # CSV bulk import
GET    /api/prospects/:id                # Get prospect detail + signals + activities
PUT    /api/prospects/:id                # Update prospect
DELETE /api/prospects/:id                # Delete prospect
PUT    /api/prospects/:id/stage          # Move to new stage (logs activity)
PUT    /api/prospects/:id/assign         # Assign to team member

# AI-Powered Features
POST   /api/prospects/discover           # AI prospect discovery (scrape + score)
                                         # Input: { industry, revenue_range, geography, ownership_type }
                                         # Returns: scored prospect list
POST   /api/prospects/:id/research       # Generate/refresh AI research brief
POST   /api/prospects/:id/score          # Recalculate sell likelihood score
POST   /api/prospects/:id/signals        # Manually add a signal

# Outreach (extends existing content engine)
POST   /api/outreach/generate            # Generate outreach content
                                         # Input: { prospect_id, type: cold_email|follow_up|one_pager|linkedin_message }
GET    /api/outreach/prospect/:id        # Get all drafts for a prospect
PUT    /api/outreach/:id                 # Edit draft
PUT    /api/outreach/:id/send            # Mark as sent

# Pipeline Analytics (extends existing analytics)
GET    /api/analytics/pipeline           # Pipeline funnel metrics
GET    /api/analytics/signals            # Signal effectiveness (which signals predict deals)
GET    /api/analytics/attribution        # Campaign -> prospect -> deal attribution

# Integration: Campaign -> Prospect
POST   /api/prospects/from-campaign/:campaignId  # Create prospects from campaign engagement data
```

---

## 5. Frontend Pages

### New Pages

**Prospects List (`/prospects`)**
- Table/grid view of all prospects
- Sort by: sell likelihood score, stage, industry, date added
- Filter by: stage, industry, score range, assigned to, source, tags
- Bulk actions: assign, change stage, export CSV
- Quick-add button for manual entry
- CSV import button
- "AI Discover" button -> opens discovery modal

**Prospect Detail (`/prospects/:id`)**
- Company overview card (name, industry, revenue, location, owner info)
- **Sell Likelihood Score** gauge (0-100) with breakdown
- **Signals Panel** - all detected signals grouped by category, with strength/confidence
- **AI Research Brief** - collapsible sections (overview, competitors, comparable transactions, suggested approach)
- **Activity Timeline** - chronological feed of all interactions
- **Outreach Drafts** - generated emails/materials with edit/send actions
- Action buttons: Research, Score, Generate Outreach, Change Stage, Add Note

**AI Discovery Modal (overlay on /prospects)**
- Form: industry, revenue range, geography, ownership type, additional criteria
- Results stream in as AI finds and scores companies
- One-click "Add to Pipeline" per result
- Option to "Create Awareness Campaign" for the entire prospect list (bridges to marketing module)

**Pipeline Board (`/prospects/pipeline`)**
- Kanban board view: Lead | Contacted | Engaged | Active Deal | Closed
- Drag-and-drop between stages
- Cards show: company name, score, industry, days in stage
- Funnel metrics at top

### Modified Existing Pages

**Dashboard (`/dashboard`)**
- Add "Deal Intelligence" summary card:
  - Total prospects, hot prospects (score 70+), active deals
  - Recent signals detected
  - Pipeline value estimate

**Analytics (`/analytics`)**
- Add "Pipeline" tab:
  - Funnel chart (prospects by stage)
  - Conversion rates between stages
  - Campaign attribution (which campaigns generated prospects)
  - Signal effectiveness chart (which signals best predict closed deals)
  - Deal velocity by industry

**Navigation**
- Add new nav section: "Deal Intelligence" with sub-items: Prospects, Pipeline, Discovery

---

## 6. AI Implementation

### AI Prospect Discovery Agent

Uses OpenAI GPT-4 with web search capabilities to find companies matching criteria.

**Input:** Industry, revenue range, geography, ownership type, additional filters
**Process:**
1. Generate search queries based on criteria
2. For each result, scrape publicly available info (website, LinkedIn, news)
3. Build company profile
4. Detect signals from scraped data
5. Calculate sell likelihood score
6. Return ranked list

**Output:** Array of prospect objects with scores and signals

### AI Research Brief Generator

**Input:** Prospect ID (uses stored company data + signals)
**Process:**
1. Aggregate all known data about the company
2. Search for recent news, press releases, job postings
3. Find comparable transactions in the same industry/size
4. Analyze competitive landscape
5. Determine suggested approach angle based on owner profile and signals
6. Generate structured brief

**Output (JSONB stored in `ai_research`):**
```json
{
  "executive_summary": "...",
  "company_overview": { "description": "...", "products_services": [...], "key_customers": [...] },
  "financial_indicators": { "estimated_revenue": "...", "estimated_ebitda_range": "...", "growth_trajectory": "..." },
  "competitive_landscape": [{ "name": "...", "comparison": "..." }],
  "comparable_transactions": [{ "target": "...", "acquirer": "...", "date": "...", "multiple": "..." }],
  "key_personnel": [{ "name": "...", "title": "...", "tenure": "..." }],
  "signals_summary": "...",
  "suggested_approach": { "angle": "succession_planning|growth_capital|strategic_exit", "reasoning": "...", "talking_points": [...] },
  "sources": [{ "url": "...", "title": "...", "date": "..." }]
}
```

### AI Outreach Generator

Uses the existing content generation engine with new IB-specific templates.

**Input:** Prospect ID, outreach type, optional customization
**Process:**
1. Load prospect data, signals, research brief
2. Select template based on outreach type and prospect profile
3. Personalize using company specifics, owner name, industry context
4. Match HCA's tone (professional, consultative, not salesy)
5. Include relevant comparable transaction or industry stat

**Templates:**
- **Cold Email** - initial outreach to owner/CEO
- **Follow-up** - 2nd/3rd touch with new angle
- **LinkedIn Message** - shorter, more personal
- **One-Pager** - company-specific deal teaser (PDF-ready)

### AI Signal Scorer

**Input:** Prospect with all detected signals
**Process:**
1. Weight each signal by category importance
2. Apply confidence multiplier
3. Check for contradicting signals (negative signals reduce score)
4. Normalize to 0-100
5. Store individual signal contributions for transparency

---

## 7. Integration with Marketing Module

### Campaign -> Prospect Flow

When a marketing campaign runs (e.g., LinkedIn awareness campaign targeting healthcare company owners), engagement data creates prospects:

```
Campaign created targeting "Healthcare CEOs, 50+, $20M+ revenue"
    │
    ▼
Campaign runs → Impressions, clicks, engagement
    │
    ▼
POST /api/prospects/from-campaign/:campaignId
    │
    ▼
Engaged contacts become prospects with:
  - source: "campaign"
  - source_campaign_id: linked
  - stage: "lead"
  - Initial signals from campaign targeting data
    │
    ▼
AI enriches & scores each new prospect
```

### Prospect -> Campaign Flow

From the prospect list, user can:
1. Select prospects → "Create Awareness Campaign" → pre-fills campaign targeting with prospect demographics
2. This runs LinkedIn/Meta ads to warm up the prospect before cold outreach
3. Campaign performance feeds back into prospect activity timeline

### Shared Content Engine

The existing `POST /api/content/generate` gets new content types:
- `pitch_email` - uses prospect context
- `one_pager` - deal teaser document
- `linkedin_message` - short professional outreach
- `market_report` - industry analysis

---

## 8. HCA Branding

The platform gets HCA-branded elements when accessed by HCA users:

- **App title:** "HCA Deal Intelligence"
- **Color scheme:** Adapt to HCA brand colors (navy/gold from their website)
- **Logo:** HCA logo in nav
- **Demo credentials:** `demo@hexagoncapital.com`

Implementation: CSS variables / theme config based on organization. The marketing features remain accessible - it's one platform, HCA just sees it branded for them.

---

## 9. MVP Scope (Phase 1)

**Build (must-have for demo):**
- [ ] Database migration (4 new tables)
- [ ] Prospect CRUD API + frontend list/detail pages
- [ ] Pipeline Kanban board
- [ ] AI Prospect Discovery (web scraping + scoring)
- [ ] Signal detection and scoring engine
- [ ] AI Research Brief generation
- [ ] AI Outreach generation (cold email, LinkedIn message)
- [ ] Pipeline analytics tab
- [ ] Dashboard deal intelligence card
- [ ] HCA branding/theme
- [ ] Seed data with realistic prospect examples

**Defer (Phase 2+):**
- Campaign -> Prospect auto-creation flow
- CSV bulk import
- Financial modeling tools
- Seamless.ai API integration
- Email sending integration (for now, copy/paste generated emails)
- One-pager PDF export
- Signal effectiveness analytics (need data first)
- Multi-user assignment and permissions

---

## 10. Technical Notes

- **Repo:** /Users/nomade/Documents/GitHub/ai-marketing-platform
- **Deployment:** Same GKE cluster, same Helm chart pattern, namespace `prod`
- **Database:** Same PostgreSQL instance, new tables via migration
- **AI calls:** OpenAI GPT-4 via existing backend integration
- **Web scraping:** OpenAI with web browsing for prospect discovery, or structured prompts for research briefs from known URLs
- **No new infrastructure** needed - everything runs on existing stack
