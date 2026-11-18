/**
 * R9-30 — high contrast travels in the backup, and the mounted
 * `ThemeProvider` re-reads it on `subscribeBackupRestored`.
 *
 * It read its keys once on mount: after a restore the app kept the old
 * palette, and a load that only ever set `true` could not turn high contrast
 * off. The theme and the color theme travelled already; they re-read too.
 *
 * Lo REAL: ThemeProvider and the restore signal, over the AsyncStorage mock.
 */
import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ThemeProvider, useTheme} from '../src/hooks/useTheme';
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
  <ThemeProvider>{children}</ThemeProvider>
);

describe('R9-30 — ThemeProvider re-reads on a restore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
  });

  it('high contrast, the theme and the color theme follow the restored disk', async () => {
    await AsyncStorage.multiSet([
      ['@app_high_contrast', 'true'],
      ['@app_theme_mode', 'light'],
      ['@app_color_theme', 'ocean'],
    ]);
    const {result} = renderHook(() => useTheme(), {wrapper});
    const view = () => [
      result.current.highContrast,
      result.current.mode,
      result.current.colorTheme,
    ];
    await waitFor(() => expect(view()).toEqual([true, 'light', 'ocean']));

    // What importBackup does: write the keys, then announce it.
    await AsyncStorage.multiSet([
      ['@app_high_contrast', 'false'],
      ['@app_theme_mode', 'dark'],
      ['@app_color_theme', 'forest'],
    ]);
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() => expect(view()).toEqual([false, 'dark', 'forest']));
  });

  it('a toggle made while the re-read is in flight is not overwritten by it', async () => {
    const {result} = renderHook(() => useTheme(), {wrapper});
    await waitFor(() => expect(result.current.highContrast).toBe(false));

    await AsyncStorage.setItem('@app_high_contrast', 'true');
    const gate = gateReads('@app_high_contrast');
    try {
      await act(async () => {
        emitBackupRestored();
      });
      // The user turns it off while the re-read still holds 'true'.
      await act(async () => {
        await result.current.setHighContrast(false);
      });
      await act(async () => {
        gate.release();
      });
    } finally {
      gate.restore();
    }

    expect(await AsyncStorage.getItem('@app_high_contrast')).toBe('false');
    expect(result.current.highContrast).toBe(false);
  });
});
