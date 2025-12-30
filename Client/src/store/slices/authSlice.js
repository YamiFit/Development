/**
 * Auth Slice - Authentication state management
 * Handles user, profile, and health profile data
 */

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  profile: null,
  healthProfile: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set loading state
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set auth error
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Clear auth error
    clearAuthError: (state) => {
      state.error = null;
    },

    // Set user and session on sign in
    setAuth: (state, action) => {
      const { user, session, profile, healthProfile } = action.payload;
      state.user = user;
      state.session = session;
      state.profile = profile || null;
      state.healthProfile = healthProfile || null;
      state.isAuthenticated = !!user;
      state.loading = false;
      state.error = null;
      console.log("✅ Redux authSlice: Auth state updated successfully", {
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        hasProfile: !!state.profile,
        hasHealthProfile: !!state.healthProfile,
        healthProfileData: state.healthProfile,
        weight: state.healthProfile?.current_weight,
        height: state.healthProfile?.height,
        age: state.healthProfile?.age,
        role: state.profile?.role,
      });
    },

    // Update only profile data (REPLACES entire profile - use for full profile fetch)
    updateProfile: (state, action) => {
      state.profile = action.payload;
    },

    // Merge partial profile updates (USE THIS for field updates like selected_coach_id)
    mergeProfile: (state, action) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      } else {
        state.profile = action.payload;
      }
    },

    // Update only health profile data
    updateHealthProfile: (state, action) => {
      state.healthProfile = action.payload;
    },

    // Update session
    updateSession: (state, action) => {
      state.session = action.payload;
    },

    // Clear all auth data on sign out
    clearAuth: (state) => {
      state.user = null;
      state.profile = null;
      state.healthProfile = null;
      state.session = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },

    // Refresh user data
    refreshAuth: (state, action) => {
      const { profile, healthProfile } = action.payload;
      if (profile) state.profile = profile;
      if (healthProfile) state.healthProfile = healthProfile;
    },
  },
});

export const {
  setAuthLoading,
  setAuthError,
  clearAuthError,
  setAuth,
  updateProfile,
  mergeProfile,
  updateHealthProfile,
  updateSession,
  clearAuth,
  refreshAuth,
} = authSlice.actions;

export default authSlice.reducer;
