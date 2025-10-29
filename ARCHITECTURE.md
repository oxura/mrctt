# Architecture Documentation

## Overview

This is a multi-tenant SaaS CRM platform designed to adapt to different business niches through configurable modules.

## Multi-Tenancy Strategy

### Approach: Shared Database with Tenant Isolation

**Why this approach?**
- Cost-effective for SaaS with many small/medium tenants
- Easier maintenance and backups
- Good performance with proper indexing
- Simpler database migrations

**How it works:**
1. Every table (except `tenants` and `migrations`) has a `tenant_id` column
2. All queries automatically filter by `tenant_id` in application layer
3. Foreign keys maintain referential integrity within tenants
4. Indexes on `tenant_id` ensure query performance

### Tenant Resolution

The system resolves tenant context from:
1. **X-Tenant-ID header** (primary method for APIs)
2. **Subdomain** (e.g., `acme.ecosystem.app`)
3. **User's tenant_id** (from JWT payload)

The `tenantGuard` middleware:
- Extracts tenant identifier
- Validates tenant exists and is active
- Injects tenant context into `req.tenantId`
- Downstream code uses this for all queries

### Security Considerations

**Preventing cross-tenant data leaks:**
- **Database-level Row-Level Security (RLS)**: PostgreSQL policies enforce `tenant_id` isolation
  - All tenant-scoped tables have RLS enabled
  - Policies use `app.tenant_id` session variable set per request
  - Double defense: Both application and database enforce isolation
- Repository pattern enforces `tenant_id` filters in WHERE clauses
- All queries use parameterized statements
- No direct SQL from user input
- Automated tests verify tenant isolation

**Database-Level Tenant Isolation:**
Migration `00009_enable_rls.sql` enables Row-Level Security on:
- users, products, groups, leads, lead_comments, lead_activities, tasks, forms, form_submissions
- Each connection sets `SET LOCAL app.tenant_id = '<uuid>'` at transaction start
- Policies return rows WHERE `tenant_id::text = current_setting('app.tenant_id', true)`
- If session variable not set, queries return no rows (fail-safe)

**Role-Based Access Control:**
- `owner` - Full access within tenant, can manage billing
- `admin` - Full CRM access, no billing
- `manager` - Limited to leads, tasks, and calendar
- `platform_owner` - Cross-tenant access for platform administration

## Authentication Flow

### Registration
```
1. User submits email, password, company info
2. System creates tenant record
3. System creates user with role='owner'
4. JWT issued with { userId, tenantId, role }
5. Client stores token + tenantId
```

### Login
```
1. User submits email, password, tenantSlug
2. System finds tenant by slug
3. System finds user by email + tenant_id
4. Verify password with bcrypt
5. JWT issued
6. Update last_login_at timestamp
```

### Protected Requests
```
1. Client sends: Authorization: Bearer <token>
2. authenticate middleware verifies JWT
3. Extracts userId, fetches user from DB
4. Injects req.user and req.tenantId
5. tenantGuard validates tenant access
6. Controller executes business logic
```

## Database Schema

### Core Tables

**tenants**
- Stores company/organization information
- Independent of users (no FK to users)
- Settings stored as JSONB for flexibility

**users**
- Belongs to tenant (FK: tenant_id)
- Unique constraint: (tenant_id, email)
- Password hashed with bcrypt (12 rounds)

**products**
- Services/courses offered by tenant
- Type field: course, service, product, other
- Settings JSONB for niche-specific fields

**groups**
- For courses (cohorts) or tourism (trips)
- Tracks capacity: max_capacity, current_capacity
- Auto-close when full

**leads**
- Customer pipeline records
- Status field for pipeline stages
- Custom fields in JSONB for flexibility
- UTM tracking for marketing attribution

**lead_comments**
- Notes/comments on leads
- Chronological log

**lead_activities**
- Audit trail of all lead interactions
- Metadata JSONB for flexible event data

**tasks**
- Reminders and follow-ups
- Can be linked to leads
- Priority levels: low, medium, high

**forms**
- Public lead capture forms
- Fields defined as JSONB array
- Each tenant can have multiple forms

**form_submissions**
- Responses to forms
- Creates lead record automatically
- Stores IP + user agent for analytics

### Indexes

All foreign keys are indexed for join performance:
- `tenant_id` on all tables
- `assigned_to`, `created_by` on leads/tasks
- `lead_id` on comments/activities
- `email` with lower() for case-insensitive search

### Triggers

`updated_at` timestamp automatically updated via trigger function on:
- tenants, users, products, groups, leads, tasks, forms

## API Design

### REST Principles

- **Resource-based URLs**: `/api/v1/leads`, `/api/v1/products`
- **HTTP verbs**: GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
- **Status codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

### Response Format

Success:
```json
{
  "status": "success",
  "data": { ... }
}
```

Error:
```json
{
  "status": "error",
  "message": "Human-readable error",
  "details": { "field": ["validation errors"] }
}
```

### Middleware Stack

1. **Request ID** - Assigns unique ID to each request for tracing
2. **Rate Limiting** - 100 requests/min per IP (granular limits on auth endpoints)
3. **Helmet** - Security headers (CSP, HSTS, etc.)
4. **CORS** - Allow frontend origins only (supports multiple via `FRONTEND_ORIGINS` CSV)
5. **Cookie Parser** - Parse cookies for auth tokens
6. **Body Parser** - JSON with 1MB limit
7. **Request Logger** - Winston logs all requests with PII redaction
8. **CSRF Protection** - Validates X-CSRF-Token on mutations (exempts auth endpoints)
9. **Authentication** - JWT verification from httpOnly cookies (optional per route)
10. **Tenant Guard** - Tenant context resolution and validation (optional per route)
11. **RBAC** - Role-based permission checks (optional per route)
12. **Route Handler** - Business logic
13. **Error Handler** - Catch all errors, sanitize, include X-Request-ID in response

## Frontend Architecture

### State Management

**Zustand** for global state:
- `authStore` - User, tenant, token
- Persisted to localStorage
- Rehydrated on app load

**Why Zustand?**
- Minimal boilerplate
- No context providers needed
- TypeScript-first
- Easy to test

### Routing

React Router DOM v6:
- Public routes: `/login`, `/register`
- Protected routes: Wrapped in `<ProtectedRoute>`
- Redirects: Unauthenticated → `/login`, Authenticated → `/dashboard`

### API Client

Axios instance with interceptors:
- Automatically adds `Authorization` header (from httpOnly cookies)
- Automatically adds `X-CSRF-Token` header for mutations
- Automatically adds `X-Tenant-ID` header
- Handles 401 errors with token refresh (single-flight to prevent stampede)
- Captures `X-Request-ID` for error tracking
- Handles errors globally

### Component Structure

```
/layouts - Page templates (AppLayout with Sidebar + Topbar)
/pages - Route components (Dashboard, Login, etc.)
/components
  /navigation - Sidebar, Topbar
  /widgets - KpiCard, ActivityFeed, TaskList
  /common - Reusable UI components
```

### Styling

CSS Modules:
- Scoped styles per component
- No global namespace pollution
- Co-located with components

## Security

### OWASP Top 10 Mitigations

1. **Injection** - Parameterized queries, Zod validation
2. **Broken Auth** - JWT with expiry, bcrypt hashing, rate limiting
3. **Sensitive Data** - HTTPS only, passwords never logged
4. **XML External Entities** - Not applicable (no XML)
5. **Broken Access Control** - RBAC middleware, tenant isolation
6. **Security Misconfiguration** - Helmet.js, strict CSP
7. **XSS** - React auto-escapes, CSP headers
8. **Insecure Deserialization** - No eval(), strict JSON parsing
9. **Using Components with Known Vulnerabilities** - Automated dependency scanning
10. **Insufficient Logging** - Winston logs all requests + errors

### Additional Security

- **CSRF Protection** - SameSite cookies (when using session-based auth)
- **SQL Injection** - Parameterized queries only
- **Brute Force** - Rate limiting on auth endpoints
- **Token Security** - JWT secret >= 32 chars, short expiry

## Deployment

### Environment Requirements

**Backend:**
- Node.js 18+
- PostgreSQL 14+ (or Neon DB)
- Environment variables set (see `.env.example`)

**Key Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT & Auth
JWT_SECRET=minimum-32-characters-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ALLOW_BEARER_TOKENS=false  # Only for non-browser clients

# CORS & Origins
FRONTEND_URL=http://localhost:3000
FRONTEND_ORIGINS=https://staging.myapp.com,https://myapp.com  # CSV for multiple
API_URL=http://localhost:5000  # For CSP only, NOT in CORS allowlist

# Cookies
COOKIE_DOMAIN=  # Empty for host-only (recommended), or .yourdomain.com for subdomains

# Security
CSP_REPORT_URI=https://report.example.com
LOG_LEVEL=info
NODE_ENV=production
```

**Frontend:**
- Static file hosting (Vercel, Netlify, S3 + CloudFront)
- Environment variables injected at build time

### Database Migrations

**Zero-downtime deployments:**
1. Run migrations before deploying new code
2. Migrations are additive (add columns, not remove)
3. Remove deprecated columns in later migration after code deployed

**Rollback strategy:**
- Keep migrations idempotent
- Test rollback scripts in staging
- Maintain manual rollback SQL for critical changes

## Monitoring & Observability

### Logs

Winston logger outputs:
- HTTP requests (method, status, duration, tenant, user)
- Errors (stack traces, context)
- Database queries (in development only)

**Log aggregation:**
- Production: Send to log service (Datadog, Logstash, etc.)
- Development: Console + local files

### Metrics

Track:
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query times
- Active tenants
- Sign-ups per day

### Alerts

Critical alerts:
- Error rate > 5%
- API response time > 2s (p95)
- Database connection pool exhausted
- Disk space < 20%

## Scalability

### Current Bottlenecks

1. **Database** - Single PostgreSQL instance
2. **API Server** - Single Node.js process

### Scaling Strategies

**Horizontal scaling:**
- Add more API servers behind load balancer
- Use connection pooling to database
- Session-less architecture (JWT) enables stateless servers

**Database scaling:**
- Read replicas for reporting queries
- Connection pooling (PgBouncer)
- Partition large tables by tenant_id
- Eventually: Separate databases per tenant for huge tenants

**Caching:**
- Redis for session data (if switching from JWT)
- Cache user/tenant lookups
- Cache dashboard KPIs with short TTL

**Background Jobs:**
- Queue system (BullMQ + Redis) for:
  - Email sending
  - Report generation
  - Batch imports
  - Data exports

## Testing Strategy

### Backend Tests

**Unit tests:**
- Services (business logic)
- Utilities (JWT, password hashing)
- Repositories (mocked DB)

**Integration tests:**
- API endpoints with real database
- Tenant isolation verification
- RBAC enforcement

### Frontend Tests

**Unit tests:**
- Components (React Testing Library)
- Stores (Zustand)
- Utilities

**E2E tests:**
- Critical user flows (Playwright/Cypress)
- Registration → Onboarding → Create Lead

## Future Enhancements

### Phase 2 Features

- Real-time chat (WebSockets)
- Email/SMS integrations
- Calendar sync (Google/Outlook)
- Advanced reporting
- Webhooks API
- Mobile app (React Native)

### Technical Debt

- Add comprehensive test coverage
- Implement background job queue
- Add rate limiting per tenant
- Implement audit logging
- Add database query caching
- Improve error messages
