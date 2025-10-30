-- Rollback: Remove unique index on forms.public_url
-- Created at 2024-10-30

BEGIN;

-- Drop unique index
DROP INDEX IF EXISTS idx_forms_public_url_unique;

-- Restore non-unique index
CREATE INDEX IF NOT EXISTS idx_forms_public_url ON forms(public_url);

COMMIT;
