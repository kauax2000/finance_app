-- Migration: Create user_activity_logs table for activity tracking
-- Run this in Supabase SQL Editor

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'family_member_invited',
        'family_member_joined',
        'family_member_removed',
        'family_permission_changed',
        'family_role_changed',
        'password_change',
        'profile_update',
        'security_settings',
        'device_added',
        'device_removed'
    )),
    description TEXT NOT NULL,
    ip_address INET,
    device TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    dedupe_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON user_activity_logs(type);

-- Row Level Security
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own activity logs
DROP POLICY IF EXISTS "Users can view own activities" ON user_activity_logs;
CREATE POLICY "Users can view own activities" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own activity logs
DROP POLICY IF EXISTS "Users can insert own activities" ON user_activity_logs;
CREATE POLICY "Users can insert own activities" ON user_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own activity logs
DROP POLICY IF EXISTS "Users can delete own activities" ON user_activity_logs;
CREATE POLICY "Users can delete own activities" ON user_activity_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Function to clean up old activity logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM user_activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Migration: new activity types + dedupe_key (existing databases)
ALTER TABLE user_activity_logs ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE INDEX IF NOT EXISTS idx_activity_dedupe ON user_activity_logs(user_id, type, dedupe_key);

ALTER TABLE user_activity_logs DROP CONSTRAINT IF EXISTS user_activity_logs_type_check;

-- Remove legacy types no longer tracked (required before new CHECK constraint)
DELETE FROM user_activity_logs WHERE type IN ('login', 'logout', 'delete_account');

ALTER TABLE user_activity_logs ADD CONSTRAINT user_activity_logs_type_check CHECK (type IN (
    'family_member_invited',
    'family_member_joined',
    'family_member_removed',
    'family_permission_changed',
    'family_role_changed',
    'password_change',
    'profile_update',
    'security_settings',
    'device_added',
    'device_removed'
));
