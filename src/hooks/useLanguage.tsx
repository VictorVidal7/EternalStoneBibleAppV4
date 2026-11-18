import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {translations, Language, TranslationKeys} from '../i18n/translations';
import * as Localization from 'expo-localization';
import {invalidateLanguageCache} from '../i18n/languageUtils';
import {subscribeBackupRestored} from '../lib/backup/restoreSignal';

const LANGUAGE_STORAGE_KEY = '@app_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({children}: {children: ReactNode}) {
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

  // R9-30 — bumped by every pick, so a restore re-read in flight cannot put
  // back the language read before the user's tap.
  const pickSeq = useRef(0);

  // R9-30 — `@app_language` travels in the backup. After a restore, apply the
  // saved language as a pick does (state + the non-React cache), without
  // writing it back. A missing or bad value leaves the current one.
  useEffect(
    () =>
      subscribeBackupRestored(() => {
        const seq = pickSeq.current;
        void (async () => {
          try {
            const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (seq !== pickSeq.current) return;
            if (saved === 'es' || saved === 'en') applyLanguage(saved);
          } catch (error) {
            console.error('Error re-reading saved language:', error);
          }
        })();
      }),
    [],
  );

  function applyLanguage(lang: Language) {
    setLanguageState(lang);
    // Invalidate language cache for non-React utilities. A static import:
    // the dynamic one threw under Jest, and languageUtils has no cycle here.
    invalidateLanguageCache();
  }

  async function setLanguage(lang: Language) {
    pickSeq.current += 1;
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    applyLanguage(lang);
  }

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
      {children}
    </LanguageContext.Provider>
  );
}

// Default context for graceful fallback during initialization
const defaultLanguageContext: LanguageContextType = {
  language: 'es',
  setLanguage: async () => {},
  t: translations.es,
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  // Return fallback instead of throwing error for smoother initialization
  if (context === undefined) {
    return defaultLanguageContext;
  }
  return context;
}
