# Implementation Checklist

This document tracks the implementation status of features and improvements based on PRD and review comments.

## ✅ Completed

### Security & Infrastructure
- [x] JWT authentication with httpOnly cookies
- [x] CSRF protection with exemptions for auth endpoints
- [x] Rate limiting (global + per-endpoint)
- [x] Row-Level Security (RLS) policies on all tenant-scoped tables
- [x] RBAC with permission middleware
- [x] Audit logging framework
- [x] Request ID tracking (X-Request-ID header)
- [x] PII redaction in request logs
- [x] Cookie security settings (httpOnly, secure, sameSite)
- [x] CORS configuration with FRONTEND_ORIGINS CSV support
- [x] Helmet security headers with CSP
- [x] Error handler with sanitization and Request ID

### Database
- [x] Multi-tenant schema with tenant_id on all tables
- [x] RLS policies with app.tenant_id session variable
- [x] Refresh tokens table with family tracking
- [x] Login attempts and lockout mechanism
- [x] Audit logs table
- [x] Indexes on foreign keys and tenant_id
- [x] Lead status CHECK constraint (migration 00014)
- [x] Tasks composite indexes for calendar queries (migration 00015)

### API Endpoints
- [x] Auth: register, login, logout, refresh, password reset
- [x] Users: list, get, create, update
- [x] Tenants: get current, list (platform owner)
- [x] Products: CRUD
- [x] Groups: CRUD
- [x] Leads: CRUD, list with filters/sorting
- [x] Tasks: CRUD
- [x] Dashboard: KPI aggregations
- [x] Audit logs: query by filters

### Validation
- [x] Zod schemas with .strict() for all create/update endpoints
- [x] Lead status enum validation
- [x] Product type/status enum validation
- [x] Email/password validation
- [x] Custom fields size limits

### Frontend
- [x] Landing page
- [x] Login/Register with validation
- [x] Password reset flow
- [x] Dashboard with KPI cards
- [x] Leads list with table and Kanban views
- [x] Products list
- [x] Tasks list
- [x] Profile page
- [x] Navigation (Sidebar + Topbar)
- [x] Protected routes
- [x] API client with auto-retry and CSRF token handling
- [x] Single-flight token refresh to prevent stampede

## 🚧 In Progress / Partially Complete

### Security (Review Comments)
- [x] Comment 1: RLS transaction scoping - Documented pattern with `withTenantContext`, full refactor deferred
- [x] Comment 2: Refresh token rate limiting and reuse detection - Already implemented
- [x] Comment 3: CSRF exemptions verified - Updated to include /auth/login, /auth/refresh
- [x] Comment 4: SQL injection in ORDER BY - Already safe with switch statement
- [x] Comment 5: CORS whitelist - Fixed to only allow frontend origins
- [x] Comment 6: Cookie domain handling - Documented with examples
- [x] Comment 11: PII redaction - Already implemented
- [x] Comment 27: Lead status constraints - Migration added
- [x] Comment 28: Cookie security - Already correct
- [x] Comment 17: Zod strict validators - Applied .strict() to all schemas
- [x] Comment 26: Request ID tracking - Already implemented
- [x] Comment 12: Frontend refresh logic - Fixed with single-flight mechanism
- [x] Comment 15: Tasks indexes - Migration added

### Needs Implementation
- [ ] Comment 7: Audit all controllers to never use req.headers['x-tenant-id'] directly
- [ ] Comment 8: CSP inline styles - Check for dynamic style tags
- [ ] Comment 9: OpenAPI documentation
- [ ] Comment 10: Automated tests (Jest/Playwright)
- [ ] Comment 13: Global search endpoint with indexed ILIKE
- [ ] Comment 14: N+1 query optimization for leads list (JOIN users/products/groups)
- [ ] Comment 16: Backlog prioritization document
- [ ] Comment 18: Audit logging middleware on all mutation routes
- [ ] Comment 19: Error response field validation formatting
- [ ] Comment 20: Accessibility audit
- [ ] Comment 21: Env docs updated - Partially done
- [ ] Comment 22: Dashboard real data endpoints
- [ ] Comment 23: Kanban backend status update endpoint
- [ ] Comment 24: Permission-based UI hiding
- [ ] Comment 25: Public forms endpoints
- [ ] Comment 29: Tenant active status checks - Already in tenantGuard
- [ ] Comment 30: Optimistic UI reconciliation
- [ ] Comment 31: Keyboard accessible Kanban
- [ ] Comment 32: Backend pagination returns total_pages - Already done
- [ ] Comment 33: ProtectedRoute module toggles
- [ ] Comment 34: Activities vs audit logs separation guidance
- [ ] Comment 35: Operational runbooks

## 📋 Backlog (Prioritized)

### P0: Critical Functionality
1. **Leads Kanban Persistence**
   - Backend: `PATCH /api/v1/leads/:id/status` with RBAC
   - Validator: Strict status enum
   - Activity logging on status change
   - Ownership check for own-only permissions

2. **Global Search**
   - Backend: `GET /api/v1/search?q=...&types[]=leads&types[]=products`
   - Indexed ILIKE on leads.email, phone, first_name, last_name
   - Indexed ILIKE on products.name
   - RBAC filtering
   - Pagination

3. **N+1 Query Fix**
   - Update leadsRepository.findAll() to JOIN users, products, groups
   - Enrich result with assigned_name, product_name, group_name in one query

4. **Lead Detail Page Backend**
   - GET /api/v1/leads/:id - Already exists
   - POST /api/v1/leads/:id/comments - Create comment
   - GET /api/v1/leads/:id/comments - List comments
   - GET /api/v1/leads/:id/activities - List activities
   - GET /api/v1/leads/:id/tasks - List lead-specific tasks

### P1: Enhanced Features
5. **Dashboard Real Data**
   - Aggregate queries with tenant scoping
   - Short TTL caching (Redis optional)
   - Indexes for date range filters

6. **Tasks Calendar**
   - GET /api/v1/tasks?due_date_from=...&due_date_to=...
   - Already has indexes from migration 00015

7. **Products UI Polishing**
   - Update/delete modals
   - Status badge styling
   - Bulk actions

8. **Permission-Based UI**
   - GET /api/v1/users/me/permissions endpoint
   - Store permissions in authStore
   - Conditionally render Sidebar items
   - ProtectedRoute checks for feature access

9. **Team Management UI**
   - Invitations (email token-based)
   - Role assignment
   - User deactivation

### P2: Public & External
10. **Forms Builder & Public Submission**
    - POST /api/v1/public/forms/:tenantSlug/:formSlug
    - CSRF exempt, public rate limiter (IP + form)
    - Auto-create leads from submissions
    - Captcha integration hook

11. **Settings Pages**
    - Tenant settings (name, logo, niche)
    - Module toggles (products, groups, forms)
    - User profile (email, password change)
    - Notification preferences

### P3: Advanced Features
12. **Billing & Subscriptions** (Owner only)
    - Stripe integration
    - Plans: Free, Pro, Enterprise
    - Usage tracking

13. **Superadmin Panel** (Platform Owner)
    - Tenant list with search/filters
    - Impersonate tenant
    - System metrics dashboard

14. **Lead Import/Export**
    - CSV upload with validation
    - Background job queue (BullMQ)
    - Progress tracking

15. **Email Templates**
    - Lead notification emails
    - Task reminder emails
    - Welcome/onboarding sequence

## 🧪 Testing Priorities

### Unit Tests (Backend)
- [ ] AuthService (register, login, refresh, reuse detection)
- [ ] Validators (Zod schemas)
- [ ] Utils (JWT, password, tokens)
- [ ] Repositories (mocked DB)

### Integration Tests (Backend)
- [ ] Auth flows (register → login → refresh → logout)
- [ ] Tenant isolation (verify RLS policies work)
- [ ] RBAC enforcement (role-based endpoint access)
- [ ] Rate limiting (hit limits, verify 429)
- [ ] CSRF protection (test exempt vs protected)

### E2E Tests (Frontend)
- [ ] Registration → Onboarding → Dashboard
- [ ] Login → Create Lead → View Lead
- [ ] Kanban drag-and-drop → Status update
- [ ] Create Product → Assign to Lead
- [ ] Token refresh on 401

## 📚 Documentation

### Completed
- [x] ARCHITECTURE.md with multi-tenancy strategy
- [x] SECURITY_AND_DATA_ARCHITECTURE.md
- [x] RBAC_AUDIT_IMPROVEMENTS.md
- [x] SECURITY_IMPLEMENTATION_NOTES.md (new)
- [x] .env.example with CORS/cookie guidance

### Needed
- [ ] OpenAPI/Swagger spec
- [ ] OPERATIONAL_RUNBOOKS.md (migrations, rollback, seeding)
- [ ] TESTING_GUIDE.md
- [ ] DEPLOYMENT_GUIDE.md
- [ ] CONTRIBUTING.md

## 🔧 Technical Debt

1. **RLS Full Refactor** - Use withTenantContext in all repositories
2. **Background Jobs** - Implement BullMQ for emails, imports
3. **Caching Layer** - Redis for dashboard KPIs
4. **Logging Service** - Integrate Datadog/Logstash in production
5. **Monitoring** - APM for latency/error tracking
6. **Database Partitioning** - For tenants with large datasets
7. **CDN for Assets** - Offload frontend static files

## 🎯 Current Sprint Goals

### Week 1-2
- [ ] Complete Comment 13: Global search endpoint
- [ ] Complete Comment 14: N+1 query optimization
- [ ] Complete Comment 23: Kanban backend endpoint
- [ ] Write integration tests for auth flows
- [ ] Add ESLint rule for direct header access

### Week 3-4
- [ ] Lead detail page with comments/activities/tasks
- [ ] Dashboard real data integration
- [ ] OpenAPI spec generation
- [ ] E2E tests for critical paths

## 📊 Progress Metrics

- **Security**: 85% complete (critical items done)
- **Core API**: 70% complete (CRUD done, advanced features pending)
- **Frontend**: 60% complete (layout + basic pages done)
- **Testing**: 10% complete (manual only, automated pending)
- **Documentation**: 75% complete (architecture done, operational pending)
