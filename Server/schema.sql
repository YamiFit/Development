-- ============================================
-- YAMIFIT SUPABASE DATABASE SCHEMA
-- Complete database structure for health & meal tracking app
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('user', 'coach', 'meal_provider', 'admin');
CREATE TYPE user_goal AS ENUM ('lose_weight', 'gain_muscle', 'maintain', 'general_health');
CREATE TYPE activity_level AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');
CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired', 'trial');
CREATE TYPE subscription_plan_type AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method_type AS ENUM ('credit_card', 'debit_card', 'cash_on_delivery', 'digital_wallet');
CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'dessert');
CREATE TYPE message_sender_type AS ENUM ('user', 'coach');
CREATE TYPE notification_type AS ENUM ('meal_reminder', 'water_reminder', 'order_update', 'subscription_expiry', 'weight_update', 'system');

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user' NOT NULL,
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
    business_name VARCHAR(255) NOT NULL,
    business_license VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL, -- in grams
    carbs INTEGER NOT NULL, -- in grams
    fats INTEGER NOT NULL, -- in grams
    fiber INTEGER DEFAULT 0, -- in grams
    sugar INTEGER DEFAULT 0, -- in grams
    sodium INTEGER DEFAULT 0, -- in mg
    serving_size VARCHAR(100),
    preparation_time INTEGER, -- in minutes
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

-- Meals are publicly readable
CREATE POLICY "Meals are viewable by everyone" ON meals FOR SELECT USING (true);

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

-- ============================================
-- END OF SCHEMA
-- ============================================