/**
 * R9-30 — the Home "Ver también en…" toggle re-reads `@home_also_versions`
 * when a backup is restored.
 *
 * The key travels in `payload.local`. The Home tab stays mounted while the
 * import runs from Ajustes, and it read the key once on mount: the card kept
 * the pre-import choice until a cold start.
 *
 * Lo REAL: useHomeAlsoVersions and the restore signal, over the AsyncStorage
 * mock. Lo sustituido: haptics.
 */
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@lib/haptics', () => ({haptics: {tap: jest.fn()}}));

import {
  HOME_ALSO_VERSIONS_KEY,
  useHomeAlsoVersions,
} from '../src/hooks/useHomeAlsoVersions';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';

describe('R9-30 — useHomeAlsoVersions re-reads on a restore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
  });

  it('a restored choice shows without a cold start', async () => {
    await AsyncStorage.setItem(HOME_ALSO_VERSIONS_KEY, '0');
    const {result} = renderHook(() => useHomeAlsoVersions());
    await act(async () => {});
    expect(result.current.alsoVersionsVisible).toBe(false);

    await AsyncStorage.setItem(HOME_ALSO_VERSIONS_KEY, '1');
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() => expect(result.current.alsoVersionsVisible).toBe(true));
  });

  it('a toggle made while the re-read is in flight is not overwritten by it', async () => {
    await AsyncStorage.setItem(HOME_ALSO_VERSIONS_KEY, '0');
    const {result} = renderHook(() => useHomeAlsoVersions());
    await act(async () => {});
    expect(result.current.alsoVersionsVisible).toBe(false);

    // The mock's getItem is a jest.fn: keep its implementation.
    const getItemMock = AsyncStorage.getItem as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    let release: (() => void) | undefined;
    const gate = new Promise<void>(r => (release = r));
    getItemMock.mockImplementation(async (key: string) => {
      const value = await realImpl(key);
      await gate;
      return value; // '0': what the disk held when the read started
    });
    await act(async () => {
      emitBackupRestored();
    });

    act(() => result.current.toggleAlsoVersions());
    expect(result.current.alsoVersionsVisible).toBe(true);

    await act(async () => {
      release?.();
    });
    getItemMock.mockImplementation(realImpl);

    expect(result.current.alsoVersionsVisible).toBe(true);
    expect(await AsyncStorage.getItem(HOME_ALSO_VERSIONS_KEY)).toBe('1');
  });
});
