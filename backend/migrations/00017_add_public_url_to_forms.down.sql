BEGIN;

DROP INDEX IF EXISTS idx_forms_public_url;
ALTER TABLE forms DROP COLUMN IF EXISTS public_url;

COMMIT;
