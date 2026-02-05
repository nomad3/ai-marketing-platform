# AI Marketing Platform - Claude Documentation

This document provides a comprehensive guide to the AI Marketing Platform architecture, commands, and development patterns for Claude and other AI agents.

## 🏗️ Architecture Overview

### Project Structure
```
ai-marketing-platform/
├── backend/              # Node.js/TypeScript API server
│   ├── src/
│   │   ├── routes/       # API routes (campaigns, analytics, content, reports)
│   │   ├── utils/        # Utilities (storage, helpers)
│   │   └── index.ts      # Server entry point
│   └── package.json
├── frontend/             # React/TypeScript web application  
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   └── App.tsx       # Main application component
│   └── package.json
├── mcp-server/           # Model Context Protocol server
│   ├── src/
│   │   ├── services/     # MCP services (AI content, analytics, campaigns)
│   │   └── index.ts      # MCP server entry point
│   └── package.json
└── docker-compose.yml    # Development environment setup
```

### Technology Stack

**Backend (Node.js/TypeScript)**
- Express.js for REST API
- File-based storage with JSON persistence
- CORS enabled for frontend communication
- Health check endpoints

**Frontend (React/TypeScript)**
- Vite for build tooling and development
- React Router for navigation
- Recharts for data visualization
- Lucide React for icons
- Custom CSS with CSS variables for theming

**MCP Server**
- Model Context Protocol for AI integrations
- OpenAI API for content generation
- Modular service architecture

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd ai-marketing-platform

# Install dependencies for all services
cd backend && npm install
cd ../frontend && npm install  
cd ../mcp-server && npm install

# Start development servers
cd backend && npm run dev    # Port 3000
cd frontend && npm run dev   # Port 5173
cd mcp-server && npm run dev # Port 3001
```

### Environment Variables
Create `.env` files in each service directory:

**Backend (.env)**
```
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_key
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000
```

**MCP Server (.env)**
```
PORT=3001
OPENAI_API_KEY=your_openai_key
```

## 📊 Core Features

### 1. AI Campaign Builder
**Location:** `frontend/src/components/AICampaignBuilder.tsx`

**Features:**
- Conversational AI interface for campaign creation
- Intelligent data extraction from natural language
- Platform-specific optimization suggestions
- Budget allocation recommendations
- Real-time campaign preview

**Usage:**
```typescript
<AICampaignBuilder
  isOpen={showBuilder}
  onClose={() => setShowBuilder(false)}
  onCampaignCreated={handleCampaignCreated}
/>
```

### 2. Enhanced Analytics Dashboard
**Location:** `frontend/src/pages/Analytics.tsx`

**Features:**
- Interactive charts with Recharts
- ROI tracking and conversion metrics
- A/B test results visualization
- Platform performance comparison
- Exportable reports

**API Endpoints:**
```
GET /api/analytics/overview?range=30d
GET /api/analytics/campaigns?range=30d
POST /api/reports/performance
```

### 3. AI Content Generator
**Location:** `frontend/src/components/ContentGenerator.tsx`

**Features:**
- Multi-format content generation (copy, images, video concepts)
- Platform-optimized prompts
- Template-based content creation
- Advanced targeting options
- Generation history tracking

**API Endpoint:**
```
POST /api/content/generate
{
  "type": "copy|image|video",
  "prompt": "content description",
  "style": "modern, professional",
  "generationOptions": {
    "platform": "meta|google|tiktok|linkedin",
    "objective": "conversions|leads|awareness",
    "audience": "millennials|gen-z|professionals",
    "tone": "professional|casual|urgent"
  }
}
```

### 4. Campaign Templates
**Location:** `frontend/src/components/CampaignTemplates.tsx`

**Features:**
- Pre-built campaign templates for common use cases
- Industry-specific configurations
- Expected performance metrics
- Platform compatibility indicators
- Difficulty levels and popularity ratings

**Template Categories:**
- E-commerce (conversion boosters, retargeting)
- B2B (lead generation, professional services)
- Brand awareness (viral campaigns, storytelling)
- Local business (foot traffic, community engagement)
- Mobile (app installs, engagement)

### 5. Multi-Platform Support
**Location:** `backend/src/routes/campaigns.ts`

**Supported Platforms:**
- **Meta (Facebook/Instagram):** Feed, Stories, Reels placements
- **Google Ads:** Search and Display networks
- **TikTok:** For You page and video feeds
- **LinkedIn:** Professional feed and messaging
- **YouTube:** Video advertising formats

**Platform-Specific Features:**
```typescript
// Platform configurations applied automatically
const platformConfig = getPlatformConfiguration(platform, objective);
campaign.platformSettings = platformConfig.settings;
```

### 6. Reporting & Export
**Location:** `backend/src/routes/reports.ts`

**Report Types:**
- Performance Overview (ROI, ROAS, conversions)
- Platform Comparison (cross-platform analysis)
- A/B Test Results (statistical significance)
- Creative Performance (content analysis)
- Conversion Funnel (customer journey)

**Export Formats:**
- JSON (structured data)
- CSV (spreadsheet import)
- PDF (formatted reports)

## 🎨 Design System

### CSS Architecture
**Location:** `frontend/src/index.css`

**Key Principles:**
- CSS Custom Properties for theming
- Glassmorphism design pattern
- Consistent spacing scale
- Responsive grid systems

**Color Palette:**
```css
:root {
  --primary: #6366f1;
  --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --bg-primary: #0a0e27;
  --bg-secondary: #111525;
  --bg-tertiary: #1a1d35;
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
}
```

### Component Patterns

**Modal Components:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

**Glass Effect Cards:**
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
}
```

## 🔧 API Patterns

### REST API Structure
All APIs follow RESTful conventions with consistent response formats:

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": { pagination?, timestamp }
}

// Error Response  
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Campaign API
```typescript
// Create Campaign
POST /api/campaigns
{
  "name": "Campaign Name",
  "platform": "meta|google|tiktok|linkedin",
  "objective": "conversions|leads|awareness|traffic",
  "budget": 5000,
  "targeting": {
    "ageRange": [25, 45],
    "locations": ["United States"],
    "interests": ["technology", "business"]
  }
}

// Get Campaigns
GET /api/campaigns?platform=meta&status=active

// Update Campaign
PUT /api/campaigns/:id
{
  "status": "active|paused|archived",
  "budget": 7500
}
```

### Analytics API
```typescript
// Overview Metrics
GET /api/analytics/overview?range=30d
Response: {
  "totalSpend": 25000,
  "totalRevenue": 75000,
  "averageROI": 200,
  "averageROAS": 3.0,
  "activeCampaigns": 8,
  "totalImpressions": 500000,
  "totalClicks": 12500,
  "totalConversions": 625
}

// Campaign Performance
GET /api/analytics/campaigns?range=30d
Response: {
  "campaigns": [
    {
      "id": "camp_123",
      "name": "Summer Sale",
      "platform": "meta",
      "metrics": { ... },
      "roi": 245,
      "abTestStatus": "winner"
    }
  ]
}
```

## 🤖 AI Integration Patterns

### Content Generation
**Service:** `mcp-server/src/services/ai-content.ts`

**Pattern:**
1. Receive generation request with context
2. Apply platform-specific optimizations  
3. Generate content using AI models
4. Post-process and format results
5. Store generation history

```typescript
const enhancedPrompt = generateEnhancedPrompt(
  prompt,
  platform,
  audience, 
  objective
);

const content = await generateContent({
  type: 'copy|image|video',
  prompt: enhancedPrompt,
  style: style
});
```

### Campaign Optimization
**Service:** `backend/src/routes/campaigns.ts`

**AI-Driven Features:**
- Budget allocation suggestions
- Audience targeting optimization
- Performance predictions
- A/B testing recommendations

## 📱 Frontend Component Guide

### Page Components
**Location:** `frontend/src/pages/`

- `LandingPage.tsx` - Marketing homepage
- `Dashboard.tsx` - Main application dashboard
- `Analytics.tsx` - Detailed analytics with charts
- `Campaigns.tsx` - Campaign management interface

### Shared Components  
**Location:** `frontend/src/components/`

- `AICampaignBuilder.tsx` - Conversational campaign creator
- `ContentGenerator.tsx` - Multi-format content creation
- `CampaignTemplates.tsx` - Template selection interface

### State Management
**Pattern:** React hooks with local state

```typescript
// Typical component state pattern
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Fetch data pattern
useEffect(() => {
  fetchData()
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [dependencies]);
```

## 🗃️ Data Storage

### File-Based Storage
**Location:** `backend/src/utils/storage.ts`

**Pattern:**
```typescript
// Campaigns stored in campaigns.json
const campaigns = await getCampaigns();
const newCampaign = { id, name, ... };
await saveCampaign(newCampaign);
```

**Storage Location:** `backend/data/campaigns.json`

### Generated Content Storage
**Location:** `backend/public/generated/`

**File Patterns:**
- Images: `image-{timestamp}-{random}.png`
- Videos: `video-{timestamp}-{random}.mp4` 
- Copy: `copy-{timestamp}.json`

## 🔍 Testing Patterns

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Create campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","platform":"meta","objective":"conversions","budget":5000}'

# Get analytics
curl http://localhost:3000/api/analytics/overview?range=30d
```

### Frontend Testing
```bash
# Start development server
npm run dev

# Test component interactions
# - Open campaign builder modal
# - Generate content with different options
# - View analytics charts
# - Export reports
```

## 🚀 Deployment

### Production Build
```bash
# Build all services
cd frontend && npm run build
cd backend && npm run build
cd mcp-server && npm run build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration
**Production URLs:**
- Frontend: `https://smartads.agentprovision.com`
- API: `https://api.smartads.agentprovision.com`
- MCP Server: Internal communication only

## 🛠️ Development Commands

### Common Tasks
```bash
# Start all services in development
npm run dev:all

# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Build production assets
npm run build:prod
```

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Commit message patterns
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: testing
# chore: maintenance
```

## 🔧 Troubleshooting

### Common Issues

**CORS Errors:**
```typescript
// Backend CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://smartads.agentprovision.com'],
  credentials: true
}));
```

**API Connection Issues:**
```typescript
// Frontend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

**File Upload Issues:**
```typescript
// Ensure proper file serving
app.use('/generated', express.static('public/generated'));
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=app:* npm run dev

# TypeScript debugging
npm run dev --inspect
```

## 📈 Performance Optimization

### Frontend Optimization
- Lazy loading for large components
- Image optimization for generated content
- Chart performance with data sampling
- Memoization of expensive calculations

### Backend Optimization
- File-based caching for campaign data
- Streaming responses for large reports
- Rate limiting for AI API calls
- Connection pooling for external APIs

## 🔐 Security Considerations

### API Security
- Input validation with Zod schemas
- Rate limiting on content generation
- API key management for external services
- CORS configuration for allowed origins

### Data Protection
- No sensitive data in client-side storage
- Encrypted API keys in environment variables
- Sanitized user inputs for AI prompts
- Audit logging for campaign changes

## 📚 Learning Resources

### Key Technologies
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Recharts Documentation](https://recharts.org/en-US/)

### AI Integration
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)

### Design Resources
- [Glassmorphism Design](https://glassmorphism.com/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

## 🎯 Quick Start Checklist

✅ **Setup Complete:**
- [ ] All dependencies installed
- [ ] Environment variables configured  
- [ ] Development servers running
- [ ] API endpoints responding
- [ ] Frontend loading correctly

✅ **Feature Testing:**
- [ ] Create campaign via AI builder
- [ ] Generate content (copy, images, video concepts)
- [ ] View analytics with charts
- [ ] Use campaign templates
- [ ] Export reports
- [ ] Test multi-platform configurations

✅ **Production Ready:**
- [ ] All tests passing
- [ ] Error handling implemented
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Documentation complete

---

*This documentation is maintained alongside the codebase. For the most current information, refer to the source code and inline comments.*