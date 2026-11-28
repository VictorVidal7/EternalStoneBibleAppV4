/**
 * The reader's note sheet (`NoteEditorModal` opened from the selection bar).
 *
 * R9-57 — there was no way to delete a note from the reader (emptying the
 * field disables SAVE, and `saveNote` returns on a blank draft), and the X or
 * the Android back dropped the draft without asking: it lives only in the
 * reader's state. S138 measured that the back reaches the sheet's Modal
 * (`onRequestClose`), not the reader's `useBackHandlerStep`.
 *
 * Lo REAL: the whole reader screen, `NoteEditorModal` and its `ConfirmDialog`s.
 * Lo sustituido: the SQLite layer (a fake whose `getNoteForVerse` /
 * `removeNote` are spies), the sync engine (a spy), the reader's other sheets,
 * and the contexts this behaviour does not read.
 */
import {act, fireEvent, render} from '@testing-library/react-native';
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
    updateNote: jest.fn(async () => undefined),
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
  const r = render(<ChapterReader />);
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

/** The Android back on the note sheet: its Modal's onRequestClose. */
async function androidBack(r: ReturnType<typeof render>) {
  const modal = noteModal(r);
  expect(modal).toBeDefined();
  await act(async () => {
    modal?.props.onRequestClose();
  });
  await settle(5);
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

describe('R9-57 — deleting a note from the reader', () => {
  it('a stored note shows a delete action; confirming removes it and queues the tombstone', async () => {
    mockStored = STORED;
    const r = await openNoteSheet();
    expect(r.getByDisplayValue('nota guardada')).toBeTruthy();

    fireEvent.press(r.getByLabelText(t.notes.deleteNote));
    await settle(5);
    // It asks first: nothing removed yet.
    expect(r.getByText(t.notes.deleteMessage)).toBeTruthy();
    expect(mockRemoveNote).not.toHaveBeenCalled();

    fireEvent.press(r.getByText(t.delete));
    await settle();
    expect(mockRemoveNote).toHaveBeenCalledWith('n1');
    expect(mockQueueDelete).toHaveBeenCalledWith(
      'notes',
      'n1',
      expect.objectContaining({book: 'John', chapter: 3, verse: 1}),
    );
    expect(noteModal(r)).toBeUndefined();
    r.unmount();
  });

  it('a new note (nothing stored) has no delete action', async () => {
    const r = await openNoteSheet();
    expect(noteModal(r)).toBeDefined();
    expect(r.queryByLabelText(t.notes.deleteNote)).toBeNull();
    r.unmount();
  });
});

describe('R9-57 — the back and the X do not drop an edited draft', () => {
  it('back with an edited draft asks; «Seguir editando» keeps the draft, «Descartar» closes', async () => {
    mockStored = STORED;
    const r = await openNoteSheet();
    fireEvent.changeText(
      r.getByDisplayValue('nota guardada'),
      'nota guardada y más',
    );
    await settle(5);

    await androidBack(r);
    expect(r.getByText(t.notes.discardTitle)).toBeTruthy();
    expect(noteModal(r)).toBeDefined();

    fireEvent.press(r.getByText(t.notes.keepEditing));
    await settle(5);
    expect(r.queryByText(t.notes.discardTitle)).toBeNull();
    expect(r.getByDisplayValue('nota guardada y más')).toBeTruthy();

    await androidBack(r);
    fireEvent.press(r.getByText(t.notes.discardConfirm));
    await settle(5);
    expect(noteModal(r)).toBeUndefined();
    r.unmount();
  });

  it('the X with an edited draft asks too', async () => {
    const r = await openNoteSheet();
    fireEvent.changeText(
      r.getByPlaceholderText(t.notes.placeholder),
      'algo nuevo',
    );
    await settle(5);
    fireEvent.press(r.getByLabelText(t.close));
    await settle(5);
    expect(r.getByText(t.notes.discardTitle)).toBeTruthy();
    expect(noteModal(r)).toBeDefined();
    r.unmount();
  });

  it('back with nothing changed closes at once', async () => {
    mockStored = STORED;
    const r = await openNoteSheet();
    await androidBack(r);
    expect(r.queryByText(t.notes.discardTitle)).toBeNull();
    expect(noteModal(r)).toBeUndefined();
    r.unmount();
  });
});
