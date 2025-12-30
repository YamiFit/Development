-- ============================================
-- Migration 010: Create NEW appointment status update function
-- ============================================
-- Use a NEW function name to completely bypass schema cache issues
-- ============================================

-- Drop ALL possible overloads of both functions to ensure clean state
DROP FUNCTION IF EXISTS public.change_appointment_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.change_appointment_status(UUID, appointment_status);
DROP FUNCTION IF EXISTS public.update_appointment_status(UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_appointment_status(UUID, appointment_status);

-- Create a new function with TEXT parameter (NOT enum)
-- This avoids PostgREST enum casting issues
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Clean the input: remove quotes, trim whitespace, normalize
  v_clean_status := UPPER(TRIM(BOTH '"' FROM TRIM(p_status)));
  
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
      'error', format('Invalid status: %s (cleaned: %s). Must be REQUESTED, CONFIRMED, CANCELED/CANCELLED, or COMPLETED', p_status, v_clean_status)
    );
  END IF;
  
  -- Get appointment
  SELECT * INTO v_appointment FROM public.appointments WHERE id = p_appointment_id;
  
  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
  END IF;
  
  -- Check authorization: coach can do anything, user can only cancel
  IF v_appointment.coach_id != v_user_id AND NOT public.is_admin() THEN
    IF v_appointment.user_id = v_user_id AND v_status = 'CANCELED' THEN
      -- Allow user to cancel their own appointment
      NULL;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'You are not authorized to update this appointment');
    END IF;
  END IF;
  
  -- Update status
  UPDATE public.appointments
  SET status = v_status, updated_at = NOW()
  WHERE id = p_appointment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'new_status', v_status::TEXT,
    'message', format('Appointment %s successfully', lower(v_status::text))
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.change_appointment_status(UUID, TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.change_appointment_status(UUID, TEXT) IS 
'Update appointment status. Accepts status as TEXT (case-insensitive, handles both CANCELED and CANCELLED spellings).
Valid statuses: REQUESTED, CONFIRMED, CANCELED/CANCELLED, COMPLETED.
Coach can update any status, user can only cancel their own appointments.';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
