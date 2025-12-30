/**
 * Custom hook for settings management
 * Handles profile, security, notifications, and preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth as useAuthRedux } from './useAuthRedux';
import * as settingsService from '@/services/api/settings.service';
import * as profileService from '@/services/api/profile.service';

export const useSettings = () => {
  const { user, profile, loading: authLoading } = useAuthRedux();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // User preferences state (unit_system, theme)
  const [userPreferences, setUserPreferences] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  /**
   * Load notification preferences
   */
  const loadNotificationPreferences = useCallback(async () => {
    if (!user?.id) return;

    setNotificationsLoading(true);
    const { data, error } = await settingsService.getNotificationPreferences(user.id);

    if (error) {
      setError(error.message);
    }

    // Always set data (even if there's an error, we return defaults)
    if (data) {
      setNotificationPreferences(data);
    }

    setNotificationsLoading(false);
  }, [user?.id]);

  /**
   * Load user preferences
   */
  const loadUserPreferences = useCallback(async () => {
    if (!user?.id) return;

    setPreferencesLoading(true);
    const { data, error, isLocal } = await settingsService.getUserPreferences(user.id);

    if (error) {
      setError(error.message);
    }

    // Always set data (even if there's an error, we return defaults)
    if (data) {
      setUserPreferences({ ...data, isLocal });

      // Apply theme to document
      if (data.theme) {
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      }
    }

    setPreferencesLoading(false);
  }, [user?.id]);

  /**
   * Load all settings on mount (only when user changes)
   */
  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    const loadSettings = async () => {
      setNotificationsLoading(true);
      setPreferencesLoading(true);

      const [notifData, prefData] = await Promise.all([
        settingsService.getNotificationPreferences(user.id),
        settingsService.getUserPreferences(user.id),
      ]);

      if (!mounted) return;

      if (notifData.error) {
        setError(notifData.error.message);
      } else if (notifData.data) {
        setNotificationPreferences(notifData.data);
      }

      if (prefData.error) {
        setError(prefData.error.message);
      } else if (prefData.data) {
        setUserPreferences({ ...prefData.data, isLocal: prefData.isLocal });
        if (prefData.data.theme) {
          document.documentElement.classList.toggle('dark', prefData.data.theme === 'dark');
        }
      }

      setNotificationsLoading(false);
      setPreferencesLoading(false);
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only reload when user ID changes

  /**
   * Update profile information (optimized for speed)
   */
  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    setLoading(true);
    setError(null);

    // Validate profile data
    const validation = settingsService.validateProfileData(updates);
    if (!validation.isValid) {
      setLoading(false);
      return { error: { message: Object.values(validation.errors).join(', ') } };
    }

    try {
      // Direct update without going through auth hook for better performance
      const { data, error } = await profileService.updateProfile(user.id, updates);

      if (error) {
        setError(error.message);
        setLoading(false);
        return { data: null, error };
      }

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { data: null, error: err };
    }
  }, [user?.id]);

  /**
   * Update password
   */
  const updatePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    setLoading(true);
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setLoading(false);
      return { error: { message: 'New passwords do not match' } };
    }

    // Validate password strength
    const validation = settingsService.validatePassword(newPassword);
    if (!validation.isValid) {
      setLoading(false);
      return { error: { message: validation.errors.join(', ') } };
    }

    const { data, error } = await settingsService.updatePassword(currentPassword, newPassword);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
    return { data, error };
  }, [user?.id]);

  /**
   * Update notification preferences
   */
  const updateNotificationPreferences = useCallback(async (preferences) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    setNotificationsLoading(true);
    setError(null);

    const { data, error } = await settingsService.updateNotificationPreferences(
      user.id,
      preferences
    );

    if (error) {
      setError(error.message);
    } else {
      setNotificationPreferences(data);
    }

    setNotificationsLoading(false);
    return { data, error };
  }, [user?.id]);

  /**
   * Update user preferences
   */
  const updateUserPreferences = useCallback(async (preferences) => {
    if (!user?.id) return { error: new Error('No user logged in') };

    setPreferencesLoading(true);
    setError(null);

    const { data, error, isLocal } = await settingsService.updateUserPreferences(
      user.id,
      preferences
    );

    if (error) {
      setError(error.message);
    } else {
      setUserPreferences({ ...data, isLocal });

      // Apply theme change immediately
      if (preferences.theme) {
        document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
      }
    }

    setPreferencesLoading(false);
    return { data, error };
  }, [user?.id]);

  /**
   * Toggle a single notification preference
   */
  const toggleNotificationPreference = useCallback(async (key, value) => {
    if (!notificationPreferences) return;

    const updated = {
      ...notificationPreferences,
      [key]: value,
    };

    return await updateNotificationPreferences(updated);
  }, [notificationPreferences, updateNotificationPreferences]);

  return {
    // State
    profile,
    notificationPreferences,
    userPreferences,
    loading,
    authLoading,
    notificationsLoading,
    preferencesLoading,
    error,

    // Methods
    updateProfile,
    updatePassword,
    updateNotificationPreferences,
    toggleNotificationPreference,
    updateUserPreferences,
    loadNotificationPreferences,
    loadUserPreferences,
  };
};
