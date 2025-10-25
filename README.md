# CRM SaaS Platform

Multi-tenant CRM system with configurable modules for different business niches (courses, services, medicine, tourism).

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon DB compatible)
- **Authentication**: JWT-based auth
- **Logging**: Winston
- **Validation**: Zod

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM v6

## Architecture

### Multi-tenancy
The system uses a **shared database, shared schema** approach with tenant_id isolation:
- All tables include a `tenant_id` column
- Tenant context is resolved via headers (`X-Tenant-ID`) or subdomain
- Middleware enforces tenant isolation at the application level

### Database Schema
- `tenants` - Company/organization accounts
- `users` - User accounts (scoped to tenants)
- `products` - Services/courses offered
- `groups` - Course batches/tourism groups
- `leads` - Customer pipeline
- `lead_comments`, `lead_activities` - Lead interaction history
- `tasks` - Reminders and follow-ups
- `forms`, `form_submissions` - Public lead capture forms
- `password_reset_tokens` - Password reset functionality

## Pages

### Public Pages
- `/` - Landing page with product information
- `/login` - Login page with validation
- `/register` - Registration page with validation (email, password 8+, name, company info, terms acceptance)
- `/forgot-password` - Password reset request page
- `/reset-password?token=<token>` - New password creation page

### Protected Pages (requires authentication)
- `/dashboard` - Main dashboard with KPIs, activity feed, and tasks
- `/onboarding` - Multi-step onboarding wizard for initial setup

## Project Structure

```
/backend
  /src
    /config          - Environment configuration
    /controllers     - Route handlers
    /db              - Database client and migrations
    /middleware      - Auth, tenant isolation, error handling
    /repositories    - Data access layer
    /routes          - API routes
    /services        - Business logic
    /types           - TypeScript types
    /utils           - Helper functions (logger, JWT, etc.)
  /migrations        - SQL migration files
  
/frontend
  /src
    /components      - Reusable UI components
    /layouts         - Page layouts
    /pages           - Page components
    /providers       - Context providers
    /routes          - Route configuration
    /store           - Global state (Zustand)
    /styles          - CSS/styling
    /types           - TypeScript types
    /utils           - Helper functions (API client)
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon DB account)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` with your database connection and secrets:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/crm_saas
JWT_SECRET=your-secret-key-minimum-32-characters-long
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Database Migrations

### Create a new migration:
```bash
cd backend
npm run migrate:create -- migration_name
```

### Run pending migrations:
```bash
npm run migrate
```

Migration files are located in `backend/migrations/` and are executed in order by filename.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new tenant and owner
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user (requires auth)

### Tenants
- `GET /api/v1/tenants/current` - Get current tenant (requires auth + tenant context)
- `GET /api/v1/tenants` - List all tenants (platform owner only)

## Security Features

1. **JWT Authentication** - Token-based auth with configurable expiry
2. **Role-Based Access Control (RBAC)** - Roles: owner, admin, manager, platform_owner
3. **Tenant Isolation** - Automatic tenant context enforcement
4. **Rate Limiting** - 100 requests per minute per IP
5. **Helmet.js** - Security headers
6. **Password Hashing** - bcrypt with salt rounds
7. **Input Validation** - Zod schemas for all requests

## Logging

Winston logger with different transports:
- Development: Console with colors
- Production: File-based (error.log, combined.log)

Log levels: fatal, error, warn, info, debug, trace

## Error Handling

Centralized error handling with:
- Operational errors (AppError) - Expected errors (validation, not found, etc.)
- Unexpected errors - Caught and logged, generic response in production
- Async route handlers wrapped with `asyncHandler`

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret for JWT signing (min 32 chars, required)
- `JWT_EXPIRES_IN` - Token expiry (default: 7d)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - development/test/production
- `FRONTEND_URL` - CORS origin (default: http://localhost:3000)
- `LOG_LEVEL` - Logging verbosity (default: info)

### Frontend
- `VITE_API_URL` - Backend API URL

## Development

### Backend commands:
```bash
npm run dev        # Start with hot reload
npm run build      # Compile TypeScript
npm run start      # Run production build
npm run lint       # Lint code
npm run format     # Format with Prettier
npm run migrate    # Run migrations
```

### Frontend commands:
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code
npm run format     # Format with Prettier
```

## License

MIT
