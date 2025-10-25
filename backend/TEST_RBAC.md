# RBAC System Testing Guide

## Prerequisites

1. Start backend server:
```bash
cd /home/engine/project/backend
npm run dev
```

2. The migrations will run automatically on startup, creating all RBAC tables.

## Test Scenarios

### 1. Register New Tenant (First User = Owner)

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "password123",
    "firstName": "Owner",
    "lastName": "User",
    "companyName": "Test Company",
    "companySlug": "test-company"
  }'
```

Expected Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "email": "owner@test.com",
      "role": "owner",  // ✅ Auto-assigned Owner role
      ...
    },
    "tenant": { ... },
    "token": "..."
  }
}
```

Save the token for next requests.

### 2. Get Current User Permissions

```bash
curl -X GET http://localhost:5000/api/v1/users/me/permissions \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Expected Response (Owner):
```json
{
  "status": "success",
  "data": {
    "role": "owner",
    "permissions": [
      "tenants:read",
      "tenants:update",
      "tenants:delete",
      "users:create",
      "users:read",
      "users:manage-roles",
      "leads:create",
      "leads:read:all",
      "leads:update:all",
      "billing:manage",
      // ... all 48 permissions
    ]
  }
}
```

### 3. Get Current Tenant Info

```bash
curl -X GET http://localhost:5000/api/v1/tenants/current \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "X-Tenant-ID: <YOUR_TENANT_ID>"
```

Should succeed (Owner has `tenants:read` permission).

### 4. List All Roles

```bash
curl -X GET http://localhost:5000/api/v1/users/roles \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Expected Response:
```json
{
  "status": "success",
  "data": {
    "roles": [
      {
        "id": "...",
        "name": "owner",
        "display_name": "Owner",
        "description": "Full access including billing and company deletion",
        "permissions": ["tenants:read", "tenants:update", ...]
      },
      {
        "name": "admin",
        "display_name": "Administrator",
        ...
      },
      {
        "name": "manager",
        "display_name": "Manager",
        ...
      }
    ]
  }
}
```

### 5. Invite Team Member (Manager)

```bash
curl -X POST http://localhost:5000/api/v1/users/team \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "X-Tenant-ID: <YOUR_TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@test.com",
    "firstName": "Test",
    "lastName": "Manager",
    "role": "manager"
  }'
```

Expected Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "email": "manager@test.com",
      "role": "manager",  // ✅ Assigned Manager role
      ...
    },
    "temporaryPassword": "abc123def456"
  },
  "message": "User invited successfully. Send them the temporary password."
}
```

### 6. Login as Manager

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@test.com",
    "password": "abc123def456",
    "tenantSlug": "test-company"
  }'
```

Save the manager token.

### 7. Check Manager Permissions

```bash
curl -X GET http://localhost:5000/api/v1/users/me/permissions \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

Expected Response (Manager - Limited):
```json
{
  "status": "success",
  "data": {
    "role": "manager",
    "permissions": [
      "leads:create",
      "leads:read:all",
      "leads:read:own",
      "leads:update:own",
      "leads:delete:own",
      "tasks:create",
      "tasks:read:own",
      "tasks:update:own",
      "tasks:delete:own",
      "products:read",
      "groups:read",
      "forms:read",
      "dashboard:view",
      "users:read:own",
      "users:update:own"
      // Only ~15 permissions (vs 48 for Owner)
    ]
  }
}
```

### 8. Manager Tries to Update Tenant (Should Fail)

```bash
curl -X PATCH http://localhost:5000/api/v1/tenants/current/onboarding \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "X-Tenant-ID: <YOUR_TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

Expected Response:
```json
{
  "status": "error",
  "message": "Insufficient permissions. Required: tenants:update",
  "statusCode": 403
}
```

✅ Manager correctly blocked from updating tenant settings.

### 9. Manager Tries to Invite Users (Should Fail)

```bash
curl -X POST http://localhost:5000/api/v1/users/team \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "X-Tenant-ID: <YOUR_TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another@test.com",
    "firstName": "Another",
    "role": "manager"
  }'
```

Expected Response:
```json
{
  "status": "error",
  "message": "Insufficient permissions. Required: users:create",
  "statusCode": 403
}
```

✅ Manager correctly blocked from inviting team members.

### 10. Owner Updates Tenant (Should Succeed)

```bash
curl -X PATCH http://localhost:5000/api/v1/tenants/current/onboarding \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "X-Tenant-ID: <YOUR_TENANT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name",
    "industry": "saas"
  }'
```

Expected Response:
```json
{
  "status": "success",
  "data": {
    "tenant": {
      "name": "Updated Company Name",
      "industry": "saas",
      ...
    }
  }
}
```

✅ Owner successfully updated tenant.

## Permission Matrix

| Permission | Owner | Admin | Manager |
|------------|-------|-------|---------|
| `tenants:read` | ✅ | ✅ | ❌ |
| `tenants:update` | ✅ | ✅ | ❌ |
| `tenants:delete` | ✅ | ❌ | ❌ |
| `users:create` | ✅ | ✅ | ❌ |
| `users:manage-roles` | ✅ | ✅ | ❌ |
| `leads:read:all` | ✅ | ✅ | ✅ |
| `leads:update:all` | ✅ | ✅ | ❌ |
| `leads:update:own` | ✅ | ✅ | ✅ |
| `billing:manage` | ✅ | ❌ | ❌ |
| `dashboard:view` | ✅ | ✅ | ✅ |

## Test Database Directly

```bash
# Connect to your database and run:

-- Check roles
SELECT * FROM roles;

-- Check permissions count
SELECT r.name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name;

-- Check user roles
SELECT u.email, u.role, t.name as tenant
FROM users u
JOIN tenants t ON t.id = u.tenant_id;

-- Check permissions for a role
SELECT p.name
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON r.id = rp.role_id
WHERE r.name = 'manager'
ORDER BY p.resource, p.action;
```

## Common Issues

### Issue: 403 Forbidden on all endpoints
**Solution**: Check that migrations ran successfully. Verify `roles` and `permissions` tables exist.

```bash
npx tsx src/db/testConnection.ts
```

### Issue: Owner not auto-assigned on registration
**Solution**: Check `UserRepository.create()` - it should detect first user in tenant.

### Issue: Permission checks always fail
**Solution**: Verify `authenticate` middleware loads permissions into `req.permissions`.

## Success Criteria

- ✅ First user in tenant gets 'owner' role automatically
- ✅ Owner has all permissions (~48)
- ✅ Admin has most permissions except billing and tenant deletion (~44)
- ✅ Manager has limited permissions (~15)
- ✅ Permission checks correctly block unauthorized actions
- ✅ Invited users get specified role (not owner)
- ✅ `/users/me/permissions` endpoint works
- ✅ `/users/roles` endpoint shows all roles with permissions
