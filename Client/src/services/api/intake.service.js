import { supabase } from '@/supabaseClient';

/**
 * Service for tracking daily nutrition intake
 */
export const intakeService = {
  /**
   * Get today's daily intake summary
   */
  async getTodayIntake() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_intake')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data || {
      calories_consumed: 0,
      protein_consumed: 0,
      carbs_consumed: 0,
      fats_consumed: 0,
      water_consumed: 0
    };
  },

  /**
   * Add a meal entry
   */
  async addMeal({ mealType, mealName, calories, protein, carbs, fats }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('add_meal_entry', {
      p_user_id: user.id,
      p_meal_type: mealType,
      p_meal_name: mealName || '',
      p_calories: calories || 0,
      p_protein: protein || 0,
      p_carbs: carbs || 0,
      p_fats: fats || 0
    });

    if (error) throw error;
    return data;
  },

  /**
   * Add water intake (default 250ml = 1 glass)
   */
  async addWater(amount = 250) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('add_water_entry', {
      p_user_id: user.id,
      p_amount: amount
    });

    if (error) throw error;
    return data;
  },

  /**
   * Get today's meal entries
   */
  async getTodayMeals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('meal_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get today's water entries
   */
  async getTodayWaterEntries() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('water_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get weekly exercise progress
   */
  async getWeeklyProgress() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_weekly_exercise_progress', {
      p_user_id: user.id
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update exercise completion for a day
   */
  async updateExerciseLog({ date, activityType, durationMinutes, completionPercentage, completed }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const dayOfWeek = new Date(date).getDay();

    const { data, error } = await supabase
      .from('exercise_logs')
      .upsert({
        user_id: user.id,
        date,
        day_of_week: dayOfWeek,
        activity_type: activityType,
        duration_minutes: durationMinutes,
        completion_percentage: completionPercentage,
        completed,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a meal entry and update totals
   */
  async deleteMeal(mealId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get meal to subtract from totals
    const { data: meal, error: fetchError } = await supabase
      .from('meal_entries')
      .select('*, daily_intake_id')
      .eq('id', mealId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the meal
    const { error: deleteError } = await supabase
      .from('meal_entries')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Update daily totals
    if (meal.daily_intake_id) {
      const { error: updateError } = await supabase
        .from('daily_intake')
        .update({
          calories_consumed: supabase.raw(`calories_consumed - ${meal.calories}`),
          protein_consumed: supabase.raw(`protein_consumed - ${meal.protein}`),
          carbs_consumed: supabase.raw(`carbs_consumed - ${meal.carbs}`),
          fats_consumed: supabase.raw(`fats_consumed - ${meal.fats}`)
        })
        .eq('id', meal.daily_intake_id);

      if (updateError) console.error('Failed to update totals:', updateError);
    }

    return true;
  }
};

export default intakeService;
