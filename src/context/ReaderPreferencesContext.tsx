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
import {ReaderTheme, isReaderTheme} from '../styles/readerThemes';
import {ReaderFontFamily, isReaderFontFamily} from '../lib/reader/typefaces';

export type {ReaderFontFamily};
export type ReaderTextAlign = 'left' | 'justify';
export type ReaderMargin = 'small' | 'medium' | 'large';
export type {ReaderTheme};

export interface ReaderPreferences {
  fontFamily: ReaderFontFamily;
  /** 14 – 26, stepped by 2 (matches the existing A+/A- bounds). */
  fontSize: number;
  /** Multiplier applied to fontSize → lineHeight. 1.2 – 2.0 by 0.2. */
  lineHeightMultiplier: number;
  textAlign: ReaderTextAlign;
  margin: ReaderMargin;
  /** Reading-surface palette. 'system' (default) follows the app theme. */
  theme: ReaderTheme;
  /**
   * T6.3b grandfathering: permanently `true` once this device is observed,
   * at hydration, to have `theme: 'sepia'` already persisted from BEFORE
   * Sepia became an offering-gated theme. Device-local, never re-derived
   * once set, never synced. See the hydration effect below for the single
   * moment this is computed, and `isReaderThemeUnlocked` in `readerThemes.ts`
   * for how it's consumed.
   */
  sepiaGrandfathered: boolean;
  /**
   * Open the immersive reader automatically when audio starts from the
   * reader's Audio button (Sprint 77, opt-in). Also guarantees the immersive
   * binds to the engine before the first ∞ chapter advance (the S73 follow
   * needs an early bind).
   */
  autoImmersiveOnListen: boolean;
  /**
   * Keep the screen on while reading (opt-in, default off). When enabled, the
   * OS screen-timeout is suspended on the long-dwell screens — the reader, the
   * study tools, the memorization drills and the guided prayer ([[
   * keepAwakeRoutes]]) — so the phone doesn't sleep mid-passage. Off elsewhere
   * to preserve battery.
   */
  keepScreenAwake: boolean;
  /**
   * Change chapter by swiping left/right in the reader (opt-in, default off).
   * The gesture only claims the middle band of the screen width — see
   * [[chapterSwipeGesture]] — so it never fights the Android system
   * back-gesture, which owns the outer edge strip.
   */
  swipeChapterNavigation: boolean;
  /**
   * Highlight the words of Jesus in red while reading (opt-out, default on —
   * a well-known Bible convention). Only takes visible effect on WEB, the
   * only reading version with the underlying marking today; silently inert
   * on every other version.
   */
  redLetterWords: boolean;
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
  setTheme: (next: ReaderTheme) => void;
  setAutoImmersiveOnListen: (next: boolean) => void;
  setKeepScreenAwake: (next: boolean) => void;
  setSwipeChapterNavigation: (next: boolean) => void;
  setRedLetterWords: (next: boolean) => void;
  /** Reset to defaults. Useful for a "Restore defaults" button. */
  reset: () => void;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  fontFamily: 'sans',
  fontSize: 16,
  lineHeightMultiplier: 1.6,
  textAlign: 'left',
  margin: 'medium',
  theme: 'system',
  sepiaGrandfathered: false,
  autoImmersiveOnListen: false,
  keepScreenAwake: false,
  swipeChapterNavigation: false,
  redLetterWords: true,
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
            // T6.3b grandfathering — this `raw` read is the ONLY moment in
            // this device's lifetime where we can observe "what theme did
            // this device have selected before Sepia became offering-gated".
            // If the persisted blob already had `theme: 'sepia'` (from an
            // older app version, pre-gate) — or the flag was already `true`
            // from a previous run of this same logic — mark this device
            // grandfathered for good. A blob with any other theme, or no
            // blob at all (new install, handled by the `if (raw)` guard),
            // never sets it: those devices are correctly gated. Once `true`
            // here, it's carried forward by the normal `...parsed` spread on
            // every future hydration and is NEVER re-derived or cleared.
            const sepiaGrandfathered =
              parsed.sepiaGrandfathered === true || parsed.theme === 'sepia';
            // Merge with defaults so new fields added later don't crash an
            // older persisted blob. Sanitize `theme` so a foreign/corrupt
            // value falls back to 'system' rather than a broken palette.
            setPreferences(prev => ({
              ...prev,
              ...parsed,
              theme: isReaderTheme(parsed.theme) ? parsed.theme : prev.theme,
              fontFamily: isReaderFontFamily(parsed.fontFamily)
                ? parsed.fontFamily
                : prev.fontFamily,
              sepiaGrandfathered,
            }));
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

  const setTheme = useCallback((next: ReaderTheme) => {
    setPreferences(prev => ({
      ...prev,
      theme: isReaderTheme(next) ? next : 'system',
    }));
  }, []);

  const setAutoImmersiveOnListen = useCallback((next: boolean) => {
    setPreferences(prev => ({...prev, autoImmersiveOnListen: !!next}));
  }, []);

  const setKeepScreenAwake = useCallback((next: boolean) => {
    setPreferences(prev => ({...prev, keepScreenAwake: !!next}));
  }, []);

  const setSwipeChapterNavigation = useCallback((next: boolean) => {
    setPreferences(prev => ({...prev, swipeChapterNavigation: !!next}));
  }, []);

  const setRedLetterWords = useCallback((next: boolean) => {
    setPreferences(prev => ({...prev, redLetterWords: !!next}));
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
      setTheme,
      setAutoImmersiveOnListen,
      setKeepScreenAwake,
      setSwipeChapterNavigation,
      setRedLetterWords,
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
      setTheme,
      setAutoImmersiveOnListen,
      setKeepScreenAwake,
      setSwipeChapterNavigation,
      setRedLetterWords,
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
