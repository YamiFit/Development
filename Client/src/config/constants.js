/**
 * Application Constants
 * Centralized configuration values
 */

export const APP_CONFIG = {
  name: 'YamiFit',
  version: '1.0.0',
  defaultLanguage: 'en',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  // User dashboard routes
  DASHBOARD: '/home',
  MEALS: '/meals',
  TRACKER: '/tracker',
  TRACKER_COACH: '/tracker/coach',
  PROGRESS: '/progress',
  COACHING: '/coaching',
  MY_PLAN: '/my-plan',
  APPOINTMENTS: '/appointments',
  ORDERS: '/orders',
  SUBSCRIPTIONS: '/subscriptions',
  SETTINGS: '/settings',
  UPGRADE: '/upgrade',
  // Coach dashboard
  COACH_DASHBOARD: '/coach/dashboard',
  COACH_PROFILE: '/coach/profile',
  COACH_CLIENTS: '/coach/clients',
  COACH_APPOINTMENTS: '/coach/appointments',
  // Service Provider dashboard
  PROVIDER_DASHBOARD: '/provider/dashboard',
  PROVIDER_PROFILE: '/provider/profile',
  // Unauthorized access
  UNAUTHORIZED: '/unauthorized',
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
};

export const PASSWORD_STRENGTH = {
  WEAK: { value: 1, label: 'weak', color: 'bg-red-500' },
  MEDIUM: { value: 2, label: 'medium', color: 'bg-yellow-500' },
  STRONG: { value: 3, label: 'strong', color: 'bg-green-500' },
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'yamifit_auth_token',
  USER_PREFERENCES: 'yamifit_user_preferences',
  LANGUAGE: 'yamifit_language',
  REDUX_PERSIST: 'persist:yamifit',
};

export const SESSION_STORAGE_KEYS = {
  TEMP_AUTH: 'yamifit_temp_auth',
  FORM_DATA: 'yamifit_form_data',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  DATA_SYNCED: 'Data synced successfully!',
};

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  PASSWORD_LOWERCASE: /[a-z]/,
  PASSWORD_UPPERCASE: /[A-Z]/,
  PASSWORD_DIGIT: /\d/,
  PASSWORD_SPECIAL: /[^a-zA-Z0-9]/,
  URL: /^https?:\/\/([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
};

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
};

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  FORM_VALIDATION: 500,
  AUTO_SAVE: 1000,
  SCROLL: 100,
};

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
};

export const LANGUAGE = {
  ENGLISH: 'en',
  ARABIC: 'ar',
};

export const UNIT_SYSTEM = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
};

export const USER_ROLES = {
  USER: 'user',
  COACH: 'coach',
  MEAL_PROVIDER: 'meal_provider',
  ADMIN: 'admin',
};

export const USER_PLANS = {
  BASIC: 'BASIC',
  PRO: 'PRO',
};

// Routes that require PRO plan
export const PRO_ROUTES = ['/tracker', '/progress', '/coaching'];

// Routes renamed in UI (keep paths, change labels)
export const ROUTE_LABELS = {
  '/progress': 'Chatting',
  '/coaching': 'Chatting',
};

export const ROLE_PERMISSIONS = {
  user: {
    canAccessUserDashboard: true,
    canAccessCoachDashboard: false,
    canAccessProviderDashboard: false,
  },
  coach: {
    canAccessUserDashboard: false,
    canAccessCoachDashboard: true,
    canAccessProviderDashboard: false,
  },
  meal_provider: {
    canAccessUserDashboard: false,
    canAccessCoachDashboard: false,
    canAccessProviderDashboard: true,
  },
  admin: {
    canAccessUserDashboard: true,
    canAccessCoachDashboard: true,
    canAccessProviderDashboard: true,
  },
};

export const ROLE_DASHBOARD_ROUTES = {
  user: '/home',
  coach: '/coach/dashboard',
  meal_provider: '/provider/dashboard',
  admin: '/home',
};

export const API_ENDPOINTS = {
  AUTH: '/auth',
  PROFILE: '/profile',
  HEALTH_PROFILE: '/health-profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
};

export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};
