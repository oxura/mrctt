# RBAC (Role-Based Access Control) Implementation Guide

## Overview

This CRM platform implements a comprehensive Role-Based Access Control (RBAC) system with granular permissions.

## Roles

### 1. Owner
- **Description**: Full access to everything including billing and company deletion
- **Auto-assigned**: First user in a tenant automatically gets this role
- **Permissions**: All permissions

### 2. Admin
- **Description**: Full CRM access except billing and company deletion
- **Permissions**: All permissions except `billing:*` and `tenants:delete`

### 3. Manager
- **Description**: Limited access to leads, tasks, and calendar
- **Permissions**:
  - Leads: Can view all, but only create/update/delete own
  - Tasks: Own tasks only
  - Read-only: Products, Groups, Forms
  - Profile management

### 4. Platform Owner
- **Description**: System administrator with cross-tenant access
- **Permissions**: Tenant management across all companies

## Permission Format

Permissions follow the format: `resource:action:scope`

Examples:
- `leads:read:all` - Read all leads in tenant
- `leads:read:own` - Read only assigned leads
- `leads:update:all` - Update any lead
- `leads:update:own` - Update only assigned leads
- `users:manage-roles` - Assign roles to team members
- `billing:manage` - Manage subscriptions

## Usage in Routes

### Using Permission Middleware

```typescript
import { requirePermission, requireAnyPermission, requireAllPermissions } from '../middleware/rbac';

// Single permission required
router.get('/leads', 
  authenticate, 
  tenantGuard,
  requirePermission('leads:read:all'),
  listLeads
);

// Any of the permissions required (OR logic)
router.post('/leads',
  authenticate,
  tenantGuard,
  requireAnyPermission('leads:create', 'leads:update:all'),
  createLead
);

// All permissions required (AND logic)
router.post('/users/invite',
  authenticate,
  tenantGuard,
  requireAllPermissions('users:create', 'users:manage-roles'),
  inviteUser
);
```

### Using Role Middleware (Legacy)

```typescript
import { requireRole } from '../middleware/auth';

router.patch('/settings',
  authenticate,
  tenantGuard,
  requireRole('owner', 'admin'),
  updateSettings
);
```

## Scoped Permissions (Own vs All)

For resources that can be owned by users, use the `requirePermissionWithOwnership` middleware:

```typescript
import { requirePermissionWithOwnership } from '../middleware/rbac';

router.put('/leads/:id',
  authenticate,
  tenantGuard,
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      // Fetch the lead and return the assigned_to user_id
      const lead = await leadRepo.findById(req.params.id);
      return lead?.assigned_to || null;
    }
  ),
  updateLead
);
```

## Programmatic Permission Checks

Use in controllers for conditional logic:

```typescript
import { checkPermission } from '../middleware/rbac';

async function updateLead(req: Request, res: Response) {
  const canUpdateAll = await checkPermission(req.user!.id, 'leads:update:all');
  
  if (!canUpdateAll) {
    // Only allow updating own leads
    const lead = await leadRepo.findById(req.params.id);
    if (lead.assigned_to !== req.user!.id) {
      throw new AppError('Access denied', 403);
    }
  }
  
  // Proceed with update
}
```

## Available Permissions by Resource

### Tenants
- `tenants:read` - View tenant information
- `tenants:update` - Update tenant settings
- `tenants:delete` - Delete tenant (Owner only)
- `tenants:list` - List all tenants (Platform Owner only)

### Users/Team
- `users:create` - Invite team members
- `users:read` - View all team members
- `users:read:own` - View own profile
- `users:update` - Update any team member
- `users:update:own` - Update own profile
- `users:delete` - Remove team members
- `users:manage-roles` - Assign roles

### Leads
- `leads:create` - Create leads
- `leads:read:all` - View all leads
- `leads:read:own` - View assigned leads
- `leads:update:all` - Update any lead
- `leads:update:own` - Update assigned leads
- `leads:delete:all` - Delete any lead
- `leads:delete:own` - Delete assigned leads
- `leads:assign` - Assign leads to team members

### Products
- `products:create` - Create products/services
- `products:read` - View products
- `products:update` - Update products
- `products:delete` - Delete products

### Groups/Streams
- `groups:create` - Create groups
- `groups:read` - View groups
- `groups:update` - Update groups
- `groups:delete` - Delete groups

### Tasks
- `tasks:create` - Create tasks
- `tasks:read:all` - View all tasks
- `tasks:read:own` - View assigned tasks
- `tasks:update:all` - Update any task
- `tasks:update:own` - Update assigned tasks
- `tasks:delete:all` - Delete any task
- `tasks:delete:own` - Delete assigned tasks

### Forms
- `forms:create` - Create forms
- `forms:read` - View forms
- `forms:update` - Update forms
- `forms:delete` - Delete forms

### Billing
- `billing:read` - View billing information
- `billing:manage` - Manage subscriptions (Owner only)

### Dashboard
- `dashboard:view` - View dashboard and analytics

## First User Auto-Owner Assignment

When a tenant is created during registration, the first user automatically receives the **Owner** role:

```typescript
// In UserRepository.create()
if (data.tenant_id) {
  const isFirstUser = await this.isFirstUserInTenant(data.tenant_id);
  if (isFirstUser) {
    role = 'owner'; // Auto-assign Owner role
  }
}
```

## API Endpoints

### Get Current User Permissions
```http
GET /api/v1/users/me/permissions
Authorization: Bearer <token>

Response:
{
  "status": "success",
  "data": {
    "role": "admin",
    "permissions": [
      "tenants:read",
      "tenants:update",
      "leads:create",
      "leads:read:all",
      ...
    ]
  }
}
```

### List All Roles with Permissions
```http
GET /api/v1/users/roles
Authorization: Bearer <token>

Response:
{
  "status": "success",
  "data": {
    "roles": [
      {
        "id": "...",
        "name": "owner",
        "display_name": "Owner",
        "description": "Full access...",
        "permissions": ["tenants:read", "tenants:update", ...]
      },
      ...
    ]
  }
}
```

### Invite Team Member
```http
POST /api/v1/users/team
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>

{
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "manager"
}

Response:
{
  "status": "success",
  "data": {
    "user": { ... },
    "temporaryPassword": "random123"
  }
}
```

## Migration

Run the RBAC migration to set up tables and seed data:

```bash
npm run migrate
```

This will create:
- `roles` table with 4 predefined roles
- `permissions` table with ~40 granular permissions
- `role_permissions` junction table
- Default permission assignments for each role

## Testing

Check database setup:
```bash
npx tsx src/db/testConnection.ts
```

## Best Practices

1. **Use permission-based checks** instead of role-based when possible for flexibility
2. **Combine scoped permissions** (`:own` vs `:all`) for fine-grained control
3. **Always check ownership** for scoped permissions in controllers
4. **Document custom permissions** in this file when adding new resources
5. **Use `requireAnyPermission`** for "either-or" scenarios
6. **Use `requireAllPermissions`** when multiple permissions are required

## Future Enhancements

- [ ] Custom permission creation per tenant
- [ ] Permission caching for performance
- [ ] Audit log for permission changes
- [ ] UI for role/permission management
- [ ] Team-level permissions (manager can see their team's leads)
