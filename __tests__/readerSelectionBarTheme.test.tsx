/**
 * R9-41 — the floating verse-selection bar must stay legible on EVERY reading
 * theme, whatever the app theme.
 *
 * The bar draws `effectiveColors.text` (the reading palette's text) over a
 * background picked by `readerIsDark`. That flag used to ENUMERATE the dark
 * reading themes (`night`, `high-contrast`); `crepusculo` (T6.3, a true-dark
 * palette) was not in the list, so the bar fell to `glassWhite98` and drew
 * `#DCE3F0` over near-white — about 1.2:1, eight actions unreadable.
 *
 * Lo REAL: the whole reader screen, the reading palettes (`readerThemes.ts`),
 * the app palettes (`lightColors` / `darkColors` from `useTheme.tsx`) and the
 * design tokens the bar paints with. Lo sustituido: the SQLite layer, the
 * reader's sheets and modals, and the contexts the bar does not read.
 */
import {act, fireEvent, render} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';

// eslint-disable-next-line no-var
var mockTheme = 'system';
// eslint-disable-next-line no-var
var mockAppIsDark = false;

jest.mock('../src/lib/database', () => {
  const db = {
    initialize: jest.fn(async () => undefined),
    getDatabaseStats: jest.fn(async () => ({
      totalVerses: 93000,
      versions: ['RVR1960', 'WEB', 'KJV', 'RV1909'],
    })),
    getChapter: jest.fn(async (_b: number, ch: number, version: string) =>
      [1, 2, 3].map(v => ({
        book: 'Juan',
        chapter: ch,
        verse: v,
        text: `${version} ${ch}:${v}`,
      })),
    ),
    updateReadingProgress: jest.fn(async () => undefined),
    getReadingProgress: jest.fn(async () => null),
    getDatabase: jest.fn(async () => ({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      execAsync: jest.fn(async () => undefined),
      runAsync: jest.fn(async () => undefined),
      getAllAsync: jest.fn(async () => []),
    })),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
    getFavorites: jest.fn(async () => []),
    getNotes: jest.fn(async () => []),
    getNoteForVerse: jest.fn(async () => null),
  };
  return {__esModule: true, default: db, bibleDB: db};
});

jest.mock('expo-router', () => {
  const params = {book: 'Juan', chapter: '3'};
  return {
    useRouter: () => ({push: jest.fn(), replace: jest.fn(), back: jest.fn()}),
    useLocalSearchParams: () => params,
    useFocusEffect: () => undefined,
    Stack: {Screen: () => null},
  };
});

// Every hook below hands back the SAME object for a given state, as the real
// providers do: a fresh object per render would loop the reader's effects.
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('react-native-safe-area-context', () => {
  const insets = {top: 0, bottom: 0, left: 0, right: 0};
  return {useSafeAreaInsets: () => insets};
});
jest.mock('expo-clipboard', () => ({setStringAsync: jest.fn()}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), selection: jest.fn()},
}));
jest.mock('@hooks/useTheme', () => {
  const actual = jest.requireActual('../src/hooks/useTheme');
  const light = {
    ...actual,
    colors: actual.lightColors,
    isDark: false,
    mode: 'light',
    setThemeMode: jest.fn(),
  };
  const dark = {
    ...light,
    colors: actual.darkColors,
    isDark: true,
    mode: 'dark',
  };
  return {...actual, useTheme: () => (mockAppIsDark ? dark : light)};
});
jest.mock('../src/hooks/useLanguage', () => {
  const value = {
    language: 'en',
    t: require('../src/i18n/translations').translations.en,
  };
  return {useLanguage: () => value};
});
jest.mock('@context/ToastContext', () => {
  const value = {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    show: jest.fn(),
  };
  return {useToast: () => value};
});
jest.mock('@context/ServicesContext', () => {
  const value = {
    achievementService: null,
    highlightService: null,
    notifyAchievements: jest.fn(),
  };
  return {useServices: () => value};
});
jest.mock('@context/FavoritesContext', () => {
  const value = {
    favorites: [],
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
  };
  return {useFavorites: () => value};
});
jest.mock('@context/ReadingPlanProgressContext', () => {
  const value = {markChapterRead: jest.fn(), getPlanDuration: jest.fn()};
  return {useReadingPlanProgress: () => value};
});
jest.mock('@context/ReadingProgressContext', () => {
  const value = {progress: {}, updateChapterProgress: jest.fn()};
  return {useReadingProgress: () => value};
});
jest.mock('@context/PremiumContext', () => {
  const value = {isPremium: true};
  return {usePremium: () => value};
});
jest.mock('@hooks/useContextualHint', () => {
  const value = {visible: false, dismiss: jest.fn()};
  return {useContextualHint: () => value};
});
jest.mock('@context/ReaderPreferencesContext', () => {
  const actual = jest.requireActual('../src/context/ReaderPreferencesContext');
  const cache = new Map<string, unknown>();
  const valueFor = (theme: string) => {
    if (!cache.has(theme)) {
      cache.set(theme, {
        preferences: {...actual.DEFAULT_READER_PREFERENCES, theme},
        hydrated: true,
      });
    }
    return cache.get(theme);
  };
  return {...actual, useReaderPreferences: () => valueFor(mockTheme)};
});
jest.mock('@/features/audio', () => {
  const actual = jest.requireActual('../src/features/audio');
  const value = {
    loadChapter: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    goToVerse: jest.fn(),
    state: {isPlaying: false, currentVerseIndex: 0, contentVersionId: null},
    isVisible: false,
    verses: [],
    readerFollowsAudio: false,
    setBottomOffset: jest.fn(),
  };
  return {
    ...actual,
    useAudioPlayer: () => value,
    KaraokeText: () => null,
    getLastPosition: jest.fn(async () => null),
  };
});
jest.mock('@components/reading/ImmersiveReader', () => ({
  ImmersiveReader: () => null,
}));
jest.mock('@components/reading/NoteEditorModal', () => ({
  NoteEditorModal: () => null,
}));
jest.mock('@components/reading/ImageShareModal', () => ({
  ImageShareModal: () => null,
}));
jest.mock('@components/reading/ReaderPreferencesSheet', () => ({
  ...jest.requireActual('../src/components/reading/ReaderPreferencesSheet'),
  ReaderPreferencesSheet: () => null,
}));
jest.mock('@components/reading/CrossReferencesSheet', () => ({
  CrossReferencesSheet: () => null,
}));
jest.mock('@components/reading/OriginalLanguagesSheet', () => ({
  OriginalLanguagesSheet: () => null,
}));
jest.mock('@components/reading/AlsoInVersionsPanel', () => ({
  AlsoInVersionsPanel: () => null,
}));
jest.mock('@/features/collections/AddToCollectionSheet', () => ({
  AddToCollectionSheet: () => null,
}));
jest.mock('@components/hints/ContextualHintBanner', () => ({
  ContextualHintBanner: () => null,
}));

import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {BibleVersionProvider} from '../src/hooks/useBibleVersion';
import {READER_THEME_ORDER} from '../src/styles/readerThemes';
import {contrastRatio} from '../src/lib/a11y/contrast';
import {translations} from '../src/i18n/translations';
import ChapterReader from '../app/(tabs)/verse/[book]/[chapter]';

const t = translations.en;

async function settle(turns = 30) {
  for (let i = 0; i < turns; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

/** `rgba(r, g, b, a)` or `#rrggbb` → `#rrggbb` (the bar is 0.98 opaque). */
function solid(color: string): string {
  const m = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/.exec(color);
  if (!m) return color;
  return (
    '#' +
    [m[1], m[2], m[3]]
      .map(n => Number(n).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Mounts the reader, selects verse 1 and reads the bar's paint. */
async function barPaint(theme: string, appIsDark: boolean) {
  mockTheme = theme;
  mockAppIsDark = appIsDark;
  const screen = render(
    <BibleVersionProvider>
      <ChapterReader />
    </BibleVersionProvider>,
  );
  await settle();
  const verses = screen.UNSAFE_getAllByProps({
    accessibilityHint: t.verse.verseA11yHint,
  });
  fireEvent.press(verses[0]);
  await settle(5);
  const count = screen.getByText(`1 ${t.verse.singular}`);
  const text = StyleSheet.flatten(count.props.style).color as string;
  // Walk up to the bar: the first ancestor that paints a background.
  let node = count.parent;
  let background: string | undefined;
  while (node && !background) {
    const style = node.props?.style
      ? StyleSheet.flatten(node.props.style)
      : undefined;
    if (style?.backgroundColor && node.props.onLayout) {
      background = style.backgroundColor as string;
    }
    node = node.parent;
  }
  screen.unmount();
  return {text, background: background ?? 'none'};
}

beforeEach(() => {
  jest.useFakeTimers();
  setAchievementServiceInstance({
    initialize: jest.fn().mockResolvedValue(undefined),
    getRawUserStats: jest.fn().mockResolvedValue({}),
    getAllAchievements: jest.fn().mockResolvedValue([]),
    getReadingLog: jest.fn().mockResolvedValue([]),
    getCompletedBooks: jest.fn().mockResolvedValue([]),
    getBookReadingLog: jest.fn().mockResolvedValue([]),
    getChaptersReadLog: jest.fn().mockResolvedValue([]),
    restoreBackup: jest.fn().mockResolvedValue(undefined),
  } as unknown as AchievementService);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

afterAll(() => setAchievementServiceInstance(null));

describe('R9-41 — the selection bar is legible on every reading theme', () => {
  const cases = READER_THEME_ORDER.flatMap(theme =>
    [false, true].map(appIsDark => [theme, appIsDark] as const),
  );

  it.each(cases)(
    'theme %s, app dark %s: bar text clears AA over the bar',
    async (theme, appIsDark) => {
      const {text, background} = await barPaint(theme, appIsDark);
      expect(background).not.toBe('none');
      const ratio = contrastRatio(solid(text), solid(background));
      // AA for normal text: the action labels are small.
      expect({theme, appIsDark, text, background, ok: ratio >= 4.5}).toEqual({
        theme,
        appIsDark,
        text,
        background,
        ok: true,
      });
    },
  );
});
