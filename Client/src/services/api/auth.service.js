/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { supabase } from '@/supabaseClient';
import { ROUTES } from '@/config/constants';

/**
 * Sign up a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} - Sign up result
 */
export const signUp = async ({ email, password, fullName, phone }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
        },
        emailRedirectTo: `${window.location.origin}${ROUTES.LOGIN}`,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Sign in with email and password
 * @param {object} credentials - Login credentials
 * @returns {Promise<object>} - Sign in result
 */
export const signIn = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<object>} - Sign out result
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Get current session
 * @returns {Promise<object>} - Current session data
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    return { session, error: null };
  } catch (error) {
    return { session: null, error };
  }
};

/**
 * Get current user
 * @returns {Promise<object>} - Current user data
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<object>} - Password reset result
 */
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Update result
 */
export const updatePassword = async (newPassword) => {
  try {
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
 * Update user metadata
 * @param {object} metadata - User metadata to update
 * @returns {Promise<object>} - Update result
 */
export const updateUserMetadata = async (metadata) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Verify OTP
 * @param {object} params - OTP verification parameters
 * @returns {Promise<object>} - Verification result
 */
export const verifyOTP = async ({ email, token, type }) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Refresh session
 * @returns {Promise<object>} - Refreshed session data
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
