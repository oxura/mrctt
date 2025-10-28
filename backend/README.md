# CRM SaaS Backend

Multi-tenant CRM backend built with TypeScript, Express.js, and PostgreSQL.

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon DB)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/crm_saas
JWT_SECRET=your-secret-key-must-be-at-least-32-characters
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

⚠️ **Important**: `JWT_SECRET` must be at least 32 characters long for security.

### Run Migrations

```bash
npm run migrate
```

### Development

```bash
npm run dev
```

Server runs at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Run production build
- `npm run migrate` - Run database migrations
- `npm run migrate:create -- migration_name` - Create new migration
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp",
  "companySlug": "acme",
  "country": "USA",
  "city": "New York",
  "industry": "courses"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "tenantSlug": "acme"
}
```

#### Forgot Password
```http
POST /api/v1/auth/password/forgot
Content-Type: application/json

{
  "email": "user@example.com",
  "tenantSlug": "acme"
}
```

#### Reset Password
```http
POST /api/v1/auth/password/reset
Content-Type: application/json

{
  "token": "reset-token",
  "password": "newStrongPassword"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Tenants

#### Get Current Tenant
```http
GET /api/v1/tenants/current
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id or tenant-slug>
```

#### List All Tenants (Platform Owner only)
```http
GET /api/v1/tenants
Authorization: Bearer <token>
```

### Health Check
```http
GET /api/v1/health
```

## Architecture

### Multi-tenancy
- **Strategy**: Shared database with tenant_id isolation
- **Resolution**: Via `X-Tenant-ID` header or subdomain
- **Middleware**: `tenantGuard` enforces tenant context on protected routes

### Authentication
- **Strategy**: JWT with httpOnly cookies (Bearer tokens deprecated for SPA in production)
- **Roles**: owner, admin, manager, platform_owner
- **Middleware**: `authenticate`, `requireRole(...roles)`
- **CSRF Protection**: Double-submit cookie pattern for all mutating requests
- **Note**: Bearer token authentication is disabled by default in production. Use cookie-based authentication for SPAs. Bearer tokens may be enabled via `ALLOW_BEARER_TOKENS=true` environment variable for API-only clients.

### Error Handling
- **Operational errors**: `AppError` with status codes
- **Unexpected errors**: Caught by global handler, generic message in production
- **Validation**: Zod schemas for all inputs

### Database Migrations
- Stored in `/migrations`
- Numbered sequentially with `.sql` (up) and `.down.sql` (rollback) files
- Tracked in `migrations` table
- Run with `npm run migrate`
- Rollback with `npm run migrate down <target-version>`
- Example: `npm run migrate down 00005_audit_logs.sql` rolls back all migrations after that version

## Security

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT**: Signed with secret, 15 min access tokens, 7-day refresh tokens
- **Cookies**: httpOnly, secure (in production), sameSite=lax
- **CSRF Protection**: Double-submit cookie pattern with exemptions for safe methods and auth endpoints
- **Rate limiting**: 
  - Global: 100 requests/min per IP
  - Login: 5 attempts/min per IP+email+tenant
  - Registration: 3 attempts/min per IP
  - Password reset: 3 requests/min per IP+email+tenant
  - Per-tenant/user limits on leads and tasks endpoints
- **Helmet.js**: Security headers with CSP
- **HTTPS**: Automatic redirect in production
- **Input validation**: Zod schemas for all inputs
- **SQL injection**: Parameterized queries
- **CORS**: Origin validation with allowlist
- **PII Protection**: Sensitive fields sanitized in logs and audit trails
- **Request tracking**: Unique request IDs in headers and logs

## Logging

Winston logger with multiple transports:
- Development: Colorized console
- Production: File-based (error.log, combined.log)

Logged info includes:
- HTTP requests (method, status, duration, tenant, user)
- Errors (with stack traces in development)
- Database operations

## Database Schema

Key tables:
- `tenants` - Company accounts
- `users` - User accounts (foreign key to tenants)
- `products` - Services/courses
- `groups` - Course batches/tourism groups
- `leads` - Customer pipeline
- `lead_comments` - Notes on leads
- `lead_activities` - Audit log
- `tasks` - Reminders
- `forms` - Public lead capture forms
- `form_submissions` - Form responses

All entity tables include:
- `tenant_id` (UUID) for isolation
- `created_at`, `updated_at` timestamps
- Indexes for query performance
