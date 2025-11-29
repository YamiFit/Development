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
      .select()
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
      .select()
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

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update user health profile
 * @param {string} userId - User ID
 * @param {object} healthData - Health profile updates
 * @returns {Promise<object>} - Update result
 */
export const updateHealthProfile = async (userId, healthData) => {
  try {
    const { data, error } = await supabase
      .from('user_health_profiles')
      .upsert({ user_id: userId, ...healthData })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
