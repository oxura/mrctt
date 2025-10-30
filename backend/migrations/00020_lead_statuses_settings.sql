-- Add support for custom lead statuses in tenant settings
-- Lead statuses will be stored in tenant.settings.lead_statuses as JSONB

BEGIN;

-- Remove the old CHECK constraint on leads.status
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add comment explaining that statuses are now configurable per tenant
COMMENT ON COLUMN leads.status IS 'Lead status: configurable per tenant via settings.lead_statuses';

-- Add default lead statuses to existing tenants without them
UPDATE tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{lead_statuses}',
  '[
    {"key": "new", "label": "Новый", "color": "#38bdf8", "order": 0},
    {"key": "contacted", "label": "Связались", "color": "#8b5cf6", "order": 1},
    {"key": "qualified", "label": "Квалифицирован", "color": "#6366f1", "order": 2},
    {"key": "proposal_sent", "label": "Отправлено КП", "color": "#f97316", "order": 3},
    {"key": "negotiation", "label": "Переговоры", "color": "#eab308", "order": 4},
    {"key": "won", "label": "Успех", "color": "#22c55e", "order": 5},
    {"key": "lost", "label": "Отказ", "color": "#ef4444", "order": 6},
    {"key": "on_hold", "label": "Отложено", "color": "#64748b", "order": 7}
  ]'::jsonb
)
WHERE settings IS NULL OR NOT settings ? 'lead_statuses';

COMMIT;
