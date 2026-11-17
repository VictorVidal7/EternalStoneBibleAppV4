/**
 * R9-30 — the devotional builder re-reads "my devotionals" when a backup is
 * restored.
 *
 * The screen holds the whole `@devotional_saved` list in `useState` (read
 * once, on mount) and every share or resend writes `addSavedDevotional(list,
 * bundle)` built from that copy. With the screen mounted under Settings, a
 * restore wrote the file's list to disk and the next share wrote the
 * pre-import list back over it: the restored devotionals were gone.
 *
 * Lo REAL: DevotionalBuilderScreen, the together codec and the restore
 * signal, over the AsyncStorage mock. Lo sustituido: theme, language, router,
 * toast, the database and the share sheet.
 */
import {Share} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn(), replace: jest.fn(), push: jest.fn()}),
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));
const mockColors = new Proxy({}, {get: () => '#888888'});
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
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
jest.mock('@context/ToastContext', () => ({
  useToast: () => ({info: jest.fn(), success: jest.fn(), error: jest.fn()}),
}));
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => {}),
    getChapterVerseCount: jest.fn(async () => 30),
  },
}));
jest.mock('@components/FeatureGuideModal', () => ({
  FeatureGuideModal: () => null,
}));

import DevotionalBuilderScreen from '../app/features/devotional/index';
import {
  DEVOTIONAL_SAVED_KEY,
  makeCalBundle,
  parseSavedDevotionals,
  serializeSavedDevotionals,
  type SavedDevotional,
} from '../src/lib/together';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import {translations} from '../src/i18n/translations';

const entry = (title: string, iso: string): SavedDevotional => ({
  id: iso,
  createdAt: iso,
  bundle: makeCalBundle('2026-12-01', title, [
    {bookId: 19, chapter: 23, verse: 1},
  ])!,
});

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'});
});

it('R9-30 — a share after the restore signal keeps the restored devotionals', async () => {
  await AsyncStorage.setItem(
    DEVOTIONAL_SAVED_KEY,
    serializeSavedDevotionals([entry('PRE-import', '2026-11-01T00:00:00Z')]),
  );
  const screen = render(<DevotionalBuilderScreen />);
  await waitFor(() => expect(screen.getByText('PRE-import')).toBeTruthy());

  // What `importBackup` does: the file's raw value, then the signal.
  const restoredRaw = serializeSavedDevotionals([
    entry('RESTAURADO-1', '2026-10-02T00:00:00Z'),
    entry('RESTAURADO-2', '2026-10-01T00:00:00Z'),
  ]);
  await AsyncStorage.setItem(DEVOTIONAL_SAVED_KEY, restoredRaw);
  await act(async () => {
    emitBackupRestored();
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });

  // The user resends whichever devotional the screen now shows first.
  await act(async () => {
    fireEvent.press(
      screen.getAllByLabelText(translations.es.devotionalBuilder.resend)[0],
    );
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });

  screen.unmount();
  const titles = parseSavedDevotionals(
    await AsyncStorage.getItem(DEVOTIONAL_SAVED_KEY),
  ).map(e => e.bundle.ti);
  expect(titles).toEqual(
    expect.arrayContaining(['RESTAURADO-1', 'RESTAURADO-2']),
  );
  expect(titles).not.toContain('PRE-import');
});
