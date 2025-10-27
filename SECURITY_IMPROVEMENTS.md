# Security & Infrastructure Improvements

This document summarizes the significant security and infrastructure improvements implemented in response to the comprehensive code review.

## Implemented Changes

### 1. JWT → HTTP-Only Cookies with Refresh Tokens (Comment 1, 25, 27)

**Backend:**
- Created `refresh_tokens` table with token rotation and revocation support
- Added `RefreshTokenRepository` for managing refresh tokens
- Updated `AuthService` to generate both access and refresh tokens
- Modified `AuthController` to set HTTP-only cookies instead of sending tokens in response body
- Access token: 15 minutes (short-lived)
- Refresh token: 7 days (long-lived, rotated on use)
- Added `/auth/refresh` endpoint for token rotation
- Added `/auth/logout` endpoint to revoke refresh tokens
- Updated authentication middleware to accept cookies or Bearer tokens (backward compatible)
- Added CSRF tokens in cookies for state-changing operations

**Frontend:**
- Updated `api.ts` to use `withCredentials: true`
- Removed localStorage token storage
- Added CSRF token handling from cookies
- Implemented automatic token refresh on 401 responses
- Updated `authStore` to track user/tenant data without storing tokens

**Migration:**
- `00007_refresh_tokens.sql` - Creates refresh_tokens, login_attempts, and account_lockouts tables

### 2. CSP Tightening (Comment 2)

- Removed `'unsafe-inline'` from `styleSrc` directive
- Made `connectSrc` dynamic to include API_URL from environment
- Set `upgradeInsecureRequests` only in production
- Updated environment config to accept `API_URL` parameter

### 3. Auth Endpoint Rate Limiting (Comment 3)

Created specific rate limiters:
- `/login`: 5 requests/min per IP+email+tenant (with skipSuccessfulRequests)
- `/password/forgot`: 3 requests/min per IP+email+tenant
- `/password/reset`: 3 requests/min per IP+email+tenant
- `/register`: 3 requests/min per IP

### 4. Tenant Guard Security Enhancement (Comment 4)

- Non-platform users can no longer access other tenant resources via header manipulation
- Platform owners must explicitly provide tenant identifier
- Non-platform authenticated users: tenantId is forced to their own tenant
- Cross-tenant access attempts return 403 Forbidden
- Canonical UUID enforcement after resolution

### 5. Error Logger Fixes (Comment 5)

- Changed `req.userId` to `req.user?.id` 
- Added `requestId` to all log entries
- Fixed logger metadata to use proper fields

### 6. SQL Injection Prevention - Leads Repository (Comment 6 & 7)

- Replaced dynamic ORDER BY column mapping with explicit switch/case
- Converted LIMIT/OFFSET from string interpolation to parameterized queries
- All user input now uses positional parameters ($1, $2, etc.)
- Sort column strictly validated against enum in `validators/leads.ts`

### 7. Password Policy Enhancement (Comment 21)

New password requirements:
- Minimum 10 characters (was 8)
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Implemented using Zod regex validators

### 8. Account Lockout Implementation (Comment 21)

- Created `login_attempts` table
- Created `account_lockouts` table
- Login failures tracked by email + tenant_slug + IP
- 5 failed attempts → 15 minute lockout
- Lockout cleared on successful login
- Provides user-friendly error message with time remaining

### 9. Password Reset Logging (Comment 9)

- Changed from `warn` to `debug` level for non-existent user/tenant attempts in production
- Prevents user enumeration via log analysis
- Generic response maintained to client

### 10. custom_fields Size Limits (Comment 30)

- Max 10 KB for serialized custom_fields JSON
- Enforced in Zod validator with `.refine()`
- Applied to both create and update lead schemas

### 11. Request ID Middleware (Comment 12)

- Added `requestId` to Express Request interface
- Generated using `crypto.randomUUID()` or from `X-Request-ID` header
- Included in all log entries
- Returned in `X-Request-ID` response header
- Added to error responses for debugging

### 12. CSRF Protection (Comment 25)

- Created `csrfProtection` middleware
- Double-submit pattern: cookie + header verification
- Exempts safe methods (GET, HEAD, OPTIONS)
- Exempts public auth endpoints (login, register, password reset)
- Requires `X-CSRF-Token` header for mutating operations
- Token generated on login with 24-hour expiry

## Database Migrations

### 00007_refresh_tokens.sql

```sql
- refresh_tokens table (id, user_id, tenant_id, token_hash, expires_at, is_revoked, created_at, revoked_at)
- login_attempts table (id, email, tenant_slug, ip_address, attempted_at, success)
- account_lockouts table (id, email, tenant_slug, locked_until, created_at)
- Indexes for performance on all foreign keys and query patterns
```

## Environment Variables Added

```
JWT_EXPIRES_IN=15m                          # Changed from 7d
REFRESH_TOKEN_EXPIRES_IN=7d                 # New
COOKIE_DOMAIN=                              # Optional for multi-subdomain
API_URL=                                    # Optional for CSP
```

## Breaking Changes

### For Clients:
1. Tokens no longer returned in response body on `/auth/login` and `/auth/register`
2. Clients must handle cookies with `withCredentials: true`
3. CSRF token required in `X-CSRF-Token` header for POST/PUT/PATCH/DELETE requests
4. 401 responses require calling `/auth/refresh` to get new access token

### Backward Compatibility:
- Authentication middleware still accepts Bearer tokens for gradual migration
- Existing API contracts unchanged (except token in response body)

## Security Improvements Summary

| Area | Before | After | Risk Reduction |
|------|---------|--------|----------------|
| Token Storage | localStorage | HTTP-only cookies | XSS token theft eliminated |
| Token Lifetime | 7 days | 15 minutes (access) | Exposure window reduced 99.85% |
| Token Refresh | None | Rotating refresh tokens | Replay attacks mitigated |
| CSRF Protection | None | Double-submit tokens | CSRF attacks prevented |
| Auth Rate Limiting | Global 100/min | Endpoint-specific 3-5/min | Brute force window reduced 95% |
| Password Policy | 8 chars, no rules | 10 chars + complexity | Dictionary attacks harder |
| Account Lockout | None | 5 attempts → 15min | Automated attacks blocked |
| SQL Injection (leads) | Map interpolation | Strict enum + params | Injection vectors closed |
| Tenant Isolation | Header trusted | JWT enforced for non-platform | Cross-tenant access prevented |
| Error Enumeration | Warn logs visible | Debug logs in prod | User enumeration harder |

## Testing Recommendations

1. **Auth Flow:**
   - Test login with cookies
   - Verify access token expiry after 15 minutes
   - Test refresh token rotation
   - Verify logout clears cookies
   - Test CSRF token validation

2. **Rate Limiting:**
   - Verify lockout after 5 failed logins
   - Test password reset rate limit
   - Verify registration rate limit

3. **Tenant Isolation:**
   - Attempt cross-tenant access as normal user (should fail)
   - Verify platform owner can switch tenants
   - Test X-Tenant-ID header manipulation

4. **SQL Security:**
   - Test leads filtering with various sort_by values
   - Verify custom_fields size limit enforcement
   - Test pagination with large offsets

## Future Recommendations (Not Implemented)

These items were identified but not implemented due to scope/complexity:

- **Comment 10:** Comprehensive test suite (Jest + Supertest for backend, RTL for frontend, E2E with Playwright)
- **Comment 11:** Redis caching for dashboard KPIs
- **Comment 13:** Full accessibility audit and keyboard navigation
- **Comment 14:** Pagination UI improvements (sliding window)
- **Comment 15-16:** Optimistic updates and refetch patterns for leads
- **Comment 17:** Task permissions review and alignment
- **Comment 18-24, 26, 29, 31:** Feature gaps (products, groups, forms, team management, billing, etc.)
- **Comment 28:** Tenant slug uniqueness validation and conflict handling
- **Comment 20:** Migration rollback scripts

## Deployment Notes

1. Run migration: `npm run migrate` in backend directory
2. Update `.env` files with new variables
3. Restart backend server
4. Deploy frontend with cookie handling
5. Test auth flow end-to-end in staging
6. Monitor logs for authentication issues during rollout
7. Consider gradual rollout with feature flags if needed

## Monitoring

After deployment, monitor:
- Failed login rates and lockout frequency
- Token refresh call volume
- CSRF validation failures
- Request ID traces for debugging
- Database pool stats (future enhancement)
