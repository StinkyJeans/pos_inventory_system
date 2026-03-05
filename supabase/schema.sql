-- POS + Inventory with barcode support (restaurants/cafes)
-- Run in Supabase SQL Editor. For existing projects, also run: supabase/migrations/001_add_barcode.sql

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products (barcode required for scan-at-POS and inventory lookup)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  sku TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Inventory (stock per product)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'unit',
  low_stock_threshold DECIMAL(10,2) DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)
);

-- Orders (sales)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('open', 'completed', 'voided')),
  order_type TEXT NOT NULL DEFAULT 'takeout' CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
  table_label TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'ewallet')),
  discount_type TEXT CHECK (discount_type IN ('none', 'percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Seed categories (only when empty)
INSERT INTO categories (name, sort_order)
SELECT * FROM (VALUES ('Coffee & Drinks', 1), ('Food', 2), ('Pastries', 3)) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Seed sample products with barcodes (optional)
INSERT INTO products (category_id, barcode, name, price, cost)
SELECT c.id, '5901234123457', 'Espresso', 3.50, 0.80 FROM categories c WHERE c.name = 'Coffee & Drinks' LIMIT 1
ON CONFLICT (barcode) DO NOTHING;
INSERT INTO products (category_id, barcode, name, price, cost)
SELECT c.id, '5901234123458', 'Latte', 4.50, 1.00 FROM categories c WHERE c.name = 'Coffee & Drinks' LIMIT 1
ON CONFLICT (barcode) DO NOTHING;
INSERT INTO products (category_id, barcode, name, price, cost)
SELECT c.id, '5901234123459', 'Croissant', 3.00, 0.90 FROM categories c WHERE c.name = 'Pastries' LIMIT 1
ON CONFLICT (barcode) DO NOTHING;
INSERT INTO products (category_id, barcode, name, price, cost)
SELECT c.id, '5901234123460', 'Sandwich', 8.00, 2.50 FROM categories c WHERE c.name = 'Food' LIMIT 1
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO inventory (product_id, quantity, low_stock_threshold)
SELECT id, 50, 50 FROM products ON CONFLICT (product_id) DO NOTHING;
