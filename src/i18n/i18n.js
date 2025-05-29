// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language files
import en from './locales/en.json';
import vi from './locales/vi.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';

// Initialize i18next
i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
      fr: { translation: fr },
      ja: { translation: ja },
    },
    lng: 'vi', // Default language
    fallbackLng: 'en', // Fallback language if the current language is not available
    interpolation: {
      escapeValue: false, // React already escapes values to prevent XSS
    },
  });

export default i18n;