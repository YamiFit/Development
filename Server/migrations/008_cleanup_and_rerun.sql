-- =====================================================
-- CLEANUP: Run this first if the original migration partially failed
-- =====================================================

-- Drop any partial objects from failed migration
DROP TABLE IF EXISTS notifications CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS notify_new_order CASCADE;
DROP FUNCTION IF EXISTS notify_order_status_change CASCADE;
DROP FUNCTION IF EXISTS notify_new_message CASCADE;
DROP FUNCTION IF EXISTS notify_new_appointment CASCADE;
DROP FUNCTION IF EXISTS notify_appointment_update CASCADE;
DROP FUNCTION IF EXISTS notify_coach_assignment CASCADE;
DROP FUNCTION IF EXISTS notify_provider_signup CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_read CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;

-- =====================================================
-- Now run the corrected migration (008_theme_and_notifications.sql)
-- =====================================================
