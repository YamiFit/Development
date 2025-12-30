/**
 * useLocale Hook
 * Custom hook for locale-aware operations
 * Combines react-i18next with custom translation helpers
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
} from '@/lib/translationHelpers';
import { SUPPORTED_LANGUAGES, isRTLLanguage } from '@/lib/i18n';

/**
 * Main hook for locale-aware operations
 * @returns {object} - Locale utilities and helpers
 */
export const useLocale = () => {
  const { t, i18n } = useTranslation();
  
  const locale = i18n.language;
  const isRTL = isRTLLanguage(locale);
  const direction = isRTL ? 'rtl' : 'ltr';
  
  /**
   * Change the current language
   * @param {string} lang - Language code ('en' or 'ar')
   */
  const changeLanguage = useCallback((lang) => {
    if (SUPPORTED_LANGUAGES[lang]) {
      i18n.changeLanguage(lang);
    }
  }, [i18n]);
  
  /**
   * Toggle between English and Arabic
   */
  const toggleLanguage = useCallback(() => {
    const newLang = locale === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  }, [locale, i18n]);
  
  /**
   * Get field value from object based on current locale
   */
  const getField = useCallback((obj, field, fallback = '') => {
    return getLocalizedField(obj, field, locale, fallback);
  }, [locale]);
  
  /**
   * Localize an object's fields
   */
  const localize = useCallback((obj, fields) => {
    return localizeObject(obj, fields, locale);
  }, [locale]);
  
  /**
   * Localize an array of objects
   */
  const localizeList = useCallback((arr, fields) => {
    return localizeArray(arr, fields, locale);
  }, [locale]);
  
  /**
   * Localize an entity using predefined field mappings
   */
  const localizeByType = useCallback((entityType, data) => {
    return localizeEntity(entityType, data, locale);
  }, [locale]);
  
  /**
   * Get translated status text
   */
  const status = useCallback((statusValue, statusType) => {
    return getLocalizedStatus(statusValue, statusType, t);
  }, [t]);
  
  /**
   * Get translated meal category
   */
  const category = useCallback((categoryValue) => {
    return getLocalizedCategory(categoryValue, t);
  }, [t]);
  
  /**
   * Format a number
   */
  const formatNumber = useCallback((num, options = {}) => {
    return formatLocalizedNumber(num, locale, options);
  }, [locale]);
  
  /**
   * Format currency
   */
  const formatCurrency = useCallback((amount, currency = 'JOD') => {
    return formatLocalizedCurrency(amount, locale, currency);
  }, [locale]);
  
  /**
   * Format date
   */
  const formatDate = useCallback((date, options = {}) => {
    return formatLocalizedDate(date, locale, options);
  }, [locale]);
  
  /**
   * Format time
   */
  const formatTime = useCallback((date, options = {}) => {
    return formatLocalizedTime(date, locale, options);
  }, [locale]);
  
  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const formatRelative = useCallback((date) => {
    return formatRelativeTime(date, locale);
  }, [locale]);
  
  /**
   * Get direction-aware class names
   * @param {string} ltrClass - Class to use in LTR mode
   * @param {string} rtlClass - Class to use in RTL mode
   * @returns {string} - Appropriate class name
   */
  const dirClass = useCallback((ltrClass, rtlClass) => {
    return isRTL ? rtlClass : ltrClass;
  }, [isRTL]);
  
  /**
   * Get RTL-aware margin/padding class
   * @param {string} side - 'left' or 'right'
   * @param {string} type - 'margin' or 'padding'
   * @param {number|string} size - Size value
   * @returns {string} - Tailwind class
   */
  const spacingClass = useCallback((side, type, size) => {
    const prefix = type === 'margin' ? 'm' : 'p';
    const actualSide = isRTL 
      ? (side === 'left' ? 'r' : 'l')
      : (side === 'left' ? 'l' : 'r');
    return `${prefix}${actualSide}-${size}`;
  }, [isRTL]);
  
  return useMemo(() => ({
    // Core i18n
    t,
    locale,
    isRTL,
    direction,
    changeLanguage,
    toggleLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    
    // Field localization
    getField,
    localize,
    localizeList,
    localizeByType,
    fieldMappings: LOCALIZED_FIELDS,
    
    // Status & category translation
    status,
    category,
    
    // Formatting
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatRelative,
    
    // Direction helpers
    dirClass,
    spacingClass,
  }), [
    t,
    locale,
    isRTL,
    direction,
    changeLanguage,
    toggleLanguage,
    getField,
    localize,
    localizeList,
    localizeByType,
    status,
    category,
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatRelative,
    dirClass,
    spacingClass,
  ]);
};

export default useLocale;
