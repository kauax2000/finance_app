-- Temporarily disable RLS to test
-- Run this in Supabase SQL Editor

-- Disable RLS
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_splits DISABLE ROW LEVEL SECURITY;
