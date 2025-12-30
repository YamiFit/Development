/**
 * Store Exports - Central export for Redux store, slices, selectors, and utilities
 * Provides clean import paths for Redux functionality
 */

// Store and persistor
export { store, persistor } from './index';

// Selectors
export * from './selectors';

// Action creators from slices
export {
  // Auth actions
  setAuthLoading,
  setAuthError,
  clearAuthError,
  setAuth,
  updateProfile,
  updateHealthProfile,
  updateSession,
  clearAuth,
  refreshAuth,
} from './slices/authSlice';

export {
  // Settings actions
  setSettingsLoading,
  setSettingsError,
  clearSettingsError,
  setNotificationPreferences,
  updateNotificationPreference,
  setUserPreferences,
  updateUserPreference,
  clearSettings,
} from './slices/settingsSlice';

export {
  // UI actions
  openAddMeal,
  closeAddMeal,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  toggleMobileMenu,
  closeMobileMenu,
  setActiveTab,
  setLoading,
  clearLoading,
  openModal,
  closeModal,
  setModalData,
} from './slices/uiSlice';

// Utilities
export * from './utils/actionCreators';
export * from './utils/helpers';
