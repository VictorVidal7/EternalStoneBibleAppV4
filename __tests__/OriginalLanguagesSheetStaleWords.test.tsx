/**
 * R9-435 — the originals sheet stays mounted while closed (the reader and the
 * prophecies screen render it with `visible` apart). Two late answers used to
 * paint one verse's words under another verse's reference:
 * - the reload at the end of a download called the `loadWords` of the render
 *   where «Descargar» was tapped (close during the download, reopen on Juan
 *   3:17, and the words of 3:16 showed under «Juan 3:17»);
 * - a read for the previous verse that landed after the current one.
 *
 * The real sheet; the download service and the originals reads are mocked
 * with gates so the test decides when each one finishes.
 */
import {render, fireEvent, screen, act} from '@testing-library/react-native';
import {OriginalLanguagesSheet} from '../src/components/reading/OriginalLanguagesSheet';

const mockRouter = {push: jest.fn(), back: jest.fn()};
jest.mock('expo-router', () => ({useRouter: () => mockRouter}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('../src/lib/haptics', () => ({haptics: {tap: jest.fn()}}));
const mockTheme = {
  colors: {
    background: '#ffffff',
    surface: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#94a3b8',
    primary: '#1d4ed8',
    border: '#cbd5e1',
    onPrimary: '#ffffff',
  },
  isDark: false,
};
jest.mock('../src/hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('../src/hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockSheet = {open: jest.fn()};
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => mockSheet,
}));
const mockPremium = {isPremium: true};
jest.mock('../src/context/PremiumContext', () => ({
  usePremium: () => mockPremium,
}));

const mockState = {
  installed: false,
  resolveDownload: null as null | (() => void),
  // verse -> pending resolver, when that verse's read is gated
  gated: new Set<number>(),
  pending: new Map<number, () => void>(),
  // when set, isOriginalsInstalled waits for this gate
  gateInstalled: false,
  releaseInstalled: null as null | (() => void),
};
jest.mock('../src/lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(
    () =>
      new Promise<number>(res => {
        mockState.resolveDownload = () => {
          mockState.installed = true;
          res(1);
        };
      }),
  ),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
  isOriginalsUpdateAvailable: jest.fn(async () => false),
}));
const mockWord = (verse: number) => ({
  position: 1,
  lang: 'G',
  word: `PALABRA-DE-${verse}`,
  translit: `translit${verse}`,
  gloss_en: `gloss${verse}`,
  gloss_es: `glosa${verse}`,
  strongs: 'G25',
  grammar: 'V-AAI-3S',
});
jest.mock('../src/features/study/originals', () => {
  const actual = jest.requireActual('../src/features/study/originals');
  return {
    ...actual,
    isOriginalsInstalled: jest.fn(
      () =>
        new Promise(res => {
          if (!mockState.gateInstalled) return res(mockState.installed);
          mockState.releaseInstalled = () => res(mockState.installed);
        }),
    ),
    getVerseOriginal: jest.fn(
      (_b: string, _c: number, v: number) =>
        new Promise(res => {
          const answer = () => res([mockWord(v)]);
          if (mockState.gated.has(v)) mockState.pending.set(v, answer);
          else answer();
        }),
    ),
    getStrongsDetail: jest.fn(async () => null),
    getVerseText: jest.fn(async () => null),
  };
});

async function flush() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
  }
}
const o = mockLang.t.originals;
const onClose = jest.fn();
function sheet(visible: boolean, verse: number) {
  return (
    <OriginalLanguagesSheet
      visible={visible}
      sourceBook="Juan"
      sourceChapter={3}
      sourceVerse={verse}
      version="RVR1960"
      onClose={onClose}
    />
  );
}
function seen() {
  return {
    ref316: !!screen.queryByText('Juan 3:16'),
    ref317: !!screen.queryByText('Juan 3:17'),
    word16: !!screen.queryByText('PALABRA-DE-16'),
    word17: !!screen.queryByText('PALABRA-DE-17'),
  };
}

beforeEach(() => {
  mockState.installed = false;
  mockState.resolveDownload = null;
  mockState.gated.clear();
  mockState.pending.clear();
  mockState.gateInstalled = false;
  mockState.releaseInstalled = null;
});

it('control: the download ends with the sheet open on the same verse', async () => {
  render(sheet(true, 16));
  await flush();
  fireEvent.press(screen.getByLabelText(o.download));
  await flush();
  await act(async () => mockState.resolveDownload!());
  await flush();
  expect(seen()).toMatchObject({ref316: true, word16: true});
});

it('closed during the download and reopened on Juan 3:17: the words of 3:17 show', async () => {
  const view = render(sheet(true, 16));
  await flush();
  fireEvent.press(screen.getByLabelText(o.download));
  await flush();
  view.rerender(sheet(false, 16));
  await flush();
  view.rerender(sheet(true, 17));
  await flush();
  await act(async () => mockState.resolveDownload!());
  await flush();
  expect(seen()).toEqual({
    ref316: false,
    ref317: true,
    word16: false,
    word17: true,
  });
});

it('a read for the previous verse that lands late does not paint over the current one', async () => {
  mockState.installed = true;
  mockState.gated.add(16);
  const view = render(sheet(true, 16));
  await flush();
  expect(mockState.pending.has(16)).toBe(true);
  view.rerender(sheet(true, 17));
  await flush();
  expect(seen()).toMatchObject({ref317: true, word17: true});
  await act(async () => mockState.pending.get(16)!());
  await flush();
  expect(seen()).toEqual({
    ref316: false,
    ref317: true,
    word16: false,
    word17: true,
  });
});

it('a late read for the previous verse is dropped while the new verse is still checking the pack', async () => {
  mockState.installed = true;
  mockState.gated.add(16);
  const view = render(sheet(true, 16));
  await flush();
  expect(mockState.pending.has(16)).toBe(true);
  mockState.gateInstalled = true;
  view.rerender(sheet(true, 17));
  await flush();
  expect(mockState.releaseInstalled).not.toBeNull();
  await act(async () => mockState.pending.get(16)!());
  await flush();
  expect(seen()).toMatchObject({ref317: true, word16: false});
  await act(async () => mockState.releaseInstalled!());
  await flush();
  expect(seen()).toEqual({
    ref316: false,
    ref317: true,
    word16: false,
    word17: true,
  });
});
