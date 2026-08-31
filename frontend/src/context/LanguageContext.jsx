import React, { createContext, useContext, useState, useEffect } from 'react';
import km from '../locales/km';
import en from '../locales/en';
import ConfirmLanguageModal from '../components/ConfirmLanguageModal';

const locales = { km, en };

const LanguageContext = createContext(null);

/**
 * LanguageProvider — wraps the whole app.
 * • Default language: Khmer ('km') for every new user.
 * • The user's choice is persisted in localStorage under 'saby_lang'.
 * • Only two languages exist: 'km' (Khmer) and 'en' (English).
 * • ConfirmLanguageModal opens whenever a language switch is requested.
 */
export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('saby_lang');
    return saved === 'en' ? 'en' : 'km';
  });

  // Modal confirmation state
  const [pendingLang, setPendingLang] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Directly apply language change
  const directSetLang = (newLang) => {
    const safe = newLang === 'en' ? 'en' : 'km';
    localStorage.setItem('saby_lang', safe);
    setLangState(safe);
    document.documentElement.lang = safe === 'km' ? 'km' : 'en';
  };

  // Called when user clicks to switch language (triggers confirmation modal)
  const setLang = (newLang) => {
    const target = newLang === 'en' ? 'en' : 'km';
    if (target === lang) return; // No change if same language
    setPendingLang(target);
    setIsConfirmOpen(true);
  };

  // Confirm action in modal
  const handleConfirmSwitch = () => {
    if (pendingLang) {
      directSetLang(pendingLang);
    }
    setIsConfirmOpen(false);
    setPendingLang(null);
  };

  // Cancel action in modal
  const handleCancelSwitch = () => {
    setIsConfirmOpen(false);
    setPendingLang(null);
  };

  // Sync HTML lang on mount/change
  useEffect(() => {
    document.documentElement.lang = lang === 'km' ? 'km' : 'en';
  }, [lang]);

  /**
   * t(key) — get a translation string.
   */
  const t = (key) => {
    const parts = key.split('.');
    let result = locales[lang];
    for (const part of parts) {
      if (result == null) break;
      result = result[part];
    }
    if (result == null) {
      let fallback = locales['en'];
      for (const part of parts) {
        if (fallback == null) break;
        fallback = fallback[part];
      }
      return fallback ?? key;
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, directSetLang, t, isKhmer: lang === 'km' }}>
      {children}
      <ConfirmLanguageModal
        isOpen={isConfirmOpen}
        targetLang={pendingLang}
        currentLang={lang}
        onConfirm={handleConfirmSwitch}
        onClose={handleCancelSwitch}
      />
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};

export default LanguageContext;
