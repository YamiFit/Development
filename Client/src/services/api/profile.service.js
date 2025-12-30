/**
 * Profile Service
 * Handles all profile-related API calls
 */

import { supabase } from '@/supabaseClient';

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Profile data
 */
export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 * @returns {Promise<object>} - Update result
 */
export const updateProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Update result
 */
export const updateLastLogin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Upload profile avatar
 * @param {string} userId - User ID
 * @param {File} file - Avatar file
 * @returns {Promise<object>} - Upload result with URL
 */
export const uploadAvatar = async (userId, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with avatar URL
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    return { data: { url: publicUrl, profile: data }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete user profile
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Delete result
 */
export const deleteProfile = async (userId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Get user health profile
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Health profile data
 */
export const getHealthProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_health_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no row found, return null data without error (expected case for new users)
      if (error.code === 'PGRST116') {
        console.log('📋 No health profile found for user (expected for new users)');
        return { data: null, error: null };
      }
      throw error;
    }

    console.log('✅ Health profile fetched:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching health profile:', error);
    return { data: null, error };
  }
};

/**
 * Update user health profile with optional N8N assessment data
 * @param {string} userId - User ID
 * @param {object} healthData - Health profile updates
 * @param {object} assessmentData - N8N assessment response (optional)
 * @returns {Promise<object>} - Update result
 */
export const updateHealthProfile = async (userId, healthData, assessmentData = null) => {
  try {
    let dataToUpdate = { user_id: userId, ...healthData };

    // If assessment data is provided, add it to the update
    if (assessmentData && assessmentData.success && assessmentData.assessment) {
      const { assessment } = assessmentData;
      
      dataToUpdate = {
        ...dataToUpdate,
        // BMI and health status
        bmi_category: assessment.healthStatus?.bmiCategory || null,
        general_assessment: assessment.healthStatus?.generalAssessment || null,
        // AI targets
        daily_calorie_target: assessment.targets?.dailyCalorieTarget || null,
        daily_protein_target: assessment.targets?.dailyProteinTarget || null,
        daily_carbs_target: assessment.targets?.dailyCarbsTarget || null,
        daily_fats_target: assessment.targets?.dailyFatsTarget || null,
        daily_water_target: assessment.targets?.dailyWaterTarget || null,
        target_weight: assessment.targets?.weightTarget ? 
          parseFloat(assessment.targets.weightTarget.match(/\d+(\.\d+)?/)?.[0]) || null : null,
        // Assessment details (JSONB fields)
        recommended_exercises: assessment.recommendedExercises || null,
        nutrition_tips: assessment.nutritionTips || null,
        weekly_plan: assessment.weeklyPlan || null,
        warnings: assessment.warnings || null,
        motivational_message: assessment.motivationalMessage || null,
        assessment_timestamp: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('user_health_profiles')
      .upsert(dataToUpdate, { 
        onConflict: 'user_id'
      })
      .select('*')
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateHealthProfile:', error);
    return { data: null, error };
  }
};

/**
 * Send health profile data to N8N webhook
 * @param {string} userId - User ID
 * @param {object} healthData - Health profile data to send
 * @returns {Promise<object>} - Webhook response
 */
export const sendHealthProfileToWebhook = async (userId, healthData) => {
  try {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('N8N webhook URL not configured - skipping webhook call');
      return { data: null, error: null };
    }

    // Format data according to N8N API requirements
    const payload = {
      userId: userId,
      height: parseInt(healthData.height) || 0,
      weight: parseInt(healthData.current_weight) || 0,
      sports: healthData.sport || '',
      age: parseInt(healthData.age) || 0,
      gender: healthData.gender || '',
      fitnessGoal: healthData.goal || '',
      activityLevel: healthData.activity_level || '',
      workType: healthData.work_type || '',
      medicalConditions: healthData.medical_conditions || ''
    };

    console.log('📤 Sending to N8N webhook:', payload);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error response:', errorText);
      // Don't throw - webhook is optional, just log the error
      return { data: null, error: new Error(`Webhook request failed: ${response.status} ${response.statusText}`) };
    }

    const result = await response.json();
    console.log('✅ Webhook result:', result);

    return { data: result, error: null };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('N8N webhook request timeout (continuing without assessment)');
      return { data: null, error: null }; // Continue without webhook data
    }
    console.warn('Error calling N8N webhook (continuing without assessment):', error.message);
    return { data: null, error: null }; // Continue without webhook data
  }
};

// ============================================
// COACH SELECTION (PRO feature)
// ============================================

/**
 * Select a coach for the current user
 * @param {string} userId - User ID
 * @param {string} coachId - Coach ID to select (or null to deselect)
 * @returns {Promise<object>} - Updated profile
 */
export const selectCoach = async (userId, coachId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ selected_coach_id: coachId })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;

    console.log('✅ Coach selected successfully:', coachId);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error selecting coach:', error);
    return { data: null, error };
  }
};

/**
 * Get the user's selected coach profile
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Selected coach profile or null
 */
export const getSelectedCoach = async (userId) => {
  try {
    // First get the user's selected_coach_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('selected_coach_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (!profile?.selected_coach_id) {
      return { data: null, error: null };
    }

    // Then get the coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('coach_id', profile.selected_coach_id)
      .single();

    if (coachError && coachError.code !== 'PGRST116') {
      throw coachError;
    }

    return { data: coach || null, error: null };
  } catch (error) {
    console.error('❌ Error getting selected coach:', error);
    return { data: null, error };
  }
};
