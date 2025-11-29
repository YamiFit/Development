/**
 * Validation Utilities
 * Centralized validation logic following DRY principles
 */

import { REGEX_PATTERNS, VALIDATION_RULES } from '@/config/constants';

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return REGEX_PATTERNS.EMAIL.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and errors
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`);
  }

  if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
    errors.push(`Password must be less than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculate password strength
 * @param {string} password - Password to check
 * @returns {object} - Strength info with level, label, and color
 */
export const calculatePasswordStrength = (password) => {
  if (!password) {
    return { strength: 0, label: '', color: '' };
  }

  let strength = 0;
  
  // Length checks
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Character variety checks
  if (REGEX_PATTERNS.PASSWORD_LOWERCASE.test(password) && 
      REGEX_PATTERNS.PASSWORD_UPPERCASE.test(password)) {
    strength++;
  }
  if (REGEX_PATTERNS.PASSWORD_DIGIT.test(password)) strength++;
  if (REGEX_PATTERNS.PASSWORD_SPECIAL.test(password)) strength++;

  // Determine strength level
  if (strength <= 2) {
    return { strength: 1, label: 'weak', color: 'bg-red-500' };
  }
  if (strength <= 3) {
    return { strength: 2, label: 'medium', color: 'bg-yellow-500' };
  }
  return { strength: 3, label: 'strong', color: 'bg-green-500' };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  return REGEX_PATTERNS.PHONE.test(phone);
};

/**
 * Validate required field
 * @param {*} value - Value to check
 * @returns {boolean} - Whether value exists
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate form fields
 * @param {object} fields - Object with field names and values
 * @param {object} rules - Validation rules for each field
 * @returns {object} - Validation result with isValid and errors object
 */
export const validateForm = (fields, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach((fieldName) => {
    const value = fields[fieldName];
    const fieldRules = rules[fieldName];

    if (fieldRules.required && !isRequired(value)) {
      errors[fieldName] = `${fieldRules.label || fieldName} is required`;
      isValid = false;
      return;
    }

    if (fieldRules.email && !isValidEmail(value)) {
      errors[fieldName] = 'Please enter a valid email address';
      isValid = false;
    }

    if (fieldRules.phone && !isValidPhone(value)) {
      errors[fieldName] = 'Please enter a valid phone number';
      isValid = false;
    }

    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[fieldName] = `${fieldRules.label || fieldName} must be at least ${fieldRules.minLength} characters`;
      isValid = false;
    }

    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[fieldName] = `${fieldRules.label || fieldName} must be less than ${fieldRules.maxLength} characters`;
      isValid = false;
    }

    if (fieldRules.match && value !== fields[fieldRules.match]) {
      errors[fieldName] = `${fieldRules.label || fieldName} does not match`;
      isValid = false;
    }

    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customResult = fieldRules.custom(value, fields);
      if (customResult !== true) {
        errors[fieldName] = customResult;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};

/**
 * Sanitize user input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};
