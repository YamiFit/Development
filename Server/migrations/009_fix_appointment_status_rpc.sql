-- ============================================
-- Migration 009: Fix update_appointment_status RPC
-- ============================================
-- Issue: PostgREST error 22P02 (invalid_text_representation) when 
-- calling RPC with custom enum type parameter.
-- 
-- Solution: Create a TEXT-accepting overload that casts internally.
-- ============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS public.update_appointment_status(UUID, appointment_status);

-- Create new function that accepts TEXT and casts internally
CREATE OR REPLACE FUNCTION public.update_appointment_status(
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
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Validate and cast status
  BEGIN
    v_status := p_status::appointment_status;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Invalid status: %s. Must be REQUESTED, CONFIRMED, CANCELED, or COMPLETED', p_status)
    );
  END;
  
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
    'message', format('Appointment %s successfully', lower(v_status::text))
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_appointment_status(UUID, TEXT) TO authenticated;

-- Also update the schema.sql reference for consistency
COMMENT ON FUNCTION public.update_appointment_status(UUID, TEXT) IS 
'Update appointment status. Accepts status as TEXT and casts to appointment_status enum internally.
Valid statuses: REQUESTED, CONFIRMED, CANCELED, COMPLETED';
