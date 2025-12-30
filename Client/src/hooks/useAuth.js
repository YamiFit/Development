/**
 * Custom hook for authentication state management
 * Provides auth context and methods
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "@/services/api/auth.service";
import * as profileService from "@/services/api/profile.service";
import { supabase } from "@/supabaseClient";
import { ROUTES } from "@/config/constants";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [healthProfile, setHealthProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Load user session on mount
   */
  useEffect(() => {
    let mounted = true;

    // Initialize auth immediately
    const initAuth = async () => {
      try {
        // Get current session immediately (from cache)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user || null);

        // Load profile if user exists
        if (session?.user) {
          const { data: profileData } = await profileService.getProfile(
            session.user.id
          );
          const { data: healthData } = await profileService.getHealthProfile(
            session.user.id
          );

          if (mounted) {
            setProfile(
              profileData || {
                id: session.user.id,
                email: session.user.email,
                full_name: "",
                phone: "",
                gender: "",
              }
            );
            setHealthProfile(healthData);
          }
        }
      } catch (error) {
        // Silently handle errors - don't block the UI
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Start initialization
    initAuth();

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Only handle sign in/out events to avoid duplicate loads
      if (event === "SIGNED_IN") {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          const { data: profileData } = await profileService.getProfile(
            session.user.id
          );
          const { data: healthData } = await profileService.getHealthProfile(
            session.user.id
          );

          if (mounted) {
            // Always set profile - use fetched data or create minimal object
            setProfile(
              profileData || {
                id: session.user.id,
                email: session.user.email,
                full_name: "",
                phone: "",
                gender: "",
              }
            );
            setHealthProfile(healthData);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setProfile(null);
        setHealthProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Sign in user
   */
  const signIn = useCallback(async (credentials) => {
    const { data, error } = await authService.signIn(credentials);

    if (error) return { error };

    if (data.user) {
      await profileService.updateLastLogin(data.user.id);
      const { data: profileData } = await profileService.getProfile(
        data.user.id
      );
      const { data: healthData } = await profileService.getHealthProfile(
        data.user.id
      );
      setProfile(profileData);
      setHealthProfile(healthData);
    }

    return { data, error: null };
  }, []);

  /**
   * Sign up new user
   */
  const signUp = useCallback(async (userData) => {
    const { data, error } = await authService.signUp(userData);
    return { data, error };
  }, []);

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    const { error } = await authService.signOut();

    if (!error) {
      setUser(null);
      setProfile(null);
      setSession(null);
      navigate(ROUTES.LOGIN);
    }

    return { error };
  }, [navigate]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return { error: new Error("No user logged in") };

      const { data, error } = await profileService.updateProfile(
        user.id,
        updates
      );

      if (data) {
        setProfile(data);
      }

      return { data, error };
    },
    [user]
  );

  /**
   * Update health profile
   */
  const updateHealthProfile = useCallback(
    async (healthData, assessmentData = null) => {
      if (!user) return { error: new Error("No user logged in") };

      console.log('🔄 updateHealthProfile called with:', { healthData, assessmentData });

      const { data, error } = await profileService.updateHealthProfile(
        user.id,
        healthData,
        assessmentData
      );

      if (data) {
        console.log('✅ Setting health profile state:', data);
        setHealthProfile(data);
      }

      if (error) {
        console.error('❌ Error updating health profile:', error);
      }

      return { data, error };
    },
    [user]
  );

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email) => {
    return await authService.resetPassword(email);
  }, []);

  /**
   * Update password
   */
  const updatePassword = useCallback(async (newPassword) => {
    return await authService.updatePassword(newPassword);
  }, []);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    const { data, error } = await authService.refreshSession();

    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
    }

    return { data, error };
  }, []);

  return {
    user,
    profile,
    healthProfile,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateHealthProfile,
    resetPassword,
    updatePassword,
    refreshSession,
  };
};
