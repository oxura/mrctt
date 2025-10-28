BEGIN;

DROP INDEX IF EXISTS idx_leads_tenant_created_desc;
DROP INDEX IF EXISTS idx_leads_tenant_product_created_desc;
DROP INDEX IF EXISTS idx_leads_tenant_assigned_created_desc;
DROP INDEX IF EXISTS idx_leads_tenant_status_created_desc;

DROP INDEX IF EXISTS idx_products_name_trgm;
DROP INDEX IF EXISTS idx_leads_phone_trgm;
DROP INDEX IF EXISTS idx_leads_email_trgm;
DROP INDEX IF EXISTS idx_leads_last_name_trgm;
DROP INDEX IF EXISTS idx_leads_first_name_trgm;

COMMIT;
