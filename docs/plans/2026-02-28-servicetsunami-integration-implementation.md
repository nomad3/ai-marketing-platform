# ServiceTsunami Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire HCA Deal Intelligence as an orchestrated microservice under ServiceTsunami, with webhook events, Temporal workflows, and ADK sub-agents.

**Architecture:** HCA emits webhook events on prospect/outreach changes. ST receives them, runs Temporal DealPipelineWorkflow, which calls back into HCA's REST API via hca_tools.py. ADK deal_team supervisor routes chat requests to deal_analyst, deal_researcher, and outreach_specialist sub-agents.

**Tech Stack:** HCA: Express/TypeScript, ST: FastAPI/Python, Google ADK, Temporal, httpx, Pydantic

**Design Doc:** `docs/plans/2026-02-28-servicetsunami-integration-design.md`

---

## Phase 1: HCA Side — Webhook Emitter & Service Auth

### Task 1: Create webhook emitter utility

**Files:**
- Create: `backend/src/services/webhook-emitter.ts`

**Step 1: Write the webhook emitter service**

```typescript
import { query } from '../db.js';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export async function emitWebhook(event: string, data: Record<string, unknown>): Promise<void> {
  const url = process.env.SERVICETSUNAMI_WEBHOOK_URL;
  if (!url) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HCA-Event': event,
        'X-Service-Key': process.env.SERVICE_API_KEY || '',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err: any) {
    console.error(`[webhook] Failed to emit ${event}:`, err.message);
  }
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd /Users/nomade/Documents/GitHub/ai-marketing-platform/backend && npx tsc --noEmit`
Expected: No errors from new file

**Step 3: Commit**

```bash
git add backend/src/services/webhook-emitter.ts
git commit -m "feat: add webhook emitter service for ST integration"
```

---

### Task 2: Create service-to-service auth middleware

**Files:**
- Create: `backend/src/middleware/serviceAuth.ts`

**Step 1: Write the service auth middleware**

```typescript
import { Request, Response, NextFunction } from 'express';

export function authenticateService(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-service-key'] as string;
  const expectedKey = process.env.SERVICE_API_KEY;

  if (!expectedKey) {
    next();
    return;
  }

  if (serviceKey && serviceKey === expectedKey) {
    (req as any).isServiceCall = true;
    (req as any).user = { id: 0, email: 'system@servicetsunami.com', name: 'ServiceTsunami', role: 'admin' };
    next();
    return;
  }

  next();
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd /Users/nomade/Documents/GitHub/ai-marketing-platform/backend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/src/middleware/serviceAuth.ts
git commit -m "feat: add service-to-service auth middleware"
```

---

### Task 3: Create integration routes

**Files:**
- Create: `backend/src/routes/integration.ts`
- Modify: `backend/src/index.ts` (mount new route)

**Step 1: Write integration routes**

```typescript
import { Router, Request, Response } from 'express';
import { emitWebhook } from '../services/webhook-emitter.js';

const router = Router();

router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'hca-deal-intelligence',
    version: '1.0.0',
    uptime: process.uptime(),
    webhook_url: process.env.SERVICETSUNAMI_WEBHOOK_URL ? 'configured' : 'not_configured',
  });
});

router.get('/config', (req: Request, res: Response) => {
  res.json({
    events: [
      'prospect.created',
      'prospect.stage_changed',
      'prospect.scored',
      'prospect.research_completed',
      'outreach.status_changed',
    ],
    endpoints: [
      { method: 'GET', path: '/api/prospects', description: 'List/filter prospects' },
      { method: 'GET', path: '/api/prospects/:id', description: 'Get prospect detail' },
      { method: 'POST', path: '/api/prospects/discover', description: 'AI prospect discovery' },
      { method: 'POST', path: '/api/prospects/discover/save', description: 'Save discovered prospects' },
      { method: 'POST', path: '/api/prospects/:id/score', description: 'Run AI scoring' },
      { method: 'POST', path: '/api/prospects/:id/research', description: 'Generate research brief' },
      { method: 'PUT', path: '/api/prospects/:id/stage', description: 'Advance pipeline stage' },
      { method: 'POST', path: '/api/outreach/generate', description: 'Generate outreach' },
      { method: 'GET', path: '/api/outreach/prospect/:id', description: 'Get outreach drafts' },
      { method: 'PUT', path: '/api/outreach/:id/status', description: 'Update outreach status' },
    ],
    auth: {
      type: 'service_key',
      header: 'X-Service-Key',
    },
  });
});

router.post('/webhook-test', async (req: Request, res: Response) => {
  try {
    await emitWebhook('integration.test', { message: 'Test webhook from HCA' });
    res.json({ status: 'sent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

**Step 2: Mount in index.ts**

In `backend/src/index.ts`, add the import and route mount alongside existing routes:

```typescript
// Add import at top with other route imports
import integrationRoutes from './routes/integration.js';

// Add route mount alongside existing app.use lines (after the outreach route)
app.use('/api/integration', integrationRoutes);
```

**Step 3: Verify no TypeScript errors**

Run: `cd /Users/nomade/Documents/GitHub/ai-marketing-platform/backend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add backend/src/routes/integration.ts backend/src/index.ts
git commit -m "feat: add integration routes for ST connectivity"
```

---

### Task 4: Add webhook calls to prospects routes

**Files:**
- Modify: `backend/src/routes/prospects.ts`

**Step 1: Add webhook import and calls**

At top of `backend/src/routes/prospects.ts`, add import:

```typescript
import { emitWebhook } from '../services/webhook-emitter.js';
```

Add webhook calls after these operations:

**After prospect creation (POST `/`)** — at the end of the handler, before `res.json`:
```typescript
emitWebhook('prospect.created', {
  prospect_id: prospect.id,
  company_name: prospect.company_name,
  industry: prospect.industry,
  source: prospect.source,
});
```

**After scoring (POST `/:id/score`)** — after the score is saved:
```typescript
emitWebhook('prospect.scored', {
  prospect_id: req.params.id,
  score: scoreResult.score,
  score_breakdown: scoreResult.breakdown,
  company_name: prospect.company_name,
});
```

**After stage change (PUT `/:id/stage`)** — after the update query:
```typescript
emitWebhook('prospect.stage_changed', {
  prospect_id: req.params.id,
  old_stage: currentStage,
  new_stage: stage,
  company_name: prospect.company_name,
});
```

**After research generation (POST `/:id/research`)** — after research is saved:
```typescript
emitWebhook('prospect.research_completed', {
  prospect_id: req.params.id,
  company_name: prospect.company_name,
});
```

**Step 2: Verify no TypeScript errors**

Run: `cd /Users/nomade/Documents/GitHub/ai-marketing-platform/backend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/src/routes/prospects.ts
git commit -m "feat: emit webhooks on prospect create/score/stage/research"
```

---

### Task 5: Add webhook calls to outreach routes

**Files:**
- Modify: `backend/src/routes/outreach.ts`

**Step 1: Add webhook import and call**

At top of `backend/src/routes/outreach.ts`, add import:

```typescript
import { emitWebhook } from '../services/webhook-emitter.js';
```

In the PUT `/:id/status` handler, after the status update query succeeds:

```typescript
emitWebhook('outreach.status_changed', {
  outreach_id: req.params.id,
  prospect_id: draft.prospect_id,
  outreach_type: draft.outreach_type,
  old_status: draft.previous_status || 'unknown',
  new_status: status,
});
```

**Step 2: Verify no TypeScript errors**

Run: `cd /Users/nomade/Documents/GitHub/ai-marketing-platform/backend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/src/routes/outreach.ts
git commit -m "feat: emit webhooks on outreach status changes"
```

---

### Task 6: Add service auth to index.ts

**Files:**
- Modify: `backend/src/index.ts`

**Step 1: Wire service auth middleware**

In `backend/src/index.ts`, add the import and apply it globally before routes:

```typescript
// Add import
import { authenticateService } from './middleware/serviceAuth.js';

// Add middleware before route mounts (after CORS, before routes)
app.use(authenticateService);
```

**Step 2: Update .env.example**

Add to `backend/.env.example`:

```bash
# ServiceTsunami Integration
SERVICETSUNAMI_WEBHOOK_URL=http://servicetsunami-api:8001/api/v1/webhooks/hca
SERVICE_API_KEY=
```

**Step 3: Verify no TypeScript errors**

Run: `cd /Users/nomade/Documents/GitHub/ai-marketing-platform/backend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add backend/src/index.ts backend/.env.example
git commit -m "feat: wire service auth middleware and add env vars"
```

---

## Phase 2: ST Side — ADK Tools & Sub-Agents

> **Important:** Phase 2 tasks modify files in `/Users/nomade/Documents/GitHub/servicetsunami-agents/`

### Task 7: Create HCA tools file

**Files:**
- Create: `apps/adk-server/tools/hca_tools.py`

**Step 1: Write HCA tool functions**

Follow the exact pattern from `apps/adk-server/tools/sales_tools.py`:

```python
"""HCA Deal Intelligence tools - thin REST wrappers calling HCA API."""
import logging
from typing import Optional
import httpx

from tools.knowledge_tools import _resolve_tenant_id
from services.knowledge_graph import get_knowledge_service
from config.settings import settings

logger = logging.getLogger(__name__)

_http_client: Optional[httpx.AsyncClient] = None

HCA_BASE_URL = getattr(settings, "hca_api_url", "http://hca-api:3000")
HCA_SERVICE_KEY = getattr(settings, "hca_service_key", "")


def _get_hca_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            base_url=HCA_BASE_URL,
            timeout=30.0,
            headers={"X-Service-Key": HCA_SERVICE_KEY},
        )
    return _http_client


async def discover_prospects(
    industry: str,
    revenue_min: int = 10000000,
    revenue_max: int = 100000000,
    geography: str = "United States",
    max_results: int = 5,
    tenant_id: str = "auto",
) -> dict:
    """Discover M&A prospects in a given industry using AI signal analysis.

    Args:
        industry: Target industry (e.g. "Healthcare", "Technology").
        revenue_min: Minimum estimated revenue.
        revenue_max: Maximum estimated revenue.
        geography: Target geography.
        max_results: Number of prospects to discover (1-10).
        tenant_id: Tenant context.

    Returns:
        Dict with discovered prospects including company profiles and sell-likelihood indicators.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.post("/api/prospects/discover", json={
            "industry": industry,
            "revenue_min": revenue_min,
            "revenue_max": revenue_max,
            "geography": geography,
            "max_results": max_results,
        })
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"discover_prospects failed: {e}")
        return {"status": "error", "error": str(e)}


async def save_discovered_prospects(
    prospects: list,
    tenant_id: str = "auto",
) -> dict:
    """Save discovered prospects to the HCA pipeline.

    Args:
        prospects: List of prospect objects from discover_prospects.
        tenant_id: Tenant context.

    Returns:
        Dict with saved prospect IDs.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.post("/api/prospects/discover/save", json={
            "prospects": prospects,
        })
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"save_discovered_prospects failed: {e}")
        return {"status": "error", "error": str(e)}


async def score_prospect(
    prospect_id: str,
    tenant_id: str = "auto",
) -> dict:
    """Run AI sell-likelihood scoring on a prospect (0-100).

    Args:
        prospect_id: HCA prospect ID.
        tenant_id: Tenant context.

    Returns:
        Dict with score (0-100), breakdown by category, and signals.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.post(f"/api/prospects/{prospect_id}/score")
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"score_prospect failed: {e}")
        return {"status": "error", "error": str(e)}


async def get_prospect_detail(
    prospect_id: str,
    tenant_id: str = "auto",
) -> dict:
    """Get full prospect detail including signals, activities, and outreach drafts.

    Args:
        prospect_id: HCA prospect ID.
        tenant_id: Tenant context.

    Returns:
        Dict with full prospect data, signals, activities, and outreach history.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.get(f"/api/prospects/{prospect_id}")
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"get_prospect_detail failed: {e}")
        return {"status": "error", "error": str(e)}


async def generate_research_brief(
    prospect_id: str,
    tenant_id: str = "auto",
) -> dict:
    """Generate an investment-banking-quality research brief for a prospect.

    Args:
        prospect_id: HCA prospect ID.
        tenant_id: Tenant context.

    Returns:
        Dict with executive summary, financial indicators, competitive landscape, and suggested approach.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.post(f"/api/prospects/{prospect_id}/research")
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"generate_research_brief failed: {e}")
        return {"status": "error", "error": str(e)}


async def generate_outreach(
    prospect_id: str,
    outreach_type: str = "cold_email",
    tenant_id: str = "auto",
) -> dict:
    """Generate personalized outreach content for a prospect.

    Args:
        prospect_id: HCA prospect ID.
        outreach_type: One of 'cold_email', 'follow_up', 'linkedin_message', 'intro_one_pager'.
        tenant_id: Tenant context.

    Returns:
        Dict with subject line and content body.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.post("/api/outreach/generate", json={
            "prospectId": int(prospect_id),
            "outreachType": outreach_type,
        })
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"generate_outreach failed: {e}")
        return {"status": "error", "error": str(e)}


async def get_outreach_drafts(
    prospect_id: str,
    tenant_id: str = "auto",
) -> dict:
    """Get all outreach drafts for a prospect.

    Args:
        prospect_id: HCA prospect ID.
        tenant_id: Tenant context.

    Returns:
        Dict with list of outreach drafts and their statuses.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.get(f"/api/outreach/prospect/{prospect_id}")
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"get_outreach_drafts failed: {e}")
        return {"status": "error", "error": str(e)}


async def advance_pipeline_stage(
    prospect_id: str,
    new_stage: str,
    tenant_id: str = "auto",
) -> dict:
    """Move a prospect to a new pipeline stage.

    Args:
        prospect_id: HCA prospect ID.
        new_stage: Target stage ('lead', 'contacted', 'engaged', 'active_deal', 'closed_won', 'closed_lost').
        tenant_id: Tenant context.

    Returns:
        Dict with updated prospect data.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    try:
        resp = await client.put(f"/api/prospects/{prospect_id}/stage", json={
            "stage": new_stage,
        })
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"advance_pipeline_stage failed: {e}")
        return {"status": "error", "error": str(e)}


async def list_prospects(
    stage: str = "",
    industry: str = "",
    score_min: int = 0,
    search: str = "",
    sort: str = "score_desc",
    tenant_id: str = "auto",
) -> dict:
    """List and filter prospects from the HCA pipeline.

    Args:
        stage: Filter by pipeline stage (optional).
        industry: Filter by industry (optional).
        score_min: Minimum sell-likelihood score (optional).
        search: Search by company name (optional).
        sort: Sort order (optional).
        tenant_id: Tenant context.

    Returns:
        Dict with list of prospects matching the filters.
    """
    tenant_id = _resolve_tenant_id(tenant_id)
    client = _get_hca_client()
    params = {}
    if stage:
        params["stage"] = stage
    if industry:
        params["industry"] = industry
    if score_min:
        params["score_min"] = str(score_min)
    if search:
        params["search"] = search
    if sort:
        params["sort"] = sort
    try:
        resp = await client.get("/api/prospects", params=params)
        resp.raise_for_status()
        return {"status": "success", "data": resp.json()}
    except Exception as e:
        logger.error(f"list_prospects failed: {e}")
        return {"status": "error", "error": str(e)}


async def sync_prospect_to_knowledge_graph(
    prospect_id: str,
    tenant_id: str = "auto",
) -> dict:
    """Fetch a prospect from HCA and sync it to ST's knowledge graph as an entity.

    Args:
        prospect_id: HCA prospect ID.
        tenant_id: Tenant context.

    Returns:
        Dict with created/updated knowledge entity ID.
    """
    tenant_id = _resolve_tenant_id(tenant_id)

    # Fetch prospect from HCA
    detail = await get_prospect_detail(prospect_id, tenant_id)
    if detail.get("status") != "success":
        return detail

    prospect = detail["data"].get("prospect", detail["data"])
    kg = get_knowledge_service()

    # Check if entity already exists
    existing = await kg.find_entities(
        query=prospect.get("company_name", ""),
        tenant_id=tenant_id,
        entity_types=["company"],
        limit=1,
    )

    properties = {
        "hca_prospect_id": str(prospect_id),
        "industry": prospect.get("industry"),
        "sub_industry": prospect.get("sub_industry"),
        "revenue_min": prospect.get("estimated_revenue_min"),
        "revenue_max": prospect.get("estimated_revenue_max"),
        "employee_count": prospect.get("employee_count_range"),
        "location": f"{prospect.get('location_city', '')}, {prospect.get('location_state', '')}",
        "sell_likelihood_score": prospect.get("sell_likelihood_score"),
        "pipeline_stage": prospect.get("stage"),
        "owner_name": prospect.get("owner_name"),
        "website": prospect.get("website"),
        "source": "hca_deal_intelligence",
    }

    if existing and len(existing) > 0:
        entity_id = existing[0].get("id")
        await kg.update_entity(
            entity_id=entity_id,
            updates={"properties": properties},
            reason="Synced from HCA Deal Intelligence",
        )
    else:
        entity = await kg.create_entity(
            name=prospect.get("company_name", "Unknown"),
            entity_type="company",
            tenant_id=tenant_id,
            properties=properties,
        )
        entity_id = entity.get("id") if isinstance(entity, dict) else str(entity)

    return {
        "status": "success",
        "entity_id": entity_id,
        "prospect_id": str(prospect_id),
        "synced": True,
    }
```

**Step 2: Verify syntax**

Run: `cd /Users/nomade/Documents/GitHub/servicetsunami-agents && python -c "import ast; ast.parse(open('apps/adk-server/tools/hca_tools.py').read()); print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/adk-server/tools/hca_tools.py
git commit -m "feat: add HCA Deal Intelligence tool functions"
```

---

### Task 8: Add HCA settings to ADK config

**Files:**
- Modify: `apps/adk-server/config/settings.py`

**Step 1: Add HCA config fields**

Add these fields to the `Settings` class in `apps/adk-server/config/settings.py`:

```python
    # HCA Deal Intelligence API
    hca_api_url: str = "http://hca-api:3000"
    hca_service_key: str = ""
```

**Step 2: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/adk-server/config/settings.py
git commit -m "feat: add HCA API config to ADK settings"
```

---

### Task 9: Create deal_team sub-agents

**Files:**
- Create: `apps/adk-server/servicetsunami_supervisor/deal_analyst.py`
- Create: `apps/adk-server/servicetsunami_supervisor/deal_researcher.py`
- Create: `apps/adk-server/servicetsunami_supervisor/outreach_specialist.py`
- Create: `apps/adk-server/servicetsunami_supervisor/deal_team.py`

**Step 1: Create deal_analyst**

File: `apps/adk-server/servicetsunami_supervisor/deal_analyst.py`

```python
from google.adk.agents import Agent
from tools.hca_tools import (
    discover_prospects,
    save_discovered_prospects,
    score_prospect,
    get_prospect_detail,
    list_prospects,
    sync_prospect_to_knowledge_graph,
)
from tools.knowledge_tools import (
    search_knowledge,
    find_entities,
    create_entity,
)
from config.settings import settings

deal_analyst = Agent(
    name="deal_analyst",
    model=settings.adk_model,
    instruction="""You are a deal analyst specializing in middle-market M&A target identification.

    IMPORTANT: For the tenant_id parameter in all tools, use the value from the session state.
    If you cannot access the session state, use "auto" as tenant_id.

    Your capabilities:
    - Discover M&A acquisition targets by industry and criteria
    - Score prospects on sell-likelihood (0-100) using AI signal analysis
    - Retrieve detailed prospect information including signals
    - Filter and list prospects by stage, industry, or score
    - Sync prospect data to the knowledge graph

    ## Scoring categories (weighted):
    - ownership_succession (30%): Owner age, succession planning, retirement signals
    - market_timing (25%): Industry M&A activity, valuation multiples
    - company_performance (20%): Revenue trajectory, EBITDA margins
    - external_triggers (15%): PE rollups, competitor exits
    - negative_signals (-10%): Litigation, key person risk

    ## Workflow:
    1. Discover prospects -> save to pipeline -> score each -> sync to knowledge graph
    2. For ad-hoc queries: list_prospects with filters, get_prospect_detail for deep dive
    3. Always sync high-value prospects (score >= 70) to knowledge graph

    ## Pipeline stages:
    lead -> contacted -> engaged -> active_deal -> closed_won / closed_lost
    """,
    tools=[
        discover_prospects,
        save_discovered_prospects,
        score_prospect,
        get_prospect_detail,
        list_prospects,
        sync_prospect_to_knowledge_graph,
        search_knowledge,
        find_entities,
        create_entity,
    ],
)
```

**Step 2: Create deal_researcher**

File: `apps/adk-server/servicetsunami_supervisor/deal_researcher.py`

```python
from google.adk.agents import Agent
from tools.hca_tools import (
    generate_research_brief,
    get_prospect_detail,
    sync_prospect_to_knowledge_graph,
)
from tools.knowledge_tools import (
    search_knowledge,
    find_entities,
    record_observation,
)
from config.settings import settings

deal_researcher = Agent(
    name="deal_researcher",
    model=settings.adk_model,
    instruction="""You are a deal researcher creating investment-banking-quality target briefs.

    IMPORTANT: For the tenant_id parameter in all tools, use the value from the session state.
    If you cannot access the session state, use "auto" as tenant_id.

    Your capabilities:
    - Generate comprehensive research briefs for M&A prospects
    - Access prospect detail including financial indicators and signals
    - Store research findings in the knowledge graph
    - Search existing knowledge for related entities and market data

    ## Research brief structure:
    - Executive summary
    - Company overview and financial indicators
    - Competitive landscape
    - Comparable transactions
    - Key personnel analysis
    - Signal summary (sell-likelihood drivers)
    - Suggested approach strategy

    ## Workflow:
    1. Get prospect detail first to understand the company
    2. Search knowledge graph for related entities/industry data
    3. Generate research brief via AI
    4. Sync updated prospect to knowledge graph
    5. Record key observations for future reference
    """,
    tools=[
        generate_research_brief,
        get_prospect_detail,
        sync_prospect_to_knowledge_graph,
        search_knowledge,
        find_entities,
        record_observation,
    ],
)
```

**Step 3: Create outreach_specialist**

File: `apps/adk-server/servicetsunami_supervisor/outreach_specialist.py`

```python
from google.adk.agents import Agent
from tools.hca_tools import (
    generate_outreach,
    get_outreach_drafts,
    get_prospect_detail,
    advance_pipeline_stage,
)
from config.settings import settings

outreach_specialist = Agent(
    name="outreach_specialist",
    model=settings.adk_model,
    instruction="""You are an outreach specialist creating personalized M&A engagement content.

    IMPORTANT: For the tenant_id parameter in all tools, use the value from the session state.
    If you cannot access the session state, use "auto" as tenant_id.

    Your capabilities:
    - Generate personalized outreach (cold emails, follow-ups, LinkedIn messages, one-pagers)
    - View existing outreach drafts for a prospect
    - Advance prospects through pipeline stages after outreach
    - Access prospect detail for personalization context

    ## Outreach types:
    - cold_email: Initial contact with value proposition
    - follow_up: Second touch with new angle
    - linkedin_message: Short LinkedIn InMail/connection request
    - intro_one_pager: Deal teaser document for serious prospects

    ## Workflow:
    1. Get prospect detail for context
    2. Check existing outreach drafts to avoid repetition
    3. Generate appropriate outreach type based on pipeline stage
    4. After outreach is sent, advance pipeline stage (lead -> contacted, contacted -> engaged)

    ## Stage advancement rules:
    - First outreach sent: lead -> contacted
    - Response received: contacted -> engaged
    - Meeting scheduled: engaged -> active_deal
    """,
    tools=[
        generate_outreach,
        get_outreach_drafts,
        get_prospect_detail,
        advance_pipeline_stage,
    ],
)
```

**Step 4: Create deal_team supervisor**

File: `apps/adk-server/servicetsunami_supervisor/deal_team.py`

```python
from google.adk.agents import Agent
from .deal_analyst import deal_analyst
from .deal_researcher import deal_researcher
from .outreach_specialist import outreach_specialist
from config.settings import settings

deal_team = Agent(
    name="deal_team",
    model=settings.adk_model,
    instruction="""You are the deal intelligence team supervisor for middle-market M&A.

    IMPORTANT: You are a ROUTING agent only. You do NOT have tools.
    Your ONLY capability is to transfer tasks to your sub-agents using transfer_to_agent.

    ## Your team:
    - **deal_analyst**: Prospect discovery, scoring, pipeline filtering, and knowledge graph sync
    - **deal_researcher**: Research brief generation, market analysis, competitive intelligence
    - **outreach_specialist**: Personalized outreach content, pipeline stage advancement

    ## Default routing:
    - "Find companies" / "Discover prospects" / "Score this company" -> deal_analyst
    - "Research this company" / "Generate a brief" / "Market analysis" -> deal_researcher
    - "Write an email" / "Draft outreach" / "Follow up" / "LinkedIn message" -> outreach_specialist
    - "Run the full pipeline" -> deal_analyst first, then deal_researcher, then outreach_specialist

    ## Full pipeline flow:
    1. deal_analyst discovers and scores prospects
    2. deal_researcher generates briefs for high-scorers (>= 70)
    3. outreach_specialist creates personalized outreach
    """,
    sub_agents=[deal_analyst, deal_researcher, outreach_specialist],
)
```

**Step 5: Verify syntax for all files**

Run: `cd /Users/nomade/Documents/GitHub/servicetsunami-agents && for f in apps/adk-server/servicetsunami_supervisor/deal_analyst.py apps/adk-server/servicetsunami_supervisor/deal_researcher.py apps/adk-server/servicetsunami_supervisor/outreach_specialist.py apps/adk-server/servicetsunami_supervisor/deal_team.py; do python -c "import ast; ast.parse(open('$f').read()); print('$f OK')"; done`
Expected: All OK

**Step 6: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/adk-server/servicetsunami_supervisor/deal_analyst.py \
        apps/adk-server/servicetsunami_supervisor/deal_researcher.py \
        apps/adk-server/servicetsunami_supervisor/outreach_specialist.py \
        apps/adk-server/servicetsunami_supervisor/deal_team.py
git commit -m "feat: add deal_team supervisor and sub-agents for HCA integration"
```

---

### Task 10: Wire deal_team into root agent

**Files:**
- Modify: `apps/adk-server/servicetsunami_supervisor/__init__.py`
- Modify: `apps/adk-server/servicetsunami_supervisor/agent.py`

**Step 1: Update __init__.py**

Add to leaf agent imports:
```python
from .deal_analyst import deal_analyst
from .deal_researcher import deal_researcher
from .outreach_specialist import outreach_specialist
```

Add to team supervisor imports:
```python
from .deal_team import deal_team
```

Add to `__all__`:
```python
    "deal_team",
    "deal_analyst",
    "deal_researcher",
    "outreach_specialist",
```

**Step 2: Update agent.py (root agent)**

Add import:
```python
from .deal_team import deal_team
```

Add `deal_team` to the `sub_agents` list in the root agent.

Add routing instruction to the root agent's instruction string:
```
- **deal_team** — M&A deal intelligence, prospect discovery, scoring, research briefs, outreach generation.
  Route here when: "find acquisition targets", "score a company", "M&A readiness", "generate outreach",
  "research brief", "deal pipeline", "prospects"
```

**Step 3: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/adk-server/servicetsunami_supervisor/__init__.py \
        apps/adk-server/servicetsunami_supervisor/agent.py
git commit -m "feat: wire deal_team into root agent routing"
```

---

## Phase 3: ST Side — Temporal Workflow & Webhook Receiver

### Task 11: Create DealPipelineWorkflow

**Files:**
- Create: `apps/api/app/workflows/deal_pipeline.py`

**Step 1: Write the workflow**

Follow the pattern from `apps/api/app/workflows/task_execution.py`:

```python
from temporalio import workflow
from datetime import timedelta
from typing import Dict, Any, List


@workflow.defn(sandboxed=False)
class DealPipelineWorkflow:
    """Durable workflow for full M&A deal pipeline orchestration.

    Steps:
    1. discover_prospects - AI-powered prospect discovery
    2. score_prospects - Score each prospect for sell-likelihood
    3. generate_research - Create research briefs for high-scorers
    4. generate_outreach - Create outreach drafts
    5. advance_pipeline - Move prospects to next stage
    6. sync_knowledge_graph - Sync all prospects to ST knowledge graph
    """

    @workflow.run
    async def run(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the full deal pipeline.

        Args:
            params: Dict with:
                - tenant_id: UUID string
                - industry: Target industry
                - criteria: Dict with revenue_min, revenue_max, geography, max_results
                - score_threshold: Minimum score to continue (default 70)
                - outreach_type: Type of outreach to generate (default 'cold_email')
        """
        tenant_id = params["tenant_id"]
        industry = params["industry"]
        criteria = params.get("criteria", {})
        score_threshold = params.get("score_threshold", 70)
        outreach_type = params.get("outreach_type", "cold_email")

        retry_policy = workflow.RetryPolicy(
            maximum_attempts=3,
            initial_interval=timedelta(seconds=10),
            backoff_coefficient=2.0,
        )

        workflow.logger.info(f"Starting deal pipeline for {industry}")

        # Step 1: Discover prospects
        discover_result = await workflow.execute_activity(
            "hca_discover_prospects",
            args=[tenant_id, industry, criteria],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy,
        )

        if discover_result.get("status") != "success":
            return {"status": "error", "step": "discover", "error": discover_result.get("error")}

        prospect_ids = discover_result.get("prospect_ids", [])
        workflow.logger.info(f"Discovered {len(prospect_ids)} prospects")

        if not prospect_ids:
            return {"status": "completed", "prospects_found": 0}

        # Step 2: Score prospects
        score_results = await workflow.execute_activity(
            "hca_score_prospects",
            args=[tenant_id, prospect_ids],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy,
        )

        high_scorers = [
            p for p in score_results.get("results", [])
            if p.get("score", 0) >= score_threshold
        ]
        high_scorer_ids = [str(p["prospect_id"]) for p in high_scorers]

        workflow.logger.info(
            f"Scored {len(prospect_ids)} prospects, "
            f"{len(high_scorer_ids)} above threshold ({score_threshold})"
        )

        if not high_scorer_ids:
            return {
                "status": "completed",
                "prospects_found": len(prospect_ids),
                "above_threshold": 0,
            }

        # Step 3: Generate research briefs
        research_result = await workflow.execute_activity(
            "hca_generate_research",
            args=[tenant_id, high_scorer_ids],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=retry_policy,
        )

        workflow.logger.info(f"Generated {research_result.get('count', 0)} research briefs")

        # Step 4: Generate outreach
        outreach_result = await workflow.execute_activity(
            "hca_generate_outreach",
            args=[tenant_id, high_scorer_ids, outreach_type],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy,
        )

        workflow.logger.info(f"Generated {outreach_result.get('count', 0)} outreach drafts")

        # Step 5: Advance pipeline
        advance_result = await workflow.execute_activity(
            "hca_advance_pipeline",
            args=[tenant_id, high_scorer_ids, "contacted"],
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=retry_policy,
        )

        # Step 6: Sync to knowledge graph
        sync_result = await workflow.execute_activity(
            "hca_sync_knowledge_graph",
            args=[tenant_id, prospect_ids],
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=retry_policy,
        )

        return {
            "status": "completed",
            "prospects_found": len(prospect_ids),
            "above_threshold": len(high_scorer_ids),
            "research_generated": research_result.get("count", 0),
            "outreach_generated": outreach_result.get("count", 0),
            "synced_to_kg": sync_result.get("count", 0),
        }
```

**Step 2: Verify syntax**

Run: `cd /Users/nomade/Documents/GitHub/servicetsunami-agents && python -c "import ast; ast.parse(open('apps/api/app/workflows/deal_pipeline.py').read()); print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/api/app/workflows/deal_pipeline.py
git commit -m "feat: add DealPipelineWorkflow Temporal workflow"
```

---

### Task 12: Create Temporal activities for deal pipeline

**Files:**
- Create: `apps/api/app/workflows/activities/hca_activities.py`

**Step 1: Write activity implementations**

Follow the pattern from `apps/api/app/workflows/activities/task_execution.py`:

```python
from temporalio import activity
from typing import Dict, Any, List
import httpx
import logging

logger = logging.getLogger(__name__)

_http_client = None


def _get_hca_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        from app.core.config import settings
        hca_url = getattr(settings, "HCA_API_URL", "http://hca-api:3000")
        hca_key = getattr(settings, "HCA_SERVICE_KEY", "")
        _http_client = httpx.AsyncClient(
            base_url=hca_url,
            timeout=30.0,
            headers={"X-Service-Key": hca_key},
        )
    return _http_client


@activity.defn
async def hca_discover_prospects(
    tenant_id: str, industry: str, criteria: Dict[str, Any]
) -> Dict[str, Any]:
    """Discover prospects via HCA API and save them."""
    client = _get_hca_client()
    try:
        resp = await client.post("/api/prospects/discover", json={
            "industry": industry,
            "revenue_min": criteria.get("revenue_min", 10_000_000),
            "revenue_max": criteria.get("revenue_max", 100_000_000),
            "geography": criteria.get("geography", "United States"),
            "max_results": criteria.get("max_results", 5),
        })
        resp.raise_for_status()
        discovered = resp.json()

        # Save discovered prospects
        save_resp = await client.post("/api/prospects/discover/save", json={
            "prospects": discovered.get("prospects", discovered),
        })
        save_resp.raise_for_status()
        saved = save_resp.json()

        prospect_ids = [str(p.get("id")) for p in saved.get("prospects", saved) if p.get("id")]
        return {"status": "success", "prospect_ids": prospect_ids}
    except Exception as e:
        logger.error(f"hca_discover_prospects failed: {e}")
        return {"status": "error", "error": str(e), "prospect_ids": []}


@activity.defn
async def hca_score_prospects(
    tenant_id: str, prospect_ids: List[str]
) -> Dict[str, Any]:
    """Score a batch of prospects."""
    client = _get_hca_client()
    results = []
    for pid in prospect_ids:
        try:
            resp = await client.post(f"/api/prospects/{pid}/score")
            resp.raise_for_status()
            data = resp.json()
            results.append({
                "prospect_id": pid,
                "score": data.get("score", data.get("prospect", {}).get("sell_likelihood_score", 0)),
            })
        except Exception as e:
            logger.error(f"Failed to score prospect {pid}: {e}")
            results.append({"prospect_id": pid, "score": 0, "error": str(e)})
    return {"status": "success", "results": results}


@activity.defn
async def hca_generate_research(
    tenant_id: str, prospect_ids: List[str]
) -> Dict[str, Any]:
    """Generate research briefs for prospects."""
    client = _get_hca_client()
    count = 0
    for pid in prospect_ids:
        try:
            resp = await client.post(f"/api/prospects/{pid}/research")
            resp.raise_for_status()
            count += 1
        except Exception as e:
            logger.error(f"Failed to generate research for {pid}: {e}")
    return {"status": "success", "count": count}


@activity.defn
async def hca_generate_outreach(
    tenant_id: str, prospect_ids: List[str], outreach_type: str
) -> Dict[str, Any]:
    """Generate outreach drafts for prospects."""
    client = _get_hca_client()
    count = 0
    for pid in prospect_ids:
        try:
            resp = await client.post("/api/outreach/generate", json={
                "prospectId": int(pid),
                "outreachType": outreach_type,
            })
            resp.raise_for_status()
            count += 1
        except Exception as e:
            logger.error(f"Failed to generate outreach for {pid}: {e}")
    return {"status": "success", "count": count}


@activity.defn
async def hca_advance_pipeline(
    tenant_id: str, prospect_ids: List[str], new_stage: str
) -> Dict[str, Any]:
    """Advance prospects to a new pipeline stage."""
    client = _get_hca_client()
    count = 0
    for pid in prospect_ids:
        try:
            resp = await client.put(f"/api/prospects/{pid}/stage", json={"stage": new_stage})
            resp.raise_for_status()
            count += 1
        except Exception as e:
            logger.error(f"Failed to advance {pid}: {e}")
    return {"status": "success", "count": count}


@activity.defn
async def hca_sync_knowledge_graph(
    tenant_id: str, prospect_ids: List[str]
) -> Dict[str, Any]:
    """Sync prospects to ST knowledge graph.

    Note: This activity calls HCA to get prospect data, then uses
    the knowledge extraction service to create entities.
    """
    client = _get_hca_client()
    from app.services.knowledge_extraction import KnowledgeExtractionService
    from app.db.session import SessionLocal

    db = SessionLocal()
    count = 0
    try:
        ke_service = KnowledgeExtractionService(db)
        for pid in prospect_ids:
            try:
                resp = await client.get(f"/api/prospects/{pid}")
                resp.raise_for_status()
                prospect = resp.json().get("prospect", resp.json())

                text = (
                    f"Company: {prospect.get('company_name')}. "
                    f"Industry: {prospect.get('industry')}. "
                    f"Revenue: ${prospect.get('estimated_revenue_min', 0):,}-${prospect.get('estimated_revenue_max', 0):,}. "
                    f"Score: {prospect.get('sell_likelihood_score', 'N/A')}/100. "
                    f"Stage: {prospect.get('stage')}. "
                    f"Owner: {prospect.get('owner_name')}."
                )

                await ke_service.extract_and_store(
                    text=text,
                    tenant_id=tenant_id,
                    source_type="hca_deal_intelligence",
                    metadata={"hca_prospect_id": str(pid)},
                )
                count += 1
            except Exception as e:
                logger.error(f"Failed to sync prospect {pid} to KG: {e}")
    finally:
        db.close()

    return {"status": "success", "count": count}
```

**Step 2: Verify syntax**

Run: `cd /Users/nomade/Documents/GitHub/servicetsunami-agents && python -c "import ast; ast.parse(open('apps/api/app/workflows/activities/hca_activities.py').read()); print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/api/app/workflows/activities/hca_activities.py
git commit -m "feat: add Temporal activities for HCA deal pipeline"
```

---

### Task 13: Create webhook receiver endpoint

**Files:**
- Create: `apps/api/app/api/v1/webhooks.py`
- Modify: `apps/api/app/api/v1/routes.py`

**Step 1: Write webhook receiver**

```python
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import logging
from temporalio.client import Client

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/hca")
async def receive_hca_webhook(request: Request) -> Dict[str, Any]:
    """Receive webhook events from HCA Deal Intelligence."""
    body = await request.json()
    event = body.get("event", "")
    data = body.get("data", {})

    logger.info(f"Received HCA webhook: {event}")

    # Validate event header matches body
    header_event = request.headers.get("X-HCA-Event", "")
    if header_event and header_event != event:
        raise HTTPException(status_code=400, detail="Event header mismatch")

    # Handle events
    if event == "prospect.created":
        logger.info(f"New prospect: {data.get('company_name')} ({data.get('industry')})")
        # Could trigger scoring workflow here

    elif event == "prospect.scored":
        score = data.get("score", 0)
        logger.info(f"Prospect scored: {data.get('company_name')} = {score}/100")
        # Could trigger research if score >= threshold

    elif event == "prospect.stage_changed":
        logger.info(
            f"Stage change: {data.get('company_name')} "
            f"{data.get('old_stage')} -> {data.get('new_stage')}"
        )

    elif event == "outreach.status_changed":
        logger.info(
            f"Outreach status: {data.get('new_status')} "
            f"for prospect {data.get('prospect_id')}"
        )

    elif event == "prospect.research_completed":
        logger.info(f"Research completed: {data.get('company_name')}")

    elif event == "integration.test":
        logger.info("Test webhook received successfully")

    else:
        logger.warning(f"Unknown HCA event: {event}")

    return {"status": "received", "event": event}
```

**Step 2: Mount in routes.py**

In `apps/api/app/api/v1/routes.py`, add:

```python
from app.api.v1 import webhooks
```

And at the end of the router includes:
```python
router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
```

**Step 3: Verify syntax**

Run: `cd /Users/nomade/Documents/GitHub/servicetsunami-agents && python -c "import ast; ast.parse(open('apps/api/app/api/v1/webhooks.py').read()); print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/api/app/api/v1/webhooks.py apps/api/app/api/v1/routes.py
git commit -m "feat: add webhook receiver endpoint for HCA events"
```

---

### Task 14: Register workflow and activities in worker

**Files:**
- Modify: `apps/api/app/workers/orchestration_worker.py`

**Step 1: Add imports and register**

Add imports:
```python
from app.workflows.deal_pipeline import DealPipelineWorkflow
from app.workflows.activities.hca_activities import (
    hca_discover_prospects,
    hca_score_prospects,
    hca_generate_research,
    hca_generate_outreach,
    hca_advance_pipeline,
    hca_sync_knowledge_graph,
)
```

Add `DealPipelineWorkflow` to the `workflows` list in the Worker constructor.

Add all 6 `hca_*` activity functions to the `activities` list in the Worker constructor.

**Step 2: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/api/app/workers/orchestration_worker.py
git commit -m "feat: register DealPipelineWorkflow in orchestration worker"
```

---

### Task 15: Add HCA config to ST API settings

**Files:**
- Modify: `apps/api/app/core/config.py`

**Step 1: Add HCA config fields**

Add to the Settings class:
```python
    HCA_API_URL: str = os.getenv("HCA_API_URL", "http://hca-api:3000")
    HCA_SERVICE_KEY: str = os.getenv("HCA_SERVICE_KEY", "")
```

**Step 2: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add apps/api/app/core/config.py
git commit -m "feat: add HCA API config to ST settings"
```

---

## Phase 4: Kubernetes Deployment

### Task 16: Create Helm values for HCA services

**Files:**
- Create: `helm/values/hca-api.yaml` (in ai-marketing-platform repo)
- Create: `helm/values/hca-web.yaml` (in ai-marketing-platform repo)

**Step 1: Create hca-api.yaml**

File: `/Users/nomade/Documents/GitHub/ai-marketing-platform/helm/values/hca-api.yaml`

```yaml
replicaCount: 1

image:
  repository: gcr.io/ai-agency-479516/hca-api
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 3000

env:
  - name: NODE_ENV
    value: "production"
  - name: PORT
    value: "3000"
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: hca-secrets
        key: database-url
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: hca-secrets
        key: jwt-secret
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: hca-secrets
        key: openai-api-key
  - name: SERVICE_API_KEY
    valueFrom:
      secretKeyRef:
        name: hca-secrets
        key: service-api-key
  - name: SERVICETSUNAMI_WEBHOOK_URL
    value: "http://servicetsunami-api:8000/api/v1/webhooks/hca"

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

**Step 2: Create hca-web.yaml**

File: `/Users/nomade/Documents/GitHub/ai-marketing-platform/helm/values/hca-web.yaml`

```yaml
replicaCount: 1

image:
  repository: gcr.io/ai-agency-479516/hca-web
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80

env:
  - name: VITE_API_URL
    value: "http://hca-api:3000"

resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "250m"

livenessProbe:
  httpGet:
    path: /
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 30
```

**Step 3: Commit**

```bash
cd /Users/nomade/Documents/GitHub/ai-marketing-platform
git add helm/values/hca-api.yaml helm/values/hca-web.yaml
git commit -m "feat: add Helm values for HCA k8s deployment"
```

---

### Task 17: Update ST Helm values with HCA env vars

**Files:**
- Modify: `helm/values/servicetsunami-api.yaml` (in servicetsunami-agents repo)
- Modify: `helm/values/servicetsunami-worker.yaml` (in servicetsunami-agents repo)

**Step 1: Add HCA env vars to both files**

Add to the `env` section of both `servicetsunami-api.yaml` and `servicetsunami-worker.yaml`:

```yaml
  - name: HCA_API_URL
    value: "http://hca-api:3000"
  - name: HCA_SERVICE_KEY
    valueFrom:
      secretKeyRef:
        name: hca-secrets
        key: service-api-key
```

Add to `servicetsunami-adk.yaml`:

```yaml
  - name: HCA_API_URL
    value: "http://hca-api:3000"
  - name: HCA_SERVICE_KEY
    valueFrom:
      secretKeyRef:
        name: hca-secrets
        key: service-api-key
```

**Step 2: Commit**

```bash
cd /Users/nomade/Documents/GitHub/servicetsunami-agents
git add helm/values/servicetsunami-api.yaml helm/values/servicetsunami-worker.yaml helm/values/servicetsunami-adk.yaml
git commit -m "feat: add HCA env vars to ST Helm values"
```

---

## Task Summary

| # | Task | Repo | Phase |
|---|------|------|-------|
| 1 | Webhook emitter service | HCA | 1 - HCA |
| 2 | Service auth middleware | HCA | 1 - HCA |
| 3 | Integration routes | HCA | 1 - HCA |
| 4 | Webhook calls in prospects | HCA | 1 - HCA |
| 5 | Webhook calls in outreach | HCA | 1 - HCA |
| 6 | Wire service auth + env vars | HCA | 1 - HCA |
| 7 | HCA tools file (10 functions) | ST | 2 - ADK |
| 8 | ADK settings for HCA | ST | 2 - ADK |
| 9 | Deal team sub-agents (4 files) | ST | 2 - ADK |
| 10 | Wire deal_team into root | ST | 2 - ADK |
| 11 | DealPipelineWorkflow | ST | 3 - Temporal |
| 12 | Temporal activities (6 functions) | ST | 3 - Temporal |
| 13 | Webhook receiver endpoint | ST | 3 - Temporal |
| 14 | Register in worker | ST | 3 - Temporal |
| 15 | ST API config for HCA | ST | 3 - Temporal |
| 16 | HCA Helm values | HCA | 4 - K8s |
| 17 | ST Helm values update | ST | 4 - K8s |
