/**
 * R9-498 — the walk «Orar la Escritura» joined every verse prayer into one
 * journal detail that newPrayerRequest cut to PRAYER_DETAIL_MAX (1000) with no
 * warning, while the screen said «Guardado». The real screen, the real
 * usePrayerJournal + prayerStore over the AsyncStorage mock, and the verses
 * read from the real seed database with node:sqlite. From the S128 probe.
 */
import {
  render,
  fireEvent,
  waitFor,
  cleanup,
  screen,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const path = require('path');
const {DatabaseSync} = require('node:sqlite');
const mockSeed = new DatabaseSync(
  path.join(__dirname, '..', 'assets', 'bible-seed.db'),
  {readOnly: true},
);

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  canGoBack: () => true,
};
const mockParams: {passageId?: string} = {passageId: 'psalm-51'};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View: RNView} = require('react-native');
  return {LinearGradient: RNView};
});
const mockInsets = {top: 0, bottom: 0, left: 0, right: 0};
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
}));
const mockTheme = {
  colors: {
    background: '#000000',
    card: '#111111',
    border: '#222222',
    primary: '#6366f1',
    primaryDark: '#4338ca',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#999999',
    onPrimary: '#ffffff',
  },
  gradient: {headerColors: ['#000', '#000', '#000']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockVersionRef = {
  current: {
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  },
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersionRef.current,
}));
const mockBack: {current: null | (() => boolean)} = {current: null};
jest.mock('@hooks/useBackHandlerStep', () => ({
  useBackHandlerStep: (h: () => boolean) => {
    mockBack.current = h;
  },
}));
const mockToast = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(
      async (
        bookId: number,
        chapter: number,
        verse: number,
        version: string,
      ) => {
        const row = mockSeed
          .prepare(
            'SELECT text FROM verses WHERE version=? AND book_id=? AND chapter=? AND verse=?',
          )
          .get(version, bookId, chapter, verse);
        return row ? {text: row.text} : null;
      },
    ),
  },
}));

import ScripturePrayerWalkScreen from '../app/features/prayer/scripture/[passageId]';

const es = require('../src/i18n/translations').translations.es;
const ts = es.scripturePrayer;
const KEY = '@prayer_requests_v1';

async function stored() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Comenzar y esperar el versículo 1 (la referencia visible). */
async function begin(firstRef: string) {
  fireEvent.press(screen.getByText(ts.begin));
  await screen.findByText(firstRef);
}

/** Escribir en el versículo visible y pasar al siguiente, esperando su referencia. */
async function writeAndNext(text: string | null, nextRef: string | null) {
  const input = await screen.findByPlaceholderText(ts.yourPrayerPlaceholder);
  if (text !== null) fireEvent.changeText(input, text);
  const btn = screen.queryByText(ts.next) ?? screen.getByText(ts.finish);
  fireEvent.press(btn);
  if (nextRef) await screen.findByText(nextRef);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockToast.success.mockClear();
  mockRouter.back.mockClear();
  mockBack.current = null;
  mockVersionRef.current = {
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  };
});
afterEach(() => cleanup());

const note = (i: number) =>
  ('Señor, te pido por esto en el versículo ' + i + ' ').padEnd(56, '.') +
  '[FIN-' +
  i +
  ']';
const BLOCK = (i: number) => 'Salmos 51:' + i + ': ' + note(i);

it('Psalm 51 with 19 prayers: nothing is cut; split between whole verses', async () => {
  mockParams.passageId = 'psalm-51';
  render(<ScripturePrayerWalkScreen />);
  await begin('Salmos 51:1');
  for (let i = 1; i <= 19; i++)
    await writeAndNext(note(i), i < 19 ? 'Salmos 51:' + (i + 1) : null);
  fireEvent.press(await screen.findByText(ts.saveJournalButton));
  await waitFor(() =>
    expect(mockToast.success).toHaveBeenCalledWith(ts.savedToast),
  );
  const list: Array<{title: string; detail: string}> = await stored();
  const title = ts.passages['psalm-51'].title;
  expect(list.length).toBe(2);
  expect(list.map(r => r.title).sort()).toEqual([
    title + ' (1/2)',
    title + ' (2/2)',
  ]);
  const joined = list
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(r => r.detail)
    .join('\n\n');
  const written = Array.from({length: 19}, (_, k) => BLOCK(k + 1)).join('\n\n');
  expect(joined).toBe(written);
  for (const r of list) expect(r.detail.length).toBeLessThanOrEqual(1000);
});

it('control: one short prayer is one entry, with the plain title', async () => {
  mockParams.passageId = 'psalm-142';
  render(<ScripturePrayerWalkScreen />);
  await begin('Salmos 142:1');
  await writeAndNext(note(1), 'Salmos 142:2');
  for (let i = 2; i <= 7; i++)
    await writeAndNext(null, i < 7 ? 'Salmos 142:' + (i + 1) : null);
  fireEvent.press(await screen.findByText(ts.saveJournalButton));
  await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  const list = await stored();
  expect(list.length).toBe(1);
  expect(list[0].title).toBe(ts.passages['psalm-142'].title);
  expect(list[0].detail).toBe('Salmos 142:1: ' + note(1));
});

it('one verse box stops where one journal entry would (visible, not cut at save)', async () => {
  mockParams.passageId = 'psalm-142';
  render(<ScripturePrayerWalkScreen />);
  await begin('Salmos 142:1');
  const input = await screen.findByPlaceholderText(ts.yourPrayerPlaceholder);
  fireEvent.changeText(input, 'x'.repeat(1500));
  expect(
    (await screen.findByPlaceholderText(ts.yourPrayerPlaceholder)).props.value
      .length,
  ).toBe(960);
});
