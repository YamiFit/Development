/**
 * Redux Store Configuration with Redux Persist
 * Central state management with persistent storage
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage

// Import reducers
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import providerReducer from './slices/providerSlice';
import mealsReducer from './slices/mealsSlice';
import providerOrdersReducer from './slices/providerOrdersSlice';

/**
 * Persist configuration
 */
const persistConfig = {
  key: 'yamifit',
  version: 1,
  storage,
  whitelist: ['auth', 'settings'], // Only persist auth and settings
  blacklist: ['ui'], // Don't persist UI state
};

/**
 * Auth persist configuration (selective)
 */
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'profile', 'healthProfile', 'session', 'isAuthenticated'], // Persist auth data
  blacklist: ['loading', 'error'], // Don't persist loading/error states
};

/**
 * Settings persist configuration (selective)
 */
const settingsPersistConfig = {
  key: 'settings',
  storage,
  whitelist: ['notificationPreferences', 'userPreferences'], // Persist settings
  blacklist: ['loading', 'error'], // Don't persist loading/error states
};

/**
 * Root reducer with nested persist configs
 */
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  ui: uiReducer, // UI state is not persisted
  provider: providerReducer, // Provider state is not persisted (fresh data)
  meals: mealsReducer, // Meals state is not persisted (fresh data)
  providerOrders: providerOrdersReducer, // Orders state is not persisted (fresh data)
});

/**
 * Create persisted reducer
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure store
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

/**
 * Create persistor
 */
export const persistor = persistStore(store);

export default store;
