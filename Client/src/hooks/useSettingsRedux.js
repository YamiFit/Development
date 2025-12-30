/**
 * useSettings Hook - Redux-based settings management
 * Clean interface for settings with Redux state
 */

import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSettingsLoading,
  setSettingsError,
  clearSettingsError,
  setNotificationPreferences,
  updateNotificationPreference,
  setUserPreferences,
  updateUserPreference,
} from '@/store/slices/settingsSlice';
import {
  selectNotificationPreferences,
  selectUserPreferences,
  selectSettingsLoading,
  selectSettingsError,
  selectTheme,
  selectLanguage,
  selectUnitSystem,
} from '@/store/selectors';
import { selectUser, selectProfile } from '@/store/selectors';
import * as settingsService from '@/services/api/settings.service';
import * as profileService from '@/services/api/profile.service';

/**
 * Custom hook for settings with Redux
 */
export const useSettings = () => {
  const dispatch = useDispatch();

  // Select state from Redux
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const notificationPreferences = useSelector(selectNotificationPreferences);
  const userPreferences = useSelector(selectUserPreferences);
  const loading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const theme = useSelector(selectTheme);
  const language = useSelector(selectLanguage);
  const unitSystem = useSelector(selectUnitSystem);

  /**
   * Load notification preferences
   */
  const loadNotificationPreferences = useCallback(async () => {
    if (!user?.id) return;

    dispatch(setSettingsLoading(true));
    const { data, error } = await settingsService.getNotificationPreferences(user.id);

    if (error) {
      dispatch(setSettingsError(error.message));
    } else if (data) {
      dispatch(setNotificationPreferences(data));
    }

    dispatch(setSettingsLoading(false));
  }, [user?.id, dispatch]);

  /**
   * Load user preferences
   */
  const loadUserPreferences = useCallback(async () => {
    if (!user?.id) return;

    dispatch(setSettingsLoading(true));
    const { data, error } = await settingsService.getUserPreferences(user.id);

    if (error) {
      dispatch(setSettingsError(error.message));
    } else if (data) {
      dispatch(setUserPreferences(data));

      // Apply theme to document
      if (data.theme) {
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      }
    }

    dispatch(setSettingsLoading(false));
  }, [user?.id, dispatch]);

  /**
   * Load all settings on mount
   */
  useEffect(() => {
    if (user?.id) {
      loadNotificationPreferences();
      loadUserPreferences();
    }
  }, [user?.id]); 

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    dispatch(setSettingsLoading(true));
    dispatch(clearSettingsError());

    // Validate profile data
    const validation = settingsService.validateProfileData(updates);
    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors).join(', ');
      dispatch(setSettingsError(errorMsg));
      return { error: { message: errorMsg } };
    }

    const { data, error } = await profileService.updateProfile(user.id, updates);

    dispatch(setSettingsLoading(false));

    if (error) {
      dispatch(setSettingsError(error.message));
    }

    return { data, error };
  }, [user?.id, dispatch]);

  /**
   * Update notification preference
   */
  const updateNotificationPref = useCallback(async (category, type, value) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    // Update Redux state immediately (optimistic update)
    dispatch(updateNotificationPreference({ category, type, value }));

    // Update backend
    const { data, error } = await settingsService.updateNotificationPreference(
      user.id,
      category,
      type,
      value
    );

    if (error) {
      // Revert on error
      dispatch(updateNotificationPreference({ category, type, value: !value }));
      dispatch(setSettingsError(error.message));
    }

    return { data, error };
  }, [user?.id, dispatch]);

  /**
   * Update user preference
   */
  const updateUserPref = useCallback(async (key, value) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    // Update Redux state immediately (optimistic update)
    dispatch(updateUserPreference({ key, value }));

    // Apply theme immediately if changing theme
    if (key === 'theme') {
      document.documentElement.classList.toggle('dark', value === 'dark');
    }

    // Update backend
    const { data, error } = await settingsService.updateUserPreference(user.id, key, value);

    if (error) {
      dispatch(setSettingsError(error.message));
      // Note: We don't revert the Redux state here as the change is already applied
    }

    return { data, error };
  }, [user?.id, dispatch]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    dispatch(setSettingsLoading(true));
    dispatch(clearSettingsError());

    const { data, error } = await settingsService.changePassword(currentPassword, newPassword);

    dispatch(setSettingsLoading(false));

    if (error) {
      dispatch(setSettingsError(error.message));
    }

    return { data, error };
  }, [user?.id, dispatch]);

  /**
   * Enable two-factor authentication
   */
  const enableTwoFactor = useCallback(async () => {
    if (!user?.id) return { error: new Error('No user logged in') };

    dispatch(setSettingsLoading(true));
    dispatch(clearSettingsError());

    const { data, error } = await settingsService.enableTwoFactor(user.id);

    dispatch(setSettingsLoading(false));

    if (error) {
      dispatch(setSettingsError(error.message));
    }

    return { data, error };
  }, [user?.id, dispatch]);

  /**
   * Disable two-factor authentication
   */
  const disableTwoFactor = useCallback(async () => {
    if (!user?.id) return { error: new Error('No user logged in') };

    dispatch(setSettingsLoading(true));
    dispatch(clearSettingsError());

    const { data, error } = await settingsService.disableTwoFactor(user.id);

    dispatch(setSettingsLoading(false));

    if (error) {
      dispatch(setSettingsError(error.message));
    }

    return { data, error };
  }, [user?.id, dispatch]);

  return {
    // State
    user,
    profile,
    notificationPreferences,
    userPreferences,
    loading,
    error,
    theme,
    language,
    unitSystem,
    authLoading: false, // For backward compatibility
    
    // Actions
    updateProfile,
    updateNotificationPref,
    updateUserPref,
    changePassword,
    enableTwoFactor,
    disableTwoFactor,
    loadNotificationPreferences,
    loadUserPreferences,
    clearError: () => dispatch(clearSettingsError()),
  };
};
