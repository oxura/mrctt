# Contributing Guide

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Neon DB account)
- Git

### First-time Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd crm-saas-platform
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure environment:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with backend URL
```

4. Run migrations:
```bash
cd backend
npm run migrate
```

5. Start development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Code Style

We use ESLint + Prettier for code formatting.

### Auto-format on save
Configure your editor to run Prettier on save.

### Manual formatting:
```bash
# Backend
cd backend
npm run format

# Frontend
cd frontend
npm run format
```

### Linting:
```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## Commit Messages

Follow conventional commits format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, etc)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add lead filtering by status
fix: resolve tenant isolation bug in tasks query
docs: update API authentication guide
```

## Creating Migrations

When you change the database schema:

1. Create a migration file:
```bash
cd backend
npm run migrate:create -- add_column_to_leads
```

2. Edit the generated `.sql` file in `/backend/migrations`

3. Test the migration:
```bash
npm run migrate
```

4. Commit both the migration file and code changes together

## Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## Pull Request Process

1. Create a feature branch from `main`:
```bash
git checkout -b feat/my-feature
```

2. Make your changes
3. Ensure tests pass and code is formatted
4. Commit with conventional commit message
5. Push and create PR on GitHub
6. Wait for review

## Project Structure

```
/backend
  /src
    /config          - Environment configuration
    /controllers     - HTTP request handlers
    /db              - Database client, migrations
    /middleware      - Auth, tenant, error handling
    /repositories    - Data access layer
    /routes          - API route definitions
    /services        - Business logic
    /types           - TypeScript types
    /utils           - Helpers (logger, JWT, etc.)
  /migrations        - SQL migration files

/frontend
  /src
    /components      - Reusable UI components
    /layouts         - Page layouts
    /pages           - Page components
    /routes          - Route config & guards
    /store           - Global state (Zustand)
    /styles          - CSS files
    /types           - TypeScript types
    /utils           - Helpers (API client, etc.)
```

## Adding New Features

### Backend Endpoints

1. Define types in `/types/models.ts`
2. Create repository in `/repositories/<entity>Repository.ts`
3. Create service in `/services/<entity>Service.ts`
4. Create controller in `/controllers/<entity>Controller.ts`
5. Register routes in `/routes/<entity>Routes.ts`
6. Import routes in `/routes/index.ts`

### Frontend Pages

1. Create page component in `/pages/<section>/<PageName>.tsx`
2. Create styles in `/pages/<section>/<PageName>.module.css`
3. Register route in `/src/App.tsx`
4. Add navigation link in `/components/navigation/Sidebar.tsx` (if needed)

## Common Issues

### Database Connection Failed
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify credentials are correct

### JWT Verification Failed
- Ensure `JWT_SECRET` is at least 32 characters
- Check token hasn't expired
- Verify frontend is sending `Authorization` header

### Tenant Not Found
- Ensure `X-Tenant-ID` header is set
- Verify tenant exists in database
- Check tenant slug matches

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- Check CORS middleware configuration

## Questions?

Open an issue or contact the maintainers.
