# ServiceTsunami Integration Design

**Date:** 2026-02-28
**Status:** Approved
**Scope:** Integrate HCA Deal Intelligence with ServiceTsunami for workflow orchestration

## Decision Summary

- **Direction:** ST orchestrates HCA (HCA = specialized microservice)
- **Runtime:** HCA stays as Node.js/Express microservice, ST calls via REST
- **Scope:** Full deal pipeline orchestration (discovery → scoring → research → outreach → pipeline)
- **Frontend:** HCA React app talks to its own backend, ST orchestrates in background
- **Pattern:** Webhook-driven — HCA emits events, ST runs Temporal workflows

## Architecture

```
root_agent (servicetsunami_supervisor)
├── personal_assistant
├── dev_team
├── data_team
├── sales_team
├── marketing_team
├── vet_supervisor
└── deal_team  ← NEW SUPERVISOR
    ├── deal_analyst        ← Scoring + signals (calls HCA API)
    ├── deal_researcher     ← Research briefs (calls HCA API)
    └── outreach_specialist ← Outreach generation (calls HCA API)
```

```
┌─────────────────────────────────────────────────────────────┐
│                ServiceTsunami (Orchestrator)                 │
│                                                              │
│  ┌──────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │ ADK      │   │ Temporal Workers  │   │ FastAPI        │  │
│  │ deal_team│   │                  │   │ /api/v1/       │  │
│  │ supervisor│  │ DealPipeline     │   │ webhooks/hca   │  │
│  │          │◄──┤ Workflow         │◄──┤                │  │
│  │ Sub-     │   │                  │   │ Receives HCA   │  │
│  │ agents   │   │ Activities:      │   │ webhook events │  │
│  └──────────┘   │  discover        │   └────────────────┘  │
│                  │  score           │          ▲             │
│                  │  research        │          │ HTTP POST   │
│                  │  outreach        │          │ webhooks    │
│                  │  advance_stage   │          │             │
│                  │  sync_kg         │          │             │
│                  └──────────────────┘          │             │
└───────────────────────────────────────────────┼─────────────┘
                                                 │
┌────────────────────────────────────────────────┼─────────────┐
│            HCA Deal Intelligence               │             │
│                                                │             │
│  Express API (/api/)───────────────────────────┘             │
│    │                                                         │
│    ├─ Webhook emitter (NEW)                                  │
│    │   Events: prospect.created, prospect.stage_changed,     │
│    │           prospect.scored, outreach.status_changed,     │
│    │           prospect.research_completed                   │
│    │                                                         │
│    ├─ Existing endpoints (unchanged)                         │
│    │   /api/prospects, /api/outreach, /api/analytics...      │
│    │                                                         │
│    ├─ Integration routes (NEW)                               │
│    │   /api/integration/status                               │
│    │   /api/integration/config                               │
│    │                                                         │
│    └─ Service auth middleware (NEW)                           │
│        X-Service-Key header for ST→HCA calls                 │
│                                                              │
│  React Frontend (unchanged)                                  │
│    Talks to Express API directly                             │
└──────────────────────────────────────────────────────────────┘
```

**Key principle:** HCA tools in ST are thin REST wrappers — they don't duplicate HCA's AI logic. HCA's OpenAI agents do the actual work. ST orchestrates when and how they're called.

## Webhook Events (HCA → ST)

| Event | Trigger | Payload |
|-------|---------|---------|
| `prospect.created` | New prospect added (manual or discovery) | `{prospect_id, company_name, industry, source}` |
| `prospect.stage_changed` | Pipeline stage transition | `{prospect_id, old_stage, new_stage, company_name}` |
| `prospect.scored` | AI scoring completed | `{prospect_id, score, score_breakdown, company_name}` |
| `outreach.status_changed` | Draft approved/sent | `{outreach_id, prospect_id, type, old_status, new_status}` |
| `prospect.research_completed` | Research brief generated | `{prospect_id, company_name}` |

Webhooks are non-blocking fire-and-forget POSTs to `SERVICETSUNAMI_WEBHOOK_URL`. Failed webhooks are logged but don't block the user operation.

## Temporal Workflow: DealPipelineWorkflow

Full deal pipeline orchestration as a durable Temporal workflow:

```
Trigger: prospect.created webhook OR "discover prospects" chat command
    │
    ▼
Activity 1: discover_prospects(industry, criteria)
    │         → Calls HCA POST /api/prospects/discover
    │         → Saves via POST /api/prospects/discover/save
    │
    ▼
Activity 2: score_prospects(prospect_ids)
    │         → Calls HCA POST /api/prospects/:id/score for each
    │         → Filters: only prospects scoring ≥70 continue
    │
    ▼
Activity 3: generate_research(prospect_ids)
    │         → Calls HCA POST /api/prospects/:id/research
    │         → Stores research in ST knowledge graph
    │
    ▼
Activity 4: generate_outreach(prospect_ids, outreach_type)
    │         → Calls HCA POST /api/outreach/generate
    │         → Creates drafts for human review
    │
    ▼
Activity 5: advance_pipeline(prospect_ids, new_stage)
    │         → Calls HCA PUT /api/prospects/:id/stage
    │         → Moves high-potential prospects to "contacted"
    │
    ▼
Activity 6: sync_to_knowledge_graph(prospect_ids)
              → Maps HCA prospects to ST knowledge entities
              → Creates relations (prospect → industry, prospect → signals)
```

### Scheduled Workflow: DealRescoringSchedule

Runs weekly on Temporal scheduler:
1. Fetch all active prospects from HCA (`GET /api/prospects?stage=lead,contacted,engaged`)
2. Re-score each (`POST /api/prospects/:id/score`)
3. For prospects that crossed the ≥70 threshold, trigger research + outreach activities
4. Log results in ST execution trace

## ADK Sub-Agents (ST Side)

### deal_team Supervisor

Routing-only agent (no tools), delegates to sub-agents:

```python
deal_team = Agent(
    name="deal_team",
    model=settings.adk_model,
    instruction="""ROUTING agent for M&A deal intelligence.

    Route to:
    - deal_analyst: scoring, signals, prospect evaluation
    - deal_researcher: research briefs, market analysis
    - outreach_specialist: email/LinkedIn outreach, follow-ups
    """,
    sub_agents=[deal_analyst, deal_researcher, outreach_specialist],
)
```

### deal_analyst

Handles prospect discovery, scoring, and signal analysis:

**Tools:** `discover_prospects`, `save_discovered_prospects`, `score_prospect`, `get_prospect_detail`, `list_prospects`

### deal_researcher

Generates research briefs and syncs findings to knowledge graph:

**Tools:** `generate_research_brief`, `get_prospect_detail`, `sync_to_knowledge_graph`

### outreach_specialist

Creates and manages outreach drafts:

**Tools:** `generate_outreach`, `get_outreach_drafts`, `advance_pipeline_stage`

## Tool Functions: hca_tools.py

All tools follow ST's standard pattern:
- `tenant_id: str = "auto"` parameter
- Return `{"status": "success/error", "data": ...}`
- Use `httpx` for async HTTP calls to HCA
- HCA API base URL from settings/credential vault

| Tool | Purpose | HCA Endpoint |
|------|---------|--------------|
| `discover_prospects` | AI prospect discovery | `POST /api/prospects/discover` |
| `save_discovered_prospects` | Save to pipeline | `POST /api/prospects/discover/save` |
| `score_prospect` | Run AI scoring | `POST /api/prospects/:id/score` |
| `get_prospect_detail` | Full prospect data + signals | `GET /api/prospects/:id` |
| `generate_research_brief` | Create research brief | `POST /api/prospects/:id/research` |
| `generate_outreach` | Create outreach drafts | `POST /api/outreach/generate` |
| `get_outreach_drafts` | List drafts for prospect | `GET /api/outreach/prospect/:id` |
| `advance_pipeline_stage` | Move pipeline stage | `PUT /api/prospects/:id/stage` |
| `list_prospects` | List/filter prospects | `GET /api/prospects` |
| `sync_to_knowledge_graph` | Map prospect to KG entity | Internal (knowledge_graph service) |

## Changes to HCA (lexsy-test)

### 1. Webhook Emitter

`backend/src/middleware/webhookEmitter.ts`

Non-blocking utility that POSTs events to ST:

```typescript
async function emitWebhook(event: string, payload: object): Promise<void> {
  const url = process.env.SERVICETSUNAMI_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-HCA-Event': event },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload }),
    });
  } catch (err) {
    console.error(`Webhook failed for ${event}:`, err.message);
  }
}
```

Called from controllers:
- `prospects.ts` → after create, score, stage change
- `outreach.ts` → after status change

### 2. Integration Routes

`backend/src/routes/integration.ts`

```
GET  /api/integration/status  → { status: 'ok', version, uptime }
GET  /api/integration/config  → { events: [...], endpoints: [...], capabilities: [...] }
POST /api/integration/webhook-test → sends test webhook to configured URL
```

### 3. Service-to-Service Auth

New middleware `authenticateService` that accepts `X-Service-Key` header. The key is:
- Generated once, stored in HCA's env as `SERVICE_API_KEY`
- Stored in ST's credential vault under skill "hca_deal_intelligence"
- Allows ST to call HCA endpoints without a user JWT

Service auth is used alongside existing JWT auth — if `X-Service-Key` is present and valid, the request is treated as a system-level call with full access.

### 4. Environment Variables (New)

```bash
# HCA .env additions
SERVICETSUNAMI_WEBHOOK_URL=http://servicetsunami-api:8001/api/v1/webhooks/hca
SERVICE_API_KEY=<generated-uuid>
```

## Kubernetes Deployment

Both services on the same k8s cluster:

```
namespace: prod
├── hca-api (Deployment + Service, port 3000)
├── hca-web (Deployment + Service, port 5173)
├── servicetsunami-api (existing)
├── servicetsunami-adk (existing)
├── servicetsunami-worker (existing, runs DealPipelineWorkflow)
└── shared: PostgreSQL, Redis, Temporal
```

HCA uses its own PostgreSQL database (separate from ST's). Communication is via internal k8s Service DNS (`hca-api.prod.svc.cluster.local:3000`).

Helm values for HCA services need to be created under `helm/values/`:
- `hca-api.yaml`
- `hca-web.yaml`

## Knowledge Graph Mapping

HCA prospects are synced to ST knowledge graph entities:

| HCA Field | KG Entity Property |
|-----------|-------------------|
| `company_name` | `name` |
| `industry` | `entity_type: "company"`, `category: industry` |
| `sell_likelihood_score` | `score` |
| `owner_name` | Related entity (type: "person", relation: "owned_by") |
| `signals` | `enrichment_data.signals` |
| `stage` | `status` (mapped: lead→identified, contacted→outreach, etc.) |
| `ai_research` | `enrichment_data.research` |

This allows ST's other agents (sales_team, knowledge_manager) to access HCA data through the unified knowledge graph.

## Files to Create/Modify

### HCA Side (lexsy-test / ai-marketing-platform)

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/middleware/webhookEmitter.ts` | CREATE | Webhook emission utility |
| `backend/src/routes/integration.ts` | CREATE | Integration status/config endpoints |
| `backend/src/middleware/serviceAuth.ts` | CREATE | X-Service-Key auth middleware |
| `backend/src/routes/prospects.ts` | MODIFY | Add webhook calls after create/score/stage |
| `backend/src/routes/outreach.ts` | MODIFY | Add webhook calls after status change |
| `backend/src/index.ts` | MODIFY | Mount integration routes |
| `helm/values/hca-api.yaml` | CREATE | K8s Helm values |
| `helm/values/hca-web.yaml` | CREATE | K8s Helm values |

### ST Side (servicetsunami-agents)

| File | Action | Purpose |
|------|--------|---------|
| `apps/adk-server/tools/hca_tools.py` | CREATE | 10 tool functions calling HCA API |
| `apps/adk-server/servicetsunami_supervisor/deal_team.py` | CREATE | Team supervisor (routing) |
| `apps/adk-server/servicetsunami_supervisor/deal_analyst.py` | CREATE | Scoring/discovery sub-agent |
| `apps/adk-server/servicetsunami_supervisor/deal_researcher.py` | CREATE | Research sub-agent |
| `apps/adk-server/servicetsunami_supervisor/outreach_specialist.py` | CREATE | Outreach sub-agent |
| `apps/adk-server/servicetsunami_supervisor/agent.py` | MODIFY | Add deal_team to root sub_agents |
| `apps/api/app/workflows/deal_pipeline.py` | CREATE | Temporal DealPipelineWorkflow |
| `apps/api/app/workflows/activities/hca_activities.py` | CREATE | Temporal activity implementations |
| `apps/api/app/api/v1/webhooks.py` | CREATE | Webhook receiver endpoint |
| `apps/api/app/api/v1/routes.py` | MODIFY | Mount webhook route |
| `apps/api/app/workers/orchestration_worker.py` | MODIFY | Register DealPipeline workflow |
| `apps/api/app/db/init_db.py` | MODIFY | Seed SkillConfig for hca_deal_intelligence |
| `helm/values/servicetsunami-api.yaml` | MODIFY | Add HCA env vars |
| `helm/values/servicetsunami-worker.yaml` | MODIFY | Add HCA env vars |
