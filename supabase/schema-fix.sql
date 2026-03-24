-- Check what tables exist and add missing columns
-- Run this in Supabase SQL Editor

-- First, let's add missing columns to transactions if they don't exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('income', 'expense'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(15, 2) NOT NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_interval TEXT CHECK (recurring_interval IN ('daily', 'weekly', 'monthly'));

-- Add missing columns to wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS name TEXT NOT NULL;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'digital', 'cash', 'other'));
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add missing columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name TEXT NOT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type TEXT NOT NULL CHECK (type IN ('income', 'expense'));
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Enable RLS on wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own wallets" ON wallets;
CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own wallets" ON wallets;
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own wallets" ON wallets;
CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
