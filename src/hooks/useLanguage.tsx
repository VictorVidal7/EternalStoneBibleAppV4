import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKeys } from '../i18n/translations';
import * as Localization from 'expo-localization';

const LANGUAGE_STORAGE_KEY = '@app_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  async function loadSavedLanguage() {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage);
      } else {
        // Auto-detect language from device locale
        const deviceLanguage = Localization.getLocales()[0]?.languageCode;
        const detectedLang: Language = deviceLanguage === 'en' ? 'en' : 'es';
        setLanguageState(detectedLang);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLang);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
