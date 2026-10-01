-- PureDrop: Initial schema migration
-- Run this in the Supabase SQL editor

-- ============================================================
-- 1. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_ngn INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  USING (active = true);

-- No client-side writes on products
-- (Only service role or dashboard can insert/update/delete)

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  items JSONB NOT NULL,
  total_ngn INTEGER NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  delivery_weekday INTEGER NOT NULL CHECK (delivery_weekday BETWEEN 0 AND 6),
  next_delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (cancel) their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserts happen on the server with service role key
-- Allow service role to insert (no RLS restriction for service role)

-- ============================================================
-- 3. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  items JSONB NOT NULL,
  total_ngn INTEGER NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('one_time', 'subscription')),
  subscription_id UUID REFERENCES subscriptions(id),
  delivery_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'demo',
  status TEXT NOT NULL DEFAULT 'pending',
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts happen on the server with service role key

-- ============================================================
-- 4. SEED PRODUCTS
-- ============================================================
INSERT INTO products (name, description, price_ngn, sort_order) VALUES
  ('Pure Water, 5-bag batch', '5 bags, about 20 sachets per bag', 2400, 1),
  ('Pure Water, 10-bag batch', '10 bags, about 20 sachets per bag', 4600, 2),
  ('Pure Water, 20-bag batch', '20 bags, about 20 sachets per bag', 9000, 3),
  ('Table Water, 1 pack', 'One pack of bottled table water', 1500, 4),
  ('Dispenser Refill, 1 bottle', 'One refill bottle for water dispensers', 1600, 5);
