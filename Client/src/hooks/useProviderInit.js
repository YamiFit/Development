/**
 * useProviderInit Hook - Provider initialization and management
 * Initializes provider profile, stats, and working hours on mount
 */

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setProviderLoading,
  setProviderError,
  setProviderProfile,
  setProviderStats,
  setWorkingHours,
} from "@/store/slices/providerSlice";
import {
  selectUser,
  selectProviderProfile,
  selectProviderLoading,
  selectProviderError,
  selectProviderStats,
} from "@/store/selectors";
import * as providersService from "@/services/api/providers.service";

/**
 * Custom hook for provider initialization
 * Automatically fetches provider data on mount for meal_provider users
 */
export const useProviderInit = () => {
  const dispatch = useDispatch();

  // Select state from Redux
  const user = useSelector(selectUser);
  const providerProfile = useSelector(selectProviderProfile);
  const loading = useSelector(selectProviderLoading);
  const error = useSelector(selectProviderError);
  const stats = useSelector(selectProviderStats);

  /**
   * Initialize provider data
   */
  useEffect(() => {
    // Skip if provider already loaded (handles React StrictMode double-mount)
    if (providerProfile !== null) {
      return;
    }

    // Skip if no user
    if (!user) {
      return;
    }

    let mounted = true;

    const initProvider = async () => {
      dispatch(setProviderLoading(true));

      try {
        // Fetch provider profile
        const { data: providerData, error: providerError } =
          await providersService.getProviderProfile(user.id);

        if (providerError) {
          throw providerError;
        }

        // If no provider profile exists, create a skeleton one
        if (!providerData) {
          const { data: newProvider, error: createError } =
            await providersService.createProviderProfile(user.id, {
              business_name: "",
              email: user.email || "",
            });

          if (createError) {
            throw createError;
          }

          dispatch(setProviderProfile(newProvider));
          dispatch(setProviderLoading(false));
          return;
        }

        // Provider exists, dispatch it (okay to dispatch even if unmounted)
        dispatch(setProviderProfile(providerData));

        // Only continue fetching stats/hours if component is still mounted
        if (!mounted) {
          dispatch(setProviderLoading(false));
          return;
        }

        // Fetch stats and working hours in parallel (with error handling)
        try {
          const [statsResult, hoursResult] = await Promise.all([
            providersService.getProviderStats(providerData.id),
            providersService.getProviderWorkingHours(providerData.id),
          ]);

          if (!mounted) return;

          // Set stats
          if (statsResult.data) {
            dispatch(setProviderStats(statsResult.data));
          }

          // Set working hours
          if (hoursResult.data) {
            dispatch(setWorkingHours(hoursResult.data));
          } else {
            console.warn("⚠️ No working hours data to dispatch");
          }
        } catch (statsError) {
          // Don't fail the whole init if stats/hours fail
          console.warn("Failed to load stats or working hours:", statsError);
        }

        dispatch(setProviderLoading(false));
      } catch (err) {
        if (mounted) {
          dispatch(
            setProviderError(
              err.message || "Failed to initialize provider data"
            )
          );
          dispatch(setProviderLoading(false));
        }
      }
    };

    initProvider();

    // Cleanup function
    return () => {
      mounted = false;
      // Don't reset hasInitialized here - let the providerProfile check handle re-initialization
    };
  }, [user, dispatch]);

  // Return provider state
  return {
    provider: providerProfile,
    stats,
    loading,
    error,
  };
};

export default useProviderInit;
