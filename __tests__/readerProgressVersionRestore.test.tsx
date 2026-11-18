/**
 * R9-605 — a restored version reloads the mounted reader, and that reload must
 * not overwrite the «Continuar leyendo» position the import just wrote.
 *
 * Since 4f93a3ab, `BibleVersionProvider` re-reads `@bible_version` on the
 * restore signal. A reader mounted on another tab sees a new version id and
 * reloads the SAME chapter; `loadChapter` wrote `reading_progress` id=1 on
 * every load, so `Juan 3:1` replaced the `Génesis 1:5` that `importBackup`
 * had written a moment before the signal.
 *
 * Lo REAL: the whole reader screen, `BibleVersionProvider`, `useReaderDualPrefs`,
 * `buildBackup` / `importBackup` and the restore signal, over the AsyncStorage
 * mock. Lo sustituido: the SQLite layer (one shared fake that logs every
 * `reading_progress` write), the reader's sheets and modals, and the contexts
 * this behaviour does not read (theme, language, toast, services, audio...).
 */
import {act, render} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- the one SQLite fake: the reader, the provider and the backup share it --
type Row = {book: string; chapter: number; verse: number; timestamp: string};
// eslint-disable-next-line no-var
var mockLog: string[] = [];
// eslint-disable-next-line no-var
var mockPointer: Row | null = null;

jest.mock('../src/lib/database', () => {
  const db = {
    initialize: jest.fn(async () => undefined),
    getDatabaseStats: jest.fn(async () => ({
      totalVerses: 93000,
      versions: ['RVR1960', 'WEB', 'KJV', 'RV1909'],
    })),
    getChapter: jest.fn(async (_b: number, ch: number, version: string) => {
      mockLog.push(`getChapter:${version}`);
      return [1, 2, 3].map(v => ({
        book: 'Juan',
        chapter: ch,
        verse: v,
        text: `${version} ${ch}:${v}`,
      }));
    }),
    updateReadingProgress: jest.fn(
      async (book: string, chapter: number, verse: number) => {
        mockLog.push(`WRITE ${book} ${chapter}:${verse}`);
        mockPointer = {book, chapter, verse, timestamp: 'now'};
      },
    ),
    getReadingProgress: jest.fn(async () => mockPointer),
    getDatabase: jest.fn(async () => ({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      execAsync: jest.fn(async () => undefined),
      runAsync: jest.fn(async () => undefined),
      getAllAsync: jest.fn(async () => []),
    })),
    executeSql: jest.fn(async (sql: string, params?: unknown[]) => {
      if (/UPDATE reading_progress/.test(sql) && params) {
        const [book, chapter, verse, timestamp] = params as [
          string,
          number,
          number,
          string,
        ];
        mockLog.push(`IMPORT ${book} ${chapter}:${verse}`);
        mockPointer = {book, chapter, verse, timestamp};
      }
      return {rows: {_array: [], length: 0}};
    }),
    getFavorites: jest.fn(async () => []),
    getNotes: jest.fn(async () => []),
  };
  return {__esModule: true, default: db, bibleDB: db};
});

// ---- route --------------------------------------------------------------------
// eslint-disable-next-line no-var
var mockParams: {book: string; chapter: string} = {book: 'Juan', chapter: '3'};
jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), replace: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => undefined,
  Stack: {Screen: () => null},
}));

// ---- contexts this behaviour does not read --------------------------------------
// Every hook below hands back the SAME object on every render, as the real
// providers do: a fresh `[]` per render would loop the reader's effects.
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
  const value = {
    colors: new Proxy({}, {get: () => '#888888'}),
    isDark: false,
    mode: 'light',
    setThemeMode: jest.fn(),
  };
  return {useTheme: () => value};
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
  const value = {isPremium: false};
  return {usePremium: () => value};
});
jest.mock('@hooks/useContextualHint', () => {
  const value = {visible: false, dismiss: jest.fn()};
  return {useContextualHint: () => value};
});
jest.mock('@context/ReaderPreferencesContext', () => {
  const actual = jest.requireActual('../src/context/ReaderPreferencesContext');
  const value = {
    preferences: actual.DEFAULT_READER_PREFERENCES,
    hydrated: true,
  };
  return {...actual, useReaderPreferences: () => value};
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
// Sheets and modals: closed throughout, and none of them writes the pointer.
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
import {buildBackup, importBackup} from '../src/services/BackupService';
import {
  BibleVersionProvider,
  useBibleVersion,
} from '../src/hooks/useBibleVersion';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import ChapterReader from '../app/(tabs)/verse/[book]/[chapter]';

let versionCtx: ReturnType<typeof useBibleVersion> | null = null;
function VersionSpy() {
  versionCtx = useBibleVersion();
  return null;
}

function tree() {
  return (
    <BibleVersionProvider>
      <VersionSpy />
      <ChapterReader />
    </BibleVersionProvider>
  );
}

async function settle(turns = 30) {
  for (let i = 0; i < turns; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

/** A file made on the other device: WEB chosen, last read Génesis 1:5. */
async function otherDeviceFile(version: string | null) {
  await AsyncStorage.clear();
  if (version) await AsyncStorage.setItem('@bible_version', version);
  mockPointer = {
    book: 'Génesis',
    chapter: 1,
    verse: 5,
    timestamp: '2026-11-01T00:00:00.000Z',
  };
  const {payload} = await buildBackup();
  return JSON.parse(JSON.stringify(payload));
}

/** This device: KJV chosen, the reader mounted on Juan 3. */
async function mountReaderOnJohn3() {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@bible_version', 'KJV');
  mockPointer = null;
  mockLog = [];
  const screen = render(tree());
  await settle();
  return screen;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockLog = [];
  mockPointer = null;
  mockParams = {book: 'Juan', chapter: '3'};
  versionCtx = null;
  __resetBackupRestoredListenersForTests();
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

describe('R9-605 — a restored version does not overwrite «Continuar leyendo»', () => {
  it('the reader reloads in the restored version and the restored position stays', async () => {
    const file = await otherDeviceFile('WEB');
    const screen = await mountReaderOnJohn3();
    // Cold start of the reader: opening a chapter IS a reading. (The provider
    // settles on KJV after a default or two, each one a load of Juan 3.)
    expect(mockLog).toContain('getChapter:KJV');
    expect(mockPointer).toMatchObject({book: 'Juan', chapter: 3, verse: 1});

    mockLog = [];
    await act(async () => {
      await importBackup(file);
    });
    await settle();

    // The reload happened (otherwise the test would prove nothing)...
    expect(versionCtx?.selectedVersion.id).toBe('WEB');
    expect(mockLog).toContain('getChapter:WEB');
    // ...and wrote nothing after the import.
    expect(mockLog.filter(l => /^(IMPORT|WRITE)/.test(l))).toEqual([
      'IMPORT Génesis 1:5',
    ]);
    expect(mockPointer).toMatchObject({book: 'Génesis', chapter: 1, verse: 5});
    screen.unmount();
  });

  it('CONTROL: opening another chapter afterwards is a new reading and moves the pointer', async () => {
    const file = await otherDeviceFile('WEB');
    const screen = await mountReaderOnJohn3();
    await act(async () => {
      await importBackup(file);
    });
    await settle();

    mockLog = [];
    mockParams = {book: 'Juan', chapter: '4'};
    screen.rerender(tree());
    await settle();

    expect(mockLog).toEqual(['getChapter:WEB', 'WRITE Juan 4:1']);
    expect(mockPointer).toMatchObject({book: 'Juan', chapter: 4, verse: 1});
    screen.unmount();
  });
});
