-- Fix trigger function - simplify it to avoid errors
-- Run this in Supabase SQL Editor

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate simpler trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default wallets only
    INSERT INTO wallets (user_id, name, type, balance, color, icon)
    VALUES 
        (NEW.id, 'Carteira', 'cash', 0, '#10B981', 'wallet'),
        (NEW.id, 'Conta Corrente', 'checking', 0, '#3B82F6', 'building-bank'),
        (NEW.id, 'Poupança', 'savings', 0, '#F59E0B', 'piggy-bank')
    ON CONFLICT DO NOTHING;
    
    -- Create default categories
    INSERT INTO categories (user_id, name, type, color, icon)
    VALUES 
        (NEW.id, 'Alimentação', 'expense', '#EF4444', 'utensils'),
        (NEW.id, 'Transporte', 'expense', '#3B82F6', 'car'),
        (NEW.id, 'Moradia', 'expense', '#8B5CF6', 'home'),
        (NEW.id, 'Lazer', 'expense', '#F59E0B', 'gamepad-2'),
        (NEW.id, 'Saúde', 'expense', '#10B981', 'heart'),
        (NEW.id, 'Educação', 'expense', '#6366F1', 'graduation-cap'),
        (NEW.id, 'Outros', 'expense', '#6B7280', 'more-horizontal'),
        (NEW.id, 'Salário', 'income', '#10B981', 'briefcase'),
        (NEW.id, 'Freelance', 'income', '#3B82F6', 'laptop'),
        (NEW.id, 'Investimentos', 'income', '#F59E0B', 'trending-up'),
        (NEW.id, 'Presentes', 'income', '#EC4899', 'gift'),
        (NEW.id, 'Outros', 'income', '#6B7280', 'more-horizontal')
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
