# 🚀 START TeamTrack Locally

## ⚠️ Prerequisites Check

### 1. Docker Installation Required

Docker was not found on your system. You need Docker to run PostgreSQL.

**Download Docker Desktop:**
- Windows: https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop

**After Installing Docker:**
```bash
# Verify Docker is running
docker --version
docker compose version
```

---

## 🎯 Quick Start (After Docker is Running)

### Step 1: Start PostgreSQL
```bash
cd E:\teamtask
docker compose up -d postgres
```

Wait 10-15 seconds for PostgreSQL to initialize.

### Step 2: Run Database Migrations
```bash
pnpm --filter @teamtrack/database migrate
```

### Step 3: Seed Development Data
```bash
pnpm --filter @teamtrack/database seed
```

### Step 4: Start Development Servers
```bash
pnpm dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

---

## 🔐 Login Credentials

### Super Admin
- **Email**: `admin@teamtrack.local`
- **Password**: `Admin@123`
- **Access**: Full platform control

### Team Alpha Lead
- **Email**: `alice@teamtrack.local`
- **Password**: `Password@123`
- **Access**: Team Alpha management

### Team Alpha Member
- **Email**: `bob@teamtrack.local`
- **Password**: `Password@123`
- **Access**: Team Alpha workspace

---

## 📊 Current Status

✅ **Dependencies Installed** - All npm packages ready  
✅ **Prisma Client Generated** - Database client ready  
⏳ **PostgreSQL Needed** - Docker not found  

---

## 🐛 Alternative: Use Local PostgreSQL

If you already have PostgreSQL installed locally:

### 1. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE teamtrack;
CREATE USER teamtrack WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE teamtrack TO teamtrack;
\q
```

### 2. Update .env
```bash
# Edit E:\teamtask\.env
DATABASE_URL="postgresql://teamtrack:password@localhost:5432/teamtrack?schema=public"
```

### 3. Run RLS Setup Manually
```bash
# Connect as superuser
psql -U postgres -d teamtrack -f E:/teamtask/infrastructure/docker/init.sql
```

### 4. Continue with Migrations
```bash
pnpm --filter @teamtrack/database migrate
pnpm --filter @teamtrack/database seed
pnpm dev
```

---

## 📝 Manual Setup Commands

If you want to run each step individually:

```bash
# 1. Generate Prisma Client (DONE ✅)
pnpm --filter @teamtrack/database generate

# 2. Start PostgreSQL (NEEDS DOCKER)
docker compose up -d postgres

# 3. Run Migrations
pnpm --filter @teamtrack/database migrate

# 4. Seed Database
pnpm --filter @teamtrack/database seed

# 5. Start Backend
pnpm --filter @teamtrack/api dev

# 6. Start Frontend (in another terminal)
pnpm --filter @teamtrack/web dev

# OR start both together:
pnpm dev
```

---

## ✅ What's Ready

- ✅ Monorepo structure
- ✅ All dependencies installed (940 packages)
- ✅ Prisma client generated
- ✅ TypeScript configured
- ✅ Next.js frontend ready
- ✅ NestJS backend ready
- ✅ Environment configured (.env file present)

---

## 📞 Next Steps

1. **Install Docker Desktop** from https://www.docker.com/products/docker-desktop/
2. **Start Docker Desktop**
3. **Run the commands above**
4. **Access http://localhost:3000**

---

## 🆘 Troubleshooting

### "Docker command not found"
- Install Docker Desktop
- Restart terminal after installation
- Verify with `docker --version`

### "Port 5432 already in use"
```bash
# Stop existing PostgreSQL
docker ps
docker stop <container-id>

# Or use different port in docker-compose.yml
```

### "Migration failed"
```bash
# Reset database
docker compose down -v
docker compose up -d postgres
# Wait 15 seconds, then retry migrations
```

---

**Current Directory**: E:\teamtask  
**Dependencies**: ✅ Installed  
**Prisma**: ✅ Generated  
**Docker**: ⚠️ Needs Installation
