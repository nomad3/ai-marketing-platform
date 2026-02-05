# 🚀 AI Marketing Platform — SmartAds

> AI-powered marketing campaign management with multi-platform support, intelligent content generation, and real-time analytics.

[![Live Site](https://img.shields.io/badge/live-marketing.agentprovision.com-success)](https://marketing.agentprovision.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Overview

**SmartAds** is a comprehensive digital marketing platform that leverages AI to create, manage, and optimize paid advertising campaigns across Meta, Google, TikTok, LinkedIn, and YouTube. Features include an AI-powered campaign builder wizard, real-time analytics with interactive charts, intelligent content generation, campaign templates, and a full reporting system.

**Production URL**: [marketing.agentprovision.com](https://marketing.agentprovision.com)

---

## ✨ Key Features

### 🎯 AI Campaign Builder
- Conversational AI wizard for campaign creation
- Intelligent data extraction from natural language
- Platform-specific optimization suggestions
- Budget allocation recommendations
- Real-time campaign preview

### 📊 Analytics Dashboard
- Interactive charts with Recharts
- ROI tracking and conversion metrics
- A/B test results visualization
- Platform performance comparison
- Exportable reports (JSON, CSV, PDF)

### ✍️ AI Content Generator
- Multi-format generation (copy, images, video concepts)
- Platform-optimized prompts and targeting
- Template-based content creation
- Advanced audience and tone options
- Generation history tracking

### 📋 Campaign Templates
- Pre-built templates for common use cases (e-commerce, B2B, brand awareness, local business, mobile)
- Industry-specific configurations
- Expected performance metrics
- Difficulty levels and popularity ratings

### 📈 Reports API
- Performance overview, platform comparison, A/B test results
- Creative performance and conversion funnel analysis
- Multiple export formats

### 🔐 Authentication System
- JWT-based auth with registration and login
- User management with company profiles
- Role-based access control

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│       Frontend (React + TypeScript + Vite)        │
│       Recharts · CSS Variables · Glassmorphism    │
├──────────────────────────────────────────────────┤
│  Landing │ Dashboard │ Campaigns │ Analytics      │
│  Content Generator │ Campaign Builder │ Templates │
│  Login │ Register                                 │
└──────────────────┬───────────────────────────────┘
                   │ Nginx reverse proxy (/api → backend)
┌──────────────────┴───────────────────────────────┐
│       Backend (Node.js + Express + TypeScript)     │
│       JWT Auth · PostgreSQL · REST API             │
├──────────────────────────────────────────────────┤
│  Auth │ Campaigns │ Analytics │ Content │ Reports  │
│  AI Campaign Builder                               │
└──────────┬───────────────────┬───────────────────┘
           │                   │
      ┌────┴─────┐       ┌───┴──────┐
      │PostgreSQL │       │  OpenAI  │
      │          │       │   API    │
      └──────────┘       └──────────┘

┌──────────────────────────────────────────────────┐
│       MCP Server (Model Context Protocol)         │
│       AI content services · Campaign tools        │
└──────────────────────────────────────────────────┘
```

### Docker Setup
- **Frontend**: Nginx serves built React app, reverse proxies `/api` → `backend:3000`
- **Backend**: Node.js/Express on port 3000
- **PostgreSQL**: Initialized from `database/init.sql` with seed data
- **Helm chart**: Symlinked from intothespace's reusable microservice chart

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + TypeScript | API server |
| Express.js | REST framework |
| PostgreSQL | Campaign, analytics, and user data |
| JWT | Authentication |
| OpenAI API | Content generation |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React + TypeScript | UI framework |
| Vite | Build tool |
| React Router | Navigation |
| Recharts | Data visualization |
| Lucide React | Icon library |
| CSS Custom Properties | Glassmorphism design system |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker | Containerization |
| Nginx | Frontend server + API reverse proxy |
| GKE Autopilot | Kubernetes orchestration |
| Helm | Deployment charts |
| PostgreSQL | Cloud SQL (production) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (recommended)

### Docker Compose (Recommended)

```bash
git clone <repository-url>
cd ai-marketing-platform

# Start all services (PostgreSQL auto-initializes with schema + seed data)
docker-compose up -d

# Services:
#   Frontend:  http://localhost:8080
#   Backend:   http://localhost:3000
#   PostgreSQL: localhost:5432
```

### Local Development

```bash
# Backend
cd backend && npm install
cp .env.example .env    # Configure DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
npm run dev             # → http://localhost:3000

# Frontend
cd frontend && npm install
cp .env.example .env    # Set VITE_API_URL=http://localhost:3000
npm run dev             # → http://localhost:5173

# MCP Server (optional)
cd mcp-server && npm install
npm run dev             # → http://localhost:3001
```

### Environment Variables

**Backend (.env)**
```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/marketing
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
ai-marketing-platform/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts              # JWT authentication
│   │   │   ├── campaigns.ts         # Campaign CRUD & management
│   │   │   ├── analytics.ts         # Metrics & performance data
│   │   │   ├── content.ts           # Content generation
│   │   │   ├── reports.ts           # Report generation & export
│   │   │   └── ai-campaign-builder.ts # AI wizard endpoint
│   │   ├── utils/                   # Storage, helpers
│   │   └── index.ts                 # Express server entry
│   ├── public/generated/            # AI-generated content storage
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Marketing homepage
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   ├── Campaigns.tsx        # Campaign management (list/grid)
│   │   │   ├── Analytics.tsx        # Interactive charts & metrics
│   │   │   ├── Content.tsx          # Content management
│   │   │   ├── Login.tsx            # Authentication
│   │   │   └── Register.tsx         # User registration
│   │   ├── components/
│   │   │   ├── AICampaignBuilder.tsx    # Conversational campaign wizard
│   │   │   ├── ContentGenerator.tsx     # Multi-format content creation
│   │   │   ├── CampaignTemplates.tsx    # Template selector
│   │   │   └── CampaignCreator.tsx      # Campaign creation form
│   │   ├── context/                 # React context providers
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
│
├── mcp-server/                      # Model Context Protocol server
│   ├── src/
│   │   ├── services/                # AI content, analytics, campaigns
│   │   └── index.ts                 # MCP entry point
│   └── package.json
│
├── database/
│   └── init.sql                     # Schema + seed data (users, campaigns, metrics)
│
├── helm/
│   ├── charts/microservice/         # Reusable Helm chart (symlink from intothespace)
│   └── values/
│       ├── marketing-backend.yaml
│       └── marketing-frontend.yaml
│
├── docker-compose.yml
├── deploy.sh
└── Makefile
```

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register          # Create account
POST /api/auth/login             # Get JWT tokens
GET  /api/auth/me                # Current user
```

### Campaigns
```
GET    /api/campaigns            # List campaigns (filterable by platform, status)
POST   /api/campaigns            # Create campaign
PUT    /api/campaigns/:id        # Update campaign
DELETE /api/campaigns/:id        # Delete campaign
```

### Analytics
```
GET  /api/analytics/overview     # Aggregate metrics (spend, revenue, ROI, ROAS)
GET  /api/analytics/campaigns    # Per-campaign performance
```

### Content & AI
```
POST /api/content/generate       # Generate copy, images, or video concepts
POST /api/ai-campaign-builder    # AI-powered campaign wizard
```

### Reports
```
POST /api/reports/performance    # Performance overview
POST /api/reports/platform       # Platform comparison
POST /api/reports/ab-test        # A/B test results
POST /api/reports/creative       # Creative performance
POST /api/reports/funnel         # Conversion funnel
```

---

## 🎨 Design System

Glassmorphism-based dark theme:

```css
--primary: #6366f1;
--bg-primary: #0a0e27;
--bg-secondary: #111525;
--text-primary: #ffffff;
--text-secondary: #94a3b8;
```

Glass effect cards with `backdrop-filter: blur(10px)` and subtle borders.

---

## 🗄️ Database Schema

PostgreSQL with the following core tables:

- **users** — Accounts with email, password hash, company, role
- **campaigns** — Campaign definitions with platform, objective, budget, targeting (JSONB)
- **ad_creatives** — Generated content (images, video, copy) linked to campaigns
- **campaign_metrics** — Daily performance data (impressions, clicks, conversions, spend)
- **content_generations** — AI generation history and metadata

Schema auto-initializes from `database/init.sql` on first Docker Compose startup.

---

## 🌐 Deployment

### Production (GKE Autopilot)

Live at **[marketing.agentprovision.com](https://marketing.agentprovision.com)**

```bash
# Build and push images
docker buildx build --platform linux/amd64 \
  -t gcr.io/PROJECT/marketing-frontend:latest --push frontend/

docker buildx build --platform linux/amd64 \
  -t gcr.io/PROJECT/marketing-backend:latest --push backend/

# Deploy with Helm
helm upgrade --install marketing-frontend ./helm/charts/microservice \
  -f ./helm/values/marketing-frontend.yaml -n prod

helm upgrade --install marketing-backend ./helm/charts/microservice \
  -f ./helm/values/marketing-backend.yaml -n prod
```

### Docker Production

```bash
docker-compose up -d --build
# Nginx frontend on :8080, API on :3000, PostgreSQL on :5432
```

---

## 📋 Recent Highlights

- **PostgreSQL Migration** — Migrated from file-based JSON storage to PostgreSQL with proper schema, seed data, and migrations
- **JWT Auth System** — Full registration/login flow with protected routes
- **Campaign Builder Wizard** — AI-powered conversational interface for creating campaigns
- **Analytics Dashboard** — Interactive Recharts-based charts with ROI, ROAS, A/B testing
- **Content Generator Enhancement** — Platform-optimized prompts, audience targeting, tone selection
- **Campaign Templates** — Pre-built templates for e-commerce, B2B, brand awareness, local business, mobile
- **Reports API** — Multi-format export (JSON, CSV, PDF) with 5 report types
- **GKE Deployment** — Full Kubernetes deployment with Helm charts and PostgreSQL

---

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/new-feature`)
2. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
3. Push and open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">

**Built with AI for smarter marketing** 🎯

</div>
