# HCA Deal Intelligence Module - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a signal-based deal intelligence module to the ai-marketing-platform that enables HCA investment bankers to discover, score, research, and outreach to middle-market companies likely to sell.

**Architecture:** New database tables (prospects, prospect_signals, prospect_activities, outreach_drafts) alongside existing marketing tables. New Express routes under `/api/prospects/` and `/api/outreach/`. New React pages (Prospects, ProspectDetail, Pipeline). AI scoring and research via OpenAI GPT-4 using the existing backend pattern. Integrates with existing campaign/content modules.

**Tech Stack:** Express + TypeScript + PostgreSQL (backend), React 18 + TypeScript + Vite (frontend), OpenAI GPT-4 (AI), existing auth middleware, existing Recharts for analytics.

**Repo:** `/Users/nomade/Documents/GitHub/ai-marketing-platform`

---

## Task 1: Database Migration - New Tables

**Files:**
- Create: `database/migrations/001_add_prospects_tables.sql`
- Modify: `database/init.sql` (append new tables)

**Step 1: Create migration file**

Create `database/migrations/001_add_prospects_tables.sql` with the 4 new tables (prospects, prospect_signals, prospect_activities, outreach_drafts) and all indexes from the design doc.

Tables use `SERIAL` for IDs consistent with existing schema (users table uses SERIAL, campaigns uses VARCHAR). Prospects will use SERIAL PRIMARY KEY for consistency with users table.

Foreign key `source_campaign_id` references `campaigns(id)` VARCHAR to link marketing campaigns to prospects.

**Step 2: Append tables to init.sql**

Add the same table definitions to the bottom of `database/init.sql` so new dev environments get the full schema. Add seed data for demo prospects.

**Step 3: Run migration against local database**

```bash
cd /Users/nomade/Documents/GitHub/ai-marketing-platform
docker exec -i $(docker ps -q -f name=postgres) psql -U postgres -d marketing_platform < database/migrations/001_add_prospects_tables.sql
```

Expected: Tables created successfully.

**Step 4: Verify tables exist**

```bash
docker exec $(docker ps -q -f name=postgres) psql -U postgres -d marketing_platform -c "\dt prospect*"
```

Expected: 4 tables listed (prospects, prospect_signals, prospect_activities, outreach_drafts)

**Step 5: Commit**

```bash
git add database/
git commit -m "feat: add prospect tables for deal intelligence module"
```

---

## Task 2: Backend - Prospect CRUD Routes

**Files:**
- Create: `backend/src/routes/prospects.ts`
- Modify: `backend/src/index.ts` (register new routes)

**Step 1: Create prospects route file**

Create `backend/src/routes/prospects.ts` with these endpoints:

```
GET    /               - List prospects (filter by stage, industry, score_min, assigned_to)
POST   /               - Create prospect manually
GET    /:id            - Get prospect detail + signals + activities + outreach drafts
PUT    /:id            - Update prospect fields
DELETE /:id            - Soft delete (set is_archived = true)
PUT    /:id/stage      - Change pipeline stage (logs activity)
```

Use the existing `query()` helper from `../db.js`. Follow the pattern from `campaigns.ts` - same error handling, same response format. User comes from `req.user?.id` via optionalAuth middleware.

**Step 2: Register routes in index.ts**

Add to `backend/src/index.ts`:
```typescript
import prospectRoutes from './routes/prospects.js';
// ... after other routes
app.use('/api/prospects', optionalAuth, prospectRoutes);
```

**Step 3: Test manually with curl**

```bash
# Create a prospect
curl -s -X POST http://localhost:3000/api/prospects \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Corp","industry":"healthcare","estimated_revenue_min":10000000,"estimated_revenue_max":50000000,"owner_name":"John Smith","stage":"lead"}'

# List prospects
curl -s http://localhost:3000/api/prospects | jq .

# Get single prospect (use ID from create response)
curl -s http://localhost:3000/api/prospects/1 | jq .
```

Expected: JSON responses with prospect data.

**Step 4: Commit**

```bash
git add backend/src/routes/prospects.ts backend/src/index.ts
git commit -m "feat: add prospect CRUD API routes"
```

---

## Task 3: Backend - AI Signal Scoring Engine

**Files:**
- Create: `backend/src/services/signal-scorer.ts`
- Modify: `backend/src/routes/prospects.ts` (add scoring endpoint)

**Step 1: Create signal scoring service**

Create `backend/src/services/signal-scorer.ts` that:

1. Takes a prospect's data (company info, owner info, any existing signals)
2. Calls OpenAI GPT-4 with a structured prompt asking it to analyze sell-likelihood signals
3. Parses the response into individual signals with category, type, description, strength (1-10), confidence (0-1)
4. Calculates overall score (0-100) from weighted signals
5. Stores signals in `prospect_signals` table
6. Updates `sell_likelihood_score` and `score_breakdown` on the prospect

Signal categories and weights:
- ownership_succession: 0.30
- market_timing: 0.25
- company_performance: 0.20
- external_triggers: 0.15
- negative (subtracts): 0.10

The OpenAI prompt should instruct GPT-4 to act as an M&A analyst evaluating sell-likelihood based on whatever data is available, and return structured JSON with signals.

**Step 2: Add scoring endpoint to prospects routes**

```
POST /api/prospects/:id/score    - Run AI scoring on a prospect
```

This endpoint:
1. Loads the prospect from DB
2. Calls the signal scorer service
3. Returns updated prospect with new score and signals

**Step 3: Test scoring**

```bash
curl -s -X POST http://localhost:3000/api/prospects/1/score | jq .
```

Expected: Prospect returned with sell_likelihood_score > 0 and signals array.

**Step 4: Commit**

```bash
git add backend/src/services/signal-scorer.ts backend/src/routes/prospects.ts
git commit -m "feat: add AI signal scoring engine for prospects"
```

---

## Task 4: Backend - AI Research Brief Generator

**Files:**
- Create: `backend/src/services/research-generator.ts`
- Modify: `backend/src/routes/prospects.ts` (add research endpoint)

**Step 1: Create research generator service**

Create `backend/src/services/research-generator.ts` that:

1. Takes prospect data + existing signals
2. Calls OpenAI GPT-4 with web browsing/search capabilities to generate a research brief
3. Returns structured JSON stored in `prospect.ai_research`:
   - executive_summary
   - company_overview (description, products/services, key customers)
   - financial_indicators (estimated revenue, EBITDA range, growth trajectory)
   - competitive_landscape (array of competitors with comparison)
   - comparable_transactions (recent M&A deals in same sector)
   - key_personnel (names, titles, tenure)
   - suggested_approach (angle: succession_planning|growth_capital|strategic_exit, reasoning, talking points)
   - sources (URLs, titles, dates)

The prompt should instruct GPT-4 to act as an investment banking research analyst preparing a target company brief for sell-side advisory.

**Step 2: Add research endpoint**

```
POST /api/prospects/:id/research    - Generate AI research brief
```

Updates `ai_research` JSONB and `last_researched_at` on the prospect. Also logs an activity.

**Step 3: Test research generation**

```bash
curl -s -X POST http://localhost:3000/api/prospects/1/research | jq .ai_research.executive_summary
```

Expected: Research brief with structured sections.

**Step 4: Commit**

```bash
git add backend/src/services/research-generator.ts backend/src/routes/prospects.ts
git commit -m "feat: add AI research brief generator for prospects"
```

---

## Task 5: Backend - AI Prospect Discovery

**Files:**
- Create: `backend/src/services/prospect-discovery.ts`
- Modify: `backend/src/routes/prospects.ts` (add discover endpoint)

**Step 1: Create prospect discovery service**

Create `backend/src/services/prospect-discovery.ts` that:

1. Takes search criteria (industry, revenue_range, geography, ownership_type)
2. Calls OpenAI GPT-4 with instructions to find real middle-market companies matching criteria
3. For each found company, extracts: name, website, location, estimated revenue, owner info, industry, year founded
4. Runs the signal scorer on each discovered company
5. Returns array of scored prospects ready for pipeline insertion

The prompt should be specific to HCA's target market: middle-market, founder-owned businesses in Consumer, Healthcare, Industrial, Business Services, $10M-$200M revenue, US-based.

**Step 2: Add discover endpoint**

```
POST /api/prospects/discover    - AI prospect discovery
```

Request body: `{ industry, revenue_min, revenue_max, geography, ownership_type, max_results }`
Response: Array of prospects with scores and signals (NOT yet saved to DB).

**Step 3: Add save-discovered endpoint**

```
POST /api/prospects/discover/save    - Save selected discovered prospects to pipeline
```

Request body: `{ prospects: [...] }` (array of prospect objects from discover response)
Saves to DB with `source: 'ai_discovery'`.

**Step 4: Test discovery**

```bash
curl -s -X POST http://localhost:3000/api/prospects/discover \
  -H "Content-Type: application/json" \
  -d '{"industry":"healthcare","revenue_min":10000000,"revenue_max":100000000,"geography":"California","max_results":5}' | jq .
```

Expected: Array of 5 prospect objects with scores.

**Step 5: Commit**

```bash
git add backend/src/services/prospect-discovery.ts backend/src/routes/prospects.ts
git commit -m "feat: add AI prospect discovery with signal scoring"
```

---

## Task 6: Backend - Outreach Generation Routes

**Files:**
- Create: `backend/src/routes/outreach.ts`
- Create: `backend/src/services/outreach-generator.ts`
- Modify: `backend/src/index.ts` (register outreach routes)

**Step 1: Create outreach generator service**

Create `backend/src/services/outreach-generator.ts` that:

1. Takes prospect data + research brief + outreach_type
2. Calls OpenAI GPT-4 with HCA-specific tone and positioning
3. Generates personalized content based on type:
   - `cold_email`: Subject + body, personalized to owner's situation, references comparable transactions
   - `follow_up`: 2nd/3rd touch with different angle
   - `linkedin_message`: Short, professional, conversational
   - `intro_one_pager`: Structured deal teaser document (company overview, opportunity, HCA credentials)

HCA tone: Professional, consultative, not salesy. References their 300+ transactions track record. Emphasizes confidential, owner-focused process.

**Step 2: Create outreach routes**

Create `backend/src/routes/outreach.ts` with:

```
POST /api/outreach/generate              - Generate outreach content
GET  /api/outreach/prospect/:prospectId  - Get all drafts for a prospect
PUT  /api/outreach/:id                   - Edit a draft
PUT  /api/outreach/:id/status            - Mark as approved/sent
```

**Step 3: Register routes**

Add to `backend/src/index.ts`:
```typescript
import outreachRoutes from './routes/outreach.js';
app.use('/api/outreach', optionalAuth, outreachRoutes);
```

**Step 4: Test outreach generation**

```bash
curl -s -X POST http://localhost:3000/api/outreach/generate \
  -H "Content-Type: application/json" \
  -d '{"prospect_id":1,"outreach_type":"cold_email"}' | jq .
```

Expected: Generated email with subject and body.

**Step 5: Commit**

```bash
git add backend/src/routes/outreach.ts backend/src/services/outreach-generator.ts backend/src/index.ts
git commit -m "feat: add AI outreach generation for prospects"
```

---

## Task 7: Backend - Pipeline Analytics Routes

**Files:**
- Modify: `backend/src/routes/analytics.ts` (add pipeline endpoints)

**Step 1: Add pipeline analytics endpoints**

Add to existing `analytics.ts`:

```
GET /api/analytics/pipeline        - Funnel metrics (count by stage, conversion rates)
GET /api/analytics/signals         - Signal distribution and effectiveness
GET /api/analytics/attribution     - Campaign-to-prospect attribution
```

Pipeline query: `SELECT stage, COUNT(*) FROM prospects WHERE is_archived = false GROUP BY stage`

Signal effectiveness: `SELECT signal_category, AVG(signal_strength) FROM prospect_signals GROUP BY signal_category`

Attribution: `SELECT c.name as campaign_name, COUNT(p.id) as prospects FROM prospects p JOIN campaigns c ON p.source_campaign_id = c.id GROUP BY c.name`

**Step 2: Test analytics**

```bash
curl -s http://localhost:3000/api/analytics/pipeline | jq .
```

**Step 3: Commit**

```bash
git add backend/src/routes/analytics.ts
git commit -m "feat: add pipeline analytics endpoints"
```

---

## Task 8: Frontend - Prospects List Page

**Files:**
- Create: `frontend/src/pages/Prospects.tsx`
- Create: `frontend/src/pages/Prospects.css`
- Modify: `frontend/src/App.tsx` (add route)

**Step 1: Create Prospects page**

Create `frontend/src/pages/Prospects.tsx` - a table/list view of all prospects with:

- Header with title "Prospects" + "Add Prospect" button + "AI Discover" button
- Filter bar: stage dropdown, industry dropdown, minimum score slider, search by company name
- Table columns: Company Name, Industry, Revenue Range, Sell Score (colored gauge 0-100), Stage (badge), Owner, Location, Source, Date Added
- Sort by clicking column headers (default: score DESC)
- Click row navigates to `/prospects/:id`
- Score column uses color coding: 70+ green, 50-69 yellow, <50 gray

Follow the existing Dashboard.tsx pattern:
- Import from lucide-react for icons
- Use `useAuth()` for auth check, `useNavigate()` for routing
- Fetch from `/api/prospects` with fetch() (existing pattern - no axios in frontend)
- Use the same glassmorphism CSS classes from Dashboard.css

**Step 2: Add CSS**

Create `frontend/src/pages/Prospects.css` following the existing `Campaigns.css` and `Dashboard.css` patterns - dark theme, glassmorphism cards, gradient accents.

**Step 3: Add route**

In `frontend/src/App.tsx`, add:
```tsx
import Prospects from './pages/Prospects';
// In Routes:
<Route path="/prospects" element={<Prospects />} />
```

**Step 4: Verify in browser**

Navigate to `http://localhost:5173/prospects`. Should show prospect list (empty or with seed data).

**Step 5: Commit**

```bash
git add frontend/src/pages/Prospects.tsx frontend/src/pages/Prospects.css frontend/src/App.tsx
git commit -m "feat: add Prospects list page with filtering and scoring"
```

---

## Task 9: Frontend - Prospect Detail Page

**Files:**
- Create: `frontend/src/pages/ProspectDetail.tsx`
- Create: `frontend/src/pages/ProspectDetail.css`
- Modify: `frontend/src/App.tsx` (add route)

**Step 1: Create ProspectDetail page**

Create `frontend/src/pages/ProspectDetail.tsx` with these sections:

**Top bar:** Back button, Company name, Stage badge with dropdown to change, "Score" button, "Research" button, "Generate Outreach" button

**Left column (60%):**
- **Company Overview Card:** Name, industry, sub-industry, website link, location, founded year, estimated revenue range, employee range, ownership type
- **Owner Card:** Name, title, LinkedIn link, email, phone, estimated age
- **AI Research Brief:** Collapsible sections (executive summary, company overview, financials, competitors, comparable transactions, key personnel, suggested approach). Show "Generate Research" button if no brief exists.
- **Outreach Drafts:** List of generated outreach with type badges, preview, edit/send actions

**Right column (40%):**
- **Sell Likelihood Score:** Large circular gauge (0-100) with color
- **Signals Panel:** Grouped by category (Ownership, Market, Performance, Triggers, Negative). Each signal shows: description, strength bar (1-10), confidence %, source link. "Rescore" button at bottom.
- **Activity Timeline:** Chronological feed (notes, emails, stage changes, signal detections). "Add Note" form at top.

**Step 2: Add CSS**

Create `frontend/src/pages/ProspectDetail.css` - two-column layout, signal strength bars, score gauge, timeline styling.

**Step 3: Add route**

```tsx
import ProspectDetail from './pages/ProspectDetail';
<Route path="/prospects/:id" element={<ProspectDetail />} />
```

**Step 4: Verify in browser**

Navigate to a prospect detail page. All sections should render (empty states for missing data).

**Step 5: Commit**

```bash
git add frontend/src/pages/ProspectDetail.tsx frontend/src/pages/ProspectDetail.css frontend/src/App.tsx
git commit -m "feat: add Prospect Detail page with signals, research, and outreach"
```

---

## Task 10: Frontend - AI Discovery Modal

**Files:**
- Create: `frontend/src/components/ProspectDiscovery.tsx`
- Create: `frontend/src/components/ProspectDiscovery.css`
- Modify: `frontend/src/pages/Prospects.tsx` (wire up modal)

**Step 1: Create ProspectDiscovery component**

A modal overlay (same pattern as `AICampaignBuilder.tsx`) with:

- Form fields: Industry (dropdown: Consumer, Healthcare, Industrial, Business Services), Revenue Range (min/max sliders or dropdowns), Geography (state/region), Ownership Type (founder, family, PE-backed), Max Results (5/10/20)
- "Discover" button starts AI search
- Loading state with progress message ("Searching for prospects...", "Analyzing signals...", "Scoring companies...")
- Results table: Company Name, Score, Industry, Revenue, Location, Owner, Key Signals
- Checkbox per result + "Add Selected to Pipeline" button
- "Create Awareness Campaign" button (pre-fills campaign creator with prospect demographics)

**Step 2: Add CSS**

Follow existing `AICampaignBuilder.css` pattern - modal overlay, form styling, results grid.

**Step 3: Wire into Prospects page**

In `Prospects.tsx`, import and toggle the discovery modal with a state variable.

**Step 4: Test flow**

Click "AI Discover" on prospects page -> fill criteria -> click Discover -> see results -> add to pipeline.

**Step 5: Commit**

```bash
git add frontend/src/components/ProspectDiscovery.tsx frontend/src/components/ProspectDiscovery.css frontend/src/pages/Prospects.tsx
git commit -m "feat: add AI prospect discovery modal"
```

---

## Task 11: Frontend - Pipeline Kanban Board

**Files:**
- Create: `frontend/src/pages/Pipeline.tsx`
- Create: `frontend/src/pages/Pipeline.css`
- Modify: `frontend/src/App.tsx` (add route)

**Step 1: Create Pipeline page**

A Kanban board view with 5 columns: Lead | Contacted | Engaged | Active Deal | Closed

Each column:
- Header with stage name + count
- Scrollable list of prospect cards
- Cards show: company name, sell score (small badge), industry, days in stage

Drag-and-drop between columns (use HTML5 drag API or simple click-to-move dropdown for MVP).

Top of page: funnel summary bar showing counts and conversion percentages between stages.

Fetch all prospects from `/api/prospects` and group by stage client-side.

**Step 2: Add CSS**

Horizontal column layout, card styling, drag hover effects.

**Step 3: Add route**

```tsx
import Pipeline from './pages/Pipeline';
<Route path="/pipeline" element={<Pipeline />} />
```

**Step 4: Commit**

```bash
git add frontend/src/pages/Pipeline.tsx frontend/src/pages/Pipeline.css frontend/src/App.tsx
git commit -m "feat: add pipeline Kanban board view"
```

---

## Task 12: Frontend - Navigation Updates

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx` (add Deal Intelligence section to sidebar + summary card)
- Create or modify navigation component used across pages

**Step 1: Add Deal Intelligence nav items**

The existing Dashboard.tsx has a sidebar with navigation. Add a "Deal Intelligence" section with:
- Prospects (link to /prospects)
- Pipeline (link to /pipeline)
- Discovery (opens discovery modal or links to /prospects with auto-open)

Use lucide-react icons: `Target` for Prospects, `GitBranch` or `Columns` for Pipeline, `Search` for Discovery.

**Step 2: Add deal intelligence summary card to Dashboard**

Add a card showing:
- Total prospects count
- Hot prospects (score 70+) count
- Active deals count
- Recent signals detected (last 7 days)

Fetch from `/api/analytics/pipeline`.

**Step 3: Verify navigation works**

All nav links should route correctly. Dashboard card should show data.

**Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add Deal Intelligence navigation and dashboard card"
```

---

## Task 13: Backend - Seed Data for Demo

**Files:**
- Create: `database/migrations/002_seed_demo_prospects.sql`
- Modify: `database/init.sql` (append seed data)

**Step 1: Create seed data**

Insert 8-10 realistic demo prospects across HCA's target industries:

- 3 Healthcare companies (med device manufacturer, home health agency, dental group)
- 2 Consumer companies (specialty food brand, DTC e-commerce)
- 2 Industrial companies (precision machining, packaging manufacturer)
- 2 Business Services companies (IT staffing firm, commercial cleaning)

Each with:
- Realistic company details (name, location, revenue range, owner)
- Pre-calculated sell_likelihood_scores ranging from 25 to 92
- 3-5 signals per prospect
- 1-2 activities per prospect
- Varying pipeline stages (most in lead/contacted, a few in engaged/active_deal)

Include 1-2 prospects with `source_campaign_id` linking to an existing demo campaign to show attribution.

**Step 2: Run seed**

```bash
docker exec -i $(docker ps -q -f name=postgres) psql -U postgres -d marketing_platform < database/migrations/002_seed_demo_prospects.sql
```

**Step 3: Verify**

```bash
curl -s http://localhost:3000/api/prospects | jq '.prospects | length'
```

Expected: 8-10 prospects.

**Step 4: Commit**

```bash
git add database/
git commit -m "feat: add demo prospect seed data for HCA"
```

---

## Task 14: HCA Branding

**Files:**
- Modify: `frontend/src/index.css` (add HCA theme variables)
- Modify: `frontend/src/pages/LandingPage.tsx` (update copy for deal intelligence positioning)
- Modify: `frontend/src/pages/Dashboard.tsx` (update app title)

**Step 1: Add HCA brand colors**

Add CSS variables to `index.css` for HCA theme:
- Primary: Navy (#1a2744) - from HCA website
- Accent: Gold (#c5a54e)
- Keep existing dark glassmorphism background

Update the app title references from "SmartAds" to "HCA Deal Intelligence" in the dashboard header and landing page.

**Step 2: Update landing page**

Update `LandingPage.tsx` hero section:
- Title: "HCA Deal Intelligence"
- Subtitle: "AI-Powered Deal Sourcing for Middle-Market Investment Banking"
- Feature highlights: Signal-based prospecting, AI research briefs, pipeline management, integrated outreach

Keep existing marketing features accessible - just add deal intelligence as the primary hero.

**Step 3: Commit**

```bash
git add frontend/src/index.css frontend/src/pages/LandingPage.tsx frontend/src/pages/Dashboard.tsx
git commit -m "feat: add HCA branding and deal intelligence positioning"
```

---

## Task 15: Pipeline Analytics Tab

**Files:**
- Modify: `frontend/src/pages/Analytics.tsx` (add Pipeline tab)

**Step 1: Add Pipeline analytics tab**

The existing Analytics page has tabs/sections for campaign metrics. Add a "Pipeline" tab showing:

- **Funnel chart:** Bar chart showing prospect count by stage (Lead -> Contacted -> Engaged -> Active -> Closed) using Recharts BarChart
- **Conversion rates:** Card showing conversion % between each stage
- **Score distribution:** Histogram of sell_likelihood_scores
- **Industry breakdown:** Pie chart of prospects by industry
- **Signal summary:** Table of most common signal types and their average strength

Fetch data from `/api/analytics/pipeline` and `/api/analytics/signals`.

**Step 2: Commit**

```bash
git add frontend/src/pages/Analytics.tsx
git commit -m "feat: add pipeline analytics tab with funnel and signal charts"
```

---

## Task 16: Build, Test, and Deploy

**Files:**
- Modify: `helm/values/marketing-backend.yaml` (if image tag changes)

**Step 1: Full local test**

```bash
cd /Users/nomade/Documents/GitHub/ai-marketing-platform
docker-compose down && docker-compose up -d --build
```

Wait for services, then test:
- Login at http://localhost:5173/login
- Dashboard shows deal intelligence card
- /prospects page loads with seed data
- Click a prospect -> detail page with score, signals
- Click "AI Discover" -> modal works
- /pipeline shows Kanban board
- /analytics has Pipeline tab

**Step 2: Build production images**

```bash
docker buildx build --platform linux/amd64 -t gcr.io/ai-agency-479516/marketing-frontend:latest --push frontend/
docker buildx build --platform linux/amd64 -t gcr.io/ai-agency-479516/marketing-backend:latest --push backend/
```

**Step 3: Deploy to GKE**

```bash
helm upgrade --install marketing-backend ./helm/charts/microservice -f ./helm/values/marketing-backend.yaml -n prod
helm upgrade --install marketing-frontend ./helm/charts/microservice -f ./helm/values/marketing-frontend.yaml -n prod
```

**Step 4: Run migration on production database**

Apply the migration SQL to the production Cloud SQL instance.

**Step 5: Verify production**

```bash
curl -s https://marketing.agentprovision.com/health
curl -s https://marketing.agentprovision.com/api/prospects
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete HCA Deal Intelligence module MVP"
git push
```

---

## Execution Order Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Database migration (4 tables) | - |
| 2 | Prospect CRUD API | 1 |
| 3 | AI Signal Scoring Engine | 2 |
| 4 | AI Research Brief Generator | 2 |
| 5 | AI Prospect Discovery | 3 |
| 6 | Outreach Generation Routes | 2, 4 |
| 7 | Pipeline Analytics Routes | 2 |
| 8 | Prospects List Page | 2 |
| 9 | Prospect Detail Page | 3, 4, 6 |
| 10 | AI Discovery Modal | 5, 8 |
| 11 | Pipeline Kanban Board | 2 |
| 12 | Navigation Updates | 8, 11 |
| 13 | Seed Data | 1 |
| 14 | HCA Branding | 8 |
| 15 | Pipeline Analytics Tab | 7 |
| 16 | Build, Test, Deploy | All |

**Parallelizable groups:**
- Tasks 3, 4, 6, 7 can run in parallel (all depend on 2)
- Tasks 8, 11, 13, 14 can run in parallel (frontend + seed)
- Tasks 9, 10, 15 depend on earlier tasks
