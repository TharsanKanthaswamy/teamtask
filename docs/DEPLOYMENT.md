# TeamTrack Deployment Guide

## Prerequisites

### System Requirements
- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher
- **PostgreSQL**: 16.x
- **Docker** (optional): For containerized PostgreSQL
- **Minimum RAM**: 2GB
- **Disk Space**: 5GB

### Required Environment Variables

Create `.env` file in root:

```bash
# Database
DATABASE_URL="postgresql://teamtrack:password@localhost:5432/teamtrack"

# Security
SESSION_SECRET="CHANGE-THIS-TO-SECURE-RANDOM-STRING-IN-PRODUCTION"
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Application URLs
APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# API Configuration
API_PORT=3001

# Session Configuration
SESSION_MAX_AGE=604800000  # 7 days in milliseconds
```

---

## Local Development Setup

### 1. Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd teamtrack

# Install dependencies
pnpm install
```

### 2. Database Setup

**Option A: Docker (Recommended)**

```bash
# Start PostgreSQL in Docker
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 5

# Initialize database with RLS functions
docker exec -i teamtrack-postgres psql -U teamtrack -d teamtrack < infrastructure/docker/init.sql
```

**Option B: Local PostgreSQL**

```bash
# Create database
createdb teamtrack

# Create user
psql -c "CREATE USER teamtrack WITH PASSWORD 'password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE teamtrack TO teamtrack;"

# Initialize RLS functions
psql -U teamtrack -d teamtrack < infrastructure/docker/init.sql
```

### 3. Run Migrations

```bash
# Generate Prisma Client
pnpm --filter @teamtrack/database prisma generate

# Apply migrations
pnpm --filter @teamtrack/database prisma migrate deploy

# Verify migrations
pnpm --filter @teamtrack/database prisma migrate status
```

### 4. Create Super Admin

```bash
pnpm --filter @teamtrack/api admin:create
```

Follow the prompts to create your first Super Administrator account.

### 5. Start Development Servers

```bash
# Start all services
pnpm dev

# OR start individually
pnpm --filter @teamtrack/api dev       # Backend on :3001
pnpm --filter @teamtrack/web dev        # Frontend on :3000
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

**Login with Super Admin credentials created in step 4.**

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Change `SESSION_SECRET` to secure random value
- [ ] Set `DATABASE_URL` with production credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure production domains in `APP_URL` and `API_URL`
- [ ] Enable HTTPS (set `secure: true` on cookies)
- [ ] Configure CORS for production frontend URL
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Review and test RLS policies
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure rate limiting
- [ ] Set up reverse proxy (nginx/Cloudflare)

### Environment Variables - Production

```bash
# Database - Use managed PostgreSQL (AWS RDS, Supabase, etc.)
DATABASE_URL="postgresql://user:password@prod-db.example.com:5432/teamtrack?ssl=true"

# Security - CRITICAL: Generate new secret
SESSION_SECRET="<64-character-random-hex-string>"

# Production URLs
APP_URL="https://teamtrack.example.com"
API_URL="https://api.teamtrack.example.com"

# Node Environment
NODE_ENV="production"

# API Configuration
API_PORT=3001

# Session Configuration
SESSION_MAX_AGE=604800000

# Optional: Error Tracking
SENTRY_DSN="https://xxx@sentry.io/xxx"

# Optional: File Storage
S3_BUCKET="teamtrack-uploads"
S3_REGION="us-east-1"
S3_ACCESS_KEY="xxx"
S3_SECRET_KEY="xxx"
```

### Build for Production

```bash
# Build all packages
pnpm build

# Verify builds
ls -la apps/api/dist
ls -la apps/web/.next
```

### Database Migration - Production

```bash
# Dry run (recommended first)
pnpm --filter @teamtrack/database prisma migrate deploy --preview-feature

# Apply migrations
pnpm --filter @teamtrack/database prisma migrate deploy

# Verify
pnpm --filter @teamtrack/database prisma migrate status
```

### Start Production Servers

**Backend (NestJS):**
```bash
cd apps/api
NODE_ENV=production node dist/main.js
```

**Frontend (Next.js):**
```bash
cd apps/web
pnpm start
```

---

## Docker Deployment

### Build Images

```bash
# Build backend
docker build -t teamtrack-api:latest -f apps/api/Dockerfile .

# Build frontend
docker build -t teamtrack-web:latest -f apps/web/Dockerfile .
```

### Docker Compose - Production

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: teamtrack
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: teamtrack
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/docker/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U teamtrack"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: teamtrack-api:latest
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://teamtrack:${DB_PASSWORD}@postgres:5432/teamtrack
      SESSION_SECRET: ${SESSION_SECRET}
      NODE_ENV: production
      API_PORT: 3001
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: teamtrack-web:latest
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
      NODE_ENV: production
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

**Start:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Cloud Platforms

### Vercel (Frontend)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd apps/web
vercel --prod
```

**Environment Variables in Vercel:**
- `NEXT_PUBLIC_API_URL`: Your production API URL

### Railway (Backend + Database)

1. Create new project
2. Add PostgreSQL service
3. Add NestJS service (link to GitHub repo)
4. Set environment variables
5. Deploy

### AWS (EC2 + RDS)

**EC2 Instance:**
- AMI: Ubuntu 22.04 LTS
- Type: t3.medium (minimum)
- Security Groups: 22 (SSH), 80 (HTTP), 443 (HTTPS)

**RDS PostgreSQL:**
- Engine: PostgreSQL 16
- Instance: db.t3.micro (dev), db.t3.small+ (prod)
- Multi-AZ: Yes (production)
- Backup: 7 days retention

**Setup Script:**
```bash
#!/bin/bash
# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm pm2

# Clone and build
git clone <repository-url> /var/www/teamtrack
cd /var/www/teamtrack
pnpm install
pnpm build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'teamtrack-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'teamtrack-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

---

## Nginx Configuration

**teamtrack.conf:**
```nginx
# API Backend
server {
    listen 80;
    server_name api.teamtrack.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name teamtrack.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d teamtrack.example.com -d api.teamtrack.example.com
```

---

## Database Maintenance

### Backups

**Automated Daily Backups:**
```bash
#!/bin/bash
# /etc/cron.daily/teamtrack-backup

BACKUP_DIR="/var/backups/teamtrack"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -U teamtrack teamtrack | gzip > "$BACKUP_DIR/teamtrack_$DATE.sql.gz"

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

**Restore from Backup:**
```bash
gunzip < teamtrack_20261113_120000.sql.gz | psql -U teamtrack teamtrack
```

### Performance Monitoring

```sql
-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## Monitoring & Logging

### Health Checks

**Backend Health Endpoint:**
```
GET /api/v1/health
```

**Monitor with:**
```bash
# Simple check
curl -f http://localhost:3001/api/v1/health

# With monitoring service (e.g., UptimeRobot, Pingdom)
```

### Application Logs

**PM2 Logs:**
```bash
pm2 logs teamtrack-api
pm2 logs teamtrack-web
```

**Docker Logs:**
```bash
docker logs teamtrack-api
docker logs teamtrack-web
```

### Database Logs

**PostgreSQL:**
```bash
tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## Security Hardening

### PostgreSQL

```sql
-- Remove public schema privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Ensure app role has no BYPASSRLS
ALTER ROLE teamtrack_app NOBYPASSRLS;

-- Rotate password
ALTER USER teamtrack_app WITH PASSWORD 'new-secure-password';
```

### Application

```bash
# Set restrictive file permissions
chmod 600 .env
chmod 700 apps/api/dist

# Run as non-root user
useradd -r -s /bin/false teamtrack
chown -R teamtrack:teamtrack /var/www/teamtrack
```

### Firewall

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -U teamtrack -h localhost -d teamtrack

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check logs
tail -f /var/log/postgresql/postgresql-16-main.log
```

### Migration Failures

```bash
# Check migration status
pnpm --filter @teamtrack/database prisma migrate status

# Reset (DEVELOPMENT ONLY - DESTROYS DATA)
pnpm --filter @teamtrack/database prisma migrate reset

# Production: Manual intervention required
# Contact database administrator
```

### RLS Policy Issues

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies
WHERE schemaname = 'public';

-- Test tenant context
SELECT set_tenant_context('team-uuid-here', false);
SELECT * FROM tasks;  -- Should only return tasks for that team
```

### Memory Issues

```bash
# Check memory usage
free -h
pm2 monit

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" pm2 start ecosystem.config.js
```

---

## Rollback Procedures

### Code Rollback

```bash
# Git rollback
git revert <commit-hash>
git push origin main

# Redeploy
pnpm build
pm2 restart all
```

### Database Rollback

```bash
# Prisma migrate rollback (if possible)
pnpm --filter @teamtrack/database prisma migrate resolve --rolled-back <migration-name>

# Manual rollback
psql -U teamtrack teamtrack < backup_before_migration.sql
```

---

## Support & Resources

- **Documentation**: `/docs` directory
- **API Docs**: https://api.teamtrack.example.com/api/docs
- **GitHub Issues**: Report bugs and request features
- **Security Issues**: security@teamtrack.local

---

**Last Updated:** 2026-11-13  
**Version:** 1.0.0
