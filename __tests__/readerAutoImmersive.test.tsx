/**
 * Sprint 77 — autoImmersiveOnListen reader preference (opt-in).
 *
 * Locks the contract behind the "open immersive mode when listening" switch:
 * OFF by default, toggle persists, and hydration of an OLDER stored blob
 * (without the new field) keeps the default instead of crashing or flipping.
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

describe('autoImmersiveOnListen preference', () => {
  it('is OFF by default', async () => {
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.preferences.autoImmersiveOnListen).toBe(false);
  });

  it('toggles and persists', async () => {
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.setAutoImmersiveOnListen(true));
    expect(result.current.preferences.autoImmersiveOnListen).toBe(true);

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(raw ?? '{}').autoImmersiveOnListen).toBe(true);
    });
  });

  it('hydrates an older blob without the field to the default OFF', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({fontSize: 20}));
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.preferences.fontSize).toBe(20);
    expect(result.current.preferences.autoImmersiveOnListen).toBe(false);
  });

  it('hydrates a stored ON value', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({autoImmersiveOnListen: true}),
    );
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.preferences.autoImmersiveOnListen).toBe(true);
  });
});
