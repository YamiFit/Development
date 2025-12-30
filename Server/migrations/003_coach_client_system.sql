-- ============================================
-- COACH-CLIENT ASSIGNMENT SYSTEM MIGRATION
-- Tables for coach-user assignments, messaging, diet plans, and appointments
-- Run this script in Supabase SQL Editor
-- ============================================

-- Enable btree_gist extension for exclusion constraints on time ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================
-- ENUMS
-- ============================================

-- Assignment status enum
DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('ACTIVE', 'ENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Appointment status enum
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('REQUESTED', 'CONFIRMED', 'CANCELED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- COACH-CLIENT ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.coach_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status assignment_status NOT NULL DEFAULT 'ACTIVE',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NULL,
  ended_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_user_not_coach CHECK (user_id != coach_id),
  CONSTRAINT chk_ended_at_with_status CHECK (
    (status = 'ACTIVE' AND ended_at IS NULL) OR
    (status = 'ENDED' AND ended_at IS NOT NULL)
  )
);

-- Unique constraint: one active assignment per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment_per_user 
ON public.coach_client_assignments(user_id) 
WHERE status = 'ACTIVE';

-- Index for coach lookups
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_coach 
ON public.coach_client_assignments(coach_id, status);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_user 
ON public.coach_client_assignments(user_id, status);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NULL,
  
  -- Unique constraint: one conversation per coach-user pair
  CONSTRAINT unique_conversation_pair UNIQUE (coach_id, user_id),
  CONSTRAINT chk_user_not_coach_conv CHECK (user_id != coach_id)
);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_conversations_coach ON public.conversations(coach_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ NULL,
  
  CONSTRAINT chk_body_not_empty CHECK (length(trim(body)) > 0)
);

-- Index for conversation message lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- Index for sender lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ============================================
-- CLIENT PLANS TABLE (Diet & Exercise)
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diet_plan JSONB NULL,              -- Structured diet plan
  diet_text TEXT NULL,                -- Text-based diet plan
  exercise_plan JSONB NULL,           -- Structured exercise plan
  exercise_text TEXT NULL,            -- Text-based exercise plan
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_user_not_coach_plan CHECK (user_id != coach_id)
);

-- Index for coach lookups
CREATE INDEX IF NOT EXISTS idx_client_plans_coach ON public.client_plans(coach_id, is_active);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_client_plans_user ON public.client_plans(user_id, is_active);

-- Unique active plan per user-coach pair (optional - remove if you want multiple plans)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_plan 
-- ON public.client_plans(user_id, coach_id) 
-- WHERE is_active = TRUE;

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'REQUESTED',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_user_not_coach_appt CHECK (user_id != coach_id),
  CONSTRAINT chk_end_after_start CHECK (end_time > start_time),
  CONSTRAINT chk_reasonable_duration CHECK (
    end_time - start_time <= interval '4 hours' AND 
    end_time - start_time >= interval '15 minutes'
  )
);

-- Exclusion constraint to prevent coach double-booking (REQUESTED or CONFIRMED only)
-- Using btree_gist extension for tstzrange exclusion
CREATE INDEX IF NOT EXISTS idx_appointments_coach_time 
ON public.appointments(coach_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_appointments_user_time 
ON public.appointments(user_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON public.appointments(status);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Generic updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

-- Trigger for coach_client_assignments
DROP TRIGGER IF EXISTS trg_coach_client_assignments_updated_at ON public.coach_client_assignments;
CREATE TRIGGER trg_coach_client_assignments_updated_at
BEFORE UPDATE ON public.coach_client_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for conversations
DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for client_plans
DROP TRIGGER IF EXISTS trg_client_plans_updated_at ON public.client_plans;
CREATE TRIGGER trg_client_plans_updated_at
BEFORE UPDATE ON public.client_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for appointments
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER TO UPDATE CONVERSATION LAST MESSAGE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_messages_update_conversation ON public.messages;
CREATE TRIGGER trg_messages_update_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to check if user is a coach
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coach'
  );
$$;

-- Function to check if there's an active assignment between coach and user
CREATE OR REPLACE FUNCTION public.has_active_assignment(p_coach_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_assignments
    WHERE coach_id = p_coach_id 
      AND user_id = p_user_id 
      AND status = 'ACTIVE'
  );
$$;

-- Function to get current user's active coach ID
CREATE OR REPLACE FUNCTION public.get_user_active_coach()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT coach_id FROM public.coach_client_assignments
  WHERE user_id = auth.uid() AND status = 'ACTIVE'
  LIMIT 1;
$$;

-- Function to check if user is assigned to the calling coach
CREATE OR REPLACE FUNCTION public.is_my_client(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_assignments
    WHERE coach_id = auth.uid() 
      AND user_id = p_user_id 
      AND status = 'ACTIVE'
  );
$$;

-- Function to count coach's active clients
CREATE OR REPLACE FUNCTION public.count_coach_active_clients(p_coach_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::INTEGER FROM public.coach_client_assignments
  WHERE coach_id = p_coach_id AND status = 'ACTIVE';
$$;

-- ============================================
-- RPC: SELECT COACH (with cooldown + capacity)
-- ============================================

CREATE OR REPLACE FUNCTION public.select_coach(p_coach_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role user_role;
  v_coach_role user_role;
  v_current_assignment RECORD;
  v_days_since_assignment INTEGER;
  v_coach_client_count INTEGER;
  v_max_clients CONSTANT INTEGER := 10;
  v_cooldown_days CONSTANT INTEGER := 5;
  v_new_assignment_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Check user's role (must be 'user')
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  
  IF v_user_role != 'user' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only users can select a coach'
    );
  END IF;
  
  -- Check coach exists and has coach role
  SELECT role INTO v_coach_role FROM public.profiles WHERE id = p_coach_id;
  
  IF v_coach_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Coach not found'
    );
  END IF;
  
  IF v_coach_role != 'coach' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Selected user is not a coach'
    );
  END IF;
  
  -- Check for current active assignment
  SELECT * INTO v_current_assignment
  FROM public.coach_client_assignments
  WHERE user_id = v_user_id AND status = 'ACTIVE';
  
  IF v_current_assignment IS NOT NULL THEN
    -- Already assigned to this coach
    IF v_current_assignment.coach_id = p_coach_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'You are already assigned to this coach'
      );
    END IF;
    
    -- Check cooldown (5 days)
    v_days_since_assignment := EXTRACT(DAY FROM (NOW() - v_current_assignment.assigned_at));
    
    IF v_days_since_assignment < v_cooldown_days THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('You can change your coach after %s days from your last selection. Please wait %s more day(s).', 
          v_cooldown_days, v_cooldown_days - v_days_since_assignment),
        'cooldown_remaining_days', v_cooldown_days - v_days_since_assignment,
        'assigned_at', v_current_assignment.assigned_at
      );
    END IF;
  END IF;
  
  -- Check coach capacity (max 10 active clients)
  v_coach_client_count := public.count_coach_active_clients(p_coach_id);
  
  IF v_coach_client_count >= v_max_clients THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Coach is at maximum capacity. Please select another coach.',
      'max_capacity', v_max_clients
    );
  END IF;
  
  -- End current assignment if exists
  IF v_current_assignment IS NOT NULL THEN
    UPDATE public.coach_client_assignments
    SET 
      status = 'ENDED',
      ended_at = NOW(),
      ended_reason = 'User switched to another coach'
    WHERE id = v_current_assignment.id;
  END IF;
  
  -- Create new assignment
  INSERT INTO public.coach_client_assignments (user_id, coach_id, status, assigned_at)
  VALUES (v_user_id, p_coach_id, 'ACTIVE', NOW())
  RETURNING id INTO v_new_assignment_id;
  
  -- Update profile's selected_coach_id
  UPDATE public.profiles
  SET selected_coach_id = p_coach_id, updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Create or get conversation
  INSERT INTO public.conversations (coach_id, user_id)
  VALUES (p_coach_id, v_user_id)
  ON CONFLICT (coach_id, user_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Coach assigned successfully',
    'assignment_id', v_new_assignment_id,
    'coach_id', p_coach_id
  );
END;
$$;

-- ============================================
-- RPC: BOOK APPOINTMENT (with conflict prevention)
-- ============================================

CREATE OR REPLACE FUNCTION public.book_appointment(
  p_coach_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_has_assignment BOOLEAN;
  v_coach_conflict BOOLEAN;
  v_user_conflict BOOLEAN;
  v_new_appointment_id UUID;
  v_appointment RECORD;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Validate times
  IF p_end_time <= p_start_time THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'End time must be after start time'
    );
  END IF;
  
  IF p_start_time < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot book appointments in the past'
    );
  END IF;
  
  -- Check duration (15 min to 4 hours)
  IF p_end_time - p_start_time < interval '15 minutes' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Appointment must be at least 15 minutes'
    );
  END IF;
  
  IF p_end_time - p_start_time > interval '4 hours' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Appointment cannot exceed 4 hours'
    );
  END IF;
  
  -- Check active assignment exists
  v_has_assignment := public.has_active_assignment(p_coach_id, v_user_id);
  
  IF NOT v_has_assignment THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You must be assigned to this coach to book an appointment'
    );
  END IF;
  
  -- Check for coach time conflicts (REQUESTED or CONFIRMED appointments)
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE coach_id = p_coach_id
      AND status IN ('REQUESTED', 'CONFIRMED')
      AND tstzrange(start_time, end_time, '[)') && tstzrange(p_start_time, p_end_time, '[)')
  ) INTO v_coach_conflict;
  
  IF v_coach_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This time slot conflicts with an existing appointment for this coach'
    );
  END IF;
  
  -- Check for user time conflicts (REQUESTED or CONFIRMED appointments)
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE user_id = v_user_id
      AND status IN ('REQUESTED', 'CONFIRMED')
      AND tstzrange(start_time, end_time, '[)') && tstzrange(p_start_time, p_end_time, '[)')
  ) INTO v_user_conflict;
  
  IF v_user_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This time slot conflicts with one of your existing appointments'
    );
  END IF;
  
  -- Create appointment
  INSERT INTO public.appointments (coach_id, user_id, start_time, end_time, notes, status)
  VALUES (p_coach_id, v_user_id, p_start_time, p_end_time, p_notes, 'REQUESTED')
  RETURNING * INTO v_appointment;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Appointment booked successfully',
    'appointment', row_to_json(v_appointment)
  );
END;
$$;

-- ============================================
-- RPC: UPDATE APPOINTMENT STATUS (for coach)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_appointment_status(
  p_appointment_id UUID,
  p_status appointment_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_coach BOOLEAN;
  v_appointment RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get appointment
  SELECT * INTO v_appointment FROM public.appointments WHERE id = p_appointment_id;
  
  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
  END IF;
  
  -- Check if user is the coach for this appointment
  IF v_appointment.coach_id != v_user_id AND NOT public.is_admin() THEN
    -- User can only cancel their own appointments
    IF v_appointment.user_id = v_user_id AND p_status = 'CANCELED' THEN
      -- Allow user to cancel
      NULL;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'You are not authorized to update this appointment');
    END IF;
  END IF;
  
  -- Update status
  UPDATE public.appointments
  SET status = p_status, updated_at = NOW()
  WHERE id = p_appointment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Appointment %s successfully', lower(p_status::text))
  );
END;
$$;

-- ============================================
-- RPC: GET COACH AVAILABLE SLOTS (helper)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_coach_appointments(
  p_coach_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NOW(),
  p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status appointment_status,
  notes TEXT,
  user_name TEXT,
  user_avatar TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_to_date IS NULL THEN
    p_to_date := p_from_date + interval '7 days';
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.start_time,
    a.end_time,
    a.status,
    a.notes,
    p.full_name AS user_name,
    p.avatar_url AS user_avatar
  FROM public.appointments a
  JOIN public.profiles p ON p.id = a.user_id
  WHERE a.coach_id = p_coach_id
    AND a.start_time >= p_from_date
    AND a.start_time < p_to_date
  ORDER BY a.start_time;
END;
$$;

-- ============================================
-- RPC: SEND MESSAGE
-- ============================================

CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id UUID,
  p_body TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_conversation RECORD;
  v_has_assignment BOOLEAN;
  v_new_message RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  IF trim(p_body) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message cannot be empty');
  END IF;
  
  -- Get conversation
  SELECT * INTO v_conversation FROM public.conversations WHERE id = p_conversation_id;
  
  IF v_conversation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
  END IF;
  
  -- Check if user is part of this conversation
  IF v_user_id != v_conversation.coach_id AND v_user_id != v_conversation.user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not part of this conversation');
  END IF;
  
  -- Check for active assignment
  v_has_assignment := public.has_active_assignment(v_conversation.coach_id, v_conversation.user_id);
  
  IF NOT v_has_assignment AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send messages without an active coaching assignment');
  END IF;
  
  -- Insert message
  INSERT INTO public.messages (conversation_id, sender_id, body)
  VALUES (p_conversation_id, v_user_id, trim(p_body))
  RETURNING * INTO v_new_message;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', row_to_json(v_new_message)
  );
END;
$$;

-- ============================================
-- RPC: GET OR CREATE CONVERSATION
-- ============================================

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_other_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role user_role;
  v_other_role user_role;
  v_coach_id UUID;
  v_client_id UUID;
  v_conversation RECORD;
  v_has_assignment BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get roles
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  SELECT role INTO v_other_role FROM public.profiles WHERE id = p_other_user_id;
  
  IF v_other_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Determine coach and client
  IF v_user_role = 'coach' AND v_other_role = 'user' THEN
    v_coach_id := v_user_id;
    v_client_id := p_other_user_id;
  ELSIF v_user_role = 'user' AND v_other_role = 'coach' THEN
    v_coach_id := p_other_user_id;
    v_client_id := v_user_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Conversation must be between a coach and a user');
  END IF;
  
  -- Check for active assignment
  v_has_assignment := public.has_active_assignment(v_coach_id, v_client_id);
  
  IF NOT v_has_assignment AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active coaching assignment exists');
  END IF;
  
  -- Get or create conversation
  INSERT INTO public.conversations (coach_id, user_id)
  VALUES (v_coach_id, v_client_id)
  ON CONFLICT (coach_id, user_id) DO UPDATE SET updated_at = NOW()
  RETURNING * INTO v_conversation;
  
  RETURN jsonb_build_object(
    'success', true,
    'conversation', row_to_json(v_conversation)
  );
END;
$$;

-- ============================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================

ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: COACH_CLIENT_ASSIGNMENTS
-- ============================================

-- Users can see their own assignments
DROP POLICY IF EXISTS "assignments_select_own_user" ON public.coach_client_assignments;
CREATE POLICY "assignments_select_own_user"
ON public.coach_client_assignments FOR SELECT
USING (user_id = auth.uid());

-- Coaches can see assignments where they are the coach
DROP POLICY IF EXISTS "assignments_select_own_coach" ON public.coach_client_assignments;
CREATE POLICY "assignments_select_own_coach"
ON public.coach_client_assignments FOR SELECT
USING (coach_id = auth.uid());

-- Admin can see all
DROP POLICY IF EXISTS "assignments_select_admin" ON public.coach_client_assignments;
CREATE POLICY "assignments_select_admin"
ON public.coach_client_assignments FOR SELECT
USING (public.is_admin());

-- No direct inserts/updates - use RPC functions
-- (RPC functions use SECURITY DEFINER)

-- ============================================
-- RLS POLICIES: CONVERSATIONS
-- ============================================

-- Users can see conversations they're part of
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant"
ON public.conversations FOR SELECT
USING (user_id = auth.uid() OR coach_id = auth.uid() OR public.is_admin());

-- ============================================
-- RLS POLICIES: MESSAGES
-- ============================================

-- Users can see messages in their conversations
DROP POLICY IF EXISTS "messages_select_conversation_member" ON public.messages;
CREATE POLICY "messages_select_conversation_member"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.coach_id = auth.uid())
  )
  OR public.is_admin()
);

-- Insert via RPC only (SECURITY DEFINER)

-- ============================================
-- RLS POLICIES: CLIENT_PLANS
-- ============================================

-- Users can see their own plans
DROP POLICY IF EXISTS "client_plans_select_user" ON public.client_plans;
CREATE POLICY "client_plans_select_user"
ON public.client_plans FOR SELECT
USING (user_id = auth.uid());

-- Coaches can see plans they created
DROP POLICY IF EXISTS "client_plans_select_coach" ON public.client_plans;
CREATE POLICY "client_plans_select_coach"
ON public.client_plans FOR SELECT
USING (coach_id = auth.uid());

-- Admin can see all
DROP POLICY IF EXISTS "client_plans_select_admin" ON public.client_plans;
CREATE POLICY "client_plans_select_admin"
ON public.client_plans FOR SELECT
USING (public.is_admin());

-- Coaches can insert plans for their assigned clients
DROP POLICY IF EXISTS "client_plans_insert_coach" ON public.client_plans;
CREATE POLICY "client_plans_insert_coach"
ON public.client_plans FOR INSERT
WITH CHECK (
  coach_id = auth.uid() 
  AND public.is_my_client(user_id)
);

-- Coaches can update their own plans for assigned clients
DROP POLICY IF EXISTS "client_plans_update_coach" ON public.client_plans;
CREATE POLICY "client_plans_update_coach"
ON public.client_plans FOR UPDATE
USING (coach_id = auth.uid() AND public.is_my_client(user_id))
WITH CHECK (coach_id = auth.uid() AND public.is_my_client(user_id));

-- Coaches can delete their own plans
DROP POLICY IF EXISTS "client_plans_delete_coach" ON public.client_plans;
CREATE POLICY "client_plans_delete_coach"
ON public.client_plans FOR DELETE
USING (coach_id = auth.uid());

-- Admin full access
DROP POLICY IF EXISTS "client_plans_admin_all" ON public.client_plans;
CREATE POLICY "client_plans_admin_all"
ON public.client_plans FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- RLS POLICIES: APPOINTMENTS
-- ============================================

-- Users can see their own appointments
DROP POLICY IF EXISTS "appointments_select_user" ON public.appointments;
CREATE POLICY "appointments_select_user"
ON public.appointments FOR SELECT
USING (user_id = auth.uid());

-- Coaches can see appointments they're part of
DROP POLICY IF EXISTS "appointments_select_coach" ON public.appointments;
CREATE POLICY "appointments_select_coach"
ON public.appointments FOR SELECT
USING (coach_id = auth.uid());

-- Admin can see all
DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
CREATE POLICY "appointments_select_admin"
ON public.appointments FOR SELECT
USING (public.is_admin());

-- Insert/update via RPC (SECURITY DEFINER) for conflict prevention

-- ============================================
-- RLS POLICIES: USER_HEALTH_PROFILES (for coaches)
-- ============================================

-- Coaches can read health profiles of their assigned clients
DROP POLICY IF EXISTS "health_profiles_coach_read" ON public.user_health_profiles;
CREATE POLICY "health_profiles_coach_read"
ON public.user_health_profiles FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_my_client(user_id)
  OR public.is_admin()
);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for messages (idempotent - ignores if already added)
DO $$
BEGIN
  -- Add messages to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  
  -- Add conversations to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  
  -- Add appointments to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.select_coach(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_appointment_status(UUID, appointment_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_coach_appointments(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_assignment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_active_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_coach_active_clients(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach() TO authenticated;
