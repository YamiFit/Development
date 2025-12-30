/**
 * Provider Slice - Provider state management
 * Handles provider profile, working hours, and stats
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  providerProfile: null,
  workingHours: [],
  stats: {
    totalMeals: 0,
    activeOrders: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    growth: 0,
  },
  loading: false,
  error: null,
};

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    // Set loading state
    setProviderLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set provider error
    setProviderError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Clear provider error
    clearProviderError: (state) => {
      state.error = null;
    },

    // Set provider profile
    setProviderProfile: (state, action) => {
      state.providerProfile = action.payload;
      // Don't automatically set loading to false - let the hook control it
    },

    // Update provider profile
    updateProviderProfile: (state, action) => {
      if (state.providerProfile) {
        state.providerProfile = {
          ...state.providerProfile,
          ...action.payload,
        };
      }
      // Don't automatically set loading to false - let the caller control it
    },

    // Set working hours
    setWorkingHours: (state, action) => {
      state.workingHours = action.payload;
    },

    // Update single working hour
    updateWorkingHour: (state, action) => {
      const { dayOfWeek, data } = action.payload;
      const index = state.workingHours.findIndex(
        (wh) => wh.day_of_week === dayOfWeek
      );

      if (index !== -1) {
        state.workingHours[index] = {
          ...state.workingHours[index],
          ...data,
        };
      } else {
        state.workingHours.push({
          day_of_week: dayOfWeek,
          ...data,
        });
      }
    },

    // Set provider stats
    setProviderStats: (state, action) => {
      state.stats = {
        ...state.stats,
        ...action.payload,
      };
    },

    // Clear all provider data
    clearProviderData: (state) => {
      state.providerProfile = null;
      state.workingHours = [];
      state.stats = initialState.stats;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setProviderLoading,
  setProviderError,
  clearProviderError,
  setProviderProfile,
  updateProviderProfile,
  setWorkingHours,
  updateWorkingHour,
  setProviderStats,
  clearProviderData,
} = providerSlice.actions;

export default providerSlice.reducer;
