-- ============================================
-- Migration 011: Final fix for appointment status update
-- ============================================
-- This migration FULLY resolves the PostgREST 22P02 error:
-- "invalid input value for enum appointment_status"
--
-- Root cause: 
-- 1. Old function overloads with enum parameter type still exist
-- 2. PostgREST picks the wrong function signature (enum vs TEXT)
-- 3. Input value may have extra quotes from JSON serialization
--
-- Solution:
-- 1. Drop ALL overloads of appointment status functions
-- 2. Create single clean function accepting TEXT
-- 3. Sanitize input (strip quotes, normalize case/spelling)
-- 4. Force PostgREST schema cache reload
-- ============================================

-- Step 1: Drop ALL possible function overloads
DROP FUNCTION IF EXISTS public.change_appointment_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.change_appointment_status(UUID, appointment_status);
DROP FUNCTION IF EXISTS public.update_appointment_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_appointment_status(UUID, appointment_status);

-- Step 2: Create the definitive function
CREATE OR REPLACE FUNCTION public.change_appointment_status(
  p_appointment_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_appointment RECORD;
  v_status appointment_status;
  v_clean_status TEXT;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Clean the input: remove any surrounding quotes, trim whitespace, uppercase
  -- This handles cases where JSON serialization adds extra quotes
  v_clean_status := UPPER(TRIM(BOTH '"' FROM TRIM(COALESCE(p_status, ''))));
  
  -- Also handle escaped quotes that might come through
  v_clean_status := REPLACE(v_clean_status, '\"', '');
  v_clean_status := REPLACE(v_clean_status, '''', '');
  
  -- Normalize status input (handle both spellings and case insensitivity)
  v_status := CASE v_clean_status
    WHEN 'REQUESTED' THEN 'REQUESTED'::appointment_status
    WHEN 'CONFIRMED' THEN 'CONFIRMED'::appointment_status
    WHEN 'CANCELED' THEN 'CANCELED'::appointment_status
    WHEN 'CANCELLED' THEN 'CANCELED'::appointment_status  -- British spelling
    WHEN 'COMPLETED' THEN 'COMPLETED'::appointment_status
    ELSE NULL
  END;
  
  -- Validate status
  IF v_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Invalid status: "%s" (cleaned: "%s"). Must be REQUESTED, CONFIRMED, CANCELED/CANCELLED, or COMPLETED', 
                      COALESCE(p_status, 'NULL'), v_clean_status),
      'received_status', p_status,
      'cleaned_status', v_clean_status
    );
  END IF;
  
  -- Get appointment
  SELECT * INTO v_appointment FROM public.appointments WHERE id = p_appointment_id;
  
  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found', 'appointment_id', p_appointment_id);
  END IF;
  
  -- Check authorization: coach can do anything, user can only cancel their own
  IF v_appointment.coach_id != v_user_id AND NOT public.is_admin() THEN
    IF v_appointment.user_id = v_user_id AND v_status = 'CANCELED' THEN
      -- Allow user to cancel their own appointment
      NULL;
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'You are not authorized to update this appointment',
        'user_id', v_user_id,
        'coach_id', v_appointment.coach_id
      );
    END IF;
  END IF;
  
  -- Update status
  UPDATE public.appointments
  SET status = v_status, updated_at = NOW()
  WHERE id = p_appointment_id;
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'old_status', v_appointment.status::TEXT,
    'new_status', v_status::TEXT,
    'message', format('Appointment status changed to %s', v_status::TEXT)
  );
END;
$$;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION public.change_appointment_status(UUID, TEXT) TO authenticated;

-- Step 4: Add documentation
COMMENT ON FUNCTION public.change_appointment_status(UUID, TEXT) IS 
'Update appointment status with full input sanitization.
Accepts status as TEXT (case-insensitive, handles both CANCELED and CANCELLED spellings).
Strips any surrounding quotes from the input to handle JSON serialization issues.
Valid statuses: REQUESTED, CONFIRMED, CANCELED/CANCELLED, COMPLETED.
Coach can update any status, user can only cancel their own appointments.
Returns JSONB with success status and details.';

-- Step 5: Fix the notification trigger to use correct enum value
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
    -- Check for confirmation
    ELSIF NEW.status = 'CONFIRMED' AND OLD.status != 'CONFIRMED' THEN
        v_title := 'Appointment Confirmed';
        
        PERFORM create_notification(
            NEW.user_id, 'user', NEW.coach_id, 'appointment_confirmed',
            v_title, 'Your appointment with ' || v_coach_name || ' has been confirmed',
            'appointments', NEW.id, '/appointments'
        );
    -- Check for rescheduling (time change on existing appointments)
    ELSIF (OLD.start_time IS DISTINCT FROM NEW.start_time OR OLD.end_time IS DISTINCT FROM NEW.end_time) 
          AND OLD.status = NEW.status THEN
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

-- Step 6: Verify RLS policies exist and are correct
-- These should already exist, but ensure they're correct
DROP POLICY IF EXISTS "appointments_update_coach" ON public.appointments;
CREATE POLICY "appointments_update_coach"
ON public.appointments FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "appointments_update_user" ON public.appointments;
CREATE POLICY "appointments_update_user"
ON public.appointments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 7: Force PostgREST to reload schema cache
-- This is CRITICAL - without it, PostgREST may continue using cached signatures
NOTIFY pgrst, 'reload schema';

-- Step 8: Optional - If using Supabase, you may also need to restart PostgREST
-- This can be done from the Supabase dashboard or by redeploying

-- ============================================
-- VERIFICATION QUERIES (run manually to test)
-- ============================================
-- Test the function:
-- SELECT public.change_appointment_status('your-appointment-uuid', 'CONFIRMED');
-- SELECT public.change_appointment_status('your-appointment-uuid', 'cancelled');
-- SELECT public.change_appointment_status('your-appointment-uuid', '"CANCELED"');
--
-- Check function signature:
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'change_appointment_status';
--
-- List all overloads:
-- SELECT proname, proargtypes::regtype[] FROM pg_proc WHERE proname LIKE '%appointment_status%';
