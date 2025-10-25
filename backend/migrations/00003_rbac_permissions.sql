-- Migration: RBAC Roles and Permissions System
-- Created at 2024-01-03

BEGIN;

-- Roles table with predefined roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('owner', 'admin', 'manager', 'platform_owner')),
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table for granular access control
-- Format: resource:action:scope (e.g., leads:read:own, leads:update:all)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship between roles and permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- Indexes for performance
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);

-- Trigger for roles updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined roles
INSERT INTO roles (name, display_name, description) VALUES
  ('owner', 'Owner', 'Full access including billing and company deletion'),
  ('admin', 'Administrator', 'Full CRM access except billing and company deletion'),
  ('manager', 'Manager', 'Limited access to leads, tasks, and calendar'),
  ('platform_owner', 'Platform Owner', 'System administrator with cross-tenant access');

-- Insert permissions

-- Tenant permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('tenants:read', 'tenants', 'read', NULL, 'View tenant information'),
  ('tenants:update', 'tenants', 'update', NULL, 'Update tenant settings'),
  ('tenants:delete', 'tenants', 'delete', NULL, 'Delete tenant (company)'),
  ('tenants:list', 'tenants', 'list', NULL, 'List all tenants (platform admin)');

-- User/Team permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('users:create', 'users', 'create', NULL, 'Invite new team members'),
  ('users:read', 'users', 'read', 'all', 'View all team members'),
  ('users:read:own', 'users', 'read', 'own', 'View own profile'),
  ('users:update', 'users', 'update', 'all', 'Update any team member'),
  ('users:update:own', 'users', 'update', 'own', 'Update own profile'),
  ('users:delete', 'users', 'delete', NULL, 'Remove team members'),
  ('users:manage-roles', 'users', 'manage-roles', NULL, 'Assign roles to team members');

-- Lead permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('leads:create', 'leads', 'create', NULL, 'Create new leads'),
  ('leads:read:all', 'leads', 'read', 'all', 'View all leads in tenant'),
  ('leads:read:own', 'leads', 'read', 'own', 'View only assigned leads'),
  ('leads:update:all', 'leads', 'update', 'all', 'Update any lead'),
  ('leads:update:own', 'leads', 'update', 'own', 'Update only assigned leads'),
  ('leads:delete:all', 'leads', 'delete', 'all', 'Delete any lead'),
  ('leads:delete:own', 'leads', 'delete', 'own', 'Delete only assigned leads'),
  ('leads:assign', 'leads', 'assign', NULL, 'Assign leads to team members');

-- Product permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('products:create', 'products', 'create', NULL, 'Create new products/services'),
  ('products:read', 'products', 'read', NULL, 'View products/services'),
  ('products:update', 'products', 'update', NULL, 'Update products/services'),
  ('products:delete', 'products', 'delete', NULL, 'Delete products/services');

-- Group permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('groups:create', 'groups', 'create', NULL, 'Create new groups/streams'),
  ('groups:read', 'groups', 'read', NULL, 'View groups/streams'),
  ('groups:update', 'groups', 'update', NULL, 'Update groups/streams'),
  ('groups:delete', 'groups', 'delete', NULL, 'Delete groups/streams');

-- Task permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('tasks:create', 'tasks', 'create', NULL, 'Create tasks'),
  ('tasks:read:all', 'tasks', 'read', 'all', 'View all tasks'),
  ('tasks:read:own', 'tasks', 'read', 'own', 'View only assigned tasks'),
  ('tasks:update:all', 'tasks', 'update', 'all', 'Update any task'),
  ('tasks:update:own', 'tasks', 'update', 'own', 'Update only assigned tasks'),
  ('tasks:delete:all', 'tasks', 'delete', 'all', 'Delete any task'),
  ('tasks:delete:own', 'tasks', 'delete', 'own', 'Delete only assigned tasks');

-- Form permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('forms:create', 'forms', 'create', NULL, 'Create new forms'),
  ('forms:read', 'forms', 'read', NULL, 'View forms'),
  ('forms:update', 'forms', 'update', NULL, 'Update forms'),
  ('forms:delete', 'forms', 'delete', NULL, 'Delete forms');

-- Billing permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('billing:read', 'billing', 'read', NULL, 'View billing information'),
  ('billing:manage', 'billing', 'manage', NULL, 'Manage subscriptions and payments');

-- Dashboard/Analytics permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  ('dashboard:view', 'dashboard', 'view', NULL, 'View dashboard and analytics');

-- Assign permissions to roles

-- Owner: Full access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'owner';

-- Admin: Full access except billing and tenant deletion
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name NOT IN ('billing:manage', 'tenants:delete', 'tenants:list');

-- Manager: Limited access to leads (own), tasks (own), read-only for products/forms
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.name IN (
    -- Can view all leads but only update/delete own
    'leads:create',
    'leads:read:all',
    'leads:read:own',
    'leads:update:own',
    'leads:delete:own',
    -- Tasks: own only
    'tasks:create',
    'tasks:read:own',
    'tasks:update:own',
    'tasks:delete:own',
    -- Read-only access
    'products:read',
    'groups:read',
    'forms:read',
    'dashboard:view',
    -- Own profile
    'users:read:own',
    'users:update:own'
  );

-- Platform Owner: Cross-tenant access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'platform_owner'
  AND p.name IN (
    'tenants:list',
    'tenants:read',
    'tenants:update',
    'tenants:delete'
  );

COMMIT;
