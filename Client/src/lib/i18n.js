/**
 * i18n Configuration
 * Internationalization setup using react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
};

export const DEFAULT_LANGUAGE = 'en';

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    // Language detection options
    detection: {
      // Order of language detection
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      // Keys to lookup language from
      lookupLocalStorage: 'yamifit_language',
      lookupCookie: 'yamifit_language',
      // Cache user language
      caches: ['localStorage', 'cookie'],
      // Cookie options
      cookieMinutes: 43200, // 30 days
    },

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // React options
    react: {
      useSuspense: true,
    },
  });

// Helper function to get text direction
export const getTextDirection = (language) => {
  return SUPPORTED_LANGUAGES[language]?.dir || 'ltr';
};

// Helper function to check if language is RTL
export const isRTLLanguage = (language) => {
  return getTextDirection(language) === 'rtl';
};

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = getTextDirection(lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = dir;
  
  // Store in localStorage for persistence
  localStorage.setItem('yamifit_language', lng);
});

export default i18n;
