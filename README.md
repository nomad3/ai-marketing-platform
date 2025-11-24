# AI Marketing Platform 🚀

A comprehensive digital marketing AI agency platform that leverages MCP servers to create, manage, and optimize paid advertising campaigns with AI-generated content.

## Features

### 🎯 Core Capabilities
- **Meta Ads Integration** - Create and manage Facebook/Instagram ads via MCP server
- **AI Content Generation** - Generate images, videos, and copy using cutting-edge AI tools
  - Hugging Face AI for image generation
  - Nano Banana for creative assets
  - AI video generators for video content
- **ROI Tracking** - Real-time campaign performance and return on investment analytics
- **Multi-Platform Support** - Manage campaigns across Meta, Google, TikTok, and more
- **Automated Optimization** - AI-driven campaign improvements and A/B testing

### 🛠️ Technology Stack
- **MCP Server** - Model Context Protocol for AI integrations
- **Node.js/TypeScript** - Backend server and MCP implementation
- **React** - Modern web interface
- **PostgreSQL** - Campaign and analytics data storage
- **Redis** - Caching and real-time data
- **Meta Marketing API** - Facebook/Instagram advertising
- **AI Services** - Hugging Face, Nano Banana, video generation APIs

## Project Structure

```
ai-marketing-platform/
├── mcp-server/           # MCP server implementation
│   ├── src/
│   │   ├── tools/        # MCP tools for ad creation, content generation
│   │   ├── resources/    # Campaign data, analytics resources
│   │   ├── prompts/      # AI prompts for content generation
│   │   └── index.ts      # MCP server entry point
│   └── package.json
├── backend/              # REST API backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database models
│   │   └── index.ts
│   └── package.json
├── frontend/             # React web application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Application pages
│   │   ├── services/     # API clients
│   │   └── App.tsx
│   └── package.json
└── docker-compose.yml    # Development environment
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Meta Developer Account
- API keys for AI services

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-marketing-platform
```

2. Install dependencies:
```bash
# Install MCP server dependencies
cd mcp-server && npm install

# Install backend dependencies
cd ../backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

3. Configure environment variables:
```bash
# Copy example env files
cp mcp-server/.env.example mcp-server/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Start development environment:
```bash
docker-compose up -d
npm run dev
```

## MCP Server Usage

The MCP server provides tools for:
- Creating ad campaigns
- Generating AI content (images, videos, copy)
- Tracking ROI and analytics
- Optimizing campaigns

### Example MCP Tool Call

```typescript
// Create a new ad campaign with AI-generated content
{
  "tool": "create_ad_campaign",
  "arguments": {
    "platform": "meta",
    "objective": "conversions",
    "budget": 1000,
    "target_audience": {
      "age_range": [25, 45],
      "interests": ["technology", "business"]
    },
    "generate_content": {
      "image": true,
      "copy": true,
      "video": false
    }
  }
}
```

## API Documentation

See [API.md](./docs/API.md) for detailed API documentation.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.
