-- Migration: Create user_sessions table for session management
-- Run this in Supabase SQL Editor

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    device_name TEXT,
    browser TEXT,
    os TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    token_hash TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only delete their own sessions
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;
CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Users can only update their own sessions
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only insert their own sessions
DROP POLICY IF EXISTS "Users can insert own sessions" ON user_sessions;
CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to clean up expired sessions (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions
    WHERE last_active_at < NOW() - INTERVAL '30 days'
    AND is_active = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get device info from user agent
CREATE OR REPLACE FUNCTION get_device_info_from_user_agent(user_agent_text TEXT)
RETURNS JSONB AS $$
DECLARE
    device_type TEXT;
    device_name TEXT;
    browser TEXT;
    os TEXT;
BEGIN
    -- Detect device type
    IF user_agent_text ILIKE '%mobile%' OR user_agent_text ILIKE '%android%' OR user_agent_text ILIKE '%iphone%' OR user_agent_text ILIKE '%ipad%' THEN
        device_type := 'mobile';
        IF user_agent_text ILIKE '%ipad%' THEN
            device_type := 'tablet';
        END IF;
    ELSE
        device_type := 'desktop';
    END IF;

    -- Detect browser
    IF user_agent_text ILIKE '%Chrome%' AND user_agent_text NOT ILIKE '%Edg%' THEN
        browser := 'Chrome';
    ELSIF user_agent_text ILIKE '%Firefox%' THEN
        browser := 'Firefox';
    ELSIF user_agent_text ILIKE '%Safari%' AND user_agent_text NOT ILIKE '%Chrome%' THEN
        browser := 'Safari';
    ELSIF user_agent_text ILIKE '%Edg%' THEN
        browser := 'Edge';
    ELSE
        browser := 'Outro';
    END IF;

    -- Detect OS
    IF user_agent_text ILIKE '%Macintosh%' OR user_agent_text ILIKE '%Mac OS%' THEN
        os := 'macOS';
    ELSIF user_agent_text ILIKE '%Windows%' THEN
        os := 'Windows';
    ELSIF user_agent_text ILIKE '%Linux%' THEN
        os := 'Linux';
    ELSIF user_agent_text ILIKE '%Android%' THEN
        os := 'Android';
    ELSIF user_agent_text ILIKE '%iPhone%' OR user_agent_text ILIKE '%iPad%' THEN
        os := 'iOS';
    ELSE
        os := 'Outro';
    END IF;

    -- Device name based on OS
    IF os = 'macOS' THEN
        device_name := 'Mac';
    ELSIF os = 'Windows' THEN
        device_name := 'Windows PC';
    ELSIF os = 'Linux' THEN
        device_name := 'Linux PC';
    ELSIF os = 'Android' THEN
        device_name := 'Android';
    ELSIF os = 'iOS' THEN
        IF user_agent_text ILIKE '%iPad%' THEN
            device_name := 'iPad';
        ELSE
            device_name := 'iPhone';
        END IF;
    ELSE
        device_name := 'Computador';
    END IF;

    RETURN jsonb_build_object(
        'device_type', device_type,
        'device_name', device_name,
        'browser', browser,
        'os', os
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Migration: device_id + fingerprint for deduplicated sessions (run on existing DBs)
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON user_sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON user_sessions(user_id, device_fingerprint);
