# Deployment Guide

## Quick Deploy

Deploy to production with a single command:

```bash
sudo ./deploy.sh smartads.agentprovision.com
```

## What the Script Does

1. **System Setup**
   - Updates system packages
   - Installs Docker and Docker Compose
   - Creates necessary directories

2. **SSL/HTTPS**
   - Sets up Traefik reverse proxy
   - Automatically obtains Let's Encrypt SSL certificates
   - Configures HTTPS redirects

3. **Application Deployment**
   - Builds Docker images for frontend and backend
   - Starts PostgreSQL and Redis databases
   - Deploys all services with proper networking
   - Configures persistent volumes for data

4. **Configuration**
   - Creates production environment files
   - Sets up Higgsfield API credentials
   - Configures database connections

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Prepare Server

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
sudo mkdir -p /opt/ai-marketing-platform
cd /opt/ai-marketing-platform
git clone <your-repo-url> .
```

### 3. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env  # Edit with your credentials

# Frontend
cp frontend/.env.example frontend/.env
nano frontend/.env  # Set VITE_API_URL to your domain
```

### 4. Deploy with Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## Environment Variables

### Backend (.env)

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/marketing_platform
REDIS_URL=redis://redis:6379

# Higgsfield AI
HIGGSFIELD_API_KEY_ID=your_key_id
HIGGSFIELD_API_KEY_SECRET=your_key_secret

# Meta Marketing API (optional)
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=

# AI Services (optional)
HUGGINGFACE_API_KEY=
OPENAI_API_KEY=
```

### Frontend (.env)

```bash
VITE_API_URL=https://smartads.agentprovision.com/api
VITE_APP_NAME=AI Marketing Platform
```

## Post-Deployment

### Check Status

```bash
cd /opt/ai-marketing-platform
docker-compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
cd /opt/ai-marketing-platform
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

### SSL Certificate Issues

If SSL certificates fail to generate:

1. Check DNS is pointing to your server
2. Ensure ports 80 and 443 are open
3. Check Traefik logs: `docker logs traefik`

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Access PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d marketing_platform
```

### Application Not Accessible

1. Check Traefik is running: `docker ps | grep traefik`
2. Verify DNS: `nslookup smartads.agentprovision.com`
3. Check firewall: `sudo ufw status`
4. View backend logs for errors

## Backup

### Database Backup

```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres marketing_platform > backup.sql
```

### Restore Database

```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres marketing_platform < backup.sql
```

### Backup Generated Content

```bash
tar -czf generated-content-backup.tar.gz /opt/ai-marketing-platform/backend/public/generated/
```

## Monitoring

### Resource Usage

```bash
docker stats
```

### Disk Space

```bash
df -h
docker system df
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Security

1. **Firewall**: Only allow ports 80, 443, and SSH
2. **SSH**: Use key-based authentication, disable password login
3. **Updates**: Regularly update system and Docker images
4. **Secrets**: Never commit `.env` files to git
5. **Backups**: Regular database and content backups

## Support

For issues or questions:
- Check logs first
- Review this deployment guide
- Contact: admin@agentprovision.com
