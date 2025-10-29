-- Migration: Fix refresh_tokens for tenant isolation
-- Purpose: Add indexes and constraints for secure refresh token lookup

BEGIN;

-- Add composite index for fast lookup by user_id + tenant_id
CREATE INDEX idx_refresh_tokens_user_tenant ON refresh_tokens(user_id, tenant_id, is_revoked, expires_at);

-- Add token_family_id for tracking token rotation chains
ALTER TABLE refresh_tokens ADD COLUMN token_family_id UUID;

-- Add index on token_family_id
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(token_family_id);

-- Add last_used_at for audit
ALTER TABLE refresh_tokens ADD COLUMN last_used_at TIMESTAMP;

COMMIT;
