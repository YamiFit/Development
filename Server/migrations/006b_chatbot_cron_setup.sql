-- ============================================
-- YAMIFIT CHATBOT - SCHEDULED CLEANUP SETUP
-- ============================================
-- 
-- IMPORTANT: pg_cron requires a PAID Supabase plan (Pro or higher)
-- 
-- OPTION 1: If you have pg_cron available:
--   1. Go to Supabase Dashboard > Database > Extensions
--   2. Search for "pg_cron" and click Enable
--   3. Then run this file
--
-- OPTION 2: If pg_cron is NOT available (Free plan):
--   - The lazy cleanup trigger already handles cleanup on every insert
--   - You can also set up an external cron job to call your server's
--     POST /api/chat/cleanup endpoint hourly
--
-- ============================================

-- Step 1: Enable pg_cron extension (requires paid plan)
-- Uncomment after enabling pg_cron in Dashboard:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Schedule hourly cleanup job
-- Uncomment after pg_cron is enabled:
-- SELECT cron.schedule(
--     'cleanup-expired-chatbot-messages',
--     '0 * * * *',
--     $$DELETE FROM public.chatbot_messages WHERE expires_at <= NOW()$$
-- );

-- ============================================
-- ALTERNATIVE: More frequent cleanup (every 15 minutes)
-- Uncomment below if you want more aggressive cleanup
-- ============================================
-- SELECT cron.schedule(
--     'cleanup-expired-chatbot-messages-frequent',
--     '*/15 * * * *',  -- Every 15 minutes
--     $$DELETE FROM public.chatbot_messages WHERE expires_at <= NOW()$$
-- );

-- ============================================
-- MONITORING COMMANDS
-- ============================================

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- View job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Unschedule a job (if needed)
-- SELECT cron.unschedule('cleanup-expired-chatbot-messages');

-- ============================================
-- MANUAL TESTING
-- ============================================

-- Test the cleanup function manually
-- SELECT public.cleanup_expired_chatbot_messages();

-- Check how many messages would be deleted
-- SELECT COUNT(*) FROM public.chatbot_messages WHERE expires_at <= NOW();

-- View all chatbot messages with expiry status
-- SELECT id, user_id, role, LEFT(content, 50) as content_preview, 
--        created_at, expires_at, 
--        CASE WHEN expires_at > NOW() THEN 'active' ELSE 'expired' END as status
-- FROM public.chatbot_messages
-- ORDER BY created_at DESC;
