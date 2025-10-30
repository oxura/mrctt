-- Migration: Ensure unique index on forms.public_url
-- Created at 2024-10-30

BEGIN;

-- Drop non-unique index if it exists
DROP INDEX IF EXISTS idx_forms_public_url;

-- Create unique index for faster lookups while preserving uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_public_url_unique
  ON forms(public_url)
  WHERE public_url IS NOT NULL;

COMMIT;
