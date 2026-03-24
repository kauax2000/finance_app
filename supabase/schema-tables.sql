-- Run this SQL to add missing tables (profiles already exists)
-- Execute in Supabase SQL Editor

-- WALLETS TABLE (only create if not exists)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'digital', 'cash', 'other')),
    balance DECIMAL(15, 2) DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CATEGORIES TABLE (only create if not exists)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRANSACTIONS TABLE (only create if not exists)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_interval TEXT CHECK (recurring_interval IN ('daily', 'weekly', 'monthly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRANSACTION SPLITS TABLE (only create if not exists)
CREATE TABLE IF NOT EXISTS transaction_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction_id ON transaction_splits(transaction_id);

-- ROW LEVEL SECURITY POLICIES

-- Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallets" ON wallets;
CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own wallets" ON wallets;
CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own wallets" ON wallets;
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own wallets" ON wallets;
CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Transaction Splits
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own splits" ON transaction_splits;
CREATE POLICY "Users can view own splits" ON transaction_splits FOR SELECT 
    USING (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own splits" ON transaction_splits;
CREATE POLICY "Users can insert own splits" ON transaction_splits FOR INSERT WITH CHECK 
    (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own splits" ON transaction_splits;
CREATE POLICY "Users can update own splits" ON transaction_splits FOR UPDATE USING 
    (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own splits" ON transaction_splits;
CREATE POLICY "Users can delete own splits" ON transaction_splits FOR DELETE USING 
    (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));

-- FUNCTION TO CREATE DEFAULT DATA FOR NEW USERS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile (ignore if already exists)
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

-- TRIGGER FOR NEW USER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
