/**
 * R9-30 — the "Mi testimonio" editor re-reads its session when a backup is
 * restored.
 *
 * The store itself is safe (every write re-reads `@faith_testimony` from
 * disk), but the open editor holds the four fields in `useState`, read once
 * per id, and each keystroke saves the WHOLE field it holds. With the editor
 * mounted under Settings, a restore wrote the file's testimony to disk and
 * the next keystroke wrote the pre-import text (plus the keystroke) back over
 * the restored field.
 *
 * Lo REAL: FaithTestimonyEditorScreen, faithTestimonyStore and the restore
 * signal, over the AsyncStorage mock. Lo sustituido: theme, language, router
 * and the share/confirm modals.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn(), replace: jest.fn(), push: jest.fn()}),
  useLocalSearchParams: () => ({id: 'r1'}),
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@lib/haptics', () => ({haptics: {tap: jest.fn()}}));
const mockColors = new Proxy({}, {get: () => '#888888'});
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: mockColors,
    gradient: {headerColors: ['#000000', '#111111']},
    highContrast: false,
  }),
}));
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: {id: 'rvr1960', language: 'es'}}),
}));
jest.mock('@components/ui/ConfirmDialog', () => ({ConfirmDialog: () => null}));
jest.mock('@components/insights/TestimonyImageModal', () => ({
  TestimonyImageModal: () => null,
}));

import FaithTestimonyEditorScreen from '../app/features/share-faith/testimony/[id]';
import {getAllFaithTestimonies} from '../src/features/study/faithTestimonyStore';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import {translations} from '../src/i18n/translations';

const session = (id: string, before: string, title = 'Mi historia') => ({
  id,
  title,
  before,
  change: 'el cambio',
  now: 'hoy',
  createdAt: 1,
  updatedAt: 1,
});

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
});

it('R9-30 — a keystroke after the restore signal edits the restored text', async () => {
  await AsyncStorage.setItem(
    '@faith_testimony',
    JSON.stringify({r1: session('r1', 'antes PRE')}),
  );
  const screen = render(<FaithTestimonyEditorScreen />);
  await waitFor(() =>
    expect(screen.getByDisplayValue('antes PRE')).toBeTruthy(),
  );

  // What `importBackup` does: the file's raw value, then the signal.
  await AsyncStorage.setItem(
    '@faith_testimony',
    JSON.stringify({
      r1: session('r1', 'antes RESTAURADO', 'Titulo restaurado'),
      r2: session('r2', 'otra historia'),
    }),
  );
  await act(async () => {
    emitBackupRestored();
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });

  // The user types one more word into the field they see.
  const input = screen.getByLabelText(
    translations.es.shareFaith.testimony.beforeLabel,
  );
  await act(async () => {
    fireEvent.changeText(input, `${input.props.value} y`);
  });
  // The debounced save fires (700 ms) while the editor stays open.
  await act(async () => {
    await new Promise(r => setTimeout(r, 900));
  });
  screen.unmount();

  const map = await getAllFaithTestimonies();
  expect(map.r1?.before).toBe('antes RESTAURADO y');
  expect(map.r1?.title).toBe('Titulo restaurado');
  expect(map.r2?.before).toBe('otra historia');
});

it('R9-30 — a save still pending at the restore is dropped, not flushed over it', async () => {
  await AsyncStorage.setItem(
    '@faith_testimony',
    JSON.stringify({r1: session('r1', 'antes PRE')}),
  );
  const screen = render(<FaithTestimonyEditorScreen />);
  await waitFor(() =>
    expect(screen.getByDisplayValue('antes PRE')).toBeTruthy(),
  );
  // Typed just before the restore: the debounced save has not fired yet.
  await act(async () => {
    fireEvent.changeText(
      screen.getByLabelText(translations.es.shareFaith.testimony.beforeLabel),
      'antes PRE tecleado',
    );
  });

  const restoredRaw = JSON.stringify({r1: session('r1', 'antes RESTAURADO')});
  await AsyncStorage.setItem('@faith_testimony', restoredRaw);
  await act(async () => {
    emitBackupRestored();
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });
  screen.unmount();
  await act(async () => {
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });

  // Byte for byte what the backup wrote.
  expect(await AsyncStorage.getItem('@faith_testimony')).toBe(restoredRaw);
});
