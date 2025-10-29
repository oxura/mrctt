-- Add CHECK constraint for lead status values
-- Ensures only valid status values are stored

DO $$
BEGIN
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_status_check'
  ) THEN
    ALTER TABLE leads
    ADD CONSTRAINT leads_status_check
    CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold'));
  END IF;
END $$;

-- Add comment explaining allowed values
COMMENT ON COLUMN leads.status IS 'Lead status: new, contacted, qualified, proposal_sent, negotiation, won, lost, on_hold';
