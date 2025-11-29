/**
 * Error Handling Utilities
 * Centralized error handling and formatting
 */

import { ERROR_MESSAGES } from '@/config/constants';

/**
 * Format API error for display
 * @param {Error|object} error - Error object
 * @param {object} customMessages - Custom error messages
 * @returns {string} - Formatted error message
 */
export const formatApiError = (error, customMessages = {}) => {
  if (!error) return ERROR_MESSAGES.GENERIC_ERROR;

  const message = error.message || error.error_description || error.msg;

  // Check for custom messages first
  for (const [key, value] of Object.entries(customMessages)) {
    if (message?.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Handle common error patterns
  if (message?.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (message?.includes('JWT') || message?.includes('token')) {
    return ERROR_MESSAGES.SESSION_EXPIRED;
  }

  return message || ERROR_MESSAGES.GENERIC_ERROR;
};

/**
 * Log error to console in development
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
export const logError = (context, error) => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
};

/**
 * Create error object
 * @param {string} message - Error message
 * @param {number} code - Error code
 * @param {object} details - Additional details
 * @returns {object} - Error object
 */
export const createError = (message, code = null, details = {}) => {
  return {
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Check if error is network error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return (
    error?.message?.includes('fetch') ||
    error?.message?.includes('network') ||
    error?.code === 'NETWORK_ERROR'
  );
};

/**
 * Check if error is authentication error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return (
    error?.message?.includes('JWT') ||
    error?.message?.includes('token') ||
    error?.message?.includes('Unauthorized') ||
    error?.code === 401 ||
    error?.status === 401
  );
};
