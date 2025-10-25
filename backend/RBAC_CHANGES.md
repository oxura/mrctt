# RBAC Implementation - Summary of Changes

## ✅ Completed Tasks

### 1. Created Roles Table in Database ✓
- Migration `00003_rbac_permissions.sql` created
- 4 predefined roles: `owner`, `admin`, `manager`, `platform_owner`
- Roles table includes display names and descriptions

### 2. Created Permissions System ✓
- `permissions` table with ~40 granular permissions
- Format: `resource:action:scope` (e.g., `leads:read:own`)
- `role_permissions` junction table for many-to-many relationships

### 3. Auto-Assign Owner Role to First User ✓
- Updated `UserRepository.create()` to check if user is first in tenant
- First user automatically receives `owner` role
- Subsequent users get role specified in invitation

### 4. Implemented RBAC Middleware ✓
Created `/src/middleware/rbac.ts` with:
- `requirePermission(permission)` - Check single permission
- `requireAnyPermission(...permissions)` - Check any of permissions (OR)
- `requireAllPermissions(...permissions)` - Check all permissions (AND)
- `requirePermissionWithOwnership()` - Check permission with resource ownership
- `checkPermission()` - Helper for programmatic checks
- `isResourceOwner()` - Helper to verify ownership

### 5. Created Permission Repository ✓
Created `/src/repositories/permissionRepository.ts` with methods:
- `getRoleByName()` - Get role details
- `getPermissionsByRole()` - Get all permissions for a role
- `getPermissionsByUserId()` - Get all permissions for a user
- `hasPermission()` - Check if user has specific permission
- `hasAnyPermission()` - Check if user has any of permissions
- `getAllRoles()` - Get all roles
- `getAllPermissions()` - Get all permissions

### 6. Updated Routes with RBAC Guards ✓
- Updated `/src/routes/tenantRoutes.ts` to use permission middleware
- Created `/src/routes/userRoutes.ts` with permission-based guards
- New endpoints:
  - `GET /api/v1/users/me/permissions` - Get current user permissions
  - `GET /api/v1/users/team` - List team members
  - `POST /api/v1/users/team` - Invite team member
  - `GET /api/v1/users/roles` - List all roles

### 7. Enhanced Authentication Middleware ✓
- Updated `authenticate()` to fetch and attach user permissions to `req.permissions`
- Permissions are now loaded on every authenticated request

### 8. Created User Management Controller ✓
Created `/src/controllers/userController.ts` with:
- `listTeamMembers()` - List all users in tenant
- `inviteTeamMember()` - Invite user with role (admin/manager)
- `getCurrentUserPermissions()` - Get current user's permissions
- `listRoles()` - List all roles with their permissions

## 📁 New Files Created

```
backend/
├── migrations/
│   └── 00003_rbac_permissions.sql        # RBAC migration
├── src/
│   ├── middleware/
│   │   └── rbac.ts                       # Permission middleware
│   ├── repositories/
│   │   └── permissionRepository.ts       # Permission data access
│   ├── controllers/
│   │   └── userController.ts             # User/team management
│   ├── routes/
│   │   └── userRoutes.ts                 # User/team routes
│   └── db/
│       └── testConnection.ts             # DB connection test
├── RBAC_GUIDE.md                         # Full documentation
└── RBAC_CHANGES.md                       # This file
```

## 🔄 Modified Files

```
backend/src/
├── routes/
│   ├── index.ts                          # Added userRoutes
│   └── tenantRoutes.ts                   # Updated to use permission middleware
├── repositories/
│   └── userRepository.ts                 # Added first user detection & auto-owner
├── services/
│   └── authService.ts                    # Removed hardcoded 'owner' role
├── middleware/
│   └── auth.ts                           # Added permission loading
└── types/
    └── express.d.ts                      # Added req.permissions
```

## 🗄️ Database Schema

### Tables Created

**roles**
- id (UUID)
- name (VARCHAR) - 'owner', 'admin', 'manager', 'platform_owner'
- display_name (VARCHAR)
- description (TEXT)
- created_at, updated_at

**permissions**
- id (UUID)
- name (VARCHAR) - e.g., 'leads:read:all'
- resource (VARCHAR) - e.g., 'leads'
- action (VARCHAR) - e.g., 'read'
- scope (VARCHAR) - e.g., 'all', 'own', null
- description (TEXT)
- created_at

**role_permissions**
- id (UUID)
- role_id (UUID FK)
- permission_id (UUID FK)
- created_at

### Seeded Data

**4 Roles:**
- Owner (48 permissions - full access)
- Admin (44 permissions - all except billing & tenant deletion)
- Manager (15 permissions - limited to own leads/tasks)
- Platform Owner (4 permissions - cross-tenant management)

**~40 Permissions** across resources:
- tenants (4)
- users (7)
- leads (8)
- products (4)
- groups (4)
- tasks (7)
- forms (4)
- billing (2)
- dashboard (1)

## 🔐 Permission Examples

| Role | Leads Access | Users Access | Billing |
|------|--------------|--------------|---------|
| Owner | All leads (CRUD) | Manage team & roles | Full access |
| Admin | All leads (CRUD) | Manage team & roles | No access |
| Manager | View all, edit own | View own profile | No access |

## 🚀 Usage Examples

### 1. Protect Route with Permission
```typescript
router.get('/leads',
  authenticate,
  tenantGuard,
  requirePermission('leads:read:all'),
  listLeads
);
```

### 2. Protect with Multiple Permissions (OR)
```typescript
router.post('/leads',
  authenticate,
  tenantGuard,
  requireAnyPermission('leads:create', 'leads:update:all'),
  createLead
);
```

### 3. Protect with Ownership Check
```typescript
router.put('/leads/:id',
  authenticate,
  tenantGuard,
  requirePermissionWithOwnership(
    'leads:update:all',
    'leads:update:own',
    async (req) => {
      const lead = await leadRepo.findById(req.params.id);
      return lead?.assigned_to || null;
    }
  ),
  updateLead
);
```

### 4. Check Permission in Controller
```typescript
import { checkPermission } from '../middleware/rbac';

async function updateLead(req: Request, res: Response) {
  const canUpdateAll = await checkPermission(req.user!.id, 'leads:update:all');
  
  if (!canUpdateAll) {
    // Verify ownership
    const lead = await leadRepo.findById(req.params.id);
    if (lead.assigned_to !== req.user!.id) {
      throw new AppError('Access denied', 403);
    }
  }
  
  // Proceed with update
}
```

## 📝 API Examples

### Get My Permissions
```bash
curl -X GET http://localhost:5000/api/v1/users/me/permissions \
  -H "Authorization: Bearer <token>"
```

Response:
```json
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

### Invite Team Member (Owner/Admin only)
```bash
curl -X POST http://localhost:5000/api/v1/users/team \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "manager"
  }'
```

## 🧪 Testing

### Run Migration
```bash
cd backend
npm run migrate
```

### Test Database Connection
```bash
npx tsx src/db/testConnection.ts
```

### Test First User Owner Assignment
1. Register a new tenant
2. Check that user has role 'owner'
3. Invite another user
4. Check that invited user has specified role (admin/manager)

### Test Permissions
1. Login as different roles
2. Try accessing protected endpoints
3. Verify 403 errors for insufficient permissions

## 🎯 Benefits

1. **Granular Control**: 40+ permissions vs 4 roles = fine-grained access
2. **Flexible**: Easy to add new permissions without changing code
3. **Secure**: Permission checks at middleware and repository level
4. **Maintainable**: Clear separation between roles and permissions
5. **Scalable**: Can add custom permissions per tenant in future
6. **User-Friendly**: Automatic owner assignment for first user

## 🔜 Next Steps (Future Enhancements)

1. Add permission caching (Redis) for performance
2. Create UI for role/permission management
3. Add audit logging for permission changes
4. Implement team-level permissions (hierarchy)
5. Add custom permissions per tenant
6. Create permission templates for different industries
