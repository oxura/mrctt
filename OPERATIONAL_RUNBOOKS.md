# Operational Runbooks

This document provides step-by-step guides for common operational tasks and troubleshooting scenarios.

## Table of Contents
1. [Database Migrations](#database-migrations)
2. [Environment Setup](#environment-setup)
3. [Seeding Data](#seeding-data)
4. [RLS Troubleshooting](#rls-troubleshooting)
5. [Tenant Management](#tenant-management)
6. [Backup and Restore](#backup-and-restore)
7. [Performance Monitoring](#performance-monitoring)
8. [Security Incident Response](#security-incident-response)

---

## Database Migrations

### Running Migrations

```bash
# Run all pending migrations
cd backend
npm run migrate

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;"
```

### Creating a New Migration

```bash
# Create a migration file
cd backend
npm run migrate:create -- descriptive_migration_name

# Edit the generated files in migrations/
# - 0000X_descriptive_migration_name.sql (up migration)
# - 0000X_descriptive_migration_name.down.sql (down migration)

# Run the migration
npm run migrate
```

### Rolling Back a Migration

```bash
# Manually revert by running the .down.sql file
psql $DATABASE_URL -f migrations/0000X_migration_name.down.sql

# Update schema_migrations table
psql $DATABASE_URL -c "DELETE FROM schema_migrations WHERE version = '0000X';"
```

### Common Migration Issues

**Issue**: Migration fails halfway through  
**Solution**: Wrap DDL in `BEGIN`...`COMMIT` transactions. PostgreSQL supports transactional DDL.

**Issue**: RLS blocking queries  
**Solution**: Use `SET LOCAL app.tenant_id` in migrations if testing with RLS enabled.

---

## Environment Setup

### Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd crm-saas/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env
nano .env

# Start development server
npm run dev
```

### Required Environment Variables

**Backend (.env)**:
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=<generate-strong-secret>
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)**:
```bash
VITE_API_URL=http://localhost:5000
```

### Generating Secrets

```bash
# Generate JWT secret (32+ bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Seeding Data

### Creating a Test Tenant

```bash
# Connect to database
psql $DATABASE_URL

# Insert tenant
INSERT INTO tenants (name, slug, country, city, industry)
VALUES ('Test Company', 'test-company', 'USA', 'New York', 'Technology')
RETURNING id;

# Note the tenant ID for next step
```

### Creating Test Users

```bash
# Hash a password
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Password123!', 10));"

# Insert user (use tenant_id from previous step)
psql $DATABASE_URL <<EOF
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
VALUES (
  '<tenant-id>',
  'admin@test.com',
  '<hashed-password>',
  'Admin',
  'User',
  'owner'
);
EOF
```

### Seeding Sample Products and Leads

```sql
-- Insert sample products
INSERT INTO products (tenant_id, name, type, price, currency)
VALUES
  ('<tenant-id>', 'Course: Web Development', 'course', 999.00, 'USD'),
  ('<tenant-id>', 'Consulting Service', 'service', 5000.00, 'USD');

-- Insert sample leads
INSERT INTO leads (tenant_id, product_id, status, first_name, last_name, email, phone, source)
VALUES
  ('<tenant-id>', '<product-id>', 'new', 'John', 'Doe', 'john@example.com', '+1234567890', 'website'),
  ('<tenant-id>', '<product-id>', 'contacted', 'Jane', 'Smith', 'jane@example.com', '+0987654321', 'referral');
```

---

## RLS Troubleshooting

### Common RLS Errors

**Error**: `relation "leads" does not exist`  
**Cause**: RLS policies may be too restrictive or `app.tenant_id` not set  
**Solution**:
```sql
-- Check current tenant context
SHOW app.tenant_id;

-- Set tenant context manually
SET app.tenant_id = '<tenant-id>';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'leads';
```

**Error**: `new row violates row-level security policy`  
**Cause**: INSERT policy not matching or tenant_id mismatch  
**Solution**:
```sql
-- Check INSERT policies
SELECT * FROM pg_policies WHERE tablename = 'leads' AND cmd = 'INSERT';

-- Ensure tenant_id is set
SET app.tenant_id = '<tenant-id>';
```

### Disabling RLS Temporarily (Development Only)

```sql
-- Disable RLS on a table (DO NOT DO IN PRODUCTION)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Re-enable
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

### Verifying RLS Configuration

```sql
-- List all tables with RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check policies for a table
SELECT * FROM pg_policies WHERE tablename = 'leads';

-- Test policy as specific tenant
SET app.tenant_id = '<tenant-id>';
SELECT COUNT(*) FROM leads; -- Should return leads for that tenant only
```

---

## Tenant Management

### Deactivating a Tenant

```sql
UPDATE tenants
SET is_active = false
WHERE slug = 'tenant-slug';

-- Users will get 404 on tenant not found
```

### Reactivating a Tenant

```sql
UPDATE tenants
SET is_active = true
WHERE slug = 'tenant-slug';
```

### Viewing Tenant Statistics

```sql
SELECT
  t.slug,
  t.name,
  COUNT(DISTINCT u.id) AS user_count,
  COUNT(DISTINCT l.id) AS lead_count,
  COUNT(DISTINCT p.id) AS product_count
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
LEFT JOIN leads l ON t.id = l.tenant_id
LEFT JOIN products p ON t.id = p.tenant_id
WHERE t.is_active = true
GROUP BY t.id, t.slug, t.name
ORDER BY user_count DESC;
```

### Deleting a Tenant (DESTRUCTIVE)

```sql
-- WARNING: This cascades and deletes all related data
DELETE FROM tenants WHERE slug = 'tenant-slug';
```

---

## Backup and Restore

### Creating a Backup

```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Tenant-specific backup
pg_dump $DATABASE_URL \
  --data-only \
  --table=tenants \
  --table=users \
  --table=leads \
  --table=products \
  > tenant_backup.sql
```

### Restoring from Backup

```bash
# Restore full backup
psql $DATABASE_URL < backup_20240101_120000.sql

# Restore specific tables
psql $DATABASE_URL < tenant_backup.sql
```

### Automated Backup Script

```bash
#!/bin/bash
# Save as backup.sh and run via cron

BACKUP_DIR="/var/backups/crm"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/crm_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Cron Schedule** (daily at 2 AM):
```bash
0 2 * * * /path/to/backup.sh >> /var/log/crm_backup.log 2>&1
```

---

## Performance Monitoring

### Checking Slow Queries

```sql
-- Enable query logging (PostgreSQL config)
-- Add to postgresql.conf:
-- log_min_duration_statement = 1000  # Log queries > 1 second

-- View currently running queries
SELECT
  pid,
  now() - query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Kill a long-running query
SELECT pg_terminate_backend(<pid>);
```

### Index Usage Analysis

```sql
-- Find tables missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 25;

-- Unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE '%_pkey';
```

### Connection Pool Monitoring

```javascript
// In backend/src/db/client.ts or a monitoring endpoint
pool.on('connect', () => {
  console.log('New client connected to pool');
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

// Expose pool stats
app.get('/api/v1/admin/pool-stats', (req, res) => {
  res.json({
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});
```

---

## Security Incident Response

### Suspected Account Compromise

1. **Immediately revoke all refresh tokens**:
   ```sql
   DELETE FROM refresh_tokens
   WHERE user_id = '<compromised-user-id>';
   ```

2. **Force password reset**:
   ```sql
   UPDATE users
   SET password_hash = '<temporary-invalid-hash>'
   WHERE id = '<user-id>';
   ```

3. **Check audit logs**:
   ```sql
   SELECT * FROM audit_logs
   WHERE user_id = '<user-id>'
   ORDER BY created_at DESC
   LIMIT 100;
   ```

4. **Review login attempts**:
   ```sql
   SELECT * FROM login_attempts
   WHERE identifier = '<email>'
   ORDER BY attempted_at DESC
   LIMIT 50;
   ```

### Rate Limit Abuse

1. **Identify abusive IPs**:
   ```bash
   # Check application logs
   grep "rate limit exceeded" logs/combined.log | awk '{print $X}' | sort | uniq -c | sort -rn
   ```

2. **Block IP at application level** (if needed):
   ```javascript
   // Add to rateLimiter middleware
   const BLOCKED_IPS = new Set(['1.2.3.4', '5.6.7.8']);
   
   app.use((req, res, next) => {
     if (BLOCKED_IPS.has(req.ip)) {
       return res.status(403).json({ error: 'Forbidden' });
     }
     next();
   });
   ```

3. **Review form submissions**:
   ```sql
   SELECT ip_address, COUNT(*) AS submission_count
   FROM form_submissions
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY ip_address
   ORDER BY submission_count DESC;
   ```

### Data Breach Response

1. **Identify scope**: Determine which data was accessed
2. **Revoke all tokens**:
   ```sql
   DELETE FROM refresh_tokens;
   -- Users will need to re-login
   ```
3. **Rotate secrets**: Update `JWT_SECRET` and redeploy
4. **Notify affected users**: Email notification with password reset link
5. **Document incident**: Create post-mortem report

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## Support

For additional help:
- Check application logs in `backend/logs/`
- Review `SECURITY_IMPLEMENTATION_NOTES.md` for security details
- Consult `ARCHITECTURE.md` for system design
- Refer to `RBAC_GUIDE.md` for permission issues
