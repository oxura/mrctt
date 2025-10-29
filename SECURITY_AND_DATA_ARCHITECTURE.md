# Security and Data Architecture Guidelines

## Multi-Tenancy and Email Uniqueness (Comment 21)

### Tenant User Email Constraints
- **Tenant Users**: Email must be unique within a tenant (`UNIQUE(tenant_id, email)`)
- **Platform Owner Users**: Email must be globally unique, `tenant_id IS NULL`
- **Enforcement**: Registration flows prevent creating platform users via tenant endpoints

###Example Migration Constraint:
```sql
-- Ensure email uniqueness within tenant
ALTER TABLE users ADD CONSTRAINT users_email_tenant_unique UNIQUE (tenant_id, email);
  
-- Platform owners have NULL tenant_id and globally unique emails
CREATE UNIQUE INDEX users_platform_owner_email_unique 
ON users (email) WHERE tenant_id IS NULL;
```

## Activities vs Audit Logs Separation (Comment 28)

### Lead Activities (`lead_activities` table)
- **Purpose**: Domain-specific business events tied to lead lifecycle
- **Examples**:
  - Lead status changes
  - Lead assignments  
  - Comments added
  - Tasks created/completed
  - Email sent to lead
- **Retention**: Application-level TTL (e.g., 2 years)
- **PII**: Includes necessary business context (lead name, etc.)

### Audit Logs (`audit_logs` table)
- **Purpose**: Security, compliance, and system-level events
- **Examples**:
  - User login/logout
  - Permission changes
  - User invitations
  - Data exports
  - Failed authentication attempts
- **Retention**: Compliance-driven (7+ years in some jurisdictions)
- **PII**: Minimized - user ID, action type, metadata hashes

### Key Differences
| Aspect | Lead Activities | Audit Logs |
|--------|----------------|------------|
| Scope | Lead lifecycle | System-wide security events |
| Audience | Business users | Security/compliance teams |
| Detail Level | Business context | System metadata |
| Retention | Shorter (2 years) | Longer (7+ years) |
| PII | Business-necessary | Minimal |

### Implementation Rules
- Do not duplicate entries between both tables
- Activities are queryable by regular users; audit logs require special permission
- Archival policies differ: activities can be purged; audit logs must be retained

## Environment Configuration Alignment (Comment 31)

### JWT and Token Settings
```bash
# Access tokens expire quickly and are in cookies
JWT_EXPIRES_IN=15m

# Refresh tokens for long-lived sessions
REFRESH_TOKEN_EXPIRES_IN=7d

# Feature flag for API integrations (default: disabled)
ALLOW_BEARER_TOKENS=false
```

### Cookie Configuration
```bash
# Leave empty for single-domain deployments
# Set to .yourdomain.com for multi-subdomain tenant isolation
COOKIE_DOMAIN=
```

### CORS and CSP
```bash
# Frontend origin (required)
FRONTEND_URL=http://localhost:3000

# API origin (used in CSP connectSrc)
API_URL=http://localhost:5000

# Optional CSP violation reporting endpoint
CSP_REPORT_URI=
```

### Runtime Validation
The `env.ts` file validates all required variables at startup. Production deployments should assert:
- `JWT_SECRET` is at least 32 characters
- `NODE_ENV` is set to `production`
- `DATABASE_URL` is configured
- Email settings are provided if email features are needed

## Cookie Security Settings (Comment 1)

All authentication cookies are set with:
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` - HTTPS-only in production
- `sameSite: 'lax'` - Prevents CSRF while allowing top-level navigation
- `domain: COOKIE_DOMAIN` - Configurable for subdomain sharing
- `path: '/'` - Available site-wide
- `maxAge` - Explicit expiry times

### Cookie Types
1. **access_token** - 15-minute JWT (httpOnly)
2. **refresh_token** - 7-day refresh token (httpOnly)
3. **csrf_token** - 24-hour CSRF token (readable by JS)
4. **tenant_id** - 7-day tenant identifier (readable by JS for API calls)

## CSRF Protection (Comment 2)

Global CSRF middleware protects all state-changing requests (POST/PUT/PATCH/DELETE) except:
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/auth/refresh`
- `/api/v1/auth/password/*`
- `/api/v1/public/forms/*` (public submission endpoints)
- `/api/v1/health`

Frontend must include `X-CSRF-Token` header from cookie on all protected requests.

## Refresh Token Replay Protection (Comment 15)

- Tokens are single-use: revoked immediately after successful refresh
- If a revoked token is presented again, entire token family is revoked
- Audit event `auth.refresh.reuse_detected` is logged
- Rate limit: 20 refresh attempts per minute per user

## Tenant Isolation (Comment 3)

Authenticated requests **must** belong to user's `tenant_id`. Unauthenticated tenant resolution is only allowed for:
- `/api/v1/auth/*` - Authentication flows
- `/api/v1/public/forms/*` - Public form submissions

Platform owners can switch tenants via `X-Tenant-ID` header.

## PII Logging Redaction (Comment 5)

Logs automatically redact:
- Passwords, tokens, secrets
- Authorization headers
- Cookie values
- Email addresses (masked: `u***r@domain.com`)

IP addresses and User-Agent strings are hashed into client fingerprints for security analysis without storing raw PII.

## Rate Limiting Strategy (Comment 6)

- **Global**: 100 requests/min per IP (backstop)
- **Login**: 5 attempts/min per email+tenant+IP
- **Password Reset**: 3 requests/min per email+tenant+IP
- **Registration**: 3 attempts/min per IP
- **Lead Mutations**: 50/min per user+tenant
- **Comments**: 30/min per user+tenant
- **Tasks Mutations**: 40/min per user+tenant
- **Lead Deletions**: 20/min per user+tenant
- **Auth Refresh**: 20/min per user+tenant

All limiters use tenant+user scoping (with IP fallback) to prevent cross-tenant abuse.

## CORS Configuration (Comment 23)

```javascript
{
  origin: [FRONTEND_URL, API_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Tenant-ID', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-CSRF-Token']
}
```

`X-Request-ID` is exposed for frontend error reporting and support tracing.
