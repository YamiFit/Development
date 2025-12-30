-- ============================================
-- YAMIFIT CHATBOT MESSAGES - 24 HOUR PERSISTENCE
-- Migration: 006_chatbot_messages.sql
-- ============================================

-- Create the chatbot_messages table
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL CHECK (length(content) <= 8000),
    attachments JSONB DEFAULT '[]'::jsonb, -- [{url, mimeType, name}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Add comment to table
COMMENT ON TABLE public.chatbot_messages IS 'YamiFit Chatbot messages with 24-hour auto-expiration';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_created 
    ON public.chatbot_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_expires 
    ON public.chatbot_messages(expires_at);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_expires 
    ON public.chatbot_messages(user_id, expires_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on the table
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own non-expired messages
CREATE POLICY "Users can view own chatbot messages"
    ON public.chatbot_messages
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        AND expires_at > NOW()
    );

-- Policy: Users can only INSERT messages for themselves
CREATE POLICY "Users can insert own chatbot messages"
    ON public.chatbot_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can DELETE their own messages (for cleanup)
CREATE POLICY "Users can delete own chatbot messages"
    ON public.chatbot_messages
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- SCHEDULED CLEANUP FUNCTION
-- ============================================

-- Function to delete expired messages
CREATE OR REPLACE FUNCTION public.cleanup_expired_chatbot_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.chatbot_messages
    WHERE expires_at <= NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup (optional - for monitoring)
    RAISE NOTICE 'Cleaned up % expired chatbot messages', deleted_count;
    
    RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_chatbot_messages() TO service_role;

-- ============================================
-- SCHEDULED JOB (pg_cron)
-- Requires pg_cron extension enabled in Supabase
-- ============================================

-- Enable pg_cron extension if available
-- Note: This needs to be run by a superuser or enabled via Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup every hour
-- Run this in SQL Editor after enabling pg_cron:
/*
SELECT cron.schedule(
    'cleanup-expired-chatbot-messages',
    '0 * * * *',  -- Every hour at minute 0
    $$DELETE FROM public.chatbot_messages WHERE expires_at <= NOW()$$
);
*/

-- ============================================
-- ALTERNATIVE: Trigger-based cleanup on insert
-- This ensures cleanup happens with every new message
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete expired messages for the current user on every insert
    -- This is a "lazy cleanup" approach
    DELETE FROM public.chatbot_messages
    WHERE user_id = NEW.user_id
      AND expires_at <= NOW();
    
    RETURN NEW;
END;
$$;

-- Create trigger for lazy cleanup on insert
DROP TRIGGER IF EXISTS trigger_chatbot_cleanup ON public.chatbot_messages;
CREATE TRIGGER trigger_chatbot_cleanup
    AFTER INSERT ON public.chatbot_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_cleanup_expired_messages();

-- ============================================
-- HELPER FUNCTION: Get user's chat history
-- ============================================

CREATE OR REPLACE FUNCTION public.get_chatbot_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 40
)
RETURNS TABLE (
    id UUID,
    role VARCHAR(20),
    content TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, cleanup expired messages for this user
    DELETE FROM public.chatbot_messages
    WHERE user_id = p_user_id
      AND expires_at <= NOW();
    
    -- Return non-expired messages
    RETURN QUERY
    SELECT 
        cm.id,
        cm.role,
        cm.content,
        cm.attachments,
        cm.created_at
    FROM public.chatbot_messages cm
    WHERE cm.user_id = p_user_id
      AND cm.expires_at > NOW()
    ORDER BY cm.created_at ASC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_chatbot_history(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chatbot_history(UUID, INTEGER) TO service_role;
