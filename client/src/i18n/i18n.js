/**
 * ================================================================
 * i18n/i18n.js — Internationalization Setup
 * Supports Marathi (default), Hindi, English, Gujarati.
 * Language preference is saved to localStorage + user profile.
 * Author: Digital Kaam Naka Dev Team
 * ================================================================
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import mr from './locales/mr.json';
import hi from './locales/hi.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      mr: { translation: mr },
      hi: { translation: hi },
      en: { translation: en },
    },

    // Marathi is the default language for this platform
    lng: localStorage.getItem('kamnaka_lang') || 'mr',
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false, // React already escapes XSS
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'kamnaka_lang',
      caches: ['localStorage'],
    },
  });

/**
 * @desc    Switch app language and persist preference
 * @param   {string} lang - Language code: 'mr', 'hi', 'en', 'gu'
 */
export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('kamnaka_lang', lang);
};

export default i18n;
