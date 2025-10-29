BEGIN;

DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_products_type;
ALTER TABLE products DROP COLUMN IF EXISTS status;

COMMIT;
