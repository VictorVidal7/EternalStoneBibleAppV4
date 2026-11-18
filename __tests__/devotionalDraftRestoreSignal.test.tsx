/**
 * R9-30 (S164) — the devotional builder re-reads its draft when a backup is
 * restored.
 *
 * `@devotional_draft` travels in `payload.local` now. The screen reads the
 * draft once, on mount, and the autosave writes the WHOLE form from memory.
 * With the screen open when a restore landed (an import still running when
 * the user came here), the next edit put the pre-import draft back over the
 * restored one, and so did an autosave still pending.
 *
 * Lo REAL: DevotionalBuilderScreen, the draft codec and the restore signal,
 * over the AsyncStorage mock. Lo sustituido: the harness of
 * `devotionalSavedRestoreSignal.test.tsx` (theme, language, router, toast,
 * the database and the share sheet).
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
  DEVOTIONAL_DRAFT_KEY,
  parseDevotionalDraft,
  serializeDevotionalDraft,
} from '../src/lib/together/devotionalDraft';
import {todayDateISO} from '../src/lib/together/bundle';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import {translations} from '../src/i18n/translations';

const db = translations.es.devotionalBuilder;

function draft(title: string, note: string) {
  return serializeDevotionalDraft({
    title,
    startDate: todayDateISO(),
    days: [{bookId: 19, chapter: 23, verse: 1, note}],
  });
}

async function storedDraft() {
  return parseDevotionalDraft(await AsyncStorage.getItem(DEVOTIONAL_DRAFT_KEY));
}

/** What `importBackup` leaves behind: the file's draft on disk, then the signal. */
async function restore(raw: string) {
  await AsyncStorage.setItem(DEVOTIONAL_DRAFT_KEY, raw);
  await act(async () => {
    emitBackupRestored();
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'});
});

it('R9-30 — the restored draft shows, and the next edit builds on it', async () => {
  await AsyncStorage.setItem(
    DEVOTIONAL_DRAFT_KEY,
    draft('Titulo PRE', 'nota PRE'),
  );
  const screen = render(<DevotionalBuilderScreen />);
  await waitFor(() =>
    expect(screen.getByDisplayValue('Titulo PRE')).toBeTruthy(),
  );

  await restore(draft('Titulo RESTAURADO', 'nota RESTAURADA'));
  // The user appends to whatever the title shows: the autosave writes the
  // WHOLE form from the screen's copy.
  const name = screen.getByPlaceholderText(db.namePlaceholder);
  fireEvent.changeText(name, `${name.props.value} y`);

  await waitFor(
    async () => expect((await storedDraft())?.title).toMatch(/ y$/),
    {timeout: 3000},
  );
  const saved = await storedDraft();
  expect(saved?.title).toBe('Titulo RESTAURADO y');
  expect(saved?.days[0].note).toBe('nota RESTAURADA');
  screen.unmount();
});

it('R9-30 — an autosave still pending when the restore lands is dropped', async () => {
  await AsyncStorage.setItem(
    DEVOTIONAL_DRAFT_KEY,
    draft('Titulo PRE', 'nota PRE'),
  );
  const screen = render(<DevotionalBuilderScreen />);
  await waitFor(() =>
    expect(screen.getByDisplayValue('Titulo PRE')).toBeTruthy(),
  );
  fireEvent.changeText(
    screen.getByPlaceholderText(db.namePlaceholder),
    'Titulo PRE tecleado',
  );

  // The re-read is slower than the debounce: a pending autosave that is not
  // dropped fires while it flies, and the read brings back its own write.
  const getItem = AsyncStorage.getItem as jest.Mock;
  const realGet = getItem.getMockImplementation()!;
  getItem.mockImplementation((key: string) =>
    key === DEVOTIONAL_DRAFT_KEY
      ? new Promise(r => setTimeout(r, 700)).then(() => realGet(key))
      : realGet(key),
  );
  try {
    await restore(draft('Titulo RESTAURADO', 'nota RESTAURADA'));
    // Past the 600 ms debounce and the slow read: nothing pending may land.
    await act(async () => {
      await new Promise(r => setTimeout(r, 1500));
    });
  } finally {
    getItem.mockImplementation(realGet);
  }

  expect((await storedDraft())?.title).toBe('Titulo RESTAURADO');
  expect(screen.getByDisplayValue('Titulo RESTAURADO')).toBeTruthy();
  screen.unmount();
});

it('R9-30 — a restore without a draft leaves the form as it is', async () => {
  await AsyncStorage.setItem(
    DEVOTIONAL_DRAFT_KEY,
    draft('Titulo PRE', 'nota PRE'),
  );
  const screen = render(<DevotionalBuilderScreen />);
  await waitFor(() =>
    expect(screen.getByDisplayValue('Titulo PRE')).toBeTruthy(),
  );

  // The file carried no draft: this device's stays on disk.
  await act(async () => {
    emitBackupRestored();
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });

  expect(screen.getByDisplayValue('Titulo PRE')).toBeTruthy();
  screen.unmount();
});
