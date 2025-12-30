/**
 * Language Context - UI language management
 * Integrates with react-i18next for translations
 * Syncs language preference with user profile in database
 */

import React, { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, isRTLLanguage } from '@/lib/i18n';

const LanguageContext = createContext(undefined);

/**
 * Language Provider Component
 * Manages application language and direction (RTL/LTR)
 * Integrates with react-i18next for translations
 */
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Current language from i18next
  const language = i18n.language || 'en';
  
  /**
   * Update document attributes when language changes
   */
  useEffect(() => {
    const dir = isRTLLanguage(language) ? 'rtl' : 'ltr';
    
    // Update document language and direction
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    
    // Add RTL class for Tailwind RTL plugin support
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }
    
    // Update font for Arabic
    if (language === 'ar') {
      document.body.style.fontFamily = "'Tajawal', 'Inter', sans-serif";
    } else {
      document.body.style.fontFamily = "'Inter', sans-serif";
    }
    
    setIsInitialized(true);
  }, [language]);
  
  /**
   * Sync language from user profile when authenticated
   * This is called by useAuth when profile is loaded
   */
  const syncFromProfile = useCallback((profileLanguage) => {
    if (profileLanguage && SUPPORTED_LANGUAGES[profileLanguage]) {
      if (i18n.language !== profileLanguage) {
        i18n.changeLanguage(profileLanguage);
      }
    }
  }, [i18n]);

  /**
   * Toggle between English and Arabic
   */
  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  }, [language, i18n]);

  /**
   * Set specific language
   */
  const changeLanguage = useCallback((newLanguage) => {
    if (SUPPORTED_LANGUAGES[newLanguage]) {
      i18n.changeLanguage(newLanguage);
    }
  }, [i18n]);

  /**
   * Check if current language is RTL
   */
  const isRTL = useMemo(() => isRTLLanguage(language), [language]);
  
  /**
   * Get text direction
   */
  const direction = useMemo(() => isRTL ? 'rtl' : 'ltr', [isRTL]);

  /**
   * Memoized context value
   */
  const value = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage,
      changeLanguage,
      toggleLanguage,
      syncFromProfile,
      isRTL,
      direction,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isInitialized,
    }),
    [language, changeLanguage, toggleLanguage, syncFromProfile, isRTL, direction, isInitialized]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use language context
 * @throws {Error} If used outside LanguageProvider
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  
  return context;
};

export default LanguageContext;
