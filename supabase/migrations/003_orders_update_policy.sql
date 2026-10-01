-- PureDrop Migration 003: Allow users to update their own orders (for email_status and email_error)
-- Run this in the Supabase SQL Editor

CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
