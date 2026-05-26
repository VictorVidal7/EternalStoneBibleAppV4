/**
 * 📖 READER PREFERENCES CONTEXT
 *
 * Persisted typography/layout preferences for the verse reader. Hydrates
 * from AsyncStorage on mount and writes every change back. Defaults match
 * the legacy hard-coded reader values so existing users see no visual
 * change until they touch a control.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReaderFontFamily = 'sans' | 'serif';
export type ReaderTextAlign = 'left' | 'justify';
export type ReaderMargin = 'small' | 'medium' | 'large';

export interface ReaderPreferences {
  fontFamily: ReaderFontFamily;
  /** 14 – 26, stepped by 2 (matches the existing A+/A- bounds). */
  fontSize: number;
  /** Multiplier applied to fontSize → lineHeight. 1.2 – 2.0 by 0.2. */
  lineHeightMultiplier: number;
  textAlign: ReaderTextAlign;
  margin: ReaderMargin;
}

interface ReaderPreferencesContextValue {
  preferences: ReaderPreferences;
  /** True until AsyncStorage has been read once; reader can render with
   * defaults while this is true. */
  hydrated: boolean;
  setFontFamily: (next: ReaderFontFamily) => void;
  setFontSize: (next: number) => void;
  setLineHeightMultiplier: (next: number) => void;
  setTextAlign: (next: ReaderTextAlign) => void;
  setMargin: (next: ReaderMargin) => void;
  /** Reset to defaults. Useful for a "Restore defaults" button. */
  reset: () => void;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  fontFamily: 'sans',
  fontSize: 16,
  lineHeightMultiplier: 1.6,
  textAlign: 'left',
  margin: 'medium',
};

export const READER_FONT_SIZE_MIN = 14;
export const READER_FONT_SIZE_MAX = 26;
export const READER_FONT_SIZE_STEP = 2;

/** Horizontal padding (dp) the reader applies to verse rows per margin level. */
export const READER_MARGIN_PADDING: Record<ReaderMargin, number> = {
  small: 12,
  medium: 24,
  large: 40,
};

const STORAGE_KEY = '@reader_preferences';

const ReaderPreferencesContext = createContext<
  ReaderPreferencesContextValue | undefined
>(undefined);

interface ReaderPreferencesProviderProps {
  children: ReactNode;
}

export const ReaderPreferencesProvider: React.FC<
  ReaderPreferencesProviderProps
> = ({children}) => {
  const [preferences, setPreferences] = useState<ReaderPreferences>(
    DEFAULT_READER_PREFERENCES,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
            // Merge with defaults so new fields added later don't crash an
            // older persisted blob.
            setPreferences(prev => ({...prev, ...parsed}));
          } catch {
            // Corrupt blob — fall through to defaults.
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  // Whenever preferences change post-hydration, persist them. Don't write
  // during the initial render or we'd overwrite the user's stored value
  // with defaults before hydration finishes.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(
      () => undefined,
    );
  }, [preferences, hydrated]);

  const setFontFamily = useCallback((next: ReaderFontFamily) => {
    setPreferences(prev => ({...prev, fontFamily: next}));
  }, []);

  const setFontSize = useCallback((next: number) => {
    const clamped = Math.min(
      READER_FONT_SIZE_MAX,
      Math.max(READER_FONT_SIZE_MIN, Math.round(next)),
    );
    setPreferences(prev => ({...prev, fontSize: clamped}));
  }, []);

  const setLineHeightMultiplier = useCallback((next: number) => {
    setPreferences(prev => ({...prev, lineHeightMultiplier: next}));
  }, []);

  const setTextAlign = useCallback((next: ReaderTextAlign) => {
    setPreferences(prev => ({...prev, textAlign: next}));
  }, []);

  const setMargin = useCallback((next: ReaderMargin) => {
    setPreferences(prev => ({...prev, margin: next}));
  }, []);

  const reset = useCallback(() => {
    setPreferences(DEFAULT_READER_PREFERENCES);
  }, []);

  const value = useMemo<ReaderPreferencesContextValue>(
    () => ({
      preferences,
      hydrated,
      setFontFamily,
      setFontSize,
      setLineHeightMultiplier,
      setTextAlign,
      setMargin,
      reset,
    }),
    [
      preferences,
      hydrated,
      setFontFamily,
      setFontSize,
      setLineHeightMultiplier,
      setTextAlign,
      setMargin,
      reset,
    ],
  );

  return (
    <ReaderPreferencesContext.Provider value={value}>
      {children}
    </ReaderPreferencesContext.Provider>
  );
};

export const useReaderPreferences = (): ReaderPreferencesContextValue => {
  const ctx = useContext(ReaderPreferencesContext);
  if (!ctx) {
    throw new Error(
      'useReaderPreferences must be used within a ReaderPreferencesProvider',
    );
  }
  return ctx;
};
