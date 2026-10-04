-- PureDrop Migration 004: cart_items table, RLS, Realtime publication, and add_to_cart function
-- Run this in the Supabase SQL Editor

-- 1. Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- 2. Enable Row Level Security
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for authenticated users
CREATE POLICY "Users can select own cart items"
  ON cart_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Enable replica identity full so delete events carry full old row data in Realtime
ALTER TABLE cart_items REPLICA IDENTITY FULL;

-- 5. Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

-- 6. Atomic add_to_cart function
CREATE OR REPLACE FUNCTION add_to_cart(p_product_id UUID, p_qty INT DEFAULT 1)
RETURNS cart_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_item cart_items;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO cart_items (user_id, product_id, quantity, updated_at)
  VALUES (v_user_id, p_product_id, LEAST(GREATEST(p_qty, 1), 99), now())
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET
    quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
    updated_at = now()
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

GRANT EXECUTE ON FUNCTION add_to_cart(UUID, INT) TO authenticated;
