/**
 * Redux Selectors - Memoized state selectors
 * Provides clean access to Redux state with performance optimization
 */

import { createSelector } from '@reduxjs/toolkit';

// ==================== AUTH SELECTORS ====================

/**
 * Select auth state
 */
export const selectAuth = (state) => state.auth;

/**
 * Select user
 */
export const selectUser = (state) => state.auth.user;

/**
 * Select profile
 */
export const selectProfile = (state) => state.auth.profile;

/**
 * Select health profile
 */
export const selectHealthProfile = (state) => state.auth.healthProfile;

/**
 * Select session
 */
export const selectSession = (state) => state.auth.session;

/**
 * Select authentication status
 */
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

/**
 * Select auth loading state
 */
export const selectAuthLoading = (state) => state.auth.loading;

/**
 * Select auth error
 */
export const selectAuthError = (state) => state.auth.error;

/**
 * Memoized selector for user display name
 */
export const selectUserDisplayName = createSelector(
  [selectUser, selectProfile],
  (user, profile) => {
    if (!user) return null;
    return profile?.full_name || user.email?.split('@')[0] || 'User';
  }
);

/**
 * Memoized selector for user email
 */
export const selectUserEmail = createSelector(
  [selectUser, selectProfile],
  (user, profile) => profile?.email || user?.email || null
);

/**
 * Select user role
 */
export const selectUserRole = (state) => state.auth.profile?.role || null;

/**
 * Memoized selector to check if user is admin
 */
export const selectIsAdmin = createSelector(
  [selectUserRole],
  (role) => role === 'admin'
);

/**
 * Memoized selector to check if user is coach
 */
export const selectIsCoach = createSelector(
  [selectUserRole],
  (role) => role === 'coach'
);

/**
 * Memoized selector to check if user is meal provider
 */
export const selectIsMealProvider = createSelector(
  [selectUserRole],
  (role) => role === 'meal_provider'
);

/**
 * Memoized selector to check if user is regular user
 */
export const selectIsUser = createSelector(
  [selectUserRole],
  (role) => role === 'user'
);

/**
 * Memoized selector to check if user has one of the allowed roles
 */
export const selectHasRole = (allowedRoles) => createSelector(
  [selectUserRole],
  (role) => role && allowedRoles.includes(role)
);

/**
 * Select user subscription plan
 */
export const selectUserPlan = (state) => state.auth.profile?.plan || 'BASIC';

/**
 * Memoized selector to check if user has PRO plan
 */
export const selectIsPro = createSelector(
  [selectUserPlan],
  (plan) => plan === 'PRO'
);

/**
 * Memoized selector to check if user has BASIC plan
 */
export const selectIsBasic = createSelector(
  [selectUserPlan],
  (plan) => plan === 'BASIC'
);

/**
 * Select user's selected coach ID
 */
export const selectSelectedCoachId = (state) => state.auth.profile?.selected_coach_id || null;

// ==================== SETTINGS SELECTORS ====================

/**
 * Select settings state
 */
export const selectSettings = (state) => state.settings;

/**
 * Select notification preferences
 */
export const selectNotificationPreferences = (state) => state.settings.notificationPreferences;

/**
 * Select user preferences
 */
export const selectUserPreferences = (state) => state.settings.userPreferences;

/**
 * Select settings loading state
 */
export const selectSettingsLoading = (state) => state.settings.loading;

/**
 * Select settings error
 */
export const selectSettingsError = (state) => state.settings.error;

/**
 * Memoized selector for theme preference
 */
export const selectTheme = createSelector(
  [selectUserPreferences],
  (preferences) => preferences?.theme || 'light'
);

/**
 * Memoized selector for language preference
 */
export const selectLanguage = createSelector(
  [selectUserPreferences],
  (preferences) => preferences?.language || 'en'
);

/**
 * Memoized selector for unit system
 */
export const selectUnitSystem = createSelector(
  [selectUserPreferences],
  (preferences) => preferences?.unit_system || 'metric'
);

// ==================== UI SELECTORS ====================

/**
 * Select UI state
 */
export const selectUI = (state) => state.ui;

/**
 * Select add meal modal state
 */
export const selectAddMealOpen = (state) => state.ui.addMealOpen;

/**
 * Select sidebar state
 */
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;

/**
 * Select mobile menu state
 */
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;

/**
 * Select active tab
 */
export const selectActiveTab = (state) => state.ui.activeTab;

/**
 * Select loading states
 */
export const selectLoadingStates = (state) => state.ui.loading;

/**
 * Select specific loading state
 */
export const selectLoadingState = (key) => (state) => state.ui.loading[key] || false;

/**
 * Select modals
 */
export const selectModals = (state) => state.ui.modals;

/**
 * Select specific modal
 */
export const selectModal = (name) => (state) => state.ui.modals[name] || { open: false, data: null };

// ==================== COMBINED SELECTORS ====================

/**
 * Memoized selector for complete user context
 */
export const selectUserContext = createSelector(
  [selectUser, selectProfile, selectHealthProfile, selectIsAuthenticated],
  (user, profile, healthProfile, isAuthenticated) => ({
    user,
    profile,
    healthProfile,
    isAuthenticated,
    displayName: profile?.full_name || user?.email?.split('@')[0] || 'User',
    email: profile?.email || user?.email || null,
    role: profile?.role || null,
  })
);

/**
 * Memoized selector for app preferences
 */
export const selectAppPreferences = createSelector(
  [selectUserPreferences, selectNotificationPreferences],
  (userPreferences, notificationPreferences) => ({
    theme: userPreferences?.theme || 'light',
    language: userPreferences?.language || 'en',
    unitSystem: userPreferences?.unit_system || 'metric',
    notifications: notificationPreferences || {},
  })
);

// ==================== PROVIDER SELECTORS ====================

/**
 * Select provider state
 */
export const selectProvider = (state) => state.provider;

/**
 * Select provider profile
 */
export const selectProviderProfile = (state) => state.provider.providerProfile;

/**
 * Select provider working hours
 */
export const selectWorkingHours = (state) => state.provider.workingHours;

/**
 * Select provider stats
 */
export const selectProviderStats = (state) => state.provider.stats;

/**
 * Select provider loading state
 */
export const selectProviderLoading = (state) => state.provider.loading;

/**
 * Select provider error
 */
export const selectProviderError = (state) => state.provider.error;

/**
 * Memoized selector for provider ID
 */
export const selectProviderId = createSelector(
  [selectProviderProfile],
  (profile) => profile?.id || null
);

/**
 * Memoized selector to check if provider profile is complete
 */
export const selectIsProviderProfileComplete = createSelector(
  [selectProviderProfile],
  (profile) => {
    if (!profile) return false;
    return Boolean(
      profile.business_name &&
      profile.address &&
      profile.phone &&
      profile.email
    );
  }
);

// ==================== MEALS SELECTORS ====================

/**
 * Select meals state
 */
export const selectMeals = (state) => state.meals;

/**
 * Select meals list
 */
export const selectMealsList = (state) => state.meals.meals;

/**
 * Select selected meal
 */
export const selectSelectedMeal = (state) => state.meals.selectedMeal;

/**
 * Select meals filters
 */
export const selectMealsFilters = (state) => state.meals.filters;

/**
 * Select meals loading state
 */
export const selectMealsLoading = (state) => state.meals.loading;

/**
 * Select meals error
 */
export const selectMealsError = (state) => state.meals.error;

/**
 * Memoized selector for filtered meals
 */
export const selectFilteredMeals = createSelector(
  [selectMealsList, selectMealsFilters],
  (meals, filters) => {
    return meals.filter((meal) => {
      // Category filter
      const matchesCategory = filters.category === 'all' || meal.category === filters.category;

      // Availability filter
      const matchesAvailability = filters.availability === 'all' ||
        (filters.availability === 'available' ? meal.is_available : !meal.is_available);

      // Search filter
      const matchesSearch = !filters.search ||
        meal.name.toLowerCase().includes(filters.search.toLowerCase());

      return matchesCategory && matchesAvailability && matchesSearch;
    });
  }
);

/**
 * Memoized selector for available meals count
 */
export const selectAvailableMealsCount = createSelector(
  [selectMealsList],
  (meals) => meals.filter(meal => meal.is_available).length
);

// ==================== PROVIDER ORDERS SELECTORS ====================

/**
 * Select provider orders state
 */
export const selectProviderOrders = (state) => state.providerOrders;

/**
 * Select orders list
 */
export const selectOrdersList = (state) => state.providerOrders.orders;

/**
 * Select selected order
 */
export const selectSelectedOrder = (state) => state.providerOrders.selectedOrder;

/**
 * Select orders filters
 */
export const selectOrdersFilters = (state) => state.providerOrders.filters;

/**
 * Select orders loading state
 */
export const selectOrdersLoading = (state) => state.providerOrders.loading;

/**
 * Select orders error
 */
export const selectOrdersError = (state) => state.providerOrders.error;

/**
 * Memoized selector for filtered orders
 */
export const selectFilteredOrders = createSelector(
  [selectOrdersList, selectOrdersFilters],
  (orders, filters) => {
    return orders.filter((order) => {
      // Status filter
      const matchesStatus = filters.status === 'all' || order.status === filters.status;

      // Search filter (customer name or order ID)
      const matchesSearch = !filters.search ||
        order.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.id?.toLowerCase().includes(filters.search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }
);

/**
 * Memoized selector for pending orders count
 */
export const selectPendingOrdersCount = createSelector(
  [selectOrdersList],
  (orders) => orders.filter(order => order.status === 'pending').length
);
