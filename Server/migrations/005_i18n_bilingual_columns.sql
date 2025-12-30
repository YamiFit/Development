-- ============================================
-- MIGRATION: Add i18n Support (Bilingual Columns)
-- Date: 2024-12-26
-- Description: Adds bilingual fields for user-facing content
-- ============================================

-- ============================================
-- 1. ADD LANGUAGE PREFERENCE TO PROFILES
-- ============================================

-- Add language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Add constraint for valid languages
DO $$ BEGIN
  ALTER TABLE public.profiles 
  ADD CONSTRAINT chk_profiles_language 
  CHECK (language IN ('en', 'ar'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.profiles.language IS 'User preferred language (en or ar)';

-- Index for filtering by language
CREATE INDEX IF NOT EXISTS idx_profiles_language ON public.profiles(language);


-- ============================================
-- 2. MEAL_PROVIDERS: Add Bilingual Fields
-- ============================================

-- Business name translations
ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS business_name_en TEXT;

ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS business_name_ar TEXT;

-- Provider name translations
ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS provider_name_en TEXT;

ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS provider_name_ar TEXT;

-- Bio translations
ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS bio_en TEXT;

ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS bio_ar TEXT;

-- Address translations
ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS address_en TEXT;

ALTER TABLE public.meal_providers 
ADD COLUMN IF NOT EXISTS address_ar TEXT;

-- Migrate existing data to English columns
UPDATE public.meal_providers 
SET 
  business_name_en = COALESCE(business_name_en, business_name),
  provider_name_en = COALESCE(provider_name_en, provider_name),
  bio_en = COALESCE(bio_en, bio),
  address_en = COALESCE(address_en, address)
WHERE business_name_en IS NULL 
   OR provider_name_en IS NULL;

COMMENT ON COLUMN public.meal_providers.business_name_en IS 'Business name in English';
COMMENT ON COLUMN public.meal_providers.business_name_ar IS 'Business name in Arabic';
COMMENT ON COLUMN public.meal_providers.provider_name_en IS 'Provider name in English';
COMMENT ON COLUMN public.meal_providers.provider_name_ar IS 'Provider name in Arabic';
COMMENT ON COLUMN public.meal_providers.bio_en IS 'Provider bio in English';
COMMENT ON COLUMN public.meal_providers.bio_ar IS 'Provider bio in Arabic';
COMMENT ON COLUMN public.meal_providers.address_en IS 'Address in English';
COMMENT ON COLUMN public.meal_providers.address_ar IS 'Address in Arabic';


-- ============================================
-- 3. MEALS: Add Bilingual Fields
-- ============================================

-- Name translations
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Description translations
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Ingredients translations (optional, for display)
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS ingredients_en TEXT;

ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS ingredients_ar TEXT;

-- Migrate existing data to English columns
UPDATE public.meals 
SET 
  name_en = COALESCE(name_en, name),
  description_en = COALESCE(description_en, description)
WHERE name_en IS NULL;

COMMENT ON COLUMN public.meals.name_en IS 'Meal name in English';
COMMENT ON COLUMN public.meals.name_ar IS 'Meal name in Arabic';
COMMENT ON COLUMN public.meals.description_en IS 'Meal description in English';
COMMENT ON COLUMN public.meals.description_ar IS 'Meal description in Arabic';
COMMENT ON COLUMN public.meals.ingredients_en IS 'Ingredients list in English';
COMMENT ON COLUMN public.meals.ingredients_ar IS 'Ingredients list in Arabic';


-- ============================================
-- 4. COACH_PROFILES: Add Bilingual Fields
-- ============================================

-- Full name translations (coach may have different name representations)
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS full_name_en TEXT;

ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS full_name_ar TEXT;

-- Bio translations
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS bio_en TEXT;

ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS bio_ar TEXT;

-- City translations
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS city_en TEXT;

ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS city_ar TEXT;

-- Country translations
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS country_en TEXT;

ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS country_ar TEXT;

-- Specialties in both languages (stored as JSON for flexibility)
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS specialties_en TEXT[];

ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS specialties_ar TEXT[];

-- Migrate existing data
UPDATE public.coach_profiles 
SET 
  full_name_en = COALESCE(full_name_en, full_name),
  bio_en = COALESCE(bio_en, bio),
  city_en = COALESCE(city_en, city),
  country_en = COALESCE(country_en, country),
  specialties_en = COALESCE(specialties_en, specialties)
WHERE full_name_en IS NULL;

COMMENT ON COLUMN public.coach_profiles.full_name_en IS 'Coach full name in English';
COMMENT ON COLUMN public.coach_profiles.full_name_ar IS 'Coach full name in Arabic';
COMMENT ON COLUMN public.coach_profiles.bio_en IS 'Coach bio in English';
COMMENT ON COLUMN public.coach_profiles.bio_ar IS 'Coach bio in Arabic';
COMMENT ON COLUMN public.coach_profiles.specialties_en IS 'Specialties list in English';
COMMENT ON COLUMN public.coach_profiles.specialties_ar IS 'Specialties list in Arabic';


-- ============================================
-- 5. COACH_TRAINING_PLACES: Add Bilingual Fields
-- ============================================

-- Place name translations
ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS place_name_en TEXT;

ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS place_name_ar TEXT;

-- City translations
ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS city_en TEXT;

ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS city_ar TEXT;

-- Country translations
ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS country_en TEXT;

ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS country_ar TEXT;

-- Description translations
ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.coach_training_places 
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Migrate existing data
UPDATE public.coach_training_places 
SET 
  place_name_en = COALESCE(place_name_en, place_name),
  city_en = COALESCE(city_en, city),
  country_en = COALESCE(country_en, country),
  description_en = COALESCE(description_en, description)
WHERE place_name_en IS NULL;


-- ============================================
-- 6. CLIENT_PLANS: Add Bilingual Fields
-- ============================================

-- Diet text translations
ALTER TABLE public.client_plans 
ADD COLUMN IF NOT EXISTS diet_text_en TEXT;

ALTER TABLE public.client_plans 
ADD COLUMN IF NOT EXISTS diet_text_ar TEXT;

-- Exercise text translations
ALTER TABLE public.client_plans 
ADD COLUMN IF NOT EXISTS exercise_text_en TEXT;

ALTER TABLE public.client_plans 
ADD COLUMN IF NOT EXISTS exercise_text_ar TEXT;

-- Notes translations
ALTER TABLE public.client_plans 
ADD COLUMN IF NOT EXISTS notes_en TEXT;

ALTER TABLE public.client_plans 
ADD COLUMN IF NOT EXISTS notes_ar TEXT;

-- Migrate existing data
UPDATE public.client_plans 
SET 
  diet_text_en = COALESCE(diet_text_en, diet_text),
  exercise_text_en = COALESCE(exercise_text_en, exercise_text),
  notes_en = COALESCE(notes_en, notes)
WHERE diet_text_en IS NULL OR exercise_text_en IS NULL;


-- ============================================
-- 7. SUBSCRIPTION_PLANS: Add Bilingual Fields
-- ============================================

-- Name translations
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Description translations (if exists)
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Migrate existing data
UPDATE public.subscription_plans 
SET 
  name_en = COALESCE(name_en, name)
WHERE name_en IS NULL;


-- ============================================
-- 8. ALLERGIES: Add Bilingual Fields
-- ============================================

-- Name translations
ALTER TABLE public.allergies 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);

ALTER TABLE public.allergies 
ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);

-- Description translations
ALTER TABLE public.allergies 
ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.allergies 
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Migrate existing data
UPDATE public.allergies 
SET 
  name_en = COALESCE(name_en, name),
  description_en = COALESCE(description_en, description)
WHERE name_en IS NULL;


-- ============================================
-- 9. NOTIFICATIONS: Add Bilingual Fields
-- ============================================

-- Title translations
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS title_en TEXT;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS title_ar TEXT;

-- Message/Body translations
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS message_en TEXT;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS message_ar TEXT;

-- Migrate existing data
UPDATE public.notifications 
SET 
  title_en = COALESCE(title_en, title),
  message_en = COALESCE(message_en, message)
WHERE title_en IS NULL;


-- ============================================
-- HELPER FUNCTION: Get Localized Value
-- ============================================

-- Function to get localized value with fallback
CREATE OR REPLACE FUNCTION public.get_localized(
  p_value_en TEXT,
  p_value_ar TEXT,
  p_locale TEXT DEFAULT 'en',
  p_fallback TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_locale = 'ar' THEN
    RETURN COALESCE(NULLIF(TRIM(p_value_ar), ''), p_value_en, p_fallback);
  ELSE
    RETURN COALESCE(NULLIF(TRIM(p_value_en), ''), p_value_ar, p_fallback);
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_localized IS 'Get localized value with fallback to other language';


-- ============================================
-- VIEW: Localized Meals (Example)
-- ============================================

CREATE OR REPLACE VIEW public.meals_localized AS
SELECT 
  m.*,
  COALESCE(m.name_en, m.name) as display_name_en,
  COALESCE(m.name_ar, m.name_en, m.name) as display_name_ar,
  COALESCE(m.description_en, m.description) as display_description_en,
  COALESCE(m.description_ar, m.description_en, m.description) as display_description_ar
FROM public.meals m;


-- ============================================
-- VIEW: Localized Providers (Example)
-- ============================================

CREATE OR REPLACE VIEW public.meal_providers_localized AS
SELECT 
  mp.*,
  COALESCE(mp.business_name_en, mp.business_name) as display_business_name_en,
  COALESCE(mp.business_name_ar, mp.business_name_en, mp.business_name) as display_business_name_ar,
  COALESCE(mp.provider_name_en, mp.provider_name) as display_provider_name_en,
  COALESCE(mp.provider_name_ar, mp.provider_name_en, mp.provider_name) as display_provider_name_ar,
  COALESCE(mp.bio_en, mp.bio) as display_bio_en,
  COALESCE(mp.bio_ar, mp.bio_en, mp.bio) as display_bio_ar
FROM public.meal_providers mp;


-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON VIEW public.meals_localized IS 'Meals with pre-computed localized display fields';
COMMENT ON VIEW public.meal_providers_localized IS 'Meal providers with pre-computed localized display fields';
