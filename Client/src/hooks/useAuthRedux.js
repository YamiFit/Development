/**
 * useAuth Hook - Redux-based authentication management
 * Clean interface for authentication with Redux state
 */

import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setAuthLoading,
  setAuthError,
  clearAuthError,
  setAuth,
  updateProfile as updateProfileAction,
  updateHealthProfile as updateHealthProfileAction,
  updateSession,
  clearAuth,
  refreshAuth,
} from "@/store/slices/authSlice";
import {
  selectUser,
  selectProfile,
  selectHealthProfile,
  selectSession,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectUserDisplayName,
  selectUserEmail,
  selectUserRole,
  selectIsAdmin,
  selectIsCoach,
  selectIsMealProvider,
  selectIsUser,
} from "@/store/selectors";
import * as authService from "@/services/api/auth.service";
import * as profileService from "@/services/api/profile.service";
import { supabase } from "@/supabaseClient";
import { ROUTES } from "@/config/constants";

/**
 * Custom hook for authentication with Redux
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select state from Redux
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const healthProfile = useSelector(selectHealthProfile);
  const session = useSelector(selectSession);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const displayName = useSelector(selectUserDisplayName);
  const email = useSelector(selectUserEmail);
  const role = useSelector(selectUserRole);
  const isAdmin = useSelector(selectIsAdmin);
  const isCoach = useSelector(selectIsCoach);
  const isMealProvider = useSelector(selectIsMealProvider);
  const isUser = useSelector(selectIsUser);

  // Track if this hook instance has already initialized
  const hasInitialized = useRef(false);

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    // Skip if already initialized by this hook instance
    if (hasInitialized.current) {
      return;
    }

    if (isAuthenticated && user && !loading) {
      hasInitialized.current = true;
      return;
    }
    let mounted = true;

    const initAuth = async () => {
      hasInitialized.current = true;
      dispatch(setAuthLoading(true));

      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          // Fetch profile data
          const [profileResult, healthProfileResult] = await Promise.all([
            profileService.getProfile(session.user.id),
            profileService.getHealthProfile(session.user.id),
          ]);

          if (mounted) {
            const authData = {
              user: session.user,
              session,
              profile: profileResult.data || {
                id: session.user.id,
                email: session.user.email,
                full_name: "",
                phone: "",
                gender: "",
              },
              healthProfile: healthProfileResult.data,
            };
            dispatch(setAuth(authData));
          }
        } else {
          dispatch(setAuthLoading(false));
        }
      } catch (error) {
        if (mounted) {
          dispatch(setAuthError(error.message));
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        const [profileResult, healthProfileResult] = await Promise.all([
          profileService.getProfile(session.user.id),
          profileService.getHealthProfile(session.user.id),
        ]);

        dispatch(
          setAuth({
            user: session.user,
            session,
            profile: profileResult.data || {
              id: session.user.id,
              email: session.user.email,
              full_name: "",
              phone: "",
              gender: "",
            },
            healthProfile: healthProfileResult.data,
          })
        );
      } else if (event === "SIGNED_OUT") {
        dispatch(clearAuth());
      } else if (event === "TOKEN_REFRESHED" && session) {
        dispatch(updateSession(session));
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [dispatch]);

  /**
   * Sign in user
   */
  const signIn = useCallback(
    async (credentials) => {
      dispatch(setAuthLoading(true));
      dispatch(clearAuthError());

      try {
        const { data, error } = await authService.signIn(credentials);

        if (error) {
          dispatch(setAuthError(error?.message || String(error)));
          dispatch(setAuthLoading(false));
          return { error };
        }

        if (data.user) {
          await profileService.updateLastLogin(data.user.id);

          const [profileResult, healthProfileResult] = await Promise.all([
            profileService.getProfile(data.user.id),
            profileService.getHealthProfile(data.user.id),
          ]);

          dispatch(
            setAuth({
              user: data.user,
              session: data.session,
              profile: profileResult.data,
              healthProfile: healthProfileResult.data,
            })
          );
        }

        return { data, error: null };
      } catch (err) {
        dispatch(setAuthError(err?.message || String(err)));
        dispatch(setAuthLoading(false));
        return { error: err };
      }
    },
    [dispatch]
  );

  /**
   * Sign up new user
   */
  const signUp = useCallback(
    async (userData) => {
      dispatch(setAuthLoading(true));
      dispatch(clearAuthError());

      const { data, error } = await authService.signUp(userData);

      if (error) {
        dispatch(setAuthError(error.message));
      } else {
        dispatch(setAuthLoading(false));
      }

      return { data, error };
    },
    [dispatch]
  );

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    const { error } = await authService.signOut();

    if (!error) {
      dispatch(clearAuth());
      navigate(ROUTES.LOGIN);
    }

    return { error };
  }, [dispatch, navigate]);

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
        dispatch(updateProfileAction(data));
      }

      return { data, error };
    },
    [user, dispatch]
  );

  /**
   * Update health profile
   */
  const updateHealthProfile = useCallback(
    async (healthData, assessmentData = null) => {
      if (!user) return { error: new Error("No user logged in") };

      const { data, error } = await profileService.updateHealthProfile(
        user.id,
        healthData,
        assessmentData
      );

      if (data) {
        dispatch(updateHealthProfileAction(data));
      }

      return { data, error };
    },
    [user, dispatch]
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
      dispatch(updateSession(data.session));
    }

    return { data, error };
  }, [dispatch]);

  /**
   * Refresh user data (profile and health profile)
   */
  const refreshUserData = useCallback(async () => {
    if (!user) return;

    const [profileResult, healthProfileResult] = await Promise.all([
      profileService.getProfile(user.id),
      profileService.getHealthProfile(user.id),
    ]);

    dispatch(
      refreshAuth({
        profile: profileResult.data,
        healthProfile: healthProfileResult.data,
      })
    );
  }, [user, dispatch]);

  return {
    // State
    user,
    profile,
    healthProfile,
    session,
    loading,
    error,
    isAuthenticated,
    displayName,
    email,
    role,
    isAdmin,
    isCoach,
    isMealProvider,
    isUser,

    // Actions
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateHealthProfile,
    resetPassword,
    updatePassword,
    refreshSession,
    refreshUserData,
    clearError: () => dispatch(clearAuthError()),
  };
};
