.PHONY: help install start stop restart logs build clean dev

help: ## Show this help message
	@echo 'AI Marketing Platform - Available Commands:'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	cd mcp-server && npm install
	cd backend && npm install
	cd frontend && npm install
	@echo "✅ Dependencies installed!"

start: ## Start all services with Docker Compose
	@echo "🚀 Starting AI Marketing Platform..."
	docker-compose up -d
	@echo "✅ Platform started!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:3000"
	@echo "MCP:      http://localhost:3001"

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped!"

restart: stop start ## Restart all services

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-mcp: ## View MCP server logs
	docker-compose logs -f mcp-server

build: ## Build all Docker images
	@echo "🔨 Building Docker images..."
	docker-compose build
	@echo "✅ Build complete!"

clean: ## Remove all containers, volumes, and images
	@echo "🧹 Cleaning up..."
	docker-compose down -v --rmi all
	@echo "✅ Cleanup complete!"

dev: ## Run in development mode (local, no Docker)
	@echo "💻 Starting development mode..."
	@echo "Make sure PostgreSQL and Redis are running!"
	@echo "Run these in separate terminals:"
	@echo "  cd mcp-server && npm run dev"
	@echo "  cd backend && npm run dev"
	@echo "  cd frontend && npm run dev"

health: ## Check service health
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:3000/health | jq . || echo "Backend not responding"
	@echo ""

setup: ## Initial setup - copy env and install deps
	@echo "⚙️  Initial setup..."
	cp .env.example .env
	@echo "✅ Created .env file - please edit with your API keys"
	@make install

db-reset: ## Reset database
	@echo "🗄️  Resetting database..."
	docker-compose down postgres
	docker volume rm ai-marketing-platform_postgres_data || true
	docker-compose up -d postgres
	@echo "✅ Database reset complete!"
