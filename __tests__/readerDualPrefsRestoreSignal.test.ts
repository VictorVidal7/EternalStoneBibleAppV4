/**
 * R9-30 — the reader's toolbar preferences (dual mode, companion version,
 * dual layout, Focus mode) re-read their keys when a backup is restored.
 *
 * The keys travel in the backup. The reader stays mounted in the tab stack
 * while the import runs from Ajustes, and it read them once on mount: it kept
 * the pre-import choices until it remounted.
 *
 * Lo REAL: useReaderDualPrefs and the restore signal, over the AsyncStorage
 * mock. Nada sustituido.
 */
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  READER_DUAL_LAYOUT_KEY,
  READER_FOCUS_MODE_KEY,
  READER_SECONDARY_VERSION_KEY,
  READER_SIDE_BY_SIDE_KEY,
  useReaderDualPrefs,
} from '../src/hooks/useReaderDualPrefs';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';

const BEFORE: [string, string][] = [
  [READER_SIDE_BY_SIDE_KEY, '0'],
  [READER_SECONDARY_VERSION_KEY, 'KJV'],
  [READER_DUAL_LAYOUT_KEY, 'stacked'],
  [READER_FOCUS_MODE_KEY, '0'],
];
const RESTORED: [string, string][] = [
  [READER_SIDE_BY_SIDE_KEY, '1'],
  [READER_SECONDARY_VERSION_KEY, 'RV1909'],
  [READER_DUAL_LAYOUT_KEY, 'columns'],
  [READER_FOCUS_MODE_KEY, '1'],
];

async function mounted() {
  const hook = renderHook(() => useReaderDualPrefs());
  await act(async () => {});
  expect(hook.result.current).toMatchObject({
    sideBySide: false,
    preferredSecondaryId: 'KJV',
    dualLayout: 'stacked',
    focusMode: false,
  });
  return hook;
}

describe('R9-30 — useReaderDualPrefs re-reads on a restore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    await AsyncStorage.multiSet(BEFORE);
  });

  it('the four restored choices show without a remount', async () => {
    const {result} = await mounted();

    await AsyncStorage.multiSet(RESTORED);
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() =>
      expect(result.current).toMatchObject({
        sideBySide: true,
        preferredSecondaryId: 'RV1909',
        dualLayout: 'columns',
        focusMode: true,
      }),
    );
  });

  it('a change made while the re-read is in flight is not overwritten by it, and the untouched keys still land', async () => {
    const {result} = await mounted();

    // The mock's getItem is a jest.fn: keep its implementation. The read
    // takes the disk as it is now (RESTORED), and lands after the taps.
    await AsyncStorage.multiSet(RESTORED);
    const getItemMock = AsyncStorage.getItem as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    let release: (() => void) | undefined;
    const gate = new Promise<void>(r => (release = r));
    getItemMock.mockImplementation(async (key: string) => {
      const value = await realImpl(key);
      await gate;
      return value;
    });
    try {
      await act(async () => {
        emitBackupRestored();
      });

      // The user picks WEB and turns Focus off-then-on-then-off: both keys
      // were touched after the read started.
      act(() => result.current.chooseSecondary('WEB'));
      act(() => result.current.toggleFocusMode());
      act(() => result.current.toggleFocusMode());

      await act(async () => {
        release?.();
      });
    } finally {
      getItemMock.mockImplementation(realImpl);
    }

    expect(result.current).toMatchObject({
      // Touched: the taps win.
      preferredSecondaryId: 'WEB',
      focusMode: false,
      // Untouched: the restore lands.
      sideBySide: true,
      dualLayout: 'columns',
    });
    expect(await AsyncStorage.getItem(READER_SECONDARY_VERSION_KEY)).toBe(
      'WEB',
    );
    expect(await AsyncStorage.getItem(READER_FOCUS_MODE_KEY)).toBe('0');
  });

  it('the setters persist what they show', async () => {
    const {result} = await mounted();
    act(() => result.current.toggleSideBySide());
    act(() => result.current.toggleLayout());
    expect(result.current.sideBySide).toBe(true);
    expect(result.current.dualLayout).toBe('columns');
    await waitFor(async () =>
      expect(await AsyncStorage.getItem(READER_SIDE_BY_SIDE_KEY)).toBe('1'),
    );
    expect(await AsyncStorage.getItem(READER_DUAL_LAYOUT_KEY)).toBe('columns');
  });
});
