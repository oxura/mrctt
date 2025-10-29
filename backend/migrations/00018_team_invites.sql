-- Migration: Team invites table
-- Created for team member invitation workflow

BEGIN;

-- Team invites table (for inviting new team members)
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager')),
  token VARCHAR(255) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email)
);

-- Indexes for team_invites
CREATE INDEX idx_team_invites_tenant_id ON team_invites(tenant_id);
CREATE INDEX idx_team_invites_token ON team_invites(token);
CREATE INDEX idx_team_invites_email ON team_invites(email);

COMMIT;
