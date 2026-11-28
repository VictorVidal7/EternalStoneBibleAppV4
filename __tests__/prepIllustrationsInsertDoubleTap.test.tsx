/**
 * R9-482 (familia de R9-474) — two taps on an illustration of the bank in
 * INSERT mode insert it once and go back once.
 *
 * `handleInsert` reads the saved notes, appends, saves and goes back, with no
 * guard: a back-to-back double tap went back twice (out of the Mesa, into the
 * reader), and a second tap landing after the first one's write (during the
 * exit) appended the illustration twice. The real bank on `renderRouter`
 * (the app's stack: reader inside `(tabs)` → Mesa (a stub) → bank with
 * `insertPassageKey`), and the real prepNotesStore on the AsyncStorage mock.
 * The harness is the S127-a4 probe's.
 */
import {Text} from 'react-native';
import {Stack, Tabs, router} from 'expo-router';
import {
  renderRouter,
  act,
  fireEvent,
  screen,
} from 'expo-router/testing-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as prepNotesStore from '../src/features/study/prepNotesStore';

const {getPrepNotes, savePrepNote} = prepNotesStore;

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  };
});
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    press: jest.fn(),
  },
}));
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  show: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {
  isDark: false,
  colors: mockColors,
  gradient: {headerColors: ['#000', '#111']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockVersion = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockPremium = {isPremium: true};
jest.mock('@context/PremiumContext', () => ({usePremium: () => mockPremium}));
const mockSheet = {open: jest.fn()};
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => mockSheet,
}));
const mockMap = {
  i1: {
    id: 'i1',
    title: 'El faro',
    body: 'Una luz en la noche',
    category: 'historical',
    createdAt: 1,
    updatedAt: 2,
  },
};
jest.mock('@/features/study/prepIllustrationsStore', () => ({
  getAllPrepIllustrations: jest.fn(async () => mockMap),
  createPrepIllustration: jest.fn(),
  deletePrepIllustration: jest.fn(),
}));

const KEY = 'John/3/16';
const PROSA = 'Mi aplicación escrita a mano';
const INSERTED = `${PROSA}\n\nEl faro\nUna luz en la noche`;
const Banco = require('../app/features/prep/illustrations/index').default;
const S = (name: string) =>
  function Stub() {
    return <Text>{name}</Text>;
  };
function routes() {
  return {
    _layout: () => (
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    ),
    '(tabs)/_layout': () => (
      <Tabs backBehavior="history" screenOptions={{headerShown: false}}>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    '(tabs)/index': S('home'),
    '(tabs)/verse/[book]/[chapter]': S('lector'),
    'features/prep/index': S('mesa'),
    'features/prep/illustrations/index': Banco,
  };
}
async function openBankInInsertMode() {
  const r = renderRouter(routes(), {initialUrl: '/'});
  act(() => router.push('/verse/John/3'));
  act(() =>
    router.push({
      pathname: '/features/prep',
      params: {book: 'John', chapter: '3', startVerse: '16'},
    }),
  );
  act(() =>
    router.push({
      pathname: '/features/prep/illustrations',
      params: {insertPassageKey: KEY},
    }),
  );
  const row = await screen.findByLabelText('El faro');
  return {r, row};
}
async function drain() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });
  }
}
const timesInserted = (text: string | undefined) =>
  (text ?? '').split('El faro').length - 1;

beforeEach(async () => {
  jest.restoreAllMocks();
  mockToast.error.mockClear();
  await AsyncStorage.clear();
  await savePrepNote(KEY, 'application', PROSA);
});

describe('R9-482 — a double tap on an illustration in insert mode', () => {
  test('control: one tap inserts once and goes back to the Mesa', async () => {
    const {r, row} = await openBankInInsertMode();
    await act(async () => fireEvent.press(row));
    await drain();
    expect(r.getPathname()).toBe('/features/prep');
    expect((await getPrepNotes(KEY)).sections.application).toBe(INSERTED);
  });

  test('back to back: inserts once and goes back once, to the Mesa', async () => {
    const {r, row} = await openBankInInsertMode();
    await act(async () => {
      fireEvent.press(row);
      fireEvent.press(row);
    });
    await drain();
    expect(r.getPathname()).toBe('/features/prep');
    expect((await getPrepNotes(KEY)).sections.application).toBe(INSERTED);
  });

  test('the second tap after the first one saved: still inserted once', async () => {
    const {r, row} = await openBankInInsertMode();
    // The first tap finishes its read and its write; the second lands
    // before the bank unmounts (the first one's back() is already asked).
    await act(async () => {
      fireEvent.press(row);
      for (let i = 0; i < 10; i++) await Promise.resolve();
      fireEvent.press(row);
    });
    await drain();
    const saved = await getPrepNotes(KEY);
    expect(timesInserted(saved.sections.application)).toBe(1);
    expect(saved.sections.application).toBe(INSERTED);
    expect(r.getPathname()).toBe('/features/prep');
  });

  test('a failed write keeps the bank, and the next tap inserts', async () => {
    const {r, row} = await openBankInInsertMode();
    jest
      .spyOn(prepNotesStore, 'savePrepNote')
      .mockRejectedValueOnce(new Error('disk full'));
    await act(async () => fireEvent.press(row));
    await drain();
    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(r.getPathname()).toBe('/features/prep/illustrations');
    expect((await getPrepNotes(KEY)).sections.application).toBe(PROSA);

    await act(async () => fireEvent.press(screen.getByLabelText('El faro')));
    await drain();
    expect(r.getPathname()).toBe('/features/prep');
    expect((await getPrepNotes(KEY)).sections.application).toBe(INSERTED);
  });

  test('a failed read keeps the bank, and the next tap inserts', async () => {
    const {r, row} = await openBankInInsertMode();
    jest
      .spyOn(prepNotesStore, 'getPrepNotes')
      .mockRejectedValueOnce(new Error('read failed'));
    await act(async () => fireEvent.press(row));
    await drain();
    expect(mockToast.error).toHaveBeenCalledTimes(1);
    expect(r.getPathname()).toBe('/features/prep/illustrations');

    await act(async () => fireEvent.press(screen.getByLabelText('El faro')));
    await drain();
    expect(r.getPathname()).toBe('/features/prep');
    expect((await getPrepNotes(KEY)).sections.application).toBe(INSERTED);
  });
});
