# TeamTrack Architecture

## System Overview

TeamTrack is a multi-tenant workforce management platform built with a modular monolith architecture. It separates concerns between frontend (Next.js), backend (NestJS), and database (PostgreSQL with RLS).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js 14 (App Router)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   Login    │  │   Admin    │  │ Workspace  │     │  │
│  │  │   Page     │  │ Dashboard  │  │ Dashboard  │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │                                                       │  │
│  │  TanStack Query • Zod • React Hook Form             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / Cookies
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Application Layer                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   NestJS Backend                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │    Auth    │  │   Teams    │  │   Tenant   │     │  │
│  │  │   Module   │  │   Module   │  │  Service   │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │                                                       │  │
│  │  Guards • Decorators • Swagger • Rate Limiting       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           PostgreSQL 16 with RLS                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   users    │  │   teams    │  │team_members│     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │                                                       │  │
│  │  Row-Level Security • Tenant Isolation               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend (Next.js)

**Responsibilities**
- User interface rendering
- Client-side routing
- Form validation
- API communication
- State management (React Query)

**Key Technologies**
- Next.js 14 App Router
- Server Components (default)
- Client Components (interactive)
- TanStack Query (data fetching)
- Tailwind CSS (styling)
- shadcn/ui (component library)

**Route Structure**
```
/                    → Redirect to /login
/login               → Authentication
/admin/*             → Super Admin interface
/workspace/*         → Team workspace
```

### Backend (NestJS)

**Responsibilities**
- Business logic
- Authentication & authorization
- Tenant context resolution
- API endpoints
- Database operations

**Module Organization**
```
auth/              Authentication & session management
users/             User CRUD operations
teams/             Team management
tenant/            Multi-tenancy resolution
audit/             Activity logging
platform-admin/    Super Admin operations
health/            Health checks
```

**Authentication Flow**
1. Client sends credentials
2. Backend verifies Argon2id hash
3. Session created with hashed token
4. HTTP-only cookie sent to client
5. AuthGuard validates on each request

### Database (PostgreSQL)

**Schema Design**
- UUID primary keys (security & distribution)
- TIMESTAMPTZ for all timestamps
- Soft deletion (deletedAt field)
- Audit trails (audit_logs table)

**Row-Level Security**
- Enabled on tenant-scoped tables
- Transaction-local tenant context
- Non-owner runtime role (cannot bypass RLS)
- Super Admin explicitly authorized

**Tenant Isolation Strategy**
```sql
-- Set tenant context
SELECT set_tenant_context('team-uuid', false);

-- RLS policy enforces isolation
CREATE POLICY team_members_tenant_isolation ON team_members
  FOR ALL
  USING (
    is_super_admin() = TRUE OR 
    team_id = get_current_team_id()
  );
```

## Authentication & Authorization

### Session Management

**Token Flow**
```
1. Generate random token (32 bytes)
2. Hash with SHA-256
3. Store hash in database
4. Send raw token in HTTP-only cookie
5. Verify: hash incoming token, lookup database
```

**Session Data**
- User ID
- Email
- Admin status
- Expiration (7 days default)
- Last used timestamp

### Authorization Hierarchy

**Level 0: Super Admin**
- Platform-wide access
- Create/manage teams
- Assign Team Leads
- View all data
- Access audit logs

**Level 1: Team Lead**
- Access own team only
- Create projects
- Assign tasks
- Add members (if enabled)
- View team analytics

**Level 2: Team Member**
- Access own team only
- View projects
- Submit contributions
- View team members
- No management privileges

## Multi-Tenancy

### Tenant Context Resolution

```typescript
// Application Layer
async resolveTenantContext(userId, teamId, isSuperAdmin) {
  if (isSuperAdmin) {
    await prisma.setTenantContext(teamId, true);
    return { teamId, role: 'TEAM_LEAD', userId };
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId, status: 'ACTIVE' }
  });

  if (!membership) {
    throw new ForbiddenException('No access to this team');
  }

  await prisma.setTenantContext(teamId, false);
  return { teamId, role: membership.role, userId };
}
```

### Database-Level Isolation

**RLS Policies**
- Team members can only see their team's records
- Queries automatically filtered by tenant context
- No application-level filtering needed
- Defense in depth

**Transaction Scope**
- Tenant context is transaction-local
- Cannot leak between requests
- Reset on connection pool return

## Security Architecture

### Defense Layers

1. **Application Security**
   - Guards verify authentication
   - Decorators extract user context
   - Validators sanitize input
   - Rate limiters prevent abuse

2. **Session Security**
   - HTTP-only cookies (XSS protection)
   - SameSite=Lax (CSRF protection)
   - Secure flag in production
   - Hashed tokens in database

3. **Password Security**
   - Argon2id (memory-hard, GPU-resistant)
   - Memory: 64MB, Time: 3, Parallelism: 4
   - Salted automatically
   - No bcrypt or SHA-256

4. **Database Security**
   - Row-Level Security (RLS)
   - Non-privileged runtime role
   - Parameterized queries (Prisma)
   - Audit logging

### Threat Model

**Protected Against**
- Cross-tenant data access
- Privilege escalation
- Session hijacking
- Password cracking (GPU/rainbow tables)
- SQL injection
- XSS attacks

**Not Protected Against**
- Physical server access
- Database admin compromise
- Social engineering
- Zero-day framework vulnerabilities

## Data Flow Examples

### Login Flow

```
1. POST /api/v1/auth/login
   Body: { email, password }

2. Backend validates credentials
   - Lookup user by email
   - Verify Argon2id hash
   - Check user status

3. Create session
   - Generate random token
   - Hash and store
   - Set HTTP-only cookie

4. Determine redirect
   - Super Admin → /admin/dashboard
   - Single team → /workspace/dashboard
   - Multiple teams → /select-team

5. Return response
   { success: true, redirectTo: '/admin/dashboard', user: {...} }
```

### Tenant-Scoped Request

```
1. GET /api/v1/teams/[teamId]/members
   Cookie: session=<token>

2. AuthGuard validates
   - Extract session token
   - Hash and lookup
   - Check expiration
   - Attach user to request

3. TenantService resolves
   - Verify membership
   - Set tenant context in DB
   - Return role

4. Controller executes
   - RLS enforces isolation
   - Only team's members returned

5. Response sent
   { success: true, data: [...] }
```

## Scalability Considerations

### Current Design

- **Monolith**: All services in one NestJS app
- **Single Database**: PostgreSQL with connection pooling
- **Stateless**: Sessions in database (can be moved to Redis)

### Future Scaling

**Horizontal Scaling**
- Add load balancer
- Run multiple backend instances
- Shared PostgreSQL
- Redis for sessions (optional)

**Database Scaling**
- Read replicas for analytics
- Connection pooling (PgBouncer)
- Partitioning by team_id
- Separate analytics database

**Microservices (If Needed)**
- Split into: Auth, Teams, Projects, Analytics
- Shared database or per-service databases
- API Gateway for routing

## Development Principles

1. **Security First**: Tenant isolation is non-negotiable
2. **Type Safety**: Strict TypeScript, no `any`
3. **Explicit Over Implicit**: Clear authorization checks
4. **Defense in Depth**: Application + Database security
5. **Fail Secure**: Deny by default, allow explicitly
6. **Audit Everything**: Log sensitive operations

## Technology Choices

**Why Next.js?**
- Modern React framework
- Server Components reduce JS payload
- Built-in routing and optimization
- TypeScript support

**Why NestJS?**
- Production-ready architecture
- Dependency injection
- TypeScript native
- Decorator-based, similar to Spring/ASP.NET

**Why PostgreSQL?**
- Row-Level Security (RLS)
- ACID transactions
- JSON support
- Mature and reliable

**Why Prisma?**
- Type-safe queries
- Automatic migrations
- Great DX with autocomplete
- Prevents SQL injection

## Deployment Architecture

### Development
```
Docker Compose:
- PostgreSQL container
- API runs on host (pnpm dev)
- Web runs on host (pnpm dev)
```

### Production
```
- API: Docker container, horizontally scaled
- Web: Vercel / Static hosting
- Database: Managed PostgreSQL (AWS RDS, Supabase)
- Reverse Proxy: nginx / Cloudflare
```

---

**Last Updated**: 2024-11-12
**Version**: 1.0.0-foundation
