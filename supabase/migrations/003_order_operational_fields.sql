-- Add restaurant/cafe operational fields to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'takeout' CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
ADD COLUMN IF NOT EXISTS table_label TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'ewallet')),
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('none', 'percent', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill safe defaults for older rows
UPDATE orders
SET
  order_type = COALESCE(order_type, 'takeout'),
  payment_method = COALESCE(payment_method, 'cash'),
  discount_value = COALESCE(discount_value, 0),
  discount_amount = COALESCE(discount_amount, 0)
WHERE
  order_type IS NULL
  OR payment_method IS NULL
  OR discount_value IS NULL
  OR discount_amount IS NULL;
