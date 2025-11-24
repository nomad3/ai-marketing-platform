#!/bin/bash

# AI Marketing Platform Deployment Script
# Domain: smartads.agentprovision.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${1:-smartads.agentprovision.com}"
PROJECT_NAME="ai-marketing-platform"
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${GREEN}🚀 Deploying AI Marketing Platform to ${DOMAIN}${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

# Check if domain is provided
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: Domain is required${NC}"
    echo "Usage: sudo ./deploy.sh <domain>"
    exit 1
fi

# Step 1: Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update -qq

# Step 2: Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Step 3: Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Step 4: Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p /opt/${PROJECT_NAME}
mkdir -p /opt/${PROJECT_NAME}/data/postgres
mkdir -p /opt/${PROJECT_NAME}/data/redis
mkdir -p /opt/${PROJECT_NAME}/backend/public/generated
mkdir -p /opt/traefik/acme

# Step 5: Copy project files
echo -e "${YELLOW}📋 Copying project files...${NC}"
cp -r . /opt/${PROJECT_NAME}/
cd /opt/${PROJECT_NAME}

# Step 6: Set up environment variables
echo -e "${YELLOW}🔧 Setting up environment variables...${NC}"

# Backend .env
if [ ! -f backend/.env ]; then
    cat > backend/.env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/marketing_platform
REDIS_URL=redis://redis:6379

# Higgsfield AI
HIGGSFIELD_API_KEY_ID=b6ee7a1e-edb8-4a34-9294-0407cb3353a1
HIGGSFIELD_API_KEY_SECRET=ecdd39e43963d70428e0a7b0e34b93d6a141673ffaffbf86c8db1076aa215ce8

# Add other API keys as needed
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
HUGGINGFACE_API_KEY=
OPENAI_API_KEY=
EOF
    echo -e "${GREEN}✓ Created backend/.env${NC}"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env <<EOF
VITE_API_URL=https://${DOMAIN}/api
VITE_APP_NAME=AI Marketing Platform
EOF
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
fi

# MCP Server .env
if [ ! -f mcp-server/.env ]; then
    cp mcp-server/.env.example mcp-server/.env
    echo -e "${GREEN}✓ Created mcp-server/.env${NC}"
fi

# Step 7: Create production docker-compose file
echo -e "${YELLOW}🐳 Creating production Docker Compose configuration...${NC}"
cat > ${COMPOSE_FILE} <<'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: marketing-postgres
    environment:
      POSTGRES_DB: marketing_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - /opt/ai-marketing-platform/data/postgres:/var/lib/postgresql/data
    networks:
      - marketing-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: marketing-redis
    volumes:
      - /opt/ai-marketing-platform/data/redis:/data
    networks:
      - marketing-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: marketing-backend
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    volumes:
      - /opt/ai-marketing-platform/backend/public/generated:/app/public/generated
    depends_on:
      - postgres
      - redis
    networks:
      - marketing-network
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.marketing-backend.rule=Host(`${DOMAIN}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.marketing-backend.entrypoints=websecure"
      - "traefik.http.routers.marketing-backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.marketing-backend.loadbalancer.server.port=3000"
      - "traefik.docker.network=traefik-public"
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: marketing-frontend
    env_file:
      - ./frontend/.env
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.marketing-frontend.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.marketing-frontend.entrypoints=websecure"
      - "traefik.http.routers.marketing-frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.marketing-frontend.loadbalancer.server.port=80"
      - "traefik.docker.network=traefik-public"
    restart: unless-stopped

networks:
  marketing-network:
    driver: bridge
  traefik-public:
    external: true
EOF

# Replace ${DOMAIN} in docker-compose file
sed -i "s/\${DOMAIN}/${DOMAIN}/g" ${COMPOSE_FILE}

echo -e "${GREEN}✓ Created ${COMPOSE_FILE}${NC}"

# Step 8: Set up Traefik if not already running
if ! docker ps | grep -q traefik; then
    echo -e "${YELLOW}🔒 Setting up Traefik...${NC}"

    # Create Traefik network
    docker network create traefik-public 2>/dev/null || true

    # Create Traefik configuration
    cat > /opt/traefik/traefik.yml <<EOF
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@agentprovision.com
      storage: /acme/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-public
EOF

    # Start Traefik
    docker run -d \
      --name traefik \
      --restart unless-stopped \
      --network traefik-public \
      -p 80:80 \
      -p 443:443 \
      -v /var/run/docker.sock:/var/run/docker.sock:ro \
      -v /opt/traefik/traefik.yml:/traefik.yml:ro \
      -v /opt/traefik/acme:/acme \
      traefik:v2.10

    echo -e "${GREEN}✓ Traefik started${NC}"
else
    echo -e "${GREEN}✓ Traefik already running${NC}"
fi

# Step 9: Build and start services
echo -e "${YELLOW}🏗️  Building and starting services...${NC}"
docker-compose -f ${COMPOSE_FILE} down 2>/dev/null || true
docker-compose -f ${COMPOSE_FILE} build --no-cache
docker-compose -f ${COMPOSE_FILE} up -d

# Step 10: Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Step 11: Run database migrations (if needed)
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
# docker-compose -f ${COMPOSE_FILE} exec -T backend npm run migrate || true

# Step 12: Show status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}Services:${NC}"
docker-compose -f ${COMPOSE_FILE} ps
echo ""
echo -e "${GREEN}🌐 Application URL: https://${DOMAIN}${NC}"
echo -e "${GREEN}📊 API URL: https://${DOMAIN}/api${NC}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  docker-compose -f ${COMPOSE_FILE} logs -f"
echo ""
echo -e "${YELLOW}Restart:${NC}"
echo "  docker-compose -f ${COMPOSE_FILE} restart"
echo ""
echo -e "${YELLOW}Stop:${NC}"
echo "  docker-compose -f ${COMPOSE_FILE} down"
