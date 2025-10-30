-- Revert custom lead statuses settings changes

BEGIN;

-- Remove lead_statuses from tenant settings when rolling back
UPDATE tenants
SET settings = 
  CASE
    WHEN settings ? 'lead_statuses' THEN settings - 'lead_statuses'
    ELSE settings
  END;

-- Restore the original CHECK constraint for leads.status values
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold'));

-- Restore the original comment describing allowed values
COMMENT ON COLUMN leads.status IS 'Lead status: new, contacted, qualified, proposal_sent, negotiation, won, lost, on_hold';

COMMIT;
