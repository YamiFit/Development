-- ============================================
-- COACH PROFILE MIGRATION
-- Run this script in Supabase SQL Editor
-- ============================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- COACH PROFILE TABLES
-- ============================================

-- Main coach profile
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  coach_id UUID PRIMARY KEY,              -- equals auth.uid()
  full_name TEXT NOT NULL,
  gender TEXT NULL,
  date_of_birth DATE NULL,
  age INT NULL,                            -- optional; if both exist, prefer date_of_birth in UI
  years_of_experience INT NULL,
  bio TEXT NULL,
  specialties TEXT[] NULL,                 -- e.g. {"Weight loss","Strength","Rehab"}
  languages TEXT[] NULL,                   -- e.g. {"Arabic","English"}
  profile_image_url TEXT NULL,
  phone TEXT NULL,
  email TEXT NULL,
  city TEXT NULL,
  country TEXT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Places the coach trained/worked at (one-to-many)
CREATE TABLE IF NOT EXISTS public.coach_training_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coach_profiles(coach_id) ON DELETE CASCADE,
  place_name TEXT NOT NULL,                -- gym/clinic/academy name
  city TEXT NULL,
  country TEXT NULL,
  from_date DATE NULL,
  to_date DATE NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_training_places_coach_id
  ON public.coach_training_places(coach_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Trigger to update updated_at on coach_profiles
CREATE OR REPLACE FUNCTION public.set_coach_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_coach_profiles_updated_at ON public.coach_profiles;
CREATE TRIGGER trg_coach_profiles_updated_at
BEFORE UPDATE ON public.coach_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_coach_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on coach tables
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_training_places ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR COACH_PROFILES
-- ============================================

-- Coach can select their own profile, admin can select all
DROP POLICY IF EXISTS "coach_profiles_select_own" ON public.coach_profiles;
CREATE POLICY "coach_profiles_select_own"
ON public.coach_profiles
FOR SELECT
USING (coach_id = auth.uid() OR public.is_admin());

-- Coach can insert their own profile
DROP POLICY IF EXISTS "coach_profiles_insert_own" ON public.coach_profiles;
CREATE POLICY "coach_profiles_insert_own"
ON public.coach_profiles
FOR INSERT
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

-- Coach can update their own profile
DROP POLICY IF EXISTS "coach_profiles_update_own" ON public.coach_profiles;
CREATE POLICY "coach_profiles_update_own"
ON public.coach_profiles
FOR UPDATE
USING (coach_id = auth.uid() OR public.is_admin())
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

-- Public can view public coach profiles
DROP POLICY IF EXISTS "coach_profiles_public_view" ON public.coach_profiles;
CREATE POLICY "coach_profiles_public_view"
ON public.coach_profiles
FOR SELECT
USING (is_public = TRUE);

-- ============================================
-- RLS POLICIES FOR COACH_TRAINING_PLACES
-- ============================================

-- Coach can select their own training places
DROP POLICY IF EXISTS "coach_places_select_own" ON public.coach_training_places;
CREATE POLICY "coach_places_select_own"
ON public.coach_training_places
FOR SELECT
USING (coach_id = auth.uid() OR public.is_admin());

-- Coach can insert their own training places
DROP POLICY IF EXISTS "coach_places_insert_own" ON public.coach_training_places;
CREATE POLICY "coach_places_insert_own"
ON public.coach_training_places
FOR INSERT
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

-- Coach can update their own training places
DROP POLICY IF EXISTS "coach_places_update_own" ON public.coach_training_places;
CREATE POLICY "coach_places_update_own"
ON public.coach_training_places
FOR UPDATE
USING (coach_id = auth.uid() OR public.is_admin())
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

-- Coach can delete their own training places
DROP POLICY IF EXISTS "coach_places_delete_own" ON public.coach_training_places;
CREATE POLICY "coach_places_delete_own"
ON public.coach_training_places
FOR DELETE
USING (coach_id = auth.uid() OR public.is_admin());

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.coach_profiles IS 'Coach profile information for users with coach role';
COMMENT ON TABLE public.coach_training_places IS 'Training/work history places for coaches';
COMMENT ON COLUMN public.coach_profiles.coach_id IS 'References auth.uid() - the coach user ID';
COMMENT ON COLUMN public.coach_profiles.specialties IS 'Array of coach specialties e.g. {"Weight loss","Strength","Rehab"}';
COMMENT ON COLUMN public.coach_profiles.languages IS 'Array of languages spoken e.g. {"Arabic","English"}';

-- ============================================
-- END OF MIGRATION
-- ============================================
