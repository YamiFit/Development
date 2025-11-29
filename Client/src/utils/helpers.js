/**
 * General Utility Functions
 * Common helper functions used across the application
 */

import { DEBOUNCE_DELAY } from '@/config/constants';

/**
 * Debounce function
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {function} - Debounced function
 */
export const debounce = (func, wait = DEBOUNCE_DELAY.NORMAL) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type
 * @returns {string} - Formatted date
 */
export const formatDate = (date, format = 'default') => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return 'Invalid date';

  const options = {
    default: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  return d.toLocaleDateString('en-US', options[format] || options.default);
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (num) => {
  return num?.toLocaleString() || '0';
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Max length
 * @returns {string} - Truncated text
 */
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Generate random ID
 * @returns {string} - Random ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Deep clone object
 * @param {object} obj - Object to clone
 * @returns {object} - Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean}
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim().length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Class names helper
 * @param  {...any} classes - Classes to combine
 * @returns {string} - Combined class string
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Pick properties from object
 * @param {object} obj - Source object
 * @param {array} keys - Keys to pick
 * @returns {object} - New object with picked keys
 */
export const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

/**
 * Omit properties from object
 * @param {object} obj - Source object
 * @param {array} keys - Keys to omit
 * @returns {object} - New object without omitted keys
 */
export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};
