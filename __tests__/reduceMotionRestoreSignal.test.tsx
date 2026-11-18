/**
 * R9-30 — "Reducir animaciones" travels in the backup, and the mounted
 * `AccessibilityPreferencesProvider` re-reads it on `subscribeBackupRestored`.
 *
 * It read the override once on mount: after a restore the app kept the old
 * motion, and a load that only ever set `true` could not turn it off.
 *
 * Lo REAL: the provider, `useReducedMotion` and the restore signal, over the
 * AsyncStorage mock. Lo sustituido: the OS reduce-motion value (off).
 */
import React from 'react';
import {AccessibilityInfo} from 'react-native';
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccessibilityPreferencesProvider,
  useAccessibilityPreferences,
} from '../src/context/AccessibilityPreferencesContext';
import {useReducedMotion} from '../src/hooks/useReducedMotion';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';

/** Hold the next reads of `key` until `release()`. */
function gateReads(key: string) {
  // Keep the mock's implementation, not the function, or it calls itself.
  const getItemMock = AsyncStorage.getItem as jest.Mock;
  const realImpl = getItemMock.getMockImplementation()!;
  let release: () => void = () => {};
  const gate = new Promise<void>(r => (release = r));
  getItemMock.mockImplementation(async (k: string) => {
    const value = (await realImpl(k)) as string | null;
    if (k === key) await gate;
    return value;
  });
  return {
    release: () => release(),
    restore: () => getItemMock.mockImplementation(realImpl),
  };
}

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AccessibilityPreferencesProvider>
    {children}
  </AccessibilityPreferencesProvider>
);

describe('R9-30 — AccessibilityPreferencesProvider re-reads on a restore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation((() => ({remove: jest.fn()})) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('useReducedMotion follows the restored override, both ways', async () => {
    const {result} = renderHook(() => useReducedMotion(), {wrapper});
    await waitFor(() =>
      expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled(),
    );
    expect(result.current).toBe(false);

    await AsyncStorage.setItem('@app_reduce_motion_override', 'true');
    await act(async () => {
      emitBackupRestored();
    });
    await waitFor(() => expect(result.current).toBe(true));

    await AsyncStorage.setItem('@app_reduce_motion_override', 'false');
    await act(async () => {
      emitBackupRestored();
    });
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('a toggle made while the re-read is in flight is not overwritten by it', async () => {
    const {result} = renderHook(() => useAccessibilityPreferences(), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current.reduceMotionOverride).toBe(false),
    );

    await AsyncStorage.setItem('@app_reduce_motion_override', 'true');
    const gate = gateReads('@app_reduce_motion_override');
    try {
      await act(async () => {
        emitBackupRestored();
      });
      // The user turns it off while the re-read still holds 'true'.
      await act(async () => {
        await result.current.setReduceMotionOverride(false);
      });
      await act(async () => {
        gate.release();
      });
    } finally {
      gate.restore();
    }

    expect(await AsyncStorage.getItem('@app_reduce_motion_override')).toBe(
      'false',
    );
    expect(result.current.reduceMotionOverride).toBe(false);
  });
});
