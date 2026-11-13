# TeamTrack Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
cd E:\teamtask
pnpm install
```

### Step 2: Start Database

```bash
docker-compose up -d postgres
```

Wait 10 seconds for PostgreSQL to initialize.

### Step 3: Run Migrations

```bash
pnpm --filter @teamtrack/database generate
pnpm --filter @teamtrack/database migrate
```

### Step 4: Seed Development Data

```bash
pnpm db:seed
```

This creates:
- **Super Admin**: `admin@teamtrack.local` / `Admin@123`
- **Team Alpha** (3 members)
- **Team Beta** (3 members)

### Step 5: Start Applications

```bash
pnpm dev
```

This starts:
- **Frontend**: http://localhost:3005
- **Backend**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

### Step 6: Log In

1. Visit http://localhost:3005
2. Login as Super Admin:
   - Email: `admin@teamtrack.local`
   - Password: `Admin@123`
3. You'll be redirected to `/admin/dashboard`

## 📊 Test Accounts

### Super Admin
- **Email**: `admin@teamtrack.local`
- **Password**: `Admin@123`
- **Access**: Full platform access

### Team Alpha Lead
- **Email**: `alice@teamtrack.local`
- **Password**: `Password@123`
- **Access**: Team Alpha only

### Team Alpha Member
- **Email**: `bob@teamtrack.local`
- **Password**: `Password@123`
- **Access**: Team Alpha, limited permissions

### Team Beta Lead
- **Email**: `david@teamtrack.local`
- **Password**: `Password@123`
- **Access**: Team Beta only

## 🧪 Verify Tenant Isolation

### Test 1: Super Admin Access
1. Login as `admin@teamtrack.local`
2. Navigate to Teams → Should see both Alpha and Beta
3. View Team Alpha members → Success
4. View Team Beta members → Success

### Test 2: Team Member Isolation
1. Login as `alice@teamtrack.local` (Team Alpha Lead)
2. Should redirect to `/workspace/dashboard`
3. Can see Team Alpha data
4. Cannot see Team Beta (no navigation or API access)

### Test 3: Database-Level Isolation
```bash
# Connect to PostgreSQL
docker exec -it teamtrack-db psql -U teamtrack -d teamtrack

# Try to query as application role (should see no data without context)
SET ROLE teamtrack_app;
SELECT * FROM team_members; -- Returns 0 rows (RLS enforced)

# Set tenant context for Team Alpha
SELECT set_tenant_context('[Team-Alpha-UUID]'::uuid, false);
SELECT * FROM team_members; -- Returns only Team Alpha members
```

## 🔧 Common Commands

```bash
# Start fresh (delete all data)
pnpm db:migrate:reset

# View database in Prisma Studio
pnpm db:studio

# Create a new Super Admin
pnpm admin:create

# Run backend only
pnpm --filter @teamtrack/api dev

# Run frontend only
pnpm --filter @teamtrack/web dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 🐛 Troubleshooting

### "Database connection failed"
- Ensure Docker is running
- Check if port 5432 is available
- Verify `.env` DATABASE_URL is correct

### "Module not found"
- Run `pnpm install` again
- Check if all packages are in `pnpm-workspace.yaml`

### "Migration failed"
- Drop database: `docker-compose down -v`
- Restart: `docker-compose up -d postgres`
- Re-run migrations

### "Cannot login"
- Ensure seed data was loaded: `pnpm db:seed`
- Check backend logs for errors
- Verify session cookie is being set

### "CORS error"
- Check `NEXT_PUBLIC_API_URL` in `.env`
- Verify backend CORS configuration in `main.ts`
- Clear browser cookies

## 📝 Next Steps

1. **Explore Admin Dashboard**
   - View platform statistics
   - Browse teams and members
   - Check audit logs

2. **Test Team Workspace**
   - Login as team member
   - Navigate team dashboard
   - Verify limited access

3. **Create New Team**
   - Login as Super Admin
   - Create a new team
   - Add members
   - Assign Team Lead

4. **Review Code**
   - Check `apps/api/src/tenant/tenant.service.ts` for isolation logic
   - Review RLS policies in `infrastructure/docker/init.sql`
   - Explore Next.js routes in `apps/web/src/app`

5. **Build Features**
   - Projects module (next milestone)
   - Tasks and assignments
   - Contribution tracking
   - Analytics dashboards

## 🎯 What's Built

✅ **Foundation Complete**
- Secure authentication (Argon2id)
- Multi-tenancy (PostgreSQL RLS)
- Team management
- Role-based access control
- Audit logging
- Super Admin interface
- Team workspace shell

🚧 **Coming Next**
- Project creation
- Task management
- Contribution tracking
- Approval workflows
- Team analytics

---

**Questions?** Check `README.md` or `docs/` folder for detailed documentation.
