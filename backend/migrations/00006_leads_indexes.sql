BEGIN;

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE INDEX IF NOT EXISTS idx_leads_first_name_trgm ON leads USING GIN (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_last_name_trgm ON leads USING GIN (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_email_trgm ON leads USING GIN (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm ON leads USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_status_created_desc ON leads (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_assigned_created_desc ON leads (tenant_id, assigned_to, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_product_created_desc ON leads (tenant_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_created_desc ON leads (tenant_id, created_at DESC);

COMMIT;
