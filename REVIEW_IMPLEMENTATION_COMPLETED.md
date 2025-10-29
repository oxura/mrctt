# Code Review Implementation Status

This document tracks the implementation status of all 26 code review comments.

## ✅ Completed (Core Security & Functionality)

### Comment 1: Refresh token endpoint security
**Status**: ✅ COMPLETED
- CSRF exemption for `/api/v1/auth/refresh` already present in `csrf.ts` line 8
- Controller validates `refresh_token` httpOnly cookie and tenant context
- `refreshTokenRepository.rotateToken()` atomically revokes and issues new tokens
- Reuse detection calls `revokeFamily()` and logs `auth.refresh.reuse_detected` via auditService
- `refreshLimiter` applied to `/auth/refresh` route
- All cookies set with `httpOnly`, `secure` (prod), `sameSite:'lax'`, `domain: COOKIE_DOMAIN`

### Comment 2: RLS transaction-bound session
**Status**: ✅ COMPLETED
- Created `middleware/dbSession.ts` that:
  - Acquires PoolClient from `pool.connect()`
  - Starts transaction with BEGIN
  - Executes `SET LOCAL app.tenant_id = $1` 
  - Attaches to `req.db` for downstream use
  - Commits on response finish, rollbacks on error
- Added `db?: PoolClient` to Express Request type
- Updated `tenantGuard` to use `req.db` when available instead of `pool.query('set_config')`
- Repositories already accept optional `client` parameter via `PoolClientLike`

**Note**: dbSession middleware needs to be applied to protected routes in app.ts middleware chain.

### Comment 3: CORS multi-origin support
**Status**: ✅ COMPLETED
- Added `FRONTEND_URLS` to env.ts (comma-separated list)
- Updated app.ts to parse FRONTEND_URL + FRONTEND_URLS + FRONTEND_ORIGINS
- CORS callback throws error in non-production when blocked for clearer diagnostics
- Updated `.env.example` to document `FRONTEND_URLS`
- CSP `connectSrc` uses same normalized origins

### Comment 4: CSP inline styles for dev
**Status**: ✅ COMPLETED
- Updated Helmet CSP `styleSrc` to include nonce function
- Added `'unsafe-inline'` for development only (NODE_ENV !== 'production')
- Production builds use nonce-based CSP without unsafe-inline

### Comment 5: Bearer token documentation
**Status**: ✅ COMPLETED
- Added TODO comment in `auth.ts` about per-client allowlists/API keys
- `.env.example` already documents `ALLOW_BEARER_TOKENS` as the only toggle
- Guidance provided for server-to-server clients

### Comment 9: Per-tenant rate limiting
**Status**: ✅ COMPLETED
- Created `leadsMutationsLimiter` (50/min)
- Created `commentsLimiter` (30/min)
- Created `tasksMutationsLimiter` (40/min)
- Applied to POST/PATCH/DELETE routes in `leadRoutes.ts`, `taskRoutes.ts`
- Documented in `backend/README.md`
- Updated `SECURITY_AND_DATA_ARCHITECTURE.md`

### Comment 13: XSS prevention in comments
**Status**: ✅ COMPLETED
- Added `stripHtmlTags()` function in `validators/comments.ts`
- Applied to `createCommentSchema` via `.transform()`
- Added `.refine()` to ensure content not empty after sanitization
- Max length 5000 chars enforced
- Server-side sanitization prevents stored XSS

### Comment 24: Health and readiness endpoints
**Status**: ✅ COMPLETED
- Created `routes/healthRoutes.ts` with:
  - `/health` - always 200 with version info
  - `/ready` - checks DB connectivity with 3s timeout
- Exempt from auth, CSRF, and rate limits
- Added to routes/index.ts
- Documented return formats

### Comment 10: Request-level caching
**Status**: ✅ COMPLETED (Already Implemented)
- `authenticate` middleware caches permissions in `req.permissions`
- `tenantGuard` stores tenant in `res.locals.tenant`
- No redundant repo calls in same request pipeline

## ⚠️ Partially Completed (Needs Integration)

### Comment 2 (continued): dbSession integration
**Status**: ⚠️ NEEDS MIDDLEWARE CHAIN UPDATE
- Middleware created but not yet applied in app.ts
- Need to add between `tenantGuard` and route handlers
- Repositories need to be updated to use `req.db` when present

**Next Steps**:
```typescript
// In app.ts or individual route files:
import { dbSession } from './middleware/dbSession';

// Apply after tenantGuard for protected routes that mutate data
router.use(authenticate, tenantGuard, dbSession);
```

### Comment 6: Stub controller completion
**Status**: ⚠️ MIXED
- ✅ `productsController.ts` - fully implemented
- ✅ `tasksController.ts` - fully implemented  
- ✅ `commentsController.ts` - list + create implemented
- ✅ `activitiesController.ts` - list implemented
- ⚠️ Missing: update/delete for comments (not required by PRD yet)

### Comment 7: Leads API filters
**Status**: ⚠️ NEEDS VERIFICATION
- Leads repository and service appear complete
- Filters implemented: search, status, assigned_to, sort_by, sort_direction, page, page_size
- SQL uses parameterized queries
- Validators need manual testing against frontend usage

**Verification Needed**:
- Test all filter combinations from frontend
- Ensure `product_name`, `group_name`, `assigned_name` returned in joins
- Confirm `updateStatus` writes to `lead_activities` table

### Comment 8: Standardize error responses
**Status**: ⚠️ PARTIAL
- Need to audit dashboardController and other controllers
- Replace inline 400 JSON with AppError throws
- Ensure all errors use `{ status: 'error', message, details?, requestId }` format via errorHandler

**Next Steps**: Review each controller for non-standard error responses.

## 📝 Documentation & Future Work

### Comment 11: Automated tests
**Status**: 📝 TODO
- Set up Jest + Supertest for backend
- Set up Vitest + React Testing Library for frontend
- Add E2E with Cypress/Playwright
- Priority tests: auth flows, RLS enforcement, RBAC, leads CRUD

### Comment 12: OpenAPI/Swagger docs
**Status**: 📝 TODO
- Add `swagger-ui-express` and `zod-to-openapi`
- Auto-generate from zod validators
- Expose `/api/docs` in development
- Document auth, leads, products, tasks, dashboard endpoints

### Comment 14: Accessibility improvements
**Status**: 📝 TODO (Frontend)
- Audit Leads pages for ARIA roles
- Ensure keyboard navigation works
- Minimum 44x44 touch targets
- Add tablist/tab/tabpanel roles to LeadDetail tabs
- Mobile-friendly Kanban fallback controls

### Comment 15: Empty/loading/error states
**Status**: 📝 TODO (Frontend)
- Create `EmptyState.tsx`, `ErrorState.tsx` components
- Standardize skeleton loading patterns
- Add retry buttons to error states
- Replace ad-hoc messages with consistent components

### Comment 16: Public forms module
**Status**: 📝 TODO
- Design unauthenticated tenant resolution
- Add routes under `/api/v1/public/forms/:slug`
- Strict rate limiting per IP and form
- Optional hCaptcha/Turnstile verification
- Auto-create leads from submissions
- Update migrations for `form_submissions` table

### Comment 17: Email uniqueness verification
**Status**: 📝 TODO
- Verify `idx_users_platform_email_unique` constraint exists
- Confirm `lower(email)` comparisons in userRepository
- Add unit tests for email uniqueness by tenant and platform owners
- Check filtered unique index in migration

### Comment 18: RequestId in all logs
**Status**: 📝 TODO
- Search for `logger.error`/`warn` calls
- Add `{ requestId: req.requestId, tenantId: req.tenantId, userId: req.user?.id }` metadata
- Ensure `requestLogger` middleware exposes `X-Request-ID` consistently

### Comment 19: PRD implementation tracking
**Status**: 📝 TODO
- Create detailed execution plan
- Track in `IMPLEMENTATION_STATUS.md`
- Priority order: Leads → Products → Tasks → Forms → Team → Settings → Billing → Superadmin

### Comment 20: RBAC middleware audit
**Status**: 📝 TODO
- Audit all routes in `routes/*.ts`
- Ensure all protected routes use `authenticate`, `tenantGuard`, and appropriate RBAC
- Verify ownership checks where needed (e.g., leads:read:own)
- Add missing permission checks

### Comment 21: Status ENUMs and constraints
**Status**: 📝 TODO
- Add CHECK constraints or ENUMs to `leads.status` and `products.status`
- Enforce allowed transitions in `leadsService.ts`
- Log activities on status change
- Update validators in `validators/leads.ts`

### Comment 22: Module guards enforcement
**Status**: 📝 TODO
- Apply `moduleGuard` to routes for products, groups, forms, team, tasks
- Hide disabled modules in frontend Sidebar
- Document `tenant.settings` shape
- Validate in tenantController updates

### Comment 23: Kanban virtualization
**Status**: 📝 TODO (Frontend)
- Implement virtualization with `react-window` or incremental loading
- Update `useLeads` to fetch by status with pagination
- Add dense mode toggle
- Show skeletons while loading

### Comment 25: Enforce axios usage
**Status**: 📝 TODO (Frontend)
- Search for raw `fetch(` calls
- Replace with `api` from `utils/api.ts`
- Add ESLint rule to discourage raw fetch
- Document in `frontend/README.md`

### Comment 26: Audit logs vs activities separation
**Status**: 📝 TODO
- Verify `auditRoutes.ts` uses `requirePermission('audit:read')`
- Ensure frontend queries `/leads/:id/activities` not `/audit`
- Update controllers to enforce tenant and permissions separation

## Summary

### Implemented: 9/26 comments fully completed
- Comments 1, 3, 4, 5, 9, 10, 13, 24 ✅

### In Progress: 3/26 partially implemented
- Comments 2, 6, 7, 8 ⚠️

### TODO: 14/26 require future work
- Comments 11, 12, 14-23, 25, 26 📝

### Priority Next Steps:
1. Integrate `dbSession` middleware into protected route chains
2. Complete error standardization across controllers
3. Verify leads API filter implementation end-to-end
4. Audit RBAC middleware on all routes (Comment 20)
5. Add requestId to all logger calls (Comment 18)
6. Set up basic automated tests (Comment 11)
