-- =====================================================
-- Daily Intake Tracking for YamiFit Dashboard
-- =====================================================

-- Table to track daily nutrition intake (meals, water, etc.)
CREATE TABLE IF NOT EXISTS daily_intake (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Nutrition totals for the day
    calories_consumed INTEGER DEFAULT 0,
    protein_consumed DECIMAL(10,2) DEFAULT 0,
    carbs_consumed DECIMAL(10,2) DEFAULT 0,
    fats_consumed DECIMAL(10,2) DEFAULT 0,
    water_consumed DECIMAL(10,2) DEFAULT 0, -- in ml
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per day
    UNIQUE(user_id, date)
);

-- Table to track individual meal entries
CREATE TABLE IF NOT EXISTS meal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_intake_id UUID REFERENCES daily_intake(id) ON DELETE CASCADE,
    
    -- Meal details
    meal_type VARCHAR(50) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    meal_name VARCHAR(255),
    description TEXT,
    
    -- Nutrition values
    calories INTEGER DEFAULT 0,
    protein DECIMAL(10,2) DEFAULT 0,
    carbs DECIMAL(10,2) DEFAULT 0,
    fats DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track water intake entries
CREATE TABLE IF NOT EXISTS water_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_intake_id UUID REFERENCES daily_intake(id) ON DELETE CASCADE,
    
    -- Water amount in ml
    amount INTEGER NOT NULL DEFAULT 250, -- default glass size
    
    -- Timestamps
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track weekly exercise progress
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Exercise details
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    activity_type VARCHAR(100),
    duration_minutes INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0, -- 0-100
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One exercise log per user per day
    UNIQUE(user_id, date)
);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_daily_intake_user_date ON daily_intake(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_entries_user ON meal_entries(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_entries_user ON water_entries(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON exercise_logs(user_id, date DESC);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE daily_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Daily intake policies
CREATE POLICY "Users can view own daily intake"
    ON daily_intake FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily intake"
    ON daily_intake FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily intake"
    ON daily_intake FOR UPDATE
    USING (auth.uid() = user_id);

-- Meal entries policies
CREATE POLICY "Users can view own meal entries"
    ON meal_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal entries"
    ON meal_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal entries"
    ON meal_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Water entries policies
CREATE POLICY "Users can view own water entries"
    ON water_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water entries"
    ON water_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water entries"
    ON water_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Users can view own exercise logs"
    ON exercise_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise logs"
    ON exercise_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise logs"
    ON exercise_logs FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- Functions
-- =====================================================

-- Function to get or create today's daily intake record
CREATE OR REPLACE FUNCTION get_or_create_daily_intake(p_user_id UUID)
RETURNS daily_intake AS $$
DECLARE
    v_intake daily_intake;
BEGIN
    -- Try to get existing record
    SELECT * INTO v_intake
    FROM daily_intake
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    
    -- If not found, create one
    IF NOT FOUND THEN
        INSERT INTO daily_intake (user_id, date)
        VALUES (p_user_id, CURRENT_DATE)
        RETURNING * INTO v_intake;
    END IF;
    
    RETURN v_intake;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a meal and update daily totals
CREATE OR REPLACE FUNCTION add_meal_entry(
    p_user_id UUID,
    p_meal_type VARCHAR(50),
    p_meal_name VARCHAR(255),
    p_calories INTEGER,
    p_protein DECIMAL,
    p_carbs DECIMAL,
    p_fats DECIMAL
)
RETURNS meal_entries AS $$
DECLARE
    v_daily_intake daily_intake;
    v_meal meal_entries;
BEGIN
    -- Get or create daily intake
    SELECT * INTO v_daily_intake FROM get_or_create_daily_intake(p_user_id);
    
    -- Insert meal entry
    INSERT INTO meal_entries (
        user_id, daily_intake_id, meal_type, meal_name,
        calories, protein, carbs, fats
    ) VALUES (
        p_user_id, v_daily_intake.id, p_meal_type, p_meal_name,
        p_calories, p_protein, p_carbs, p_fats
    ) RETURNING * INTO v_meal;
    
    -- Update daily totals
    UPDATE daily_intake
    SET 
        calories_consumed = calories_consumed + p_calories,
        protein_consumed = protein_consumed + p_protein,
        carbs_consumed = carbs_consumed + p_carbs,
        fats_consumed = fats_consumed + p_fats,
        updated_at = NOW()
    WHERE id = v_daily_intake.id;
    
    RETURN v_meal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add water intake
CREATE OR REPLACE FUNCTION add_water_entry(
    p_user_id UUID,
    p_amount INTEGER DEFAULT 250
)
RETURNS water_entries AS $$
DECLARE
    v_daily_intake daily_intake;
    v_water water_entries;
BEGIN
    -- Get or create daily intake
    SELECT * INTO v_daily_intake FROM get_or_create_daily_intake(p_user_id);
    
    -- Insert water entry
    INSERT INTO water_entries (user_id, daily_intake_id, amount)
    VALUES (p_user_id, v_daily_intake.id, p_amount)
    RETURNING * INTO v_water;
    
    -- Update daily total
    UPDATE daily_intake
    SET 
        water_consumed = water_consumed + p_amount,
        updated_at = NOW()
    WHERE id = v_daily_intake.id;
    
    RETURN v_water;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get weekly exercise progress
CREATE OR REPLACE FUNCTION get_weekly_exercise_progress(p_user_id UUID)
RETURNS TABLE (
    day_name VARCHAR,
    day_number INTEGER,
    activity_type VARCHAR,
    duration_minutes INTEGER,
    completion_percentage INTEGER,
    is_completed BOOLEAN,
    log_date DATE
) AS $$
BEGIN
    RETURN QUERY
    WITH week_days AS (
        SELECT 
            generate_series(
                date_trunc('week', CURRENT_DATE)::DATE,
                date_trunc('week', CURRENT_DATE)::DATE + INTERVAL '6 days',
                '1 day'::INTERVAL
            )::DATE AS day_date
    )
    SELECT 
        CASE EXTRACT(DOW FROM wd.day_date)::INTEGER
            WHEN 0 THEN 'Sun'::VARCHAR
            WHEN 1 THEN 'Mon'::VARCHAR
            WHEN 2 THEN 'Tue'::VARCHAR
            WHEN 3 THEN 'Wed'::VARCHAR
            WHEN 4 THEN 'Thu'::VARCHAR
            WHEN 5 THEN 'Fri'::VARCHAR
            WHEN 6 THEN 'Sat'::VARCHAR
        END AS day_name,
        EXTRACT(DOW FROM wd.day_date)::INTEGER AS day_number,
        COALESCE(el.activity_type, 'Not set')::VARCHAR AS activity_type,
        COALESCE(el.duration_minutes, 0)::INTEGER AS duration_minutes,
        COALESCE(el.completion_percentage, 0)::INTEGER AS completion_percentage,
        COALESCE(el.completed, false) AS is_completed,
        wd.day_date AS log_date
    FROM week_days wd
    LEFT JOIN exercise_logs el ON el.user_id = p_user_id AND el.date = wd.day_date
    ORDER BY wd.day_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_daily_intake(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_meal_entry(UUID, VARCHAR, VARCHAR, INTEGER, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION add_water_entry(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_exercise_progress(UUID) TO authenticated;
