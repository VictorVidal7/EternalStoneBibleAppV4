/**
 * R9-30 — Ajustes > Metas re-reads the three goals when a backup is restored.
 *
 * `@reading_daily_goal`, `@memory_daily_goal` and `@memory_weekly_target`
 * travel in `payload.local`. `GoalsSettings` lives in the Ajustes scroll, the
 * same screen the import runs from, and read the goals once on mount: after a
 * restore its chips kept the pre-import goals, and a pick equal to the stale
 * value was swallowed by the `selected === value` guard.
 *
 * Lo REAL: GoalsSettings, GoalOptionRow, the three stores and the restore
 * signal, over the AsyncStorage mock. Lo sustituido: theme, language, toast,
 * haptics and icons.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@lib/haptics', () => ({haptics: {tap: jest.fn()}}));
const mockColors = new Proxy({}, {get: () => '#888888'});
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('@context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn(), info: jest.fn()}),
}));

import GoalsSettings from '../src/components/settings/GoalsSettings';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';

/** Selected chip of each row, in row order: reading, memory, weekly. */
function selectedValues(view: ReturnType<typeof render>): string[] {
  return view.getAllByRole('button', {selected: true}).map(b => {
    const texts = b.findAll(
      n =>
        typeof n.props.children === 'number' ||
        typeof n.props.children === 'string',
    );
    return String(texts[0]?.props.children);
  });
}

describe('R9-30 — GoalsSettings re-reads the goals on a restore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    await AsyncStorage.multiSet([
      ['@reading_daily_goal', '10'],
      ['@memory_daily_goal', '10'],
      ['@memory_weekly_target', '3'],
    ]);
  });

  it('the chips show the restored goals, and picking the old one writes it', async () => {
    const view = render(<GoalsSettings />);
    fireEvent.press(view.getByLabelText('Configurar metas'));
    await waitFor(() =>
      expect(selectedValues(view)).toEqual(['10', '10', '3']),
    );

    // What importBackup does: write payload.local, then announce it.
    await AsyncStorage.multiSet([
      ['@reading_daily_goal', '30'],
      ['@memory_daily_goal', '20'],
      ['@memory_weekly_target', '5'],
    ]);
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() =>
      expect(selectedValues(view)).toEqual(['30', '20', '5']),
    );

    // The user goes back to 10: with stale state the guard swallowed it.
    const tens = view.getAllByText('10');
    await act(async () => {
      fireEvent.press(tens[0]);
    });
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('@reading_daily_goal')).toBe('10'),
    );
  });

  it('a pick made while the re-read is in flight is not overwritten by it', async () => {
    const view = render(<GoalsSettings />);
    fireEvent.press(view.getByLabelText('Configurar metas'));
    await waitFor(() =>
      expect(selectedValues(view)).toEqual(['10', '10', '3']),
    );

    await AsyncStorage.setItem('@reading_daily_goal', '30');
    // The mock's getItem is itself a jest.fn: keep its implementation, not
    // the function, or the override calls itself.
    const getItemMock = AsyncStorage.getItem as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    const realGetItem = (key: string) =>
      realImpl(key) as Promise<string | null>;
    let release: (() => void) | undefined;
    const gate = new Promise<void>(r => (release = r));
    getItemMock.mockImplementation(async (key: string) => {
      const value = await realGetItem(key);
      if (key === '@reading_daily_goal') await gate;
      return value;
    });
    await act(async () => {
      emitBackupRestored();
    });

    // The user picks 50 while the read (which saw 30) is still out.
    await act(async () => {
      fireEvent.press(view.getByText('50'));
    });
    await waitFor(async () =>
      expect(await realGetItem('@reading_daily_goal')).toBe('50'),
    );
    await act(async () => {
      release?.();
    });
    getItemMock.mockImplementation(realImpl);

    expect(selectedValues(view)[0]).toBe('50');
  });
});
