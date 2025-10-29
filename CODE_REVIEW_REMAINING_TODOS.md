# Code Review: Remaining TODOs

## Critical Integration Tasks

### 1. Apply dbSession middleware to route chains
**Priority**: HIGH
**Location**: `backend/src/routes/*.ts` or `backend/src/app.ts`

The `dbSession` middleware has been created but not yet integrated. It must be applied to protected routes that need transaction-bound RLS enforcement.

**Options**:

A. **Global application (recommended for consistency)**:
```typescript
// In backend/src/app.ts after CSRF protection
import { dbSession } from './middleware/dbSession';

app.use(requestId);
app.use(requestLogger);
app.use(csrfProtection);
app.use(dbSession); // Add here for all /api/v1 routes

app.use('/api/v1', routes);
```

B. **Per-route application** (more granular):
```typescript
// In each protected route file
import { dbSession } from '../middleware/dbSession';

router.use(authenticate, tenantGuard, dbSession);
```

**Testing**:
- Verify RLS policies apply consistently
- Check transaction commit/rollback behavior
- Monitor for connection leaks

---

### 2. Update repositories to prefer req.db
**Priority**: MEDIUM
**Affected files**: All repositories that query the database

Currently repositories use `pool` by default. When `req.db` is available, they should use it to participate in the request transaction.

**Pattern to apply**:
```typescript
// Before
async findById(tenantId: string, id: string): Promise<Entity> {
  const result = await pool.query('SELECT * FROM entities WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return result.rows[0];
}

// After
async findById(tenantId: string, id: string, client?: PoolClientLike): Promise<Entity> {
  const db = client || pool;
  const result = await db.query('SELECT * FROM entities WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return result.rows[0];
}
```

**Affected repositories**:
- leadsRepository.ts
- productsRepository.ts
- tasksRepository.ts
- commentsRepository.ts
- activitiesRepository.ts
- userRepository.ts
- tenantRepository.ts

**Controllers pattern**:
```typescript
// Pass req.db from controllers to services/repositories
const lead = await leadsService.updateLead(tenantId, leadId, data, req.db);
```

---

## Code Quality & Standardization

### 3. Standardize error responses (Comment 8)
**Priority**: MEDIUM
**Files**: All controllers

**Current inconsistencies**:
- Some controllers return inline `res.status(400).json({ error: '...' })`
- Should throw `AppError` instead to use global error handler

**Pattern**:
```typescript
// Bad
if (!someCondition) {
  return res.status(400).json({ error: 'Validation failed' });
}

// Good
if (!someCondition) {
  throw new AppError('Validation failed', 400, { field: ['error detail'] });
}
```

**Files to audit**:
- `dashboardController.ts`
- `leadsController.ts`
- `productsController.ts`
- `tasksController.ts`
- All other controllers

---

### 4. Add requestId to all logger calls (Comment 18)
**Priority**: LOW
**Files**: All controllers and services

**Pattern**:
```typescript
logger.error('Operation failed', {
  requestId: req.requestId,
  tenantId: req.tenantId,
  userId: req.user?.id,
  error: err,
});
```

**Search command**:
```bash
grep -rn "logger\.(error|warn)" backend/src/controllers backend/src/services
```

---

### 5. Verify email uniqueness constraints (Comment 17)
**Priority**: MEDIUM
**Files**: Migration, `userRepository.ts`

**Tasks**:
1. Check migration `00001_initial_schema.sql` for:
   - `UNIQUE(tenant_id, email)` constraint
   - Filtered unique index for platform owners: `CREATE UNIQUE INDEX users_platform_owner_email_unique ON users (email) WHERE tenant_id IS NULL;`

2. Verify `userRepository` uses `LOWER(email)` for comparisons:
```typescript
const result = await pool.query(
  'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND tenant_id = $2',
  [email, tenantId]
);
```

3. Add unit tests for email uniqueness scenarios

---

## Security & RBAC

### 6. Audit RBAC middleware on all routes (Comment 20)
**Priority**: HIGH
**Files**: All route files in `backend/src/routes/`

**Checklist for each route**:
- [ ] Uses `authenticate` middleware
- [ ] Uses `tenantGuard` middleware
- [ ] Has appropriate RBAC middleware (`requirePermission`, `requirePermissionWithOwnership`, etc.)
- [ ] Read operations require `resource:read:all` OR `resource:read:own`
- [ ] Write operations require `resource:update:all` OR `resource:update:own` with ownership check
- [ ] Delete operations require `resource:delete:all` OR `resource:delete:own`

**Example**:
```typescript
// Good
router.patch(
  '/:id',
  authenticate,
  tenantGuard,
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => await leadsRepository.getOwnerIdIfExists(req.tenantId!, req.params.id)
  ),
  leadsController.update
);
```

---

### 7. Enforce module guards (Comment 22)
**Priority**: MEDIUM
**Files**: Route files, frontend Sidebar.tsx

**Backend**:
Apply `requireModule('moduleName')` to routes that should respect tenant settings:
```typescript
import { requireModule } from '../middleware/moduleGuard';

router.use(authenticate, tenantGuard, requireModule('products'));
```

**Frontend**:
Hide menu items for disabled modules in `Sidebar.tsx`:
```typescript
const tenant = useTenantStore((state) => state.tenant);
const modulesEnabled = tenant?.settings?.modules || {};

// Only show if enabled
{modulesEnabled.products && (
  <NavLink to="/products">Products</NavLink>
)}
```

---

## Data Integrity

### 8. Add status ENUMs/constraints (Comment 21)
**Priority**: MEDIUM
**Files**: Migration, `leadsService.ts`, `validators/leads.ts`

**Migration**:
```sql
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));

ALTER TABLE products ADD CONSTRAINT products_status_check
CHECK (status IN ('active', 'archived'));
```

Or create a per-tenant statuses table:
```sql
CREATE TABLE lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  pipeline_order INT NOT NULL,
  ...
);
```

**Service logic** (in `leadsService.ts`):
- Validate transitions (e.g., cannot go from 'converted' to 'new')
- Log activity on status change
- Update validator to accept only allowed values

---

### 9. Verify leads API filters end-to-end (Comment 7)
**Priority**: HIGH
**Files**: `leadsRepository.ts`, `leadsService.ts`, `validators/leads.ts`

**Test checklist**:
- [ ] `search` param filters by name, phone, email, product name
- [ ] `status` param filters by lead status
- [ ] `assigned_to` param filters by user ID
- [ ] `sort_by` param works for all allowed columns
- [ ] `sort_direction` param (asc/desc) applies correctly
- [ ] `page` and `page_size` paginate correctly
- [ ] Response includes `product_name`, `group_name`, `assigned_name` from joins
- [ ] `updateStatus` writes to `lead_activities` table
- [ ] SQL uses parameterized queries (no SQL injection)

**Manual test**:
```bash
# Test from frontend Leads page with various filter combinations
# Or use curl:
curl -X GET "http://localhost:5000/api/v1/leads?search=John&status=new&page=1&page_size=25" \
  -H "Cookie: access_token=..." \
  -H "X-Tenant-ID: ..."
```

---

## Testing & Documentation

### 10. Set up automated tests (Comment 11)
**Priority**: HIGH (Long-term)

**Backend (Jest + Supertest)**:
```bash
npm install --save-dev jest supertest @types/jest @types/supertest ts-jest
```

**Test categories**:
1. Auth flows: register, login, refresh, logout
2. RLS enforcement: cross-tenant data isolation
3. RBAC: permission checks, ownership validation
4. Leads CRUD: list with filters, create, update, delete

**Example structure**:
```
backend/
  tests/
    integration/
      auth.test.ts
      leads.test.ts
      rbac.test.ts
    unit/
      services/
        authService.test.ts
```

**Frontend (Vitest + React Testing Library)**:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

**Test categories**:
1. Leads list: sorting, filtering, selection
2. Leads Kanban: drag-and-drop status update (mock API)
3. Forms: validation, submission

**E2E (Playwright or Cypress)**:
1. User registration → onboarding → create product → create lead

---

### 11. Add OpenAPI/Swagger documentation (Comment 12)
**Priority**: MEDIUM

**Installation**:
```bash
npm install swagger-ui-express zod-to-openapi
```

**Implementation**:
```typescript
// backend/src/app.ts
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from './openapi';

if (env.NODE_ENV !== 'production') {
  const swaggerDocument = generateOpenApiDocument();
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
```

**Generate from zod validators**:
```typescript
// backend/src/openapi.ts
import { extendZodWithOpenApi } from 'zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// Convert zod schemas to OpenAPI format
export const generateOpenApiDocument = () => {
  return {
    openapi: '3.0.0',
    info: { title: 'CRM SaaS API', version: '1.0.0' },
    paths: { /* auto-generate from validators */ },
  };
};
```

---

### 12. Separate audit logs vs activities (Comment 26)
**Priority**: MEDIUM
**Files**: `auditRoutes.ts`, `activitiesService.ts`, frontend hooks

**Backend**:
- Ensure `auditRoutes.ts` uses `requirePermission('audit:read')` (admin-only)
- Lead activities should query `lead_activities` table
- Audit logs should query `audit_logs` table

**Frontend**:
- `useActivities` hook queries `/api/v1/leads/:id/activities` 
- Admins query `/api/v1/audit` for system-wide security logs

**Verify separation**:
```typescript
// backend/src/routes/auditRoutes.ts
router.get('/', requirePermission('audit:read'), auditController.list);

// backend/src/routes/leadRoutes.ts
router.get('/:leadId/activities', 
  requirePermissionWithOwnership('leads:read:all', 'leads:read:own', ...),
  activitiesController.list
);
```

---

## Frontend Improvements

### 13. Accessibility improvements (Comment 14)
**Priority**: MEDIUM
**Files**: Frontend components, especially Leads pages

**Checklist**:
- [ ] All interactive elements have visible focus styles
- [ ] Buttons/links have minimum 44x44px touch targets
- [ ] Proper ARIA roles on custom components
- [ ] Keyboard navigation works for all actions
- [ ] Screen reader friendly labels

**LeadDetail tabs**:
```tsx
<div role="tablist">
  <button role="tab" aria-selected={activeTab === 'overview'}>
    Overview
  </button>
  <button role="tab" aria-selected={activeTab === 'comments'}>
    Comments
  </button>
</div>
<div role="tabpanel">
  {/* tab content */}
</div>
```

**Kanban mobile fallback**:
- Add dropdown for status change on small screens
- Ensure drag-and-drop is not the only way to change status

---

### 14. Standardize empty/loading/error states (Comment 15)
**Priority**: LOW
**Files**: `frontend/src/components/ui/`

**Create reusable components**:
```tsx
// EmptyState.tsx
<div className={styles.emptyState}>
  <Icon name="inbox" />
  <h3>{title}</h3>
  <p>{message}</p>
  {action && <button onClick={action.onClick}>{action.label}</button>}
</div>

// ErrorState.tsx
<div className={styles.errorState}>
  <Icon name="alert" />
  <h3>Что-то пошло не так</h3>
  <p>{error.message}</p>
  <button onClick={retry}>Повторить</button>
</div>

// Skeleton.tsx (if not exists)
<div className={styles.skeleton} />
```

**Usage**:
```tsx
if (loading) return <Skeleton />;
if (error) return <ErrorState error={error} retry={refetch} />;
if (!data || data.length === 0) return <EmptyState title="Нет лидов" />;
```

---

### 15. Enforce axios usage (Comment 25)
**Priority**: LOW
**Files**: Frontend source files

**Search for raw fetch**:
```bash
grep -rn "fetch(" frontend/src
```

**Replace with**:
```typescript
import api from '../utils/api';

// Instead of fetch(...)
const response = await api.get('/leads');
const data = await api.post('/leads', leadData);
```

**ESLint rule** (optional):
```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-globals": ["error", {
      "name": "fetch",
      "message": "Use api from utils/api.ts instead of raw fetch"
    }]
  }
}
```

---

### 16. Kanban virtualization (Comment 23)
**Priority**: LOW (Performance optimization)
**Files**: `frontend/src/pages/leads/Leads.tsx`

**Install**:
```bash
npm install react-window
```

**Implementation**:
```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={column.leads.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <LeadCard lead={column.leads[index]} />
    </div>
  )}
</FixedSizeList>
```

**Alternative**: Incremental loading
- Fetch first 20 leads per status
- "Load more" button at bottom of each column
- Update `useLeads` hook to support `status` filter + pagination

---

## Future Features (PRD Alignment)

### 17. Public forms module (Comment 16)
**Priority**: MEDIUM (Future milestone)

**Requirements**:
- Unauthenticated tenant resolution (by slug or domain)
- Routes under `/api/v1/public/forms/:slug`
- Strict rate limiting per IP (e.g., 10 submissions/hour)
- Optional hCaptcha or Cloudflare Turnstile verification
- Input validation with zod
- Auto-create lead from submission
- Store in `form_submissions` table
- Email notification on submission

**Migration**:
```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  form_id UUID NOT NULL REFERENCES forms(id),
  data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  lead_id UUID REFERENCES leads(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 18. Track PRD implementation (Comment 19)
**Priority**: LOW (Planning)

**Update `IMPLEMENTATION_STATUS.md`** with:

**Phase 1: Core CRM** (MVP)
- [x] Authentication & multi-tenancy
- [x] Dashboard
- [x] Leads (list, create, update, delete, Kanban)
- [x] Products (basic CRUD)
- [x] Tasks (basic CRUD, calendar)
- [ ] Lead comments & activities (partial)
- [ ] Lead status transitions with validation

**Phase 2: Extended Features**
- [ ] Forms (builder + public submission)
- [ ] Groups module
- [ ] Team management (user invitations, roles)
- [ ] Settings (tenant settings, modules toggle)

**Phase 3: Advanced**
- [ ] Billing (plans, subscriptions)
- [ ] Superadmin (platform owner features)
- [ ] Reporting & analytics
- [ ] Integrations (webhooks, API)

---

## Implementation Priority Summary

### Must Do (Before Production):
1. ✅ Integrate `dbSession` middleware
2. ✅ Audit RBAC on all routes
3. ✅ Verify leads API filters
4. ✅ Add status ENUMs/constraints
5. ✅ Set up basic automated tests

### Should Do (Post-MVP):
6. Standardize error responses
7. Add requestId to logs
8. OpenAPI documentation
9. Verify email uniqueness
10. Module guards enforcement

### Nice to Have (Future):
11. Accessibility improvements
12. Empty/error state components
13. Kanban virtualization
14. Public forms module
15. Full test coverage

---

## Testing the Implementation

After completing the above tasks, run these checks:

**Backend**:
```bash
npm run lint
npm run build
npm run migrate
npm test # when tests are added
```

**Frontend**:
```bash
npm run lint
npm run build
npm run test # when tests are added
```

**Manual smoke tests**:
1. Register new tenant
2. Create product
3. Create lead
4. Update lead status (Kanban drag-and-drop)
5. Add comment to lead
6. Create task for lead
7. Filter/sort leads list
8. Check audit logs (admin only)
9. Test rate limits (try to exceed)
10. Test RLS (try to access other tenant's data)

---

## Questions for Product/Team

1. Should we implement `dbSession` globally or per-route?
2. What are the allowed lead status transitions?
3. Which modules should be enabled by default for new tenants?
4. What is the priority for public forms vs. other features?
5. Do we need email verification for new registrations?
6. What billing provider will we integrate with?
