/**
 * R9-642 (the NoteEditorModal part) — a toast the reader fires with the note
 * sheet open is drawn inside the sheet, not behind it.
 *
 * The toast is a plain View of the window that draws it; a native Modal is
 * another window on top (R9-560). The reader fires notes.saveError (and, since
 * R9-57, notes.deleteError) with NoteEditorModal open, and the sheet had no
 * ToastHost: the R9-637 guard does not see it, because the toast comes from
 * the parent (the sheet itself has no useToast).
 *
 * Lo REAL: the whole reader screen, NoteEditorModal and the REAL
 * ToastProvider / ToastHost. Lo sustituido: the SQLite layer (updateNote
 * rejects), the sync engine, the reader's other sheets, and the contexts this
 * behaviour does not read.
 */
import {act, fireEvent, render, within} from '@testing-library/react-native';
import {Modal} from 'react-native';

type StoredNote = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

// eslint-disable-next-line no-var
var mockStored: StoredNote | null = null;
// eslint-disable-next-line no-var
var mockRemoveNote: jest.Mock;
// eslint-disable-next-line no-var
var mockQueueDelete: jest.Mock;
// eslint-disable-next-line no-var
var mockParams: {book: string; chapter: string; verse?: string} = {
  book: 'Juan',
  chapter: '3',
};

jest.mock('../src/lib/database', () => {
  mockRemoveNote = jest.fn(async () => undefined);
  const db = {
    initialize: jest.fn(async () => undefined),
    getChapter: jest.fn(async (_b: number, ch: number) =>
      [1, 2, 3].map(v => ({
        book: 'Juan',
        chapter: ch,
        verse: v,
        text: `texto ${ch}:${v}`,
      })),
    ),
    updateReadingProgress: jest.fn(async () => undefined),
    getReadingProgress: jest.fn(async () => null),
    getFavorites: jest.fn(async () => []),
    getNotes: jest.fn(async () => []),
    getNoteForVerse: jest.fn(async () => mockStored),
    // The save fails: the row is locked, the disk is full...
    updateNote: jest.fn(async () => {
      throw new Error('disk full');
    }),
    addNote: jest.fn(async () => 'new-id'),
    removeNote: (id: string) => mockRemoveNote(id),
  };
  return {__esModule: true, default: db, bibleDB: db};
});
jest.mock('../src/lib/sync', () => {
  mockQueueDelete = jest.fn();
  const engine = {
    queueWrite: jest.fn(),
    queueDelete: (...a: unknown[]) => mockQueueDelete(...a),
  };
  return {getSyncEngine: () => engine};
});

jest.mock('expo-router', () => {
  const router = {push: jest.fn(), replace: jest.fn(), back: jest.fn()};
  return {
    useRouter: () => router,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: () => undefined,
    Stack: {Screen: () => null},
  };
});

// Every hook below hands back the SAME object, as the real providers do: a
// fresh object per render would loop the reader's effects.
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
  const value = {
    ...actual,
    colors: actual.lightColors,
    isDark: false,
    mode: 'light',
    setThemeMode: jest.fn(),
  };
  return {...actual, useTheme: () => value};
});
jest.mock('@hooks/useBibleVersion', () => {
  const value = {
    selectedVersion: {
      id: 'RVR1960',
      language: 'es',
      name: 'RVR1960',
      abbreviation: 'RVR1960',
    },
    availableVersions: [],
    setVersion: jest.fn(),
  };
  return {useBibleVersion: () => value};
});
jest.mock('../src/hooks/useLanguage', () => {
  const value = {
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  };
  return {useLanguage: () => value};
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
jest.mock('@components/reading/ImmersiveReader', () => ({
  ImmersiveReader: () => null,
}));
jest.mock('@components/reading/NoteImageModal', () => ({
  NoteImageModal: () => null,
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
import {translations} from '../src/i18n/translations';
import {ToastProvider} from '../src/context/ToastContext';
import ChapterReader from '../app/(tabs)/verse/[book]/[chapter]';

const t = translations.es;

const STORED: StoredNote = {
  id: 'n1',
  book: 'John',
  chapter: 3,
  verse: 1,
  text: 'texto 3:1',
  note: 'nota guardada',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

async function settle(turns = 30) {
  for (let i = 0; i < turns; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

/** Mounts the reader on Juan 3, selects verse 1 and taps «Nota». */
async function openNoteSheet() {
  const r = render(
    <ToastProvider>
      <ChapterReader />
    </ToastProvider>,
  );
  await settle();
  const verses = r.UNSAFE_getAllByProps({
    accessibilityHint: t.verse.verseA11yHint,
  });
  fireEvent.press(verses[0]);
  await settle(5);
  fireEvent.press(r.getByText(t.notes.note));
  await settle();
  return r;
}

const openModals = (r: ReturnType<typeof render>) =>
  r.UNSAFE_getAllByType(Modal).filter(m => m.props.visible);

/** The note sheet's own Modal (the one holding its input), or undefined. */
function noteModal(r: ReturnType<typeof render>) {
  return openModals(r).find(
    m => m.findAll(n => n.props.placeholder === t.notes.placeholder).length > 0,
  );
}

beforeEach(() => {
  mockStored = null;
  mockRemoveNote.mockClear();
  mockQueueDelete.mockClear();
  mockParams = {book: 'Juan', chapter: '3'};
  setAchievementServiceInstance({
    initialize: jest.fn().mockResolvedValue(undefined),
    getRawUserStats: jest.fn().mockResolvedValue({}),
    getAllAchievements: jest.fn().mockResolvedValue([]),
    getReadingLog: jest.fn().mockResolvedValue([]),
    getCompletedBooks: jest.fn().mockResolvedValue([]),
    getBookReadingLog: jest.fn().mockResolvedValue([]),
    getChaptersReadLog: jest.fn().mockResolvedValue([]),
  } as unknown as AchievementService);
});

afterAll(() => setAchievementServiceInstance(null));

describe('R9-642 — the note sheet holds its own ToastHost', () => {
  it('the save error, fired with the sheet open, is drawn inside the sheet Modal, once', async () => {
    mockStored = STORED;
    const r = await openNoteSheet();
    fireEvent.changeText(r.getByDisplayValue('nota guardada'), 'nota nueva');
    await settle(5);
    fireEvent.press(r.getByText(t.notes.saveNote));
    await settle();

    // The sheet stays open (the save failed) and the error is in its window.
    const sheet = noteModal(r);
    expect(sheet).toBeDefined();
    expect(within(sheet!).getByText(t.notes.saveError)).toBeTruthy();
    expect(r.getAllByText(t.notes.saveError)).toHaveLength(1);
    r.unmount();
  });
});
