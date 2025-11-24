# 🚀 AI Marketing Platform - Quick Start Guide

Welcome to the AI Marketing Platform! This guide will help you get started quickly.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development)
- API Keys (see below)

## 🔑 Required API Keys

### 1. Meta Marketing API
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Marketing API" product
4. Get your App ID, App Secret, and Access Token
5. Note your Ad Account ID from Business Manager

### 2. Hugging Face (for AI image generation)
1. Sign up at [Hugging Face](https://huggingface.co/)
2. Go to Settings → Access Tokens
3. Create a new token with "read" permissions

### 3. OpenAI (for AI copy generation)
1. Sign up at [OpenAI](https://platform.openai.com/)
2. Go to API Keys
3. Create a new API key

### 4. Video Generation (Optional)
- Runway ML, Pika Labs, or similar service
- Get API credentials from your chosen provider

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-marketing-platform

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

### 2. Configure Environment Variables

Edit `.env` and add your API keys:

```env
META_APP_ID=your_actual_app_id
META_APP_SECRET=your_actual_app_secret
META_ACCESS_TOKEN=your_actual_access_token
META_AD_ACCOUNT_ID=your_actual_ad_account_id

HUGGINGFACE_API_KEY=your_actual_hf_key
OPENAI_API_KEY=your_actual_openai_key

JWT_SECRET=your_secure_random_string
```

### 3. Start the Platform

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
curl http://localhost:3000/health
```

### 4. Access the Platform

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MCP Server**: http://localhost:3001

## 📦 Services

The platform runs 5 Docker containers:

1. **PostgreSQL** (port 5432) - Database
2. **Redis** (port 6379) - Cache
3. **MCP Server** (port 3001) - AI & Marketing integrations
4. **Backend API** (port 3000) - REST API
5. **Frontend** (port 5173) - React UI

## 🛠️ Development

### Install Dependencies

```bash
# MCP Server
cd mcp-server && npm install

# Backend
cd ../backend && npm install

# Frontend
cd ../frontend && npm install
```

### Run Locally (without Docker)

```bash
# Terminal 1 - Database
docker-compose up postgres redis

# Terminal 2 - MCP Server
cd mcp-server && npm run dev

# Terminal 3 - Backend
cd backend && npm run dev

# Terminal 4 - Frontend
cd frontend && npm run dev
```

## 🎯 Using the MCP Server

The MCP server provides tools for:

### 1. Create Ad Campaign

```json
{
  "tool": "create_ad_campaign",
  "arguments": {
    "name": "Summer Sale 2024",
    "platform": "meta",
    "objective": "conversions",
    "budget": 1000,
    "target_audience": {
      "age_range": [25, 45],
      "interests": ["technology", "business"],
      "locations": ["US", "CA"]
    },
    "generate_content": {
      "image": true,
      "copy": true,
      "video": false
    }
  }
}
```

### 2. Generate AI Content

```json
{
  "tool": "generate_content",
  "arguments": {
    "type": "image",
    "prompt": "Professional business meeting with diverse team",
    "style": "modern, vibrant, professional",
    "dimensions": {
      "width": 1200,
      "height": 628
    }
  }
}
```

### 3. Get Campaign ROI

```json
{
  "tool": "get_campaign_roi",
  "arguments": {
    "campaign_id": "camp_123",
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  }
}
```

### 4. Optimize Campaign

```json
{
  "tool": "optimize_campaign",
  "arguments": {
    "campaign_id": "camp_123",
    "optimization_goal": "roi"
  }
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Analytics
- `GET /api/analytics/campaigns/:id` - Campaign metrics
- `GET /api/analytics/overview` - Platform overview

### Content
- `POST /api/content/generate` - Generate AI content
- `GET /api/content/history` - Generation history

## 🔧 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors
```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### API key errors
- Verify all API keys are correctly set in `.env`
- Check API key permissions and quotas
- Ensure no extra spaces in `.env` file

## 📚 Next Steps

1. **Explore the Landing Page** - Visit http://localhost:5173
2. **Create Your First Campaign** - Use the dashboard
3. **Generate AI Content** - Try the content generator
4. **Track ROI** - View analytics and metrics
5. **Optimize Campaigns** - Use AI recommendations

## 🤝 Support

For issues or questions:
- Check the documentation
- Review API logs: `docker-compose logs backend`
- Check MCP server logs: `docker-compose logs mcp-server`

## 🎉 You're Ready!

Your AI Marketing Platform is now running. Start creating amazing campaigns! 🚀
