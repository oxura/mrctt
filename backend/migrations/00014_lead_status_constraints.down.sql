-- Remove lead status check constraint

ALTER TABLE leads
DROP CONSTRAINT IF EXISTS leads_status_check;
