-- Run this in Supabase SQL Editor if you already have the old schema (no barcode column).
-- Adds barcode column and index for product lookup.

ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
