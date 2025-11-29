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
  DASHBOARD: '/home',
  MEALS: '/meals',
  TRACKER: '/tracker',
  PROGRESS: '/progress',
  COACHING: '/coaching',
  ORDERS: '/orders',
  SUBSCRIPTIONS: '/subscriptions',
  SETTINGS: '/settings',
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
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
};

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  PASSWORD_LOWERCASE: /[a-z]/,
  PASSWORD_UPPERCASE: /[A-Z]/,
  PASSWORD_DIGIT: /\d/,
  PASSWORD_SPECIAL: /[^a-zA-Z0-9]/,
};

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  FORM_VALIDATION: 500,
};
