-- Down Migration: Revert refresh tokens isolation fixes

BEGIN;

-- Drop indexes and columns added in the up migration
DROP INDEX IF EXISTS idx_refresh_tokens_user_tenant;
DROP INDEX IF EXISTS idx_refresh_tokens_family;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS token_family_id;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS last_used_at;

COMMIT;
