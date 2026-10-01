-- PureDrop Migration 002: Add INSERT policies for orders and subscriptions
-- Run this in the Supabase SQL Editor

-- Allow authenticated users to insert their own orders
CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
