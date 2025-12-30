/**
 * Translation Helper Utilities
 * Helper functions for handling dynamic content translations from database
 */

/**
 * Get localized value from an object with _en and _ar suffixed fields
 * @param {object} obj - Object containing both language variants
 * @param {string} field - Base field name (e.g., 'name', 'description')
 * @param {string} locale - Current locale ('en' or 'ar')
 * @param {string} fallback - Optional fallback value
 * @returns {string} - Localized value
 * 
 * @example
 * // Given: { name_en: 'Grilled Chicken', name_ar: 'دجاج مشوي' }
 * getLocalizedField(meal, 'name', 'ar') // Returns 'دجاج مشوي'
 */
export const getLocalizedField = (obj, field, locale, fallback = '') => {
  if (!obj) return fallback;
  
  const localizedKey = `${field}_${locale}`;
  const primaryValue = obj[localizedKey];
  
  // If primary locale value exists and is not empty
  if (primaryValue && primaryValue.trim() !== '') {
    return primaryValue;
  }
  
  // Fallback to other language
  const fallbackLocale = locale === 'ar' ? 'en' : 'ar';
  const fallbackKey = `${field}_${fallbackLocale}`;
  const fallbackValue = obj[fallbackKey];
  
  if (fallbackValue && fallbackValue.trim() !== '') {
    return fallbackValue;
  }
  
  // Last resort: try the original field without suffix
  if (obj[field] && typeof obj[field] === 'string' && obj[field].trim() !== '') {
    return obj[field];
  }
  
  return fallback;
};

/**
 * Create a localized object with display fields
 * Maps bilingual DB fields to single display fields based on locale
 * 
 * @param {object} obj - Object with bilingual fields
 * @param {string[]} fields - Array of base field names to localize
 * @param {string} locale - Current locale
 * @returns {object} - Object with added localized display fields
 * 
 * @example
 * const meal = { name_en: 'Chicken', name_ar: 'دجاج', description_en: 'Grilled', description_ar: 'مشوي' };
 * localizeObject(meal, ['name', 'description'], 'ar')
 * // Returns: { ...meal, name: 'دجاج', description: 'مشوي' }
 */
export const localizeObject = (obj, fields, locale) => {
  if (!obj) return obj;
  
  const localized = { ...obj };
  
  fields.forEach(field => {
    localized[field] = getLocalizedField(obj, field, locale);
  });
  
  return localized;
};

/**
 * Localize an array of objects
 * @param {object[]} arr - Array of objects with bilingual fields
 * @param {string[]} fields - Array of base field names to localize
 * @param {string} locale - Current locale
 * @returns {object[]} - Array with localized display fields
 */
export const localizeArray = (arr, fields, locale) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => localizeObject(item, fields, locale));
};

/**
 * Get localized status text
 * @param {string} status - Status value from DB
 * @param {string} statusType - Type of status ('order', 'appointment', 'assignment', 'subscription', 'provider')
 * @param {function} t - Translation function from i18next
 * @returns {string} - Localized status text
 */
export const getLocalizedStatus = (status, statusType, t) => {
  if (!status) return '';
  
  // Map snake_case/camelCase DB values to translation keys
  const statusKeyMap = {
    'out_for_delivery': 'outForDelivery',
    'under_preparation': 'underPreparation',
  };
  
  const translationKey = statusKeyMap[status] || status.toLowerCase();
  const translated = t(`status.${statusType}.${translationKey}`, { defaultValue: status });
  
  return translated;
};

/**
 * Get localized meal category
 * @param {string} category - Category from DB
 * @param {function} t - Translation function
 * @returns {string} - Localized category name
 */
export const getLocalizedCategory = (category, t) => {
  if (!category) return '';
  return t(`meals.categories.${category.toLowerCase()}`, { defaultValue: category });
};

/**
 * Format number according to locale
 * @param {number} num - Number to format
 * @param {string} locale - Locale ('en' or 'ar')
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} - Formatted number
 */
export const formatLocalizedNumber = (num, locale, options = {}) => {
  if (num === null || num === undefined) return '';
  
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
  };
  
  const intlLocale = localeMap[locale] || 'en-US';
  
  return new Intl.NumberFormat(intlLocale, options).format(num);
};

/**
 * Format currency according to locale
 * @param {number} amount - Amount to format
 * @param {string} locale - Locale ('en' or 'ar')
 * @param {string} currency - Currency code (default: 'JOD')
 * @returns {string} - Formatted currency string
 */
export const formatLocalizedCurrency = (amount, locale, currency = 'JOD') => {
  return formatLocalizedNumber(amount, locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format date according to locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale ('en' or 'ar')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatLocalizedDate = (date, locale, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
  };
  
  const intlLocale = localeMap[locale] || 'en-US';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(intlLocale, defaultOptions).format(dateObj);
};

/**
 * Format time according to locale
 * @param {Date|string} date - Date/time to format
 * @param {string} locale - Locale ('en' or 'ar')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted time string
 */
export const formatLocalizedTime = (date, locale, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
  };
  
  const intlLocale = localeMap[locale] || 'en-US';
  
  const defaultOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  };
  
  return new Intl.DateTimeFormat(intlLocale, defaultOptions).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale ('en' or 'ar')
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (date, locale) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const localeMap = {
    en: 'en-US',
    ar: 'ar-SA',
  };
  
  const intlLocale = localeMap[locale] || 'en-US';
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });
  
  if (diffDays > 0) {
    return rtf.format(-diffDays, 'day');
  } else if (diffHours > 0) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffMins > 0) {
    return rtf.format(-diffMins, 'minute');
  } else {
    return rtf.format(-diffSecs, 'second');
  }
};

/**
 * Field mappings for different entity types
 * Use these to quickly localize common entities
 */
export const LOCALIZED_FIELDS = {
  meal: ['name', 'description'],
  meal_provider: ['business_name', 'provider_name', 'bio', 'address'],
  coach_profile: ['bio', 'full_name'],
  client_plan: ['diet_text', 'exercise_text', 'notes'],
  subscription_plan: ['name', 'description'],
};

/**
 * Quick localization function for common entities
 * @param {string} entityType - Type of entity (meal, meal_provider, coach_profile, etc.)
 * @param {object|object[]} data - Single object or array of objects
 * @param {string} locale - Current locale
 * @returns {object|object[]} - Localized data
 */
export const localizeEntity = (entityType, data, locale) => {
  const fields = LOCALIZED_FIELDS[entityType];
  if (!fields) return data;
  
  if (Array.isArray(data)) {
    return localizeArray(data, fields, locale);
  }
  return localizeObject(data, fields, locale);
};

export default {
  getLocalizedField,
  localizeObject,
  localizeArray,
  getLocalizedStatus,
  getLocalizedCategory,
  formatLocalizedNumber,
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedTime,
  formatRelativeTime,
  localizeEntity,
  LOCALIZED_FIELDS,
};
