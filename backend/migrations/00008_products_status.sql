-- Migration: Add status field to products table
-- Created at 2024-10-29

BEGIN;

-- Add status column to products table
ALTER TABLE products ADD COLUMN status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived'));

-- Update existing records to have 'active' status if is_active is true, 'archived' if false
UPDATE products SET status = CASE WHEN is_active THEN 'active' ELSE 'archived' END;

-- Create index for filtering by status
CREATE INDEX idx_products_status ON products(status);

-- Create index for filtering by type
CREATE INDEX idx_products_type ON products(type);

COMMIT;
