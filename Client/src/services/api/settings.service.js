/**
 * Settings Service
 * Handles all settings-related API calls
 */

import { supabase } from "@/supabaseClient";

/**
 * Get notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Notification preferences
 */
export const getNotificationPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Return defaults even on error so UI doesn't break
      return {
        data: {
          meal_reminders: true,
          water_reminders: true,
          order_updates: true,
          subscription_expiry: true,
          weight_updates: true,
          email_notifications: true,
          push_notifications: true,
        },
        error,
      };
    }

    // If no preferences exist, return defaults
    if (!data) {
      return {
        data: {
          meal_reminders: true,
          water_reminders: true,
          order_updates: true,
          subscription_expiry: true,
          weight_updates: true,
          email_notifications: true,
          push_notifications: true,
        },
        error: null,
      };
    }

    return { data, error: null };
  } catch (error) {
    // Return defaults even on error so UI doesn't break
    return {
      data: {
        meal_reminders: true,
        water_reminders: true,
        order_updates: true,
        subscription_expiry: true,
        weight_updates: true,
        email_notifications: true,
        push_notifications: true,
      },
      error,
    };
  }
};

/**
 * Update notification preferences
 * @param {string} userId - User ID
 * @param {object} preferences - Notification preferences
 * @returns {Promise<object>} - Update result
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...preferences }, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get user preferences (unit_system, theme)
 * @param {string} userId - User ID
 * @returns {Promise<object>} - User preferences
 */
export const getUserPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Return defaults even on error so UI doesn't break
      return {
        data: {
          unit_system: "metric",
          theme: "light",
        },
        error,
      };
    }

    // If no preferences exist, return defaults
    if (!data) {
      return {
        data: {
          unit_system: "metric",
          theme: "light",
        },
        error: null,
      };
    }

    return { data, error: null };
  } catch (error) {
    // Return defaults even on error so UI doesn't break
    return {
      data: {
        unit_system: "metric",
        theme: "light",
      },
      error,
    };
  }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {object} preferences - User preferences (unit_system, theme)
 * @returns {Promise<object>} - Update result
 */
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, ...preferences }, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update user password via Supabase Auth
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Update result
 */
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Create a separate client for verification to avoid auth state conflicts
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const verifyClient = createClient(supabaseUrl, supabaseKey);

    // Verify current password using separate client
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return {
        data: null,
        error: { message: "Current password is incorrect" },
      };
    }

    // Update to new password using main client
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Validate profile data before update
 * @param {object} profileData - Profile data to validate
 * @returns {object} - Validation result
 */
export const validateProfileData = (profileData) => {
  const errors = {};

  // Validate full_name
  if (profileData.full_name && profileData.full_name.trim().length < 2) {
    errors.full_name = "Name must be at least 2 characters";
  }

  // Validate phone
  if (profileData.phone) {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(profileData.phone)) {
      errors.phone = "Invalid phone number format";
    }
  }

  // Validate gender
  if (profileData.gender) {
    const validGenders = ["male", "female", "other", "prefer_not_to_say"];
    if (!validGenders.includes(profileData.gender.toLowerCase())) {
      errors.gender = "Invalid gender selection";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate password requirements
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain a number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
