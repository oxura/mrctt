# De-Scoped Features

This document lists features and modules that are **intentionally not implemented** in the current MVP phase.

## 🚫 Out of Scope (Phase 2+)

### 1. Billing Module
The billing and subscription management module is **not implemented** in Phase 1.

**What's Missing:**
- No billing API endpoints (`/api/v1/billing/*`)
- No subscription plans or pricing tiers
- No payment gateway integration (Stripe, PayPal, etc.)
- No invoice generation
- No usage tracking or metering
- No billing UI/settings page

**Why De-Scoped:**
- Billing adds significant complexity
- MVP should focus on core CRM functionality first
- Payment gateway integration requires additional compliance/security
- Subscription model needs validation with real users first

**RBAC Impact:**
- The `owner` role has `billing:manage` permission defined
- Permission exists but endpoints are not implemented
- No functional impact on other features

**Planned for:** Phase 2 (Q2 2024)

---

### 2. Superadmin Panel
A comprehensive platform administration panel is **partially implemented**.

**What Exists:**
- ✅ `platform_owner` role defined in RBAC
- ✅ Backend endpoint: `GET /api/v1/tenants` (list all tenants)
- ✅ Cross-tenant audit log access
- ✅ Permission system supports cross-tenant operations

**What's Missing:**
- ❌ No dedicated superadmin UI/dashboard
- ❌ No tenant management page (view/suspend/delete tenants)
- ❌ No platform-wide analytics and metrics
- ❌ No tenant activity monitoring
- ❌ No bulk tenant operations
- ❌ No system health/status dashboard
- ❌ No feature flag management UI

**Why Partially Implemented:**
- Backend infrastructure is in place for future expansion
- MVP focuses on single-tenant experience
- Superadmin features are low priority for initial launch
- UI complexity would delay MVP release

**Workaround:**
- Platform owners can use API directly for tenant management
- Database queries can be used for administrative tasks

**Planned for:** Phase 2+ (as needed)

---

### 3. Advanced Forms Builder
A full drag-and-drop forms builder is **not implemented**.

**What Exists:**
- ✅ Database schema for `forms` and `form_submissions` tables
- ✅ RLS policies enabled on forms tables
- ❌ No forms CRUD API
- ❌ No public form submission endpoint
- ❌ No form builder UI
- ❌ No public form rendering

**What's Missing:**
- Drag-and-drop form designer
- Field type library (text, select, radio, file upload, etc.)
- Conditional logic (show/hide fields based on answers)
- Form templates and presets
- Custom styling per form
- Thank you page customization
- Email notifications on submission
- Webhook integrations

**Workaround:**
- Leads can be created manually via admin interface
- Import leads from CSV (if needed)
- Use external form tools (Typeform, Google Forms) and integrate via API

**Planned for:** Phase 2 (high priority)

---

### 4. Automated Testing & OpenAPI Documentation
Comprehensive test coverage and API documentation are **not implemented**.

**What's Missing:**
- ❌ No Jest + Supertest backend tests
- ❌ No React Testing Library frontend tests
- ❌ No integration tests
- ❌ No OpenAPI/Swagger specification
- ❌ No API documentation page
- ❌ No automated test runs in CI/CD

**Why De-Scoped:**
- MVP prioritizes feature implementation over testing infrastructure
- Manual testing sufficient for initial launch
- Documentation can be added incrementally

**Risk:**
- Higher chance of regressions without automated tests
- Developers must rely on manual testing

**Mitigation:**
- Code reviews required for all changes
- Manual QA testing before releases
- TypeScript provides some type safety

**Planned for:** Ongoing (add tests incrementally)

---

### 5. Advanced A11y Features
Full WCAG AA accessibility compliance is **not complete**.

**What Exists:**
- ✅ Semantic HTML used throughout
- ✅ Basic ARIA labels on interactive elements
- ✅ Keyboard navigation on most components
- ✅ Focus indicators

**What's Missing:**
- ❌ Full ARIA landmark regions
- ❌ Screen reader testing for all pages
- ❌ High contrast mode
- ❌ Reduced motion support
- ❌ Consistent 44x44px touch targets everywhere
- ❌ Comprehensive keyboard shortcuts

**Workaround:**
- Current implementation is usable with keyboard
- Basic screen reader support present
- Mobile touch targets generally adequate

**Planned for:** Incremental improvements in Phase 1.5+

---

## Summary

| Feature | Status | Priority | Planned Phase |
|---------|--------|----------|---------------|
| Billing Module | Not Implemented | High | Phase 2 |
| Superadmin Panel (UI) | Backend Only | Medium | Phase 2+ |
| Forms Builder | Schema Only | High | Phase 2 |
| Automated Tests | Not Implemented | High | Ongoing |
| OpenAPI Docs | Not Implemented | Medium | Phase 1.5 |
| Full A11y Compliance | Partial | Medium | Ongoing |

---

## How to Handle Missing Features

### For Users:
- Billing: Contact support for manual subscription setup
- Forms: Use external form tools or manual lead entry
- Superadmin: API access available for platform owners

### For Developers:
- Check this document before implementing related features
- API design should consider future implementation of de-scoped features
- Avoid hardcoding workarounds that block future implementation

### For Product/Stakeholders:
- Phase 1 focuses on core CRM: leads, products, groups, tasks
- De-scoped features do not block MVP launch
- Roadmap clearly defines when each feature will be added
