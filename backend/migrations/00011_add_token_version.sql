-- Migration: Add token_version for JWT revocation
-- Purpose: Allow forced logout and JWT token revocation

BEGIN;

-- Add token_version column to users table
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1;

-- Create index for fast token version checks
CREATE INDEX idx_users_id_token_version ON users(id, token_version);

-- Create function to increment token version (for logout/password change)
CREATE OR REPLACE FUNCTION increment_token_version(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET token_version = token_version + 1 WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

COMMIT;
