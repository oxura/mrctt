# Security Implementation Notes

This document provides implementation details and recommendations for critical security improvements.

## 1. Row-Level Security (RLS) Transaction Scoping

### Current Status
- RLS policies are enabled via `00009_enable_rls.sql` and `00010_fix_rls_strict_tenant_isolation.sql`
- The middleware uses `set_config('app.tenant_id', ..., true)` which is session-local
- Connection pooling may lead to tenant context bleed between requests

### Recommended Implementation
For complete isolation, all database queries should be wrapped in transactions with `SET LOCAL app.tenant_id`:

```typescript
// Recommended pattern (already available in db/client.ts):
import { withTenantContext } from '../db/client';

await withTenantContext(tenantId, async (client) => {
  // All queries here run in a transaction with SET LOCAL app.tenant_id
  const result = await client.query('SELECT * FROM leads WHERE ...');
  return result.rows;
});
```

### Current Mitigation
- The `set_config(..., true)` call in `tenant.ts` sets the variable for the transaction only
- Each request gets a connection from the pool
- While not perfect, the third parameter (true) ensures session-local scope

### Future Improvement
Refactor all repositories to use `withTenantContext` wrapper to guarantee transaction-scoped RLS.

## 2. Refresh Token Security

### Implemented Features
✅ Rate limiting on `/auth/refresh` endpoint (20 requests/minute per tenant-user)
✅ Token family tracking for rotation
✅ Reuse detection with family revocation
✅ Audit logging on reuse detection (`auth.refresh.reuse_detected`)
✅ Immediate token family revocation on reuse

### How It Works
1. Each refresh token belongs to a token family
2. On refresh, the old token is marked as used and a new one is issued
3. If a revoked/used token is presented, the entire family is revoked
4. Audit log event is recorded for security monitoring

## 3. CSRF Protection

### Exempted Paths
The following paths are exempt from CSRF checks:
- `/api/v1/auth/login` - Initial login
- `/api/v1/auth/register` - Registration
- `/api/v1/auth/refresh` - Token refresh
- `/api/v1/auth/password/*` - Password reset flows
- `/api/v1/public/forms/*` - Public form submissions
- `/api/v1/health` - Health check

### Testing CSRF
To verify CSRF protection:
1. Exempt endpoints should work without X-CSRF-Token header
2. Protected endpoints should return 403 without token
3. Browser should automatically send csrf_token cookie

## 4. SQL Injection Prevention

### ORDER BY Protection
The `leadsRepository.findAll()` uses a whitelist approach:

```typescript
const resolveSortColumn = (column: string): string => {
  switch (column) {
    case 'updated_at': return 'l.updated_at';
    case 'status': return 'l.status';
    case 'first_name': return 'l.first_name';
    case 'last_name': return 'l.last_name';
    default: return 'l.created_at';
  }
};
```

All user input is parameterized for WHERE clauses, LIMIT, and OFFSET.

### Validation
Zod validators ensure `sort_by` is an enum, preventing arbitrary values.

## 5. CORS Configuration

### Current Implementation
- Only frontend origins are allowed in CORS
- `API_URL` is NOT in the allowlist (prevents credential leakage)
- Supports multiple origins via `FRONTEND_ORIGINS` CSV env var
- Example: `FRONTEND_ORIGINS=https://staging.myapp.com,https://myapp.com`

### Cookie Domain
- Leave `COOKIE_DOMAIN` empty for host-only cookies (most secure)
- Set to `.yourdomain.com` only if subdomain sharing is required
- Warning: Subdomain cookies are accessible across all subdomains

## 6. Cookie Security Settings

All authentication cookies use:
- `httpOnly: true` for access_token and refresh_token
- `secure: true` in production
- `sameSite: 'lax'`
- `domain: COOKIE_DOMAIN ?? undefined` (defaults to host-only)
- Proper maxAge values

CSRF and tenant_id cookies are intentionally not httpOnly (JavaScript needs access).

## 7. Lead Status Constraints

Migration `00014_lead_status_constraints.sql` adds a CHECK constraint:
```sql
CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold'))
```

This ensures database-level enforcement, complementing Zod validation.

## 8. Tenant Active Status

All routes that use `tenantGuard` middleware verify `is_active = true`.
Inactive tenants receive 404 responses consistently.

## 9. PII Redaction in Logs

The `requestLogger` middleware redacts:
- Passwords and secrets
- Authorization headers
- Cookies
- Email addresses (masked or hashed)
- CSRF tokens

Error messages are sanitized before logging to prevent token leakage.

## 10. Request ID Tracking

- Every request gets a unique `X-Request-ID` header
- Included in all error responses
- Logged with every request
- Frontend captures and logs requestId in dev mode
- Use for support tracing

## 11. Tasks Indexes

Migration `00015_tasks_indexes.sql` adds composite indexes:
- `(tenant_id, is_completed, due_date)` - Overdue tasks
- `(tenant_id, due_date)` - Calendar queries
- `(tenant_id, assigned_to, is_completed, due_date)` - User-specific queries

## 12. Validator Strictness

All create/update schemas use `.strict()` to prevent unknown keys:
- `createLeadSchema`
- `updateLeadSchema`
- `createProductSchema`
- `updateProductSchema`
- `createTaskSchema`
- `updateTaskSchema`

## Testing Recommendations

### Security Tests to Add
1. **RLS**: Verify users cannot query other tenants' data
2. **CSRF**: Test exempted vs. protected routes
3. **Rate Limiting**: Verify limits trigger correctly
4. **Token Reuse**: Simulate reuse and verify family revocation
5. **SQL Injection**: Try malicious sort_by values
6. **Inactive Tenant**: Verify 404 on inactive tenant access
7. **Cookie Security**: Verify flags in production mode
8. **Lead Status**: Try inserting invalid status via SQL

### Manual Testing
```bash
# Test CSRF on protected endpoint
curl -X POST http://localhost:5000/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test"}' \
  # Should return 403

# Test rate limiting
for i in {1..25}; do
  curl -X POST http://localhost:5000/api/v1/auth/refresh
done
# Should return 429 after 20 requests
```

## Future Improvements

### High Priority
1. Full repository refactor to use `withTenantContext`
2. Add automated security tests (unit + integration)
3. Implement OpenAPI spec for contract testing
4. Add E2E tests for critical auth flows

### Medium Priority
1. Dashboard real-time data endpoints
2. Global search endpoint with indexed ILIKE queries
3. Kanban status update endpoint with permission checks
4. Permission-based UI hiding

### Low Priority
1. CSP inline style nonces for dynamic components
2. Accessibility audit for keyboard navigation
3. Operational runbooks for common scenarios

## 13. Public Form Security

### Rate Limiting
- **10 submissions per hour** per IP + publicUrl combination
- Tracks submissions at `public-form-submit:{ip}:{publicUrl}`
- Structured logging on rate limit violations
- Returns 429 with requestId for tracking

### Captcha Integration
- Supports hCaptcha and Cloudflare Turnstile
- Configured via environment variables:
  - `CAPTCHA_PROVIDER=hcaptcha` or `turnstile`
  - `HCAPTCHA_SECRET` and `HCAPTCHA_SITEKEY`
  - `TURNSTILE_SECRET` and `TURNSTILE_SITEKEY`
- Optional: if not configured, submissions proceed without captcha
- Verified before processing submission

### Payload Size Limits
- **32 KB** maximum total JSON payload
- **5000 characters** maximum per text field
- **50 fields** maximum per submission
- Multiple validation layers (controller, service, validator)

### Data Persistence
- All submissions logged to `form_submissions` table
- Captures: `ip_address`, `user_agent`, `data`, `lead_id`
- Enables abuse detection and analytics
- Linked to created lead for tracking

### Validation
- Email fields: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Phone fields: regex `/^[\d\s\+\-\(\)]+$/`
- Field type validation at submission time
- Normalized strings (trimmed)
- Unknown field IDs filtered out

### CSRF Exemption
- Public form submissions exempt from CSRF tokens
- Pattern: `/^\/api\/v1\/forms\/public\/.+$/`
- Pattern: `/^\/api\/v1\/public\/forms\/.+$/`
- Documented in `csrf.ts`

### Frontend Integration
- Frontend should use shared API client from `utils/api.ts`
- Captures `X-Request-ID` for logging
- Optional: Add captcha widget (hCaptcha or Turnstile)
- Must send `captcha_token` if captcha is enabled

## 14. Content Security Policy (CSP)

### Current Configuration
- **Script Sources**: `'self'` + nonce (for inline scripts if needed)
- **Style Sources**: `'self'` + nonce + `'unsafe-inline'` (dev only)
- **Production**: No `'unsafe-inline'` allowed
- **Upgrade Insecure Requests**: Enabled in production

### Dynamic Inline Content Guidelines
1. **Avoid inline `<script>` and `<style>` tags** - use external files
2. **If inline required**: include `nonce` attribute from `res.locals.cspNonce`
3. **React components**: Do NOT use `dangerouslySetInnerHTML` unless absolutely necessary
4. **Dynamic styles**: Use CSS classes or CSS-in-JS solutions that emit external stylesheets

### ESLint Rule Recommendation
Add to `.eslintrc.js`:
```javascript
rules: {
  'react/no-danger': 'error',
  'react/no-danger-with-children': 'error',
}
```

### Future: Server-Side Rendering
If SSR is introduced, ensure nonce is passed to client:
```html
<script nonce="${cspNonce}">...</script>
<style nonce="${cspNonce}">...</style>
```

## 15. Tenant Header Spoofing Prevention

### Centralized Tenant Resolution
- **Single source of truth**: `tenantGuard` middleware sets `req.tenantId`
- **No direct header reads**: Controllers/services must use `req.tenantId`
- **Audit completed**: No instances of direct `req.headers['x-tenant-id']` in controllers

### Rate Limiter Safety
- `rateLimiter.ts` now uses **only** `req.tenantId` (not direct header read)
- Fallback to cookie if needed, but never direct header as primary

### Validation
- Platform owners can specify tenant via header
- Non-platform users: tenant validated against JWT claim
- Mismatch detection logs warning and returns 403

### Testing
```bash
# Try spoofing tenant header (should fail for non-platform-owner)
curl -X GET http://localhost:5000/api/v1/leads \
  -H "X-Tenant-ID: spoofed-tenant-id" \
  -H "Cookie: access_token=..." \
  # Should return 403 or ignore header
```

## Environment Variables Reference

```bash
# Single frontend
FRONTEND_URL=http://localhost:3000

# Multiple environments
FRONTEND_ORIGINS=https://staging.myapp.com,https://myapp.com

# Cookie domain (empty = host-only, recommended)
COOKIE_DOMAIN=

# Cookie domain for subdomains (use carefully)
COOKIE_DOMAIN=.myapp.com

# JWT settings
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Security
ALLOW_BEARER_TOKENS=false  # Only for non-browser clients
```
