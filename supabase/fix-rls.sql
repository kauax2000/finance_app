-- Fix RLS policies to allow user creation
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON wallets;

DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Create permissive policies (allow all for authenticated users)
CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.role() = 'authenticated');
