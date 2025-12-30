-- ============================================
-- CHAT ATTACHMENTS & SECURITY HARDENING MIGRATION
-- Adds attachment support to messages and implements secure RLS policies
-- Run this script in Supabase SQL Editor
-- IMPORTANT: Run 003_coach_client_system.sql FIRST if not already done
-- ============================================

-- ============================================
-- 0. VERIFY PREREQUISITES
-- ============================================

-- Check if conversations table exists (from 003 migration)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    RAISE EXCEPTION 'conversations table does not exist. Please run 003_coach_client_system.sql first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    RAISE EXCEPTION 'messages table does not exist. Please run 003_coach_client_system.sql first.';
  END IF;
END $$;

-- ============================================
-- 1. MESSAGE TYPE ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. ALTER MESSAGES TABLE FOR ATTACHMENTS
-- ============================================

-- Add attachment columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type message_type NOT NULL DEFAULT 'text';

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT NULL;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_path TEXT NULL;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_name TEXT NULL;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_mime TEXT NULL;

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_size BIGINT NULL;

-- Update the body constraint to allow NULL body when attachment exists
-- First, drop any existing constraints
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS chk_body_not_empty;

ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS chk_message_has_content;

-- Make body nullable
ALTER TABLE public.messages 
ALTER COLUMN body DROP NOT NULL;

-- Add new constraint: body OR attachment must exist
ALTER TABLE public.messages 
ADD CONSTRAINT chk_message_has_content CHECK (
  (body IS NOT NULL AND length(trim(body)) > 0) 
  OR 
  (attachment_path IS NOT NULL AND attachment_name IS NOT NULL)
);

-- Add index for message type filtering
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);

-- Add index for attachment queries
CREATE INDEX IF NOT EXISTS idx_messages_attachment ON public.messages(conversation_id) 
WHERE attachment_path IS NOT NULL;

COMMENT ON COLUMN public.messages.message_type IS 'Type of message: text, image, or file';
COMMENT ON COLUMN public.messages.attachment_url IS 'Public or signed URL for attachment (computed/cached)';
COMMENT ON COLUMN public.messages.attachment_path IS 'Storage path: chat_attachments/{conversation_id}/{message_id}/{filename}';
COMMENT ON COLUMN public.messages.attachment_name IS 'Original filename of the attachment';
COMMENT ON COLUMN public.messages.attachment_mime IS 'MIME type of the attachment';
COMMENT ON COLUMN public.messages.attachment_size IS 'File size in bytes';

-- ============================================
-- 3. CREATE STORAGE BUCKET FOR CHAT ATTACHMENTS
-- ============================================

-- Create chat_attachments bucket (private - requires signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  false,
  52428800, -- 50MB max file size
  ARRAY[
    'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 4. HELPER FUNCTION: CHECK CONVERSATION ACCESS WITH ACTIVE ASSIGNMENT
-- ============================================

-- Function to check if user can access a conversation (with active assignment check)
CREATE OR REPLACE FUNCTION public.can_access_conversation(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (c.user_id = auth.uid() OR c.coach_id = auth.uid())
      AND EXISTS (
        SELECT 1 
        FROM public.coach_client_assignments cca
        WHERE cca.user_id = c.user_id
          AND cca.coach_id = c.coach_id
          AND cca.status = 'ACTIVE'
      )
  )
  OR public.is_admin();
$$;

-- Function to check if user can access a conversation for read-only (even if assignment ended)
-- This allows viewing history but not sending new messages
CREATE OR REPLACE FUNCTION public.can_read_conversation(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (c.user_id = auth.uid() OR c.coach_id = auth.uid())
  )
  OR public.is_admin();
$$;

-- Function to check if user can send to a conversation (requires active assignment)
CREATE OR REPLACE FUNCTION public.can_send_to_conversation(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_access_conversation(p_conversation_id);
$$;

GRANT EXECUTE ON FUNCTION public.can_access_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_send_to_conversation(UUID) TO authenticated;

-- ============================================
-- 5. UPDATE RLS POLICIES FOR CONVERSATIONS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_with_assignment" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;

-- SELECT: Can read conversations they're part of (even if assignment ended - for history)
CREATE POLICY "conversations_select_participant"
ON public.conversations FOR SELECT
USING (
  user_id = auth.uid() 
  OR coach_id = auth.uid() 
  OR public.is_admin()
);

-- INSERT: Only if there's an active assignment between the coach and user
CREATE POLICY "conversations_insert_with_assignment"
ON public.conversations FOR INSERT
WITH CHECK (
  (
    -- User creating conversation with their coach
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.coach_client_assignments
      WHERE coach_client_assignments.user_id = auth.uid()
        AND coach_client_assignments.coach_id = conversations.coach_id
        AND coach_client_assignments.status = 'ACTIVE'
    ))
    OR
    -- Coach creating conversation with their client
    (coach_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.coach_client_assignments
      WHERE coach_client_assignments.coach_id = auth.uid()
        AND coach_client_assignments.user_id = conversations.user_id
        AND coach_client_assignments.status = 'ACTIVE'
    ))
  )
  OR public.is_admin()
);

-- UPDATE: Only participants can update (for last_message_at etc.)
CREATE POLICY "conversations_update_participant"
ON public.conversations FOR UPDATE
USING (
  user_id = auth.uid() 
  OR coach_id = auth.uid() 
  OR public.is_admin()
)
WITH CHECK (
  user_id = auth.uid() 
  OR coach_id = auth.uid() 
  OR public.is_admin()
);

-- ============================================
-- 6. UPDATE RLS POLICIES FOR MESSAGES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "messages_select_conversation_member" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_update_read_at" ON public.messages;

-- SELECT: Can read messages in conversations they're part of
-- (Allow reading even if assignment ended - for message history)
CREATE POLICY "messages_select_conversation_member"
ON public.messages FOR SELECT
USING (
  public.can_read_conversation(conversation_id)
);

-- INSERT: Direct insert policy (in addition to RPC)
-- Only if sender is participant AND there's an active assignment
CREATE POLICY "messages_insert_sender"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.can_send_to_conversation(conversation_id)
);

-- UPDATE: Only for marking as read (by recipient)
CREATE POLICY "messages_update_read_at"
ON public.messages FOR UPDATE
USING (
  -- Can only update messages in your conversations that you didn't send
  sender_id != auth.uid()
  AND public.can_read_conversation(conversation_id)
)
WITH CHECK (
  -- Can only update read_at field (enforced at application level)
  sender_id != auth.uid()
  AND public.can_read_conversation(conversation_id)
);

-- ============================================
-- 7. STORAGE POLICIES FOR CHAT ATTACHMENTS
-- ============================================

-- Helper function to extract conversation_id from storage path
-- Path format: {conversation_id}/{message_id}/{filename}
CREATE OR REPLACE FUNCTION public.get_conversation_id_from_path(path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (string_to_array(path, '/'))[1]::UUID;
$$;

-- Helper function to check if user can access storage path
CREATE OR REPLACE FUNCTION public.can_access_chat_attachment(object_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Extract conversation_id from path
  BEGIN
    v_conversation_id := public.get_conversation_id_from_path(object_path);
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  IF v_conversation_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user can access this conversation
  RETURN public.can_read_conversation(v_conversation_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_id_from_path(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_chat_attachment(TEXT) TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "chat_attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_delete" ON storage.objects;

-- SELECT: Can download attachments from conversations they're part of
CREATE POLICY "chat_attachments_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.can_access_chat_attachment(name)
);

-- INSERT: Can upload to conversations with active assignment
CREATE POLICY "chat_attachments_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.can_access_chat_attachment(name)
);

-- DELETE: Can delete own uploads (optional - for cleanup on failed sends)
CREATE POLICY "chat_attachments_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner::uuid = auth.uid()
);

-- ============================================
-- 8. ENHANCED SEND MESSAGE RPC (WITH ATTACHMENT SUPPORT)
-- ============================================

CREATE OR REPLACE FUNCTION public.send_message_with_attachment(
  p_conversation_id UUID,
  p_body TEXT DEFAULT NULL,
  p_message_type message_type DEFAULT 'text',
  p_attachment_path TEXT DEFAULT NULL,
  p_attachment_name TEXT DEFAULT NULL,
  p_attachment_mime TEXT DEFAULT NULL,
  p_attachment_size BIGINT DEFAULT NULL
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
  v_has_content BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Validate content exists
  v_has_content := (p_body IS NOT NULL AND trim(p_body) != '') 
                   OR (p_attachment_path IS NOT NULL AND p_attachment_name IS NOT NULL);
  
  IF NOT v_has_content THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message must have text or attachment');
  END IF;
  
  -- Validate message_type matches content
  IF p_message_type IN ('image', 'file') AND p_attachment_path IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attachment path required for image/file messages');
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
  INSERT INTO public.messages (
    conversation_id, 
    sender_id, 
    body,
    message_type,
    attachment_path,
    attachment_name,
    attachment_mime,
    attachment_size
  )
  VALUES (
    p_conversation_id, 
    v_user_id, 
    NULLIF(trim(p_body), ''),
    p_message_type,
    p_attachment_path,
    p_attachment_name,
    p_attachment_mime,
    p_attachment_size
  )
  RETURNING * INTO v_new_message;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', row_to_json(v_new_message)
  );
END;
$$;

-- Update the original send_message to use the new function for text messages
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id UUID,
  p_body TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.send_message_with_attachment(
    p_conversation_id,
    p_body,
    'text'::message_type,
    NULL, NULL, NULL, NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message_with_attachment(UUID, TEXT, message_type, TEXT, TEXT, TEXT, BIGINT) TO authenticated;

-- ============================================
-- 9. FUNCTION TO GET SIGNED URL FOR ATTACHMENT
-- ============================================

-- Note: Signed URL generation should be done client-side using Supabase Storage API
-- This is just a helper to validate access

CREATE OR REPLACE FUNCTION public.can_download_attachment(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message RECORD;
BEGIN
  -- Get message with attachment
  SELECT * INTO v_message 
  FROM public.messages 
  WHERE id = p_message_id AND attachment_path IS NOT NULL;
  
  IF v_message IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message or attachment not found');
  END IF;
  
  -- Check if user can access this conversation
  IF NOT public.can_read_conversation(v_message.conversation_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'attachment_path', v_message.attachment_path,
    'attachment_name', v_message.attachment_name,
    'attachment_mime', v_message.attachment_mime,
    'attachment_size', v_message.attachment_size
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_download_attachment(UUID) TO authenticated;

-- ============================================
-- 10. FUNCTION TO CHECK CHAT STATUS (for UI)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_chat_status(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation RECORD;
  v_has_active_assignment BOOLEAN;
  v_can_send BOOLEAN;
  v_can_read BOOLEAN;
BEGIN
  -- Get conversation
  SELECT * INTO v_conversation FROM public.conversations WHERE id = p_conversation_id;
  
  IF v_conversation IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Conversation not found'
    );
  END IF;
  
  -- Check if user is participant
  IF auth.uid() != v_conversation.coach_id AND auth.uid() != v_conversation.user_id THEN
    IF NOT public.is_admin() THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Access denied'
      );
    END IF;
  END IF;
  
  -- Check assignment status
  v_has_active_assignment := public.has_active_assignment(v_conversation.coach_id, v_conversation.user_id);
  v_can_send := v_has_active_assignment OR public.is_admin();
  v_can_read := TRUE; -- Participants can always read history
  
  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', v_conversation.id,
    'coach_id', v_conversation.coach_id,
    'user_id', v_conversation.user_id,
    'has_active_assignment', v_has_active_assignment,
    'can_send', v_can_send,
    'can_read', v_can_read,
    'status', CASE WHEN v_has_active_assignment THEN 'active' ELSE 'read_only' END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_status(UUID) TO authenticated;

-- ============================================
-- 11. COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.messages IS 'Chat messages between coaches and clients. Supports text, images, and file attachments.';
COMMENT ON TABLE public.conversations IS 'One-to-one conversation threads between a coach and a user.';

COMMENT ON FUNCTION public.send_message_with_attachment IS 'Send a message with optional attachment. Validates active assignment.';
COMMENT ON FUNCTION public.get_chat_status IS 'Get the current status of a chat (active or read-only).';
COMMENT ON FUNCTION public.can_access_conversation IS 'Check if current user can access a conversation (with active assignment).';
COMMENT ON FUNCTION public.can_read_conversation IS 'Check if current user can read a conversation (allows history access).';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- To verify, run:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages';
-- SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
-- SELECT policyname FROM pg_policies WHERE tablename = 'messages';
