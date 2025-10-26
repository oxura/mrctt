# RBAC and Audit Improvements

## Changes Made

### 1. Fixed Manager Task Permissions
**Issue**: Managers couldn't see all tasks, only their own tasks.

**Solution**: Added `tasks:read:all` permission to Manager role, allowing them to view all tasks in the calendar/dashboard while still only being able to modify their own tasks.

**Migration**: `00004_update_manager_task_permissions.sql`

**Rationale**: According to PRD, managers need access to the calendar and task system. To effectively coordinate work and understand team activity, they should see all tasks but maintain limited editing rights (only their own).

### 2. Implemented Audit Logging System
**Feature**: Comprehensive audit trail for security and compliance.

**Migration**: `00005_audit_logs.sql`

**Components**:
- **Database Table**: `audit_logs` - stores all audit events
- **Repository**: `AuditLogRepository` - data access layer
- **Service**: `AuditService` - business logic for recording audits
- **Middleware**: `auditLog()` - automatic audit trail for routes
- **Controller**: `auditController` - API to view audit logs
- **Routes**: `/api/v1/audit` - endpoint to access audit logs
- **Permission**: `audit:read` - granted to owner, admin, and platform_owner

**Initial Tracked Events**:
- User registration (automatic owner assignment)
- User login
- Team member invitation
- Tenant onboarding updates (via middleware)

Additional routes can opt-in by using the `auditLog` middleware or `AuditService` directly.

**Audit Log Fields**:
- `tenant_id` - tenant context
- `user_id` - who performed the action
- `action` - what was done (e.g., "user.login", "user.invite")
- `resource_type` - type of resource (user, tenant, lead, etc.)
- `resource_id` - specific resource ID
- `details` - JSON with additional context
- `ip_address` - client IP address
- `user_agent` - browser/client information
- `created_at` - timestamp

### 3. Enhanced Authentication Audit Trail
**Changes**:
- Registration events now logged with tenant and role info
- Login events tracked with tenant context
- IP address and user agent captured for security

### 4. Route Protection with Audit
**Updated Routes**:
- `PATCH /tenants/current/onboarding` - audit logged
- `POST /users/team` - audit logged with role assignment details

### 5. Permission Verification
All existing permissions verified against PRD requirements:

**Owner** (48 permissions):
- ✅ Full access to everything including billing and tenant deletion

**Admin** (44 permissions):
- ✅ Full CRM access
- ✅ Can read billing info
- ❌ Cannot manage billing
- ❌ Cannot delete tenant

**Manager** (16 permissions):
- ✅ View all leads, modify only own leads
- ✅ View all tasks, modify only own tasks (FIXED)
- ✅ Read-only access to products, groups, forms
- ✅ View dashboard
- ❌ No access to team management
- ❌ No access to billing

**Platform Owner** (4 permissions):
- ✅ Cross-tenant administration
- ✅ Can view audit logs

## API Endpoints

### New Endpoints

```http
GET /api/v1/audit?limit=50&offset=0
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>

# Response
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "uuid",
        "tenant_id": "uuid",
        "user_id": "uuid",
        "action": "user.login",
        "resource_type": "user",
        "resource_id": "uuid",
        "details": { "email": "user@example.com" },
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-10T12:00:00Z"
      }
    ],
    "limit": 50,
    "offset": 0
  }
}
```

## Usage Examples

### Using Audit Middleware
```typescript
import { auditLog } from '../middleware/audit';

router.post(
  '/resource',
  authenticate,
  tenantGuard,
  requirePermission('resource:create'),
  auditLog('resource.create', 'resource'),
  createResourceController
);
```

### Manual Audit Logging
```typescript
import { AuditService } from '../services/auditService';

const auditService = new AuditService();

await auditService.record({
  tenantId: req.tenantId,
  userId: req.user.id,
  action: 'lead.status.change',
  resourceType: 'lead',
  resourceId: lead.id,
  details: {
    from: 'new',
    to: 'in_progress'
  },
  request: req
});
```

## Security Benefits

1. **Accountability**: Every critical action is tracked with user and timestamp
2. **Compliance**: Audit trail for regulatory requirements (GDPR, etc.)
3. **Forensics**: Investigate security incidents
4. **Monitoring**: Detect unusual patterns or unauthorized access attempts
5. **Transparency**: Owners can see all team activities

## Performance Considerations

- Audit logging is asynchronous and doesn't block requests
- Errors in audit logging are caught and logged but don't fail the request
- Indexes on `tenant_id`, `user_id`, `action`, and `created_at` for fast queries
- Consider archiving old audit logs after 1 year

## Future Enhancements

- Export audit logs to CSV/JSON
- Real-time audit log streaming
- Alerts on suspicious activities
- Audit log retention policies
- Advanced filtering and search
