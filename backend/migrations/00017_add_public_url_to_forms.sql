-- Migration: Add public_url to forms table
-- Created at 2024-01-17

BEGIN;

-- Add public_url column to forms table
ALTER TABLE forms ADD COLUMN public_url VARCHAR(255) UNIQUE;

-- Create index for public_url lookups
CREATE INDEX idx_forms_public_url ON forms(public_url);

COMMIT;
