-- Extend profiles roles for operations
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'manager', 'cashier', 'pos'));

-- Ensure legacy "pos" users become "cashier"
UPDATE public.profiles
SET role = 'cashier'
WHERE role = 'pos';

-- Extend order status for refund workflow
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('open', 'completed', 'voided', 'refunded'));

-- Reason tracking on orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS void_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Order item operational notes
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS modifiers_text TEXT,
ADD COLUMN IF NOT EXISTS kitchen_note TEXT;

-- Inventory audit trail table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('sale', 'refund', 'void', 'manual_adjustment', 'stock_in', 'stock_out')),
  quantity_before DECIMAL(10,2) NOT NULL,
  quantity_change DECIMAL(10,2) NOT NULL,
  quantity_after DECIMAL(10,2) NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all inventory_adjustments"
  ON inventory_adjustments FOR ALL
  USING (true)
  WITH CHECK (true);
