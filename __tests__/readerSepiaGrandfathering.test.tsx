/**
 * T6.3b — Sepia joins PREMIUM_READER_THEMES (Nuevos extras premium), but with
 * a mandatory grandfathering exception: this project's non-negotiable rule is
 * that premium never takes away something that used to be free, and Sepia
 * was one of the 5 original free reading themes (not a T6.3 exclusive).
 *
 * These tests lock down the ONE moment `sepiaGrandfathered` can be derived —
 * the very first AsyncStorage hydration of `ReaderPreferencesContext` — and
 * confirm it never gets re-derived or cleared afterwards. Mirrors
 * readerAutoImmersive.test.tsx's direct renderHook-against-AsyncStorage style.
 */
import {type ReactNode} from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReaderPreferencesProvider,
  useReaderPreferences,
} from '../src/context/ReaderPreferencesContext';

const STORAGE_KEY = '@reader_preferences';

const wrapper = ({children}: {children: ReactNode}) => (
  <ReaderPreferencesProvider>{children}</ReaderPreferencesProvider>
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('sepiaGrandfathered — hydration-time detection', () => {
  it('is OFF by default (no persisted blob — a new install)', async () => {
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.preferences.sepiaGrandfathered).toBe(false);
    expect(result.current.preferences.theme).toBe('system');
  });

  it('turns ON when an OLD persisted blob (pre-gate, no sepiaGrandfathered field) already had theme: "sepia"', async () => {
    // Simulates a device on a pre-T6.3b app version, where `theme: 'sepia'`
    // was persisted long before this field existed.
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({theme: 'sepia', fontSize: 18}),
    );

    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.preferences.sepiaGrandfathered).toBe(true);
    expect(result.current.preferences.theme).toBe('sepia');
    // Untouched fields still hydrate normally.
    expect(result.current.preferences.fontSize).toBe(18);
  });

  it('stays OFF when the persisted blob had a different theme (e.g. paper)', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'paper'}));

    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.preferences.sepiaGrandfathered).toBe(false);
    expect(result.current.preferences.theme).toBe('paper');
  });

  it('stays OFF when the persisted blob has no theme field at all', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({fontSize: 22}));

    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.preferences.sepiaGrandfathered).toBe(false);
  });

  it('carries an already-true flag forward even if the blob theme is no longer sepia', async () => {
    // A device that was grandfathered on a previous run and later switched
    // to a different theme must NOT lose the flag.
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({theme: 'night', sepiaGrandfathered: true}),
    );

    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.preferences.sepiaGrandfathered).toBe(true);
    expect(result.current.preferences.theme).toBe('night');
  });

  it('persists the derived flag back to AsyncStorage so it survives future restarts', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'sepia'}));

    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.preferences.sepiaGrandfathered).toBe(true);

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(raw ?? '{}').sepiaGrandfathered).toBe(true);
    });
  });

  it('never turns back off once set true, even after switching away from sepia at runtime', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'sepia'}));

    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.preferences.sepiaGrandfathered).toBe(true);

    act(() => result.current.setTheme('paper'));

    expect(result.current.preferences.theme).toBe('paper');
    expect(result.current.preferences.sepiaGrandfathered).toBe(true);
  });

  it('a corrupt persisted blob falls back to defaults (flag OFF) instead of crashing', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{not valid json');

    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.preferences.sepiaGrandfathered).toBe(false);
  });
});
