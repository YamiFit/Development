-- ============================================
-- MIGRATION: Add Subscription Plans (BASIC/PRO) 
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create the subscription_plan enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('BASIC', 'PRO');
  END IF;
END $$;

-- Step 2: Add plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan subscription_plan DEFAULT 'BASIC' NOT NULL;

-- Step 3: Add selected_coach_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_coach_id UUID NULL;

-- Step 4: Add foreign key constraint (if coach_profiles table exists)
-- This allows users to select a coach for tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_profiles_selected_coach'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT fk_profiles_selected_coach 
    FOREIGN KEY (selected_coach_id) 
    REFERENCES public.coach_profiles(coach_id) 
    ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'coach_profiles table does not exist yet. FK will be added when coach_profiles is created.';
END $$;

-- Step 5: Create index for faster lookups on selected_coach_id
CREATE INDEX IF NOT EXISTS idx_profiles_selected_coach 
ON public.profiles(selected_coach_id);

-- Step 6: Create index for faster plan lookups
CREATE INDEX IF NOT EXISTS idx_profiles_plan 
ON public.profiles(plan);

-- Step 7: RLS Policy - Users can update their own selected_coach_id
-- (profile update policy should already exist, but ensure it covers new columns)
DROP POLICY IF EXISTS "Users can update own selected coach" ON profiles;
CREATE POLICY "Users can update own selected coach"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 8: Grant users ability to read public coach profiles for selection
-- This allows PRO users to see the list of available coaches
DROP POLICY IF EXISTS "Users can view public coaches" ON public.coach_profiles;
CREATE POLICY "Users can view public coaches"
ON public.coach_profiles
FOR SELECT
USING (is_public = TRUE);

-- ============================================
-- VERIFICATION QUERIES (run to verify migration)
-- ============================================
-- Check that plan column exists:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('plan', 'selected_coach_id');

-- Check a sample profile:
-- SELECT id, email, plan, selected_coach_id FROM profiles LIMIT 5;

-- ============================================
-- OPTIONAL: Upgrade a user to PRO (for testing)
-- ============================================
-- UPDATE profiles SET plan = 'PRO' WHERE email = 'test@example.com';

-- ============================================
-- END OF MIGRATION
-- ============================================
