/**
 * Custom hook for authentication state management
 * Provides auth context and methods
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '@/services/api/auth.service';
import * as profileService from '@/services/api/profile.service';
import { supabase } from '@/supabaseClient';
import { ROUTES } from '@/config/constants';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Load user session on mount
   */
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { session } = await authService.getSession();
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          const { data: profileData } = await profileService.getProfile(session.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          const { data: profileData } = await profileService.getProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
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
      const { data: profileData } = await profileService.getProfile(data.user.id);
      setProfile(profileData);
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
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { error: new Error('No user logged in') };

    const { data, error } = await profileService.updateProfile(user.id, updates);
    
    if (data) {
      setProfile(data);
    }

    return { data, error };
  }, [user]);

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
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshSession,
  };
};
