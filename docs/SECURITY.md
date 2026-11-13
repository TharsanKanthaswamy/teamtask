# TeamTrack Security Documentation

## Security Model

TeamTrack implements defense-in-depth security with multiple layers protecting against unauthorized access and data breaches.

## Authentication

### Password Storage

**Algorithm**: Argon2id (winner of the Password Hashing Competition)

**Parameters**:
```typescript
{
  type: argon2.argon2id,
  memoryCost: 65536,     // 64 MB
  timeCost: 3,            // 3 iterations
  parallelism: 4,         // 4 threads
}
```

**Why Argon2id?**
- Memory-hard (resistant to GPU/ASIC attacks)
- Side-channel resistant
- Configurable cost parameters
- Better than bcrypt against modern attacks

### Session Management

**Token Generation**
```typescript
const sessionToken = crypto.randomBytes(32).toString('hex'); // 256 bits entropy
const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
```

**Storage**
- Token hash stored in database (never plaintext)
- Raw token sent in HTTP-only cookie
- Session expiration: 7 days (configurable)

**Cookie Configuration**
```typescript
{
  httpOnly: true,          // No JavaScript access
  secure: production,      // HTTPS only in production
  sameSite: 'lax',         // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

**Session Validation**
1. Extract token from cookie
2. Hash the token
3. Lookup in database
4. Check expiration
5. Verify user status
6. Update last_used_at

### Authentication Flow Security

```
Login Attempt
    ↓
Rate Limiting (10 attempts / 15 minutes)
    ↓
Email Lookup (constant-time)
    ↓
Argon2id Verify (constant-time)
    ↓
Status Check
    ↓
Session Creation
    ↓
Audit Log Entry
    ↓
HTTP-only Cookie
```

## Authorization

### Role-Based Access Control (RBAC)

**Hierarchy**
```
Super Admin (Level 0)
    ↓
Team Lead (Level 1)
    ↓
Team Member (Level 2)
```

**Permission Matrix**

| Action | Super Admin | Team Lead | Team Member |
|--------|-------------|-----------|-------------|
| Create Team | ✅ | ❌ | ❌ |
| View All Teams | ✅ | ❌ | ❌ |
| View Own Team | ✅ | ✅ | ✅ |
| Add Team Member | ✅ | ✅* | ❌ |
| Assign Team Lead | ✅ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ❌ |
| View Projects | ✅ | ✅ | ✅ |
| Assign Tasks | ✅ | ✅ | ❌ |
| Submit Contributions | ✅ | ✅ | ✅ |
| Approve Work | ✅ | ✅ | ❌ |
| Platform Analytics | ✅ | ❌ | ❌ |
| Team Analytics | ✅ | ✅ | ✅ |
| Audit Logs (Global) | ✅ | ❌ | ❌ |
| Audit Logs (Team) | ✅ | ✅ | ❌ |

*If enabled by platform settings

### Guard Implementation

**AuthGuard**: Verifies session
```typescript
@UseGuards(AuthGuard)
async someMethod() { ... }
```

**AdminGuard**: Requires Super Admin
```typescript
@UseGuards(AuthGuard, AdminGuard)
async platformMethod() { ... }
```

**TenantGuard**: Verifies team membership (future)
```typescript
@UseGuards(AuthGuard, TenantGuard)
async teamMethod() { ... }
```

## Multi-Tenancy & Isolation

### Tenant Context

**Resolution Process**
1. Authenticate user (AuthGuard)
2. Extract team_id from request
3. Verify membership in database
4. Set tenant context for transaction
5. Execute operation
6. RLS enforces isolation

**Critical**: Team ID must NEVER come from client input without verification.

### Row-Level Security (RLS)

**Database Functions**
```sql
-- Set tenant context (transaction-local)
CREATE FUNCTION set_tenant_context(tenant_team_id UUID, is_super_admin BOOLEAN)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_team_id', tenant_team_id::TEXT, TRUE);
    PERFORM set_config('app.is_super_admin', is_super_admin::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current tenant
CREATE FUNCTION get_current_team_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_team_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;
```

**RLS Policy Example**
```sql
CREATE POLICY team_members_tenant_isolation ON team_members
    FOR ALL
    USING (
        is_super_admin() = TRUE OR 
        team_id = get_current_team_id()
    );
```

**Enforcement**
- Application role does NOT have BYPASSRLS privilege
- Policies FORCE isolation even for the owner
- Super Admin path explicitly checks authorization

### Database Roles

**Migration Role** (Owner)
- Creates tables and policies
- Runs migrations
- NOT used at runtime

**Runtime Role** (`teamtrack_app`)
- Used by NestJS application
- SELECT, INSERT, UPDATE, DELETE permissions
- NO BYPASSRLS privilege
- Cannot disable RLS

### Isolation Tests

**Required Tests**
```typescript
// Alpha member accessing Alpha data → ✅ Allow
await expect(alphaUser.getProjects(alphaTeamId)).resolves.toBeDefined();

// Alpha member accessing Beta data → ❌ Deny
await expect(alphaUser.getProjects(betaTeamId)).rejects.toThrow();

// Team Lead accessing other team → ❌ Deny
await expect(alphaLead.getProjects(betaTeamId)).rejects.toThrow();

// Super Admin accessing any team → ✅ Allow
await expect(superAdmin.getProjects(alphaTeamId)).resolves.toBeDefined();
await expect(superAdmin.getProjects(betaTeamId)).resolves.toBeDefined();
```

## Input Validation

### Request Validation

**NestJS Validation Pipe**
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Reject unknown properties
    transform: true,            // Auto-transform types
  }),
);
```

**Zod Schemas**
```typescript
export const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});
```

**SQL Injection Prevention**
- Prisma uses parameterized queries
- No string concatenation for queries
- Input automatically escaped

## Audit Logging

### Logged Events

**Authentication**
- LOGIN
- LOGOUT
- FAILED_LOGIN (future)

**Team Management**
- CREATE_TEAM
- UPDATE_TEAM
- DEACTIVATE_TEAM
- ADD_MEMBER
- REMOVE_MEMBER
- CHANGE_ROLE
- ASSIGN_LEAD

**Sensitive Access**
- SUPER_ADMIN_ACCESS (when admin views team data)

### Audit Log Schema

```typescript
{
  id: UUID,
  actorId: UUID,              // Who performed the action
  teamId: UUID | null,        // Which team (null for global)
  action: AuditAction,
  entityType: string,         // 'Team', 'User', 'Project', etc.
  entityId: UUID,             // Which entity was affected
  metadata: JSON,             // Additional context
  ipAddress: string | null,
  createdAt: timestamp,
}
```

**Immutability**
- Audit logs are append-only
- No UPDATE or DELETE operations
- Retention policy managed separately

## Attack Vectors & Mitigations

### Cross-Tenant Access

**Attack**: User manipulates team_id in request to access another team

**Mitigation**:
1. Team ID verified through membership check
2. RLS enforces at database level
3. Transaction-local tenant context
4. Audit log for suspicious access patterns

### Privilege Escalation

**Attack**: Team Member tries to promote themselves to Team Lead

**Mitigation**:
1. Role changes only through Super Admin
2. AdminGuard on role modification endpoints
3. No client-side role updates
4. Audit log for role changes

### Session Hijacking

**Attack**: Attacker steals session cookie

**Mitigation**:
1. HTTP-only cookies (no XSS access)
2. Secure flag in production (HTTPS only)
3. SameSite=Lax (CSRF protection)
4. Session expiration (7 days)
5. IP address logging (detection)
6. Revocation on logout

### Password Attacks

**Attack**: Brute force or credential stuffing

**Mitigation**:
1. Rate limiting (10 attempts / 15 minutes)
2. Argon2id (GPU-resistant, memory-hard)
3. Account lockout (future)
4. 2FA (future)
5. Audit log of failed attempts

### SQL Injection

**Attack**: Malicious SQL in user input

**Mitigation**:
1. Prisma ORM (parameterized queries)
2. Input validation (Zod/class-validator)
3. TypeScript (compile-time type safety)
4. No raw SQL except for RLS setup

### XSS (Cross-Site Scripting)

**Attack**: Inject malicious JavaScript

**Mitigation**:
1. React auto-escaping
2. No dangerouslySetInnerHTML
3. Content-Security-Policy header (future)
4. HTTP-only cookies

### CSRF (Cross-Site Request Forgery)

**Attack**: Forged requests from malicious site

**Mitigation**:
1. SameSite=Lax cookies
2. Origin/Referer checking
3. CORS configuration
4. CSRF tokens (future, if needed)

## Security Checklist

### Development

- [ ] Never log passwords or tokens
- [ ] Always use Argon2id for passwords
- [ ] Verify team membership before operations
- [ ] Set tenant context in transaction
- [ ] Use AuthGuard on protected routes
- [ ] Validate all input with Zod
- [ ] Test RLS policies
- [ ] Audit sensitive operations

### Deployment

- [ ] Change SESSION_SECRET to random value
- [ ] Enable HTTPS (secure cookies)
- [ ] Set NODE_ENV=production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Rotate database credentials
- [ ] Review RLS policies
- [ ] Enable security headers
- [ ] Set up monitoring/alerting

### Code Review

- [ ] No hardcoded credentials
- [ ] No client-side authorization
- [ ] No raw SQL (except RLS)
- [ ] Input validation on all endpoints
- [ ] AuthGuard on protected routes
- [ ] Tenant context set properly
- [ ] Audit logs for sensitive actions
- [ ] Error messages don't leak info

## Reporting Security Issues

**Email**: security@teamtrack.local

**Please Include**:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

**Response Time**:
- Acknowledgment: 24 hours
- Fix for critical: 72 hours
- Fix for high: 1 week
- Fix for medium/low: Next release

**Responsible Disclosure**:
- 90-day disclosure timeline
- Public credit (if desired)
- Bug bounty (future)

---

**Last Updated**: 2024-11-12
**Version**: 1.0.0-foundation
