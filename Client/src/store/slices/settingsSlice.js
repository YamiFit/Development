/**
 * Settings Slice - User settings state management
 * Handles notification preferences and user preferences
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notificationPreferences: null,
  userPreferences: null,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Set loading state
    setSettingsLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set settings error
    setSettingsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Clear settings error
    clearSettingsError: (state) => {
      state.error = null;
    },

    // Set notification preferences
    setNotificationPreferences: (state, action) => {
      state.notificationPreferences = action.payload;
    },

    // Update specific notification preference
    updateNotificationPreference: (state, action) => {
      const { category, type, value } = action.payload;
      if (!state.notificationPreferences) {
        state.notificationPreferences = {};
      }
      if (!state.notificationPreferences[category]) {
        state.notificationPreferences[category] = {};
      }
      state.notificationPreferences[category][type] = value;
    },

    // Set user preferences
    setUserPreferences: (state, action) => {
      state.userPreferences = action.payload;
    },

    // Update specific user preference
    updateUserPreference: (state, action) => {
      const { key, value } = action.payload;
      if (!state.userPreferences) {
        state.userPreferences = {};
      }
      state.userPreferences[key] = value;
    },

    // Clear all settings
    clearSettings: (state) => {
      state.notificationPreferences = null;
      state.userPreferences = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setSettingsLoading,
  setSettingsError,
  clearSettingsError,
  setNotificationPreferences,
  updateNotificationPreference,
  setUserPreferences,
  updateUserPreference,
  clearSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
