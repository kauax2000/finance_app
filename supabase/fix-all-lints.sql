-- Supabase Lints Full Fix
-- Execute this in Supabase SQL Editor to fix all lint errors and warnings
-- Generated based on Supabase Database Lints analysis

-- ============================================================
-- STEP 1: Enable RLS on all tables that have policies but RLS disabled
-- ============================================================

-- Enable RLS on wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on transaction_splits
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: Recreate RLS policies (ensure they are correct)
-- ============================================================

-- Wallets policies
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON wallets;

CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Transaction Splits policies
DROP POLICY IF EXISTS "Users can view own splits" ON transaction_splits;
DROP POLICY IF EXISTS "Users can insert own splits" ON transaction_splits;
DROP POLICY IF EXISTS "Users can update own splits" ON transaction_splits;
DROP POLICY IF EXISTS "Users can delete own splits" ON transaction_splits;

CREATE POLICY "Users can view own splits" ON transaction_splits FOR SELECT 
    USING (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own splits" ON transaction_splits FOR INSERT WITH CHECK 
    (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own splits" ON transaction_splits FOR UPDATE USING 
    (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own splits" ON transaction_splits FOR DELETE USING 
    (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));

-- ============================================================
-- STEP 3: Fix handle_new_user function with secure search_path
-- ============================================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function with secure search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create default wallets
    INSERT INTO wallets (user_id, name, type, balance, color, icon)
    VALUES 
        (NEW.id, 'Carteira', 'cash', 0, '#10B981', 'wallet'),
        (NEW.id, 'Conta Corrente', 'checking', 0, '#3B82F6', 'building-bank'),
        (NEW.id, 'Poupança', 'savings', 0, '#F59E0B', 'piggy-bank')
    ON CONFLICT DO NOTHING;
    
    -- Create default expense categories
    INSERT INTO categories (user_id, name, type, color, icon)
    VALUES 
        (NEW.id, 'Alimentação', 'expense', '#EF4444', 'utensils'),
        (NEW.id, 'Transporte', 'expense', '#3B82F6', 'car'),
        (NEW.id, 'Moradia', 'expense', '#8B5CF6', 'home'),
        (NEW.id, 'Lazer', 'expense', '#F59E0B', 'gamepad-2'),
        (NEW.id, 'Saúde', 'expense', '#10B981', 'heart'),
        (NEW.id, 'Educação', 'expense', '#6366F1', 'graduation-cap'),
        (NEW.id, 'Outros', 'expense', '#6B7280', 'more-horizontal')
    ON CONFLICT DO NOTHING;
    
    -- Create default income categories
    INSERT INTO categories (user_id, name, type, color, icon)
    VALUES 
        (NEW.id, 'Salário', 'income', '#10B981', 'briefcase'),
        (NEW.id, 'Freelance', 'income', '#3B82F6', 'laptop'),
        (NEW.id, 'Investimentos', 'income', '#F59E0B', 'trending-up'),
        (NEW.id, 'Presentes', 'income', '#EC4899', 'gift'),
        (NEW.id, 'Outros', 'income', '#6B7280', 'more-horizontal')
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STEP 4: Handle debt_installments table (INFO level)
-- ============================================================

-- Check if debt_installments table exists and handle it
-- Option A: If table exists, enable RLS and create policies
-- Option B: If table is not needed, disable RLS

-- Uncomment below if debt_installments table exists and you want to secure it:
-- ALTER TABLE debt_installments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own debt_installments" ON debt_installments FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own debt_installments" ON debt_installments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own debt_installments" ON debt_installments FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own debt_installments" ON debt_installments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check RLS status on all tables
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' ORDER BY tablename;

-- Check policies on all tables  
-- SELECT policyname, tablename, cmd FROM pg_policies 
-- WHERE schemaname = 'public' ORDER BY tablename;