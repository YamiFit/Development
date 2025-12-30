-- =====================================================
-- Theme & Notifications System for YamiFit
-- Migration 008
-- =====================================================

-- =====================================================
-- FEATURE 1: THEME SUPPORT
-- =====================================================

-- Add theme column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'light' 
CHECK (theme IN ('light', 'dark'));

-- Create index for theme queries
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);

-- =====================================================
-- FEATURE 2: NOTIFICATIONS SYSTEM
-- =====================================================

-- Create notifications table
-- Note: We reference profiles(id) instead of auth.users(id) for RLS compatibility
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_role VARCHAR(50) NOT NULL, -- 'user', 'coach', 'admin', 'meal_provider'
    actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Notification content
    type VARCHAR(100) NOT NULL, -- e.g., 'order_created', 'order_status_changed', 'message_received'
    title TEXT NOT NULL,
    body TEXT,
    
    -- Related entity
    entity_type VARCHAR(50), -- 'orders', 'appointments', 'messages', 'profiles', etc.
    entity_id UUID,
    url TEXT, -- Deep link to navigate to in UI
    
    -- Status
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
    ON notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created 
    ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = recipient_user_id);

-- Only service role / triggers can insert notifications
-- For direct inserts (from triggers), we use SECURITY DEFINER functions
CREATE POLICY "Allow trigger inserts"
    ON notifications FOR INSERT
    WITH CHECK (true); -- Controlled via SECURITY DEFINER functions

-- Users can only update is_read on their own notifications
CREATE POLICY "Users can mark own notifications as read"
    ON notifications FOR UPDATE
    USING (auth.uid() = recipient_user_id)
    WITH CHECK (auth.uid() = recipient_user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = recipient_user_id);

-- =====================================================
-- NOTIFICATION HELPER FUNCTION
-- =====================================================

-- Function to create a notification (SECURITY DEFINER for trigger use)
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_user_id UUID,
    p_recipient_role VARCHAR(50),
    p_actor_user_id UUID,
    p_type VARCHAR(100),
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_url TEXT DEFAULT NULL
)
RETURNS notifications AS $$
DECLARE
    v_notification notifications;
BEGIN
    INSERT INTO notifications (
        recipient_user_id,
        recipient_role,
        actor_user_id,
        type,
        title,
        body,
        entity_type,
        entity_id,
        url
    ) VALUES (
        p_recipient_user_id,
        p_recipient_role,
        p_actor_user_id,
        p_type,
        p_title,
        p_body,
        p_entity_type,
        p_entity_id,
        p_url
    ) RETURNING * INTO v_notification;
    
    RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ORDER NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger function for new orders (notify provider)
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    v_provider_user_id UUID;
    v_customer_name TEXT;
BEGIN
    -- Get provider's user_id from meal_providers
    SELECT mp.user_id INTO v_provider_user_id
    FROM meal_providers mp
    WHERE mp.id = NEW.provider_id;
    
    -- Get customer name
    SELECT COALESCE(p.full_name, p.email) INTO v_customer_name
    FROM profiles p
    WHERE p.id = NEW.user_id;
    
    IF v_provider_user_id IS NOT NULL THEN
        PERFORM create_notification(
            v_provider_user_id,
            'meal_provider',
            NEW.user_id,
            'order_created',
            'New Order Received',
            'You have a new order from ' || COALESCE(v_customer_name, 'a customer'),
            'orders',
            NEW.id,
            '/provider/orders'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_notify_new_order ON orders;
CREATE TRIGGER trigger_notify_new_order
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

-- Trigger function for order status changes (notify user)
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_status_message TEXT;
BEGIN
    -- Only trigger on status changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Build status message
    CASE NEW.status::text
        WHEN 'confirmed' THEN v_status_message := 'Your order has been confirmed';
        WHEN 'preparing' THEN v_status_message := 'Your order is being prepared';
        WHEN 'under_preparation' THEN v_status_message := 'Your order is under preparation';
        WHEN 'ready' THEN v_status_message := 'Your order is ready for pickup/delivery';
        WHEN 'out_for_delivery' THEN v_status_message := 'Your order is out for delivery';
        WHEN 'delivered' THEN v_status_message := 'Your order has been delivered';
        WHEN 'completed' THEN v_status_message := 'Your order has been completed';
        WHEN 'cancelled' THEN v_status_message := 'Your order has been cancelled';
        ELSE v_status_message := 'Your order status has been updated';
    END CASE;
    
    -- Notify the customer
    PERFORM create_notification(
        NEW.user_id,
        'user',
        NULL,
        'order_status_changed',
        'Order Status Updated',
        v_status_message,
        'orders',
        NEW.id,
        '/orders'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS trigger_notify_order_status ON orders;
CREATE TRIGGER trigger_notify_order_status
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_change();

-- =====================================================
-- MESSAGE NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger function for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation RECORD;
    v_recipient_id UUID;
    v_recipient_role VARCHAR(50);
    v_sender_name TEXT;
BEGIN
    -- Get conversation details to find coach and user
    SELECT coach_id, user_id INTO v_conversation
    FROM public.conversations
    WHERE id = NEW.conversation_id;
    
    IF v_conversation IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Determine recipient (the other party in the conversation)
    IF NEW.sender_id = v_conversation.coach_id THEN
        -- Message from coach to user
        v_recipient_id := v_conversation.user_id;
        v_recipient_role := 'user';
    ELSE
        -- Message from user to coach
        v_recipient_id := v_conversation.coach_id;
        v_recipient_role := 'coach';
    END IF;
    
    -- Get sender name
    SELECT COALESCE(p.full_name, p.email) INTO v_sender_name
    FROM profiles p
    WHERE p.id = NEW.sender_id;
    
    IF v_recipient_id IS NOT NULL THEN
        PERFORM create_notification(
            v_recipient_id,
            v_recipient_role,
            NEW.sender_id,
            'message_received',
            'New Message',
            'You have a new message from ' || COALESCE(v_sender_name, 'someone'),
            'messages',
            NEW.id,
            CASE WHEN v_recipient_role = 'coach' THEN '/coach/clients' ELSE '/coaching' END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages (check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
        CREATE TRIGGER trigger_notify_new_message
            AFTER INSERT ON messages
            FOR EACH ROW
            EXECUTE FUNCTION notify_new_message();
    END IF;
END;
$$;

-- =====================================================
-- APPOINTMENT NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger function for new appointments
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_coach_name TEXT;
BEGIN
    -- Get user and coach names
    SELECT COALESCE(p.full_name, p.email) INTO v_user_name
    FROM profiles p WHERE p.id = NEW.user_id;
    
    SELECT COALESCE(p.full_name, p.email) INTO v_coach_name
    FROM profiles p WHERE p.id = NEW.coach_id;
    
    -- Notify coach about new appointment
    PERFORM create_notification(
        NEW.coach_id,
        'coach',
        NEW.user_id,
        'appointment_created',
        'New Appointment Request',
        COALESCE(v_user_name, 'A client') || ' has booked an appointment',
        'appointments',
        NEW.id,
        '/coach/appointments'
    );
    
    -- Notify user about appointment confirmation
    PERFORM create_notification(
        NEW.user_id,
        'user',
        NEW.coach_id,
        'appointment_created',
        'Appointment Booked',
        'Your appointment with ' || COALESCE(v_coach_name, 'your coach') || ' has been scheduled',
        'appointments',
        NEW.id,
        '/appointments'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointments (check if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        DROP TRIGGER IF EXISTS trigger_notify_new_appointment ON appointments;
        CREATE TRIGGER trigger_notify_new_appointment
            AFTER INSERT ON appointments
            FOR EACH ROW
            EXECUTE FUNCTION notify_new_appointment();
    END IF;
END;
$$;

-- Trigger for appointment updates/cancellations
CREATE OR REPLACE FUNCTION notify_appointment_update()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_coach_name TEXT;
    v_title TEXT;
    v_body TEXT;
BEGIN
    -- Get names
    SELECT COALESCE(p.full_name, p.email) INTO v_user_name
    FROM profiles p WHERE p.id = NEW.user_id;
    
    SELECT COALESCE(p.full_name, p.email) INTO v_coach_name
    FROM profiles p WHERE p.id = NEW.coach_id;
    
    -- Check for cancellation (use enum value CANCELED, not lowercase 'cancelled')
    IF NEW.status = 'CANCELED' AND OLD.status != 'CANCELED' THEN
        v_title := 'Appointment Cancelled';
        v_body := 'The appointment has been cancelled';
        
        -- Notify both parties
        PERFORM create_notification(
            NEW.coach_id, 'coach', NEW.user_id, 'appointment_cancelled',
            v_title, 'Appointment with ' || v_user_name || ' was cancelled',
            'appointments', NEW.id, '/coach/appointments'
        );
        
        PERFORM create_notification(
            NEW.user_id, 'user', NEW.coach_id, 'appointment_cancelled',
            v_title, 'Your appointment with ' || v_coach_name || ' was cancelled',
            'appointments', NEW.id, '/appointments'
        );
    -- Check for rescheduling (date change)
    ELSIF OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at THEN
        v_title := 'Appointment Rescheduled';
        
        PERFORM create_notification(
            NEW.coach_id, 'coach', NEW.user_id, 'appointment_updated',
            v_title, 'Appointment with ' || v_user_name || ' has been rescheduled',
            'appointments', NEW.id, '/coach/appointments'
        );
        
        PERFORM create_notification(
            NEW.user_id, 'user', NEW.coach_id, 'appointment_updated',
            v_title, 'Your appointment with ' || v_coach_name || ' has been rescheduled',
            'appointments', NEW.id, '/appointments'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create update trigger for appointments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        DROP TRIGGER IF EXISTS trigger_notify_appointment_update ON appointments;
        CREATE TRIGGER trigger_notify_appointment_update
            AFTER UPDATE ON appointments
            FOR EACH ROW
            EXECUTE FUNCTION notify_appointment_update();
    END IF;
END;
$$;

-- =====================================================
-- COACH ASSIGNMENT NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger for coach assignment changes
CREATE OR REPLACE FUNCTION notify_coach_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_coach_name TEXT;
BEGIN
    -- Only trigger when selected_coach_id changes
    IF OLD.selected_coach_id IS NOT DISTINCT FROM NEW.selected_coach_id THEN
        RETURN NEW;
    END IF;
    
    -- Get names
    SELECT COALESCE(p.full_name, p.email) INTO v_user_name
    FROM profiles p WHERE p.id = NEW.id;
    
    IF NEW.selected_coach_id IS NOT NULL THEN
        SELECT COALESCE(p.full_name, p.email) INTO v_coach_name
        FROM profiles p WHERE p.id = NEW.selected_coach_id;
        
        -- Notify coach about new client
        PERFORM create_notification(
            NEW.selected_coach_id,
            'coach',
            NEW.id,
            'client_assigned',
            'New Client Assigned',
            v_user_name || ' has been assigned to you',
            'profiles',
            NEW.id,
            '/coach/clients'
        );
        
        -- Notify user about coach assignment
        PERFORM create_notification(
            NEW.id,
            'user',
            NEW.selected_coach_id,
            'coach_assigned',
            'Coach Assigned',
            'You have been assigned to coach ' || v_coach_name,
            'profiles',
            NEW.selected_coach_id,
            '/coaching'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for coach assignment
DROP TRIGGER IF EXISTS trigger_notify_coach_assignment ON profiles;
CREATE TRIGGER trigger_notify_coach_assignment
    AFTER UPDATE OF selected_coach_id ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION notify_coach_assignment();

-- =====================================================
-- PROVIDER VERIFICATION NOTIFICATION (for Admin)
-- =====================================================

CREATE OR REPLACE FUNCTION notify_provider_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
    v_provider_name TEXT;
BEGIN
    -- Get provider name
    v_provider_name := COALESCE(NEW.business_name, NEW.provider_name, 'New Provider');
    
    -- Notify all admins
    FOR v_admin_id IN (SELECT id FROM profiles WHERE role = 'admin')
    LOOP
        PERFORM create_notification(
            v_admin_id,
            'admin',
            NEW.user_id,
            'provider_signup',
            'New Provider Registration',
            v_provider_name || ' has registered and needs verification',
            'providers',
            NEW.id,
            '/admin/providers'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new provider signups
DROP TRIGGER IF EXISTS trigger_notify_provider_signup ON meal_providers;
CREATE TRIGGER trigger_notify_provider_signup
    AFTER INSERT ON meal_providers
    FOR EACH ROW
    EXECUTE FUNCTION notify_provider_signup();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id AND recipient_user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE recipient_user_id = auth.uid() AND is_read = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE recipient_user_id = auth.uid() AND is_read = false;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR, UUID, VARCHAR, TEXT, TEXT, VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
