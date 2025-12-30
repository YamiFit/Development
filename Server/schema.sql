-- ============================================
-- YAMIFIT SUPABASE DATABASE SCHEMA
-- Complete database structure for health & meal tracking app
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for meal and provider images
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meal-images');

-- Storage Policies: Allow public access to view images
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'meal-images');

-- Storage Policies: Allow users to update their own images
CREATE POLICY "Allow users to update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'meal-images' AND auth.uid() = owner::uuid);

-- Storage Policies: Allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'meal-images' AND auth.uid() = owner::uuid);

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('user', 'coach', 'meal_provider', 'admin');
CREATE TYPE user_goal AS ENUM ('lose_weight', 'gain_muscle', 'maintain', 'general_health');
CREATE TYPE activity_level AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');
CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE sport_type AS ENUM (
  'Basketball',
  'Boxing',
  'Diving',
  'Football',
  'Golf',
  'Handball',
  'Judo',
  'Swimming',
  'Tennis',
  'Table Tennis'
);
CREATE TYPE work_type AS ENUM (
  'sedentary_office',
  'light_activity',
  'manual_labor',
  'heavy_labor',
  'shift_worker',
  'student',
  'unemployed'
);
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired', 'trial');
CREATE TYPE subscription_plan_type AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'under_preparation', 'ready', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method_type AS ENUM ('credit_card', 'debit_card', 'cash_on_delivery', 'digital_wallet');
CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'dessert');
CREATE TYPE message_sender_type AS ENUM ('user', 'coach');
CREATE TYPE notification_type AS ENUM ('meal_reminder', 'water_reminder', 'order_update', 'subscription_expiry', 'weight_update', 'system');
CREATE TYPE day_of_week AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('BASIC', 'PRO');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user' NOT NULL,
    plan subscription_plan DEFAULT 'BASIC' NOT NULL,
    selected_coach_id UUID NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    date_of_birth DATE,
    gender gender,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE
);

-- ============================================
-- USER HEALTH PROFILE
-- ============================================

CREATE TABLE user_health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_weight DECIMAL(5,2), -- in kg
    target_weight DECIMAL(5,2), -- in kg
    height DECIMAL(5,2), -- in cm
    goal user_goal,
    activity_level activity_level,
    daily_calorie_target INTEGER,
    daily_protein_target INTEGER, -- in grams
    daily_carbs_target INTEGER, -- in grams
    daily_fats_target INTEGER, -- in grams
    daily_water_target INTEGER, -- in ml
    age INTEGER,
    sport sport_type,
    work_type work_type,
    medical_conditions TEXT[],
    gender gender_type,
    bmi DECIMAL(4,2) GENERATED ALWAYS AS (
        CASE 
            WHEN height > 0 THEN current_weight / ((height/100) * (height/100))
            ELSE NULL
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ALLERGIES & DIETARY RESTRICTIONS
-- ============================================

CREATE TABLE allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    severity VARCHAR(50), -- mild, moderate, severe
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    allergy_id UUID REFERENCES allergies(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, allergy_id)
);

-- ============================================
-- WEIGHT TRACKING
-- ============================================

CREATE TABLE weight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL, -- in kg
    log_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, log_date DESC);

-- ============================================
-- MEAL PROVIDERS
-- ============================================

CREATE TABLE meal_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    business_name VARCHAR(255),
    business_license VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url TEXT,
    provider_name VARCHAR(255),
    bio TEXT,
    category VARCHAR(100),
    whatsapp VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROVIDER WORKING HOURS
-- ============================================

CREATE TABLE provider_working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES meal_providers(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    is_open BOOLEAN DEFAULT true,
    open_time TIME,
    close_time TIME,
    delivery_slots JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, day_of_week)
);

CREATE INDEX idx_provider_working_hours_provider ON provider_working_hours(provider_id);

-- ============================================
-- MEALS
-- ============================================

CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES meal_providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category meal_category NOT NULL,
    image_url TEXT,
    price DECIMAL(10,2) NOT NULL,
    calories INTEGER,
    protein INTEGER, -- in grams
    carbs INTEGER, -- in grams
    fats INTEGER, -- in grams
    fiber INTEGER DEFAULT 0, -- in grams
    sugar INTEGER DEFAULT 0, -- in grams
    sodium INTEGER DEFAULT 0, -- in mg
    serving_size VARCHAR(100),
    preparation_time_minutes INTEGER, -- in minutes
    ingredients TEXT[],
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meals_category ON meals(category);
CREATE INDEX idx_meals_provider ON meals(provider_id);
CREATE INDEX idx_meals_available ON meals(is_available);

-- ============================================
-- MEAL REVIEWS
-- ============================================

CREATE TABLE meal_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meal_id, user_id)
);

CREATE INDEX idx_meal_reviews_meal ON meal_reviews(meal_id);

-- ============================================
-- COACHES
-- ============================================

CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    specialization VARCHAR(255),
    bio TEXT,
    certification TEXT[],
    years_of_experience INTEGER,
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER-COACH ASSIGNMENTS
-- ============================================

CREATE TABLE user_coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, coach_id)
);

-- ============================================
-- CHAT MESSAGES
-- ============================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
    sender_type message_sender_type NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user_coach ON chat_messages(user_id, coach_id, created_at DESC);

-- ============================================
-- SUBSCRIPTION PLANS
-- ============================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    plan_type subscription_plan_type NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    meals_per_day INTEGER DEFAULT 3,
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER SUBSCRIPTIONS
-- ============================================

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status subscription_status DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- ============================================
-- ADDRESSES
-- ============================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    label VARCHAR(100), -- Home, Work, etc.
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Jordan',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    delivery_address_id UUID REFERENCES addresses(id),
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    delivery_date DATE,
    delivery_time_slot VARCHAR(50),
    special_instructions TEXT,
    cancellation_reason TEXT,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);

-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method_type NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);

-- ============================================
-- PAYMENT METHODS
-- ============================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type payment_method_type NOT NULL,
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

-- ============================================
-- DAILY MEAL LOGS
-- ============================================

CREATE TABLE daily_meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id),
    log_date DATE DEFAULT CURRENT_DATE,
    meal_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    servings DECIMAL(3,1) DEFAULT 1.0,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    fats INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_meal_logs_user_date ON daily_meal_logs(user_id, log_date DESC);

-- ============================================
-- WATER INTAKE LOGS
-- ============================================

CREATE TABLE water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- in ml
    log_date DATE DEFAULT CURRENT_DATE,
    log_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, log_date DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    meal_reminders BOOLEAN DEFAULT TRUE,
    water_reminders BOOLEAN DEFAULT TRUE,
    order_updates BOOLEAN DEFAULT TRUE,
    subscription_expiry BOOLEAN DEFAULT TRUE,
    weight_updates BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    unit_system VARCHAR(20) DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own preferences
CREATE POLICY "Users can view own preferences" 
    ON user_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
    ON user_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
    ON user_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AI PREDICTIONS & INSIGHTS
-- ============================================

CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    prediction_type VARCHAR(100), -- weight_forecast, goal_achievement, etc.
    prediction_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_predictions_user ON ai_predictions(user_id, created_at DESC);

-- ============================================
-- MEAL RECOMMENDATIONS
-- ============================================

CREATE TABLE meal_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    recommendation_score DECIMAL(3,2),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_meal_recommendations_user ON meal_recommendations(user_id, recommendation_score DESC);

-- ============================================
-- DIET PLANS (for coaches to create)
-- ============================================

CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    daily_calorie_target INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diet_plans_user ON diet_plans(user_id);

-- ============================================
-- DIET PLAN MEALS
-- ============================================

CREATE TABLE diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    meal_category meal_category NOT NULL,
    servings DECIMAL(3,1) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diet_plan_meals_plan ON diet_plan_meals(diet_plan_id);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG (for tracking important changes)
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_working_hours ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Health profiles policies
CREATE POLICY "Users can view own health profile" ON user_health_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own health profile" ON user_health_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health profile" ON user_health_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weight logs policies
CREATE POLICY "Users can view own weight logs" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight logs" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily meal logs policies
CREATE POLICY "Users can view own meal logs" ON daily_meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal logs" ON daily_meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal logs" ON daily_meal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal logs" ON daily_meal_logs FOR DELETE USING (auth.uid() = user_id);

-- Meal providers policies
CREATE POLICY "Providers can view own profile" ON meal_providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Providers can insert own profile" ON meal_providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update own profile" ON meal_providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all providers" ON meal_providers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update all providers" ON meal_providers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users can view verified providers" ON meal_providers FOR SELECT USING (is_verified = true AND is_active = true);

-- Meals policies
CREATE POLICY "Everyone can view available meals" ON meals FOR SELECT USING (is_available = true);
CREATE POLICY "Providers can view own meals" ON meals FOR SELECT USING (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = meals.provider_id AND meal_providers.user_id = auth.uid())
);
CREATE POLICY "Providers can insert own meals" ON meals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = meals.provider_id AND meal_providers.user_id = auth.uid())
);
CREATE POLICY "Providers can update own meals" ON meals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = meals.provider_id AND meal_providers.user_id = auth.uid())
);
CREATE POLICY "Providers can delete own meals" ON meals FOR DELETE USING (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = meals.provider_id AND meal_providers.user_id = auth.uid())
);

-- Provider working hours policies
CREATE POLICY "Providers can view own working hours" ON provider_working_hours FOR SELECT USING (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = provider_working_hours.provider_id AND meal_providers.user_id = auth.uid())
);
CREATE POLICY "Providers can insert own working hours" ON provider_working_hours FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = provider_working_hours.provider_id AND meal_providers.user_id = auth.uid())
);
CREATE POLICY "Providers can update own working hours" ON provider_working_hours FOR UPDATE USING (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = provider_working_hours.provider_id AND meal_providers.user_id = auth.uid())
);
CREATE POLICY "Providers can delete own working hours" ON provider_working_hours FOR DELETE USING (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = provider_working_hours.provider_id AND meal_providers.user_id = auth.uid())
);
CREATE POLICY "Users can view provider working hours" ON provider_working_hours FOR SELECT USING (
  EXISTS (SELECT 1 FROM meal_providers WHERE meal_providers.id = provider_working_hours.provider_id AND meal_providers.is_verified = true AND meal_providers.is_active = true)
);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_health_profiles_updated_at BEFORE UPDATE ON user_health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_providers_updated_at BEFORE UPDATE ON meal_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_working_hours_updated_at BEFORE UPDATE ON provider_working_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    'user',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate daily nutrition totals
CREATE OR REPLACE FUNCTION get_daily_nutrition_summary(p_user_id UUID, p_date DATE)
RETURNS TABLE (
    total_calories INTEGER,
    total_protein INTEGER,
    total_carbs INTEGER,
    total_fats INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(calories)::INTEGER as total_calories,
        SUM(protein)::INTEGER as total_protein,
        SUM(carbs)::INTEGER as total_carbs,
        SUM(fats)::INTEGER as total_fats
    FROM daily_meal_logs
    WHERE user_id = p_user_id AND log_date = p_date;
END;
$$ LANGUAGE plpgsql;

-- Function to update meal rating when review is added
CREATE OR REPLACE FUNCTION update_meal_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE meals
    SET 
        rating = (SELECT AVG(rating) FROM meal_reviews WHERE meal_id = NEW.meal_id),
        total_reviews = (SELECT COUNT(*) FROM meal_reviews WHERE meal_id = NEW.meal_id)
    WHERE id = NEW.meal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meal_rating_trigger AFTER INSERT OR UPDATE ON meal_reviews
    FOR EACH ROW EXECUTE FUNCTION update_meal_rating();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert some common allergies
INSERT INTO allergies (name, description, severity) VALUES
    ('Peanuts', 'Peanut allergy', 'severe'),
    ('Tree Nuts', 'Tree nut allergy', 'severe'),
    ('Dairy', 'Lactose intolerance or milk allergy', 'moderate'),
    ('Eggs', 'Egg allergy', 'moderate'),
    ('Soy', 'Soy allergy', 'moderate'),
    ('Wheat', 'Wheat/Gluten allergy', 'moderate'),
    ('Fish', 'Fish allergy', 'severe'),
    ('Shellfish', 'Shellfish allergy', 'severe');

-- Insert default subscription plans
INSERT INTO subscription_plans (name, plan_type, price, duration_days, meals_per_day, features) VALUES
    ('Weekly Plan', 'weekly', 49.99, 7, 3, ARRAY['3 meals per day', 'Nutritionist support', 'Custom meal plans']),
    ('Monthly Plan', 'monthly', 179.99, 30, 3, ARRAY['3 meals per day', 'Nutritionist support', 'Custom meal plans', 'Priority delivery', '10% discount']);

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
    ('delivery_fee', '5.00', 'Standard delivery fee in JOD'),
    ('tax_rate', '0.16', 'Tax rate (16%)'),
    ('free_delivery_threshold', '50.00', 'Minimum order amount for free delivery');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for user dashboard summary
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    p.id as user_id,
    p.full_name,
    uhp.current_weight,
    uhp.target_weight,
    uhp.daily_calorie_target,
    uhp.bmi,
    us.status as subscription_status,
    us.end_date as subscription_end_date
FROM profiles p
LEFT JOIN user_health_profiles uhp ON p.id = uhp.user_id
LEFT JOIN user_subscriptions us ON p.id = us.user_id AND us.status = 'active';

-- View for active orders with details
CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
    o.id,
    o.user_id,
    p.full_name as user_name,
    o.status,
    o.total_amount,
    o.delivery_date,
    o.created_at,
    a.street_address,
    a.city,
    COUNT(oi.id) as total_items
FROM orders o
JOIN profiles p ON o.user_id = p.id
LEFT JOIN addresses a ON o.delivery_address_id = a.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery')
GROUP BY o.id, p.full_name, a.street_address, a.city;

-- ============================================
-- ADMIN MIGRATIONS - Added for Admin Panel
-- ============================================

-- Migration 001: Add missing columns to meal_providers
ALTER TABLE meal_providers 
ADD COLUMN IF NOT EXISTS is_temporarily_disabled BOOLEAN DEFAULT FALSE;

ALTER TABLE meal_providers 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE meal_providers 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

ALTER TABLE meal_providers 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE meal_providers 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN meal_providers.is_temporarily_disabled IS 'Provider temporarily unavailable (vacation mode)';
COMMENT ON COLUMN meal_providers.verified_by IS 'Admin who verified this provider';

-- Migration 002: Add missing columns to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES meal_providers(id);

-- Create delivery_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_type_enum') THEN
    CREATE TYPE delivery_type_enum AS ENUM ('pickup', 'delivery');
  END IF;
END $$;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_type delivery_type_enum DEFAULT 'delivery';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_orders_provider ON orders(provider_id);

-- Migration 003: Add meals tracking columns
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- ============================================
-- ADMIN ACTIVITY LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES profiles(id) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin ON admin_activity_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON admin_activity_log(entity_type, entity_id);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN HELPER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user owns an order (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_owns_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = p_order_id 
    AND orders.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if provider owns order (bypasses RLS)
CREATE OR REPLACE FUNCTION public.provider_owns_order(p_order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders o
    JOIN meal_providers mp ON o.provider_id = mp.id
    WHERE o.id = p_order_id 
    AND mp.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADMIN RLS POLICIES
-- ============================================

-- Admin activity log policies
CREATE POLICY "Admins can view all activity logs"
    ON admin_activity_log FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert activity logs"
    ON admin_activity_log FOR INSERT
    WITH CHECK (public.is_admin());

-- Drop existing meal_providers policies and recreate
DROP POLICY IF EXISTS "Providers can view own profile" ON meal_providers;
DROP POLICY IF EXISTS "Admins can view all providers" ON meal_providers;
DROP POLICY IF EXISTS "Admins can update all providers" ON meal_providers;
DROP POLICY IF EXISTS "Users can view verified providers" ON meal_providers;
DROP POLICY IF EXISTS "Providers can insert own profile" ON meal_providers;
DROP POLICY IF EXISTS "Providers can update own profile" ON meal_providers;

-- New meal_providers policies
CREATE POLICY "Admins full access to meal_providers"
    ON meal_providers FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Providers can view own profile"
    ON meal_providers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile"
    ON meal_providers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can insert own profile"
    ON meal_providers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view active verified providers"
    ON meal_providers FOR SELECT
    USING (
        is_verified = true 
        AND is_active = true 
        AND (is_temporarily_disabled IS NULL OR is_temporarily_disabled = false)
    );

-- Drop existing meals policies and recreate
DROP POLICY IF EXISTS "Everyone can view available meals" ON meals;
DROP POLICY IF EXISTS "Providers can view own meals" ON meals;
DROP POLICY IF EXISTS "Providers can insert own meals" ON meals;
DROP POLICY IF EXISTS "Providers can update own meals" ON meals;
DROP POLICY IF EXISTS "Providers can delete own meals" ON meals;

-- New meals policies
CREATE POLICY "Admins full access to meals"
    ON meals FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Providers can manage own meals"
    ON meals FOR ALL
    USING (EXISTS (
        SELECT 1 FROM meal_providers 
        WHERE meal_providers.id = meals.provider_id 
        AND meal_providers.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM meal_providers 
        WHERE meal_providers.id = meals.provider_id 
        AND meal_providers.user_id = auth.uid()
    ));

CREATE POLICY "Users can view available meals from active providers"
    ON meals FOR SELECT
    USING (
        is_available = true 
        AND (deleted_at IS NULL)
        AND EXISTS (
            SELECT 1 FROM meal_providers 
            WHERE meal_providers.id = meals.provider_id
            AND meal_providers.is_active = true
            AND meal_providers.is_verified = true
        )
    );

-- Drop existing orders policies and recreate
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins full access to orders" ON orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Providers can view orders with their meals" ON orders;
DROP POLICY IF EXISTS "Providers can update order status" ON orders;

-- New orders policies
CREATE POLICY "Admins full access to orders"
    ON orders FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- Use provider_id column directly to avoid recursion through order_items
CREATE POLICY "Providers can view orders for their meals"
    ON orders FOR SELECT
    USING (
        provider_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM meal_providers 
            WHERE meal_providers.id = orders.provider_id 
            AND meal_providers.user_id = auth.uid()
        )
    );

CREATE POLICY "Providers can update order status"
    ON orders FOR UPDATE
    USING (
        provider_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM meal_providers 
            WHERE meal_providers.id = orders.provider_id 
            AND meal_providers.user_id = auth.uid()
        )
    );

-- Enable RLS on order_items if not already
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order items policies
DROP POLICY IF EXISTS "Admins full access to order_items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Providers can view order items for their meals" ON order_items;

CREATE POLICY "Admins full access to order_items"
    ON order_items FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Use SECURITY DEFINER function to avoid recursion
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (public.user_owns_order(order_id));

CREATE POLICY "Users can insert own order items"
    ON order_items FOR INSERT
    WITH CHECK (public.user_owns_order(order_id));

CREATE POLICY "Providers can view order items for their meals"
    ON order_items FOR SELECT
    USING (public.provider_owns_order(order_id));

-- Update provider_working_hours policies
DROP POLICY IF EXISTS "Providers can view own working hours" ON provider_working_hours;
DROP POLICY IF EXISTS "Providers can insert own working hours" ON provider_working_hours;
DROP POLICY IF EXISTS "Providers can update own working hours" ON provider_working_hours;
DROP POLICY IF EXISTS "Providers can delete own working hours" ON provider_working_hours;
DROP POLICY IF EXISTS "Users can view provider working hours" ON provider_working_hours;

CREATE POLICY "Admins full access to working hours"
    ON provider_working_hours FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Providers can manage own working hours"
    ON provider_working_hours FOR ALL
    USING (EXISTS (
        SELECT 1 FROM meal_providers 
        WHERE meal_providers.id = provider_working_hours.provider_id 
        AND meal_providers.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM meal_providers 
        WHERE meal_providers.id = provider_working_hours.provider_id 
        AND meal_providers.user_id = auth.uid()
    ));

CREATE POLICY "Users can view working hours of active providers"
    ON provider_working_hours FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM meal_providers 
        WHERE meal_providers.id = provider_working_hours.provider_id
        AND meal_providers.is_active = true
        AND meal_providers.is_verified = true
    ));

-- ============================================
-- ADMIN VIEWS
-- ============================================

-- View for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM meal_providers) as total_providers,
    (SELECT COUNT(*) FROM meal_providers WHERE is_verified = true) as verified_providers,
    (SELECT COUNT(*) FROM meal_providers WHERE is_active = true) as active_providers,
    (SELECT COUNT(*) FROM meals) as total_meals,
    (SELECT COUNT(*) FROM meals WHERE is_available = true) as available_meals,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status NOT IN ('cancelled')) as total_revenue;

-- View for provider overview
CREATE OR REPLACE VIEW admin_providers_view AS
SELECT 
    mp.id,
    mp.user_id,
    mp.business_name,
    mp.provider_name,
    mp.email,
    mp.phone,
    mp.address,
    mp.is_verified,
    mp.is_active,
    mp.is_temporarily_disabled,
    mp.rating,
    mp.total_reviews,
    mp.profile_image_url,
    mp.created_at,
    mp.updated_at,
    p.full_name as owner_name,
    p.email as owner_email,
    (SELECT COUNT(*) FROM meals WHERE meals.provider_id = mp.id) as meals_count,
    (SELECT COUNT(*) FROM orders o 
     JOIN order_items oi ON o.id = oi.order_id 
     JOIN meals m ON oi.meal_id = m.id 
     WHERE m.provider_id = mp.id) as orders_count
FROM meal_providers mp
LEFT JOIN profiles p ON mp.user_id = p.id;

-- View for orders with details
CREATE OR REPLACE VIEW admin_orders_view AS
SELECT 
    o.id,
    o.user_id,
    o.provider_id,
    o.status,
    o.total_amount,
    o.delivery_fee,
    o.discount_amount,
    o.tax_amount,
    o.delivery_date,
    o.delivery_time_slot,
    o.delivery_type,
    o.special_instructions,
    o.cancellation_reason,
    o.cancelled_by,
    o.cancelled_at,
    o.created_at,
    o.updated_at,
    p.full_name as customer_name,
    p.email as customer_email,
    p.phone as customer_phone,
    a.street_address,
    a.city,
    a.postal_code,
    mp.business_name as provider_name,
    (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = o.id) as items_count
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN addresses a ON o.delivery_address_id = a.id
LEFT JOIN meal_providers mp ON o.provider_id = mp.id;

-- ============================================
-- ADMIN USER ROLE MANAGEMENT
-- ============================================

-- Drop existing profile policies that conflict
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (EXCEPT role field - enforced by trigger)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can view ALL profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (public.is_admin());

-- Coaches can view their assigned clients' profiles
DROP POLICY IF EXISTS "Coaches can view client profiles" ON profiles;
CREATE POLICY "Coaches can view client profiles"
    ON profiles FOR SELECT
    USING (public.is_my_client(id));

-- Admins can update any profile (for role management)
CREATE POLICY "Admins can update user roles"
    ON profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Function to prevent non-admins from changing their own role
CREATE OR REPLACE FUNCTION prevent_role_self_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is being changed
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Only admins can change roles
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Only administrators can change user roles';
        END IF;
        
        -- Prevent removing the last admin (optional safety)
        IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
            IF (SELECT COUNT(*) FROM profiles WHERE role = 'admin' AND id != OLD.id) = 0 THEN
                RAISE EXCEPTION 'Cannot remove the last administrator';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_self_update();

-- Admin view for user management
CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.avatar_url,
    p.role,
    p.is_active,
    p.email_verified,
    p.created_at,
    p.updated_at,
    p.last_login
FROM profiles p
ORDER BY p.created_at DESC;

-- ============================================
-- ORDERS LIFECYCLE VIEWS AND FUNCTIONS
-- ============================================

-- Order status constants for clarity
-- Active statuses: pending, confirmed, preparing, ready, out_for_delivery
-- Past statuses: completed, delivered, cancelled

-- View for user's active orders (pending through out_for_delivery)
CREATE OR REPLACE VIEW user_active_orders_view AS
SELECT 
    o.id,
    o.user_id,
    o.provider_id,
    o.status,
    o.total_amount,
    o.delivery_fee,
    o.discount_amount,
    o.delivery_date,
    o.delivery_time_slot,
    o.delivery_type,
    o.special_instructions,
    o.created_at,
    o.updated_at,
    mp.business_name as provider_name,
    mp.provider_name as provider_display_name,
    mp.profile_image_url as provider_image,
    mp.phone as provider_phone,
    a.street_address,
    a.city,
    (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = o.id) as items_count
FROM orders o
LEFT JOIN meal_providers mp ON o.provider_id = mp.id
LEFT JOIN addresses a ON o.delivery_address_id = a.id
WHERE o.status IN ('pending', 'confirmed', 'preparing', 'under_preparation', 'ready', 'out_for_delivery');

-- View for user's past orders (completed, delivered, cancelled)
CREATE OR REPLACE VIEW user_past_orders_view AS
SELECT 
    o.id,
    o.user_id,
    o.provider_id,
    o.status,
    o.total_amount,
    o.delivery_fee,
    o.discount_amount,
    o.delivery_date,
    o.delivery_time_slot,
    o.delivery_type,
    o.special_instructions,
    o.cancellation_reason,
    o.cancelled_at,
    o.created_at,
    o.updated_at,
    mp.business_name as provider_name,
    mp.provider_name as provider_display_name,
    mp.profile_image_url as provider_image,
    a.street_address,
    a.city,
    (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = o.id) as items_count
FROM orders o
LEFT JOIN meal_providers mp ON o.provider_id = mp.id
LEFT JOIN addresses a ON o.delivery_address_id = a.id
WHERE o.status IN ('completed', 'delivered', 'cancelled');

-- View for provider's recent orders
CREATE OR REPLACE VIEW provider_recent_orders_view AS
SELECT 
    o.id,
    o.user_id,
    o.provider_id,
    o.status,
    o.total_amount,
    o.created_at,
    o.updated_at,
    p.full_name as customer_name,
    p.avatar_url as customer_avatar,
    (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = o.id) as items_count
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.provider_id IS NOT NULL
ORDER BY o.created_at DESC;

-- ============================================
-- POPULAR MEALS ANALYTICS FUNCTION (RPC)
-- ============================================

-- Function to get popular meals for a provider
-- Returns top N meals by total quantity sold
CREATE OR REPLACE FUNCTION get_provider_popular_meals(
    p_provider_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    meal_id UUID,
    meal_name VARCHAR(255),
    meal_image_url TEXT,
    meal_price DECIMAL(10,2),
    meal_category meal_category,
    total_sold BIGINT,
    total_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as meal_id,
        m.name as meal_name,
        m.image_url as meal_image_url,
        m.price as meal_price,
        m.category as meal_category,
        COALESCE(SUM(oi.quantity), 0)::BIGINT as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
    FROM meals m
    LEFT JOIN order_items oi ON oi.meal_id = m.id
    LEFT JOIN orders o ON o.id = oi.order_id
        AND o.status NOT IN ('cancelled', 'pending')  -- Only count non-cancelled, non-pending orders
    WHERE m.provider_id = p_provider_id
        AND m.deleted_at IS NULL
    GROUP BY m.id, m.name, m.image_url, m.price, m.category
    ORDER BY total_sold DESC, total_revenue DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get provider order stats by status
CREATE OR REPLACE FUNCTION get_provider_order_stats(p_provider_id UUID)
RETURNS TABLE (
    status order_status,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.status,
        COUNT(*)::BIGINT as count
    FROM orders o
    WHERE o.provider_id = p_provider_id
    GROUP BY o.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get provider revenue summary
CREATE OR REPLACE FUNCTION get_provider_revenue_summary(
    p_provider_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_revenue DECIMAL(12,2),
    total_orders BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    avg_order_value DECIMAL(10,2)
) AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE := NOW() - (p_days || ' days')::INTERVAL;
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(
            CASE WHEN o.status NOT IN ('cancelled') 
            THEN o.total_amount ELSE 0 END
        ), 0) as total_revenue,
        COUNT(*)::BIGINT as total_orders,
        COUNT(CASE WHEN o.status IN ('completed', 'delivered') THEN 1 END)::BIGINT as completed_orders,
        COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END)::BIGINT as cancelled_orders,
        COALESCE(AVG(
            CASE WHEN o.status NOT IN ('cancelled') 
            THEN o.total_amount END
        ), 0) as avg_order_value
    FROM orders o
    WHERE o.provider_id = p_provider_id
        AND o.created_at >= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME PUBLICATION FOR ORDERS
-- ============================================

-- Enable realtime for orders table (if not already enabled)
-- Note: Run this in Supabase Dashboard > Database > Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'Main user profiles table linked to Supabase auth';
COMMENT ON TABLE user_health_profiles IS 'User health metrics and targets';
COMMENT ON TABLE meals IS 'Meal catalog with nutritional information';
COMMENT ON TABLE orders IS 'Customer orders for meal subscriptions';
COMMENT ON TABLE coaches IS 'Nutritionist/coach profiles';
COMMENT ON TABLE chat_messages IS 'Messages between users and coaches';
COMMENT ON TABLE daily_meal_logs IS 'Daily food intake tracking';
COMMENT ON TABLE weight_logs IS 'Historical weight measurements';
COMMENT ON TABLE ai_predictions IS 'AI-generated predictions and insights';
COMMENT ON TABLE admin_activity_log IS 'Audit log for admin actions';

COMMENT ON FUNCTION get_provider_popular_meals IS 'Returns top N popular meals for a provider by quantity sold';
COMMENT ON FUNCTION get_provider_order_stats IS 'Returns order count grouped by status for a provider';
COMMENT ON FUNCTION get_provider_revenue_summary IS 'Returns revenue summary for a provider over specified days';

-- ============================================
-- COACH PROFILE TABLES
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Enable RLS on coach tables
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_training_places ENABLE ROW LEVEL SECURITY;

-- Coach profile policies: Coach can manage their own profile
DROP POLICY IF EXISTS "coach_profiles_select_own" ON public.coach_profiles;
CREATE POLICY "coach_profiles_select_own"
ON public.coach_profiles
FOR SELECT
USING (coach_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "coach_profiles_insert_own" ON public.coach_profiles;
CREATE POLICY "coach_profiles_insert_own"
ON public.coach_profiles
FOR INSERT
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "coach_profiles_update_own" ON public.coach_profiles;
CREATE POLICY "coach_profiles_update_own"
ON public.coach_profiles
FOR UPDATE
USING (coach_id = auth.uid() OR public.is_admin())
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

-- Coach training places policies: Coach can manage their own rows
DROP POLICY IF EXISTS "coach_places_select_own" ON public.coach_training_places;
CREATE POLICY "coach_places_select_own"
ON public.coach_training_places
FOR SELECT
USING (coach_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "coach_places_insert_own" ON public.coach_training_places;
CREATE POLICY "coach_places_insert_own"
ON public.coach_training_places
FOR INSERT
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "coach_places_update_own" ON public.coach_training_places;
CREATE POLICY "coach_places_update_own"
ON public.coach_training_places
FOR UPDATE
USING (coach_id = auth.uid() OR public.is_admin())
WITH CHECK (coach_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "coach_places_delete_own" ON public.coach_training_places;
CREATE POLICY "coach_places_delete_own"
ON public.coach_training_places
FOR DELETE
USING (coach_id = auth.uid() OR public.is_admin());

-- Public can view public coach profiles
DROP POLICY IF EXISTS "coach_profiles_public_view" ON public.coach_profiles;
CREATE POLICY "coach_profiles_public_view"
ON public.coach_profiles
FOR SELECT
USING (is_public = TRUE);

COMMENT ON TABLE public.coach_profiles IS 'Coach profile information for users with coach role';
COMMENT ON TABLE public.coach_training_places IS 'Training/work history places for coaches';

-- ============================================
-- ADD SELECTED COACH FOREIGN KEY TO PROFILES
-- ============================================

-- Add FK constraint for selected_coach_id (after coach_profiles exists)
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_selected_coach 
FOREIGN KEY (selected_coach_id) 
REFERENCES public.coach_profiles(coach_id) 
ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_selected_coach ON public.profiles(selected_coach_id);

-- RLS policy for updating selected_coach_id
DROP POLICY IF EXISTS "Users can update own selected coach" ON profiles;
CREATE POLICY "Users can update own selected coach"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- COACH-CLIENT ASSIGNMENT SYSTEM
-- ============================================

-- Enable btree_gist extension for exclusion constraints on time ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

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
  
  CONSTRAINT chk_user_not_coach CHECK (user_id != coach_id)
);

-- Unique constraint: one active assignment per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment_per_user 
ON public.coach_client_assignments(user_id) 
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_coach 
ON public.coach_client_assignments(coach_id, status);

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
  
  CONSTRAINT unique_conversation_pair UNIQUE (coach_id, user_id),
  CONSTRAINT chk_user_not_coach_conv CHECK (user_id != coach_id)
);

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

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(sender_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- CLIENT PLANS TABLE (Diet & Exercise)
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diet_plan JSONB NULL,
  diet_text TEXT NULL,
  exercise_plan JSONB NULL,
  exercise_text TEXT NULL,
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_user_not_coach_plan CHECK (user_id != coach_id)
);

CREATE INDEX IF NOT EXISTS idx_client_plans_coach ON public.client_plans(coach_id, is_active);
CREATE INDEX IF NOT EXISTS idx_client_plans_user ON public.client_plans(user_id, is_active);

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

CREATE INDEX IF NOT EXISTS idx_appointments_coach_time ON public.appointments(coach_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_user_time ON public.appointments(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_coach_client_assignments_updated_at ON public.coach_client_assignments;
CREATE TRIGGER trg_coach_client_assignments_updated_at
BEFORE UPDATE ON public.coach_client_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_client_plans_updated_at ON public.client_plans;
CREATE TRIGGER trg_client_plans_updated_at
BEFORE UPDATE ON public.client_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update conversation last_message_at
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coach'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_active_assignment(p_coach_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_assignments
    WHERE coach_id = p_coach_id 
      AND user_id = p_user_id 
      AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_active_coach()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT coach_id FROM public.coach_client_assignments
  WHERE user_id = auth.uid() AND status = 'ACTIVE'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_my_client(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_client_assignments
    WHERE coach_id = auth.uid() 
      AND user_id = p_user_id 
      AND status = 'ACTIVE'
  );
$$;

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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  
  IF v_user_role != 'user' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only users can select a coach');
  END IF;
  
  SELECT role INTO v_coach_role FROM public.profiles WHERE id = p_coach_id;
  
  IF v_coach_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coach not found');
  END IF;
  
  IF v_coach_role != 'coach' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selected user is not a coach');
  END IF;
  
  SELECT * INTO v_current_assignment
  FROM public.coach_client_assignments
  WHERE user_id = v_user_id AND status = 'ACTIVE'
  FOR UPDATE;
  
  IF v_current_assignment IS NOT NULL THEN
    IF v_current_assignment.coach_id = p_coach_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'You are already assigned to this coach');
    END IF;
    
    v_days_since_assignment := EXTRACT(DAY FROM (NOW() - v_current_assignment.assigned_at))::INTEGER;
    
    IF v_days_since_assignment < v_cooldown_days THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('You can change your coach after %s days. Please wait %s more day(s).', 
          v_cooldown_days, v_cooldown_days - v_days_since_assignment),
        'cooldown_remaining_days', v_cooldown_days - v_days_since_assignment
      );
    END IF;
    
    UPDATE public.coach_client_assignments
    SET status = 'ENDED', ended_at = NOW(), ended_reason = 'User switched to another coach'
    WHERE id = v_current_assignment.id;
  END IF;
  
  v_coach_client_count := public.count_coach_active_clients(p_coach_id);
  
  IF v_coach_client_count >= v_max_clients THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coach is at maximum capacity.', 'max_capacity', v_max_clients);
  END IF;
  
  INSERT INTO public.coach_client_assignments (user_id, coach_id, status, assigned_at)
  VALUES (v_user_id, p_coach_id, 'ACTIVE', NOW())
  RETURNING id INTO v_new_assignment_id;
  
  UPDATE public.profiles
  SET selected_coach_id = p_coach_id, updated_at = NOW()
  WHERE id = v_user_id;
  
  INSERT INTO public.conversations (coach_id, user_id)
  VALUES (p_coach_id, v_user_id)
  ON CONFLICT (coach_id, user_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Coach assigned successfully',
    'assignment_id', v_new_assignment_id,
    'coach_id', p_coach_id
  );
  
EXCEPTION
  WHEN unique_violation THEN
    UPDATE public.coach_client_assignments
    SET status = 'ENDED', ended_at = NOW(), ended_reason = 'Auto-ended for new selection'
    WHERE user_id = v_user_id AND status = 'ACTIVE';
    
    INSERT INTO public.coach_client_assignments (user_id, coach_id, status, assigned_at)
    VALUES (v_user_id, p_coach_id, 'ACTIVE', NOW())
    RETURNING id INTO v_new_assignment_id;
    
    UPDATE public.profiles SET selected_coach_id = p_coach_id WHERE id = v_user_id;
    
    INSERT INTO public.conversations (coach_id, user_id)
    VALUES (p_coach_id, v_user_id) ON CONFLICT DO NOTHING;
    
    RETURN jsonb_build_object('success', true, 'assignment_id', v_new_assignment_id, 'coach_id', p_coach_id);
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  IF p_end_time <= p_start_time THEN
    RETURN jsonb_build_object('success', false, 'error', 'End time must be after start time');
  END IF;
  
  IF p_start_time < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot book appointments in the past');
  END IF;
  
  IF p_end_time - p_start_time < interval '15 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment must be at least 15 minutes');
  END IF;
  
  IF p_end_time - p_start_time > interval '4 hours' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment cannot exceed 4 hours');
  END IF;
  
  v_has_assignment := public.has_active_assignment(p_coach_id, v_user_id);
  
  IF NOT v_has_assignment THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be assigned to this coach to book an appointment');
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE coach_id = p_coach_id
      AND status IN ('REQUESTED', 'CONFIRMED')
      AND tstzrange(start_time, end_time, '[)') && tstzrange(p_start_time, p_end_time, '[)')
  ) INTO v_coach_conflict;
  
  IF v_coach_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'This time slot conflicts with an existing appointment');
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE user_id = v_user_id
      AND status IN ('REQUESTED', 'CONFIRMED')
      AND tstzrange(start_time, end_time, '[)') && tstzrange(p_start_time, p_end_time, '[)')
  ) INTO v_user_conflict;
  
  IF v_user_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'This time slot conflicts with one of your existing appointments');
  END IF;
  
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
-- RPC: UPDATE APPOINTMENT STATUS
-- ============================================
-- Accepts TEXT parameter and casts to appointment_status enum internally
-- to avoid PostgREST 22P02 errors with custom enum types

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
  
  SELECT * INTO v_appointment FROM public.appointments WHERE id = p_appointment_id;
  
  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
  END IF;
  
  IF v_appointment.coach_id != v_user_id AND NOT public.is_admin() THEN
    IF v_appointment.user_id = v_user_id AND v_status = 'CANCELED' THEN
      NULL;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'You are not authorized to update this appointment');
    END IF;
  END IF;
  
  UPDATE public.appointments
  SET status = v_status, updated_at = NOW()
  WHERE id = p_appointment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Appointment %s successfully', lower(v_status::text))
  );
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
  
  SELECT * INTO v_conversation FROM public.conversations WHERE id = p_conversation_id;
  
  IF v_conversation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
  END IF;
  
  IF v_user_id != v_conversation.coach_id AND v_user_id != v_conversation.user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not part of this conversation');
  END IF;
  
  v_has_assignment := public.has_active_assignment(v_conversation.coach_id, v_conversation.user_id);
  
  IF NOT v_has_assignment AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send messages without an active coaching assignment');
  END IF;
  
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
  
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  SELECT role INTO v_other_role FROM public.profiles WHERE id = p_other_user_id;
  
  IF v_other_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF v_user_role = 'coach' AND v_other_role = 'user' THEN
    v_coach_id := v_user_id;
    v_client_id := p_other_user_id;
  ELSIF v_user_role = 'user' AND v_other_role = 'coach' THEN
    v_coach_id := p_other_user_id;
    v_client_id := v_user_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Conversation must be between a coach and a user');
  END IF;
  
  v_has_assignment := public.has_active_assignment(v_coach_id, v_client_id);
  
  IF NOT v_has_assignment AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active coaching assignment exists');
  END IF;
  
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
-- ENABLE RLS ON COACH-CLIENT TABLES
-- ============================================

ALTER TABLE public.coach_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: COACH_CLIENT_ASSIGNMENTS
-- ============================================

DROP POLICY IF EXISTS "assignments_select_own_user" ON public.coach_client_assignments;
CREATE POLICY "assignments_select_own_user"
ON public.coach_client_assignments FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "assignments_select_own_coach" ON public.coach_client_assignments;
CREATE POLICY "assignments_select_own_coach"
ON public.coach_client_assignments FOR SELECT
USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "assignments_select_admin" ON public.coach_client_assignments;
CREATE POLICY "assignments_select_admin"
ON public.coach_client_assignments FOR SELECT
USING (public.is_admin());

-- ============================================
-- RLS POLICIES: CONVERSATIONS
-- ============================================

DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant"
ON public.conversations FOR SELECT
USING (user_id = auth.uid() OR coach_id = auth.uid() OR public.is_admin());

-- ============================================
-- RLS POLICIES: MESSAGES
-- ============================================

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

DROP POLICY IF EXISTS "messages_update_read_status" ON public.messages;
CREATE POLICY "messages_update_read_status"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR c.coach_id = auth.uid())
  )
  AND sender_id != auth.uid()
);

-- ============================================
-- RLS POLICIES: CLIENT_PLANS
-- ============================================

DROP POLICY IF EXISTS "client_plans_select_user" ON public.client_plans;
CREATE POLICY "client_plans_select_user"
ON public.client_plans FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "client_plans_select_coach" ON public.client_plans;
CREATE POLICY "client_plans_select_coach"
ON public.client_plans FOR SELECT
USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "client_plans_select_admin" ON public.client_plans;
CREATE POLICY "client_plans_select_admin"
ON public.client_plans FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "client_plans_insert_coach" ON public.client_plans;
CREATE POLICY "client_plans_insert_coach"
ON public.client_plans FOR INSERT
WITH CHECK (coach_id = auth.uid() AND public.is_my_client(user_id));

DROP POLICY IF EXISTS "client_plans_update_coach" ON public.client_plans;
CREATE POLICY "client_plans_update_coach"
ON public.client_plans FOR UPDATE
USING (coach_id = auth.uid() AND public.is_my_client(user_id))
WITH CHECK (coach_id = auth.uid() AND public.is_my_client(user_id));

DROP POLICY IF EXISTS "client_plans_delete_coach" ON public.client_plans;
CREATE POLICY "client_plans_delete_coach"
ON public.client_plans FOR DELETE
USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "client_plans_admin_all" ON public.client_plans;
CREATE POLICY "client_plans_admin_all"
ON public.client_plans FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================
-- RLS POLICIES: APPOINTMENTS
-- ============================================

DROP POLICY IF EXISTS "appointments_select_user" ON public.appointments;
CREATE POLICY "appointments_select_user"
ON public.appointments FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "appointments_select_coach" ON public.appointments;
CREATE POLICY "appointments_select_coach"
ON public.appointments FOR SELECT
USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
CREATE POLICY "appointments_select_admin"
ON public.appointments FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "appointments_insert_user" ON public.appointments;
CREATE POLICY "appointments_insert_user"
ON public.appointments FOR INSERT
WITH CHECK (user_id = auth.uid() AND public.has_active_assignment(coach_id, auth.uid()));

DROP POLICY IF EXISTS "appointments_update_user" ON public.appointments;
CREATE POLICY "appointments_update_user"
ON public.appointments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "appointments_update_coach" ON public.appointments;
CREATE POLICY "appointments_update_coach"
ON public.appointments FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- ============================================
-- RLS: COACH CAN READ CLIENT HEALTH PROFILES
-- ============================================

DROP POLICY IF EXISTS "health_profiles_coach_read" ON public.user_health_profiles;
CREATE POLICY "health_profiles_coach_read"
ON public.user_health_profiles FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_my_client(user_id)
  OR public.is_admin()
);

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.select_coach(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_appointment_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_assignment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_active_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_coach_active_clients(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach() TO authenticated;

-- ============================================
-- CHAT ATTACHMENTS & SECURITY HARDENING
-- ============================================

-- Message Type Enum
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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

-- Update body constraint for attachments
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS chk_body_not_empty;

ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS chk_message_has_content;

ALTER TABLE public.messages 
ALTER COLUMN body DROP NOT NULL;

ALTER TABLE public.messages 
ADD CONSTRAINT chk_message_has_content CHECK (
  (body IS NOT NULL AND length(trim(body)) > 0) 
  OR 
  (attachment_path IS NOT NULL AND attachment_name IS NOT NULL)
);

-- Indexes for attachments
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_attachment ON public.messages(conversation_id) 
WHERE attachment_path IS NOT NULL;

-- ============================================
-- CHAT ATTACHMENTS STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  false,
  52428800,
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
-- CHAT ACCESS HELPER FUNCTIONS
-- ============================================

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
-- HARDENED RLS POLICIES FOR CONVERSATIONS
-- ============================================

DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_with_assignment" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;

CREATE POLICY "conversations_select_participant"
ON public.conversations FOR SELECT
USING (
  user_id = auth.uid() 
  OR coach_id = auth.uid() 
  OR public.is_admin()
);

CREATE POLICY "conversations_insert_with_assignment"
ON public.conversations FOR INSERT
WITH CHECK (
  (
    (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.coach_client_assignments
      WHERE coach_client_assignments.user_id = auth.uid()
        AND coach_client_assignments.coach_id = conversations.coach_id
        AND coach_client_assignments.status = 'ACTIVE'
    ))
    OR
    (coach_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.coach_client_assignments
      WHERE coach_client_assignments.coach_id = auth.uid()
        AND coach_client_assignments.user_id = conversations.user_id
        AND coach_client_assignments.status = 'ACTIVE'
    ))
  )
  OR public.is_admin()
);

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
-- HARDENED RLS POLICIES FOR MESSAGES
-- ============================================

DROP POLICY IF EXISTS "messages_select_conversation_member" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_update_read_at" ON public.messages;

CREATE POLICY "messages_select_conversation_member"
ON public.messages FOR SELECT
USING (
  public.can_read_conversation(conversation_id)
);

CREATE POLICY "messages_insert_sender"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.can_send_to_conversation(conversation_id)
);

CREATE POLICY "messages_update_read_at"
ON public.messages FOR UPDATE
USING (
  sender_id != auth.uid()
  AND public.can_read_conversation(conversation_id)
)
WITH CHECK (
  sender_id != auth.uid()
  AND public.can_read_conversation(conversation_id)
);

-- ============================================
-- STORAGE POLICIES FOR CHAT ATTACHMENTS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_conversation_id_from_path(path TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (string_to_array(path, '/'))[1]::UUID;
$$;

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
  BEGIN
    v_conversation_id := public.get_conversation_id_from_path(object_path);
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  IF v_conversation_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.can_read_conversation(v_conversation_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_id_from_path(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_chat_attachment(TEXT) TO authenticated;

DROP POLICY IF EXISTS "chat_attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_delete" ON storage.objects;

CREATE POLICY "chat_attachments_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.can_access_chat_attachment(name)
);

CREATE POLICY "chat_attachments_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.can_access_chat_attachment(name)
);

CREATE POLICY "chat_attachments_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND owner::uuid = auth.uid()
);

-- ============================================
-- SEND MESSAGE WITH ATTACHMENT RPC
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
  
  v_has_content := (p_body IS NOT NULL AND trim(p_body) != '') 
                   OR (p_attachment_path IS NOT NULL AND p_attachment_name IS NOT NULL);
  
  IF NOT v_has_content THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message must have text or attachment');
  END IF;
  
  IF p_message_type IN ('image', 'file') AND p_attachment_path IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attachment path required for image/file messages');
  END IF;
  
  SELECT * INTO v_conversation FROM public.conversations WHERE id = p_conversation_id;
  
  IF v_conversation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
  END IF;
  
  IF v_user_id != v_conversation.coach_id AND v_user_id != v_conversation.user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not part of this conversation');
  END IF;
  
  v_has_assignment := public.has_active_assignment(v_conversation.coach_id, v_conversation.user_id);
  
  IF NOT v_has_assignment AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send messages without an active coaching assignment');
  END IF;
  
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
-- CHAT STATUS HELPER FUNCTIONS
-- ============================================

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
  SELECT * INTO v_message 
  FROM public.messages 
  WHERE id = p_message_id AND attachment_path IS NOT NULL;
  
  IF v_message IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Message or attachment not found');
  END IF;
  
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
  SELECT * INTO v_conversation FROM public.conversations WHERE id = p_conversation_id;
  
  IF v_conversation IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Conversation not found'
    );
  END IF;
  
  IF auth.uid() != v_conversation.coach_id AND auth.uid() != v_conversation.user_id THEN
    IF NOT public.is_admin() THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Access denied'
      );
    END IF;
  END IF;
  
  v_has_active_assignment := public.has_active_assignment(v_conversation.coach_id, v_conversation.user_id);
  v_can_send := v_has_active_assignment OR public.is_admin();
  v_can_read := TRUE;
  
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

GRANT EXECUTE ON FUNCTION public.can_download_attachment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_status(UUID) TO authenticated;

-- ============================================
-- YAMIFIT CHATBOT MESSAGES - 24 HOUR PERSISTENCE
-- ============================================

-- Create the chatbot_messages table
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL CHECK (length(content) <= 8000),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

COMMENT ON TABLE public.chatbot_messages IS 'YamiFit Chatbot messages with 24-hour auto-expiration';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_created 
    ON public.chatbot_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_expires 
    ON public.chatbot_messages(expires_at);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_expires 
    ON public.chatbot_messages(user_id, expires_at);

-- Enable RLS on the table
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own chatbot messages"
    ON public.chatbot_messages
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND expires_at > NOW());

CREATE POLICY "Users can insert own chatbot messages"
    ON public.chatbot_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chatbot messages"
    ON public.chatbot_messages
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Function to delete expired messages
CREATE OR REPLACE FUNCTION public.cleanup_expired_chatbot_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.chatbot_messages WHERE expires_at <= NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_chatbot_messages() TO service_role;

-- Trigger-based lazy cleanup on insert
CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.chatbot_messages
    WHERE user_id = NEW.user_id AND expires_at <= NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_chatbot_cleanup ON public.chatbot_messages;
CREATE TRIGGER trigger_chatbot_cleanup
    AFTER INSERT ON public.chatbot_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_cleanup_expired_messages();

-- Helper function to get user's chat history
CREATE OR REPLACE FUNCTION public.get_chatbot_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 40
)
RETURNS TABLE (
    id UUID,
    role VARCHAR(20),
    content TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.chatbot_messages
    WHERE user_id = p_user_id AND expires_at <= NOW();
    
    RETURN QUERY
    SELECT cm.id, cm.role, cm.content, cm.attachments, cm.created_at
    FROM public.chatbot_messages cm
    WHERE cm.user_id = p_user_id AND cm.expires_at > NOW()
    ORDER BY cm.created_at ASC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_chatbot_history(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chatbot_history(UUID, INTEGER) TO service_role;

-- ============================================
-- END OF SCHEMA
-- ============================================