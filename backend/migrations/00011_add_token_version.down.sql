-- Down Migration: Remove token_version column and function

BEGIN;

-- Drop the increment function
DROP FUNCTION IF EXISTS increment_token_version(UUID);

-- Drop index and column
DROP INDEX IF EXISTS idx_users_id_token_version;
ALTER TABLE users DROP COLUMN IF EXISTS token_version;

COMMIT;
