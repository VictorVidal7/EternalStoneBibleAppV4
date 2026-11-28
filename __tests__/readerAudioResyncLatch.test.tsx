/**
 * R9-423 — a second version switch while listening re-syncs the voice again.
 *
 * The reader re-syncs the audio engine to the version on screen when the user
 * switches versions mid-listen (Sprint 102). A latch (`audioVersionResyncRef`)
 * blocks re-entry while the engine has not yet reported the new version; it
 * remembered `book/chapter/version` and nothing ever cleared it. So: listen in
 * RVR1960 → switch to WEB (re-sync, latch = 43/3/WEB) → close the player →
 * back to RVR1960 → «Escuchar» (engine loads RVR1960) → switch to WEB: same
 * key, no re-sync. English text, Spanish voice.
 *
 * Lo REAL: the whole reader screen and its re-sync effect
 * (`shouldResyncAudioToVersion`). Lo sustituido: the audio engine (a fake that,
 * like the real `loadChapter`, tags what it loads with the live selected
 * version), the SQLite layer, the reader's sheets and modals, and the contexts
 * this behaviour does not read. Built on the S116 probe
 * (`_scratch/S116-sondas-agente-1/S116-a1-resyncLatch.test.tsx.txt`).
 */
import {act, render, waitFor} from '@testing-library/react-native';

type Version = {id: string; language: string; name: string};
type AudioVerse = {text?: string};
type AudioState = {
  isPlaying: boolean;
  isPaused: boolean;
  currentVerseIndex: number;
  contentVersionId: string | null;
};

const RVR: Version = {id: 'RVR1960', language: 'es', name: 'RVR1960'};
const WEB: Version = {id: 'WEB', language: 'en', name: 'WEB'};

// eslint-disable-next-line no-var
var mockState: {
  version: Version;
  audio: {isVisible: boolean; verses: AudioVerse[]; state: AudioState};
};
function freshState() {
  return {
    version: RVR,
    audio: {
      isVisible: false,
      verses: [] as AudioVerse[],
      state: {
        isPlaying: false,
        isPaused: false,
        currentVerseIndex: 0,
        contentVersionId: null,
      } as AudioState,
    },
  };
}
mockState = freshState();

// The engine: like the real `loadChapter`, it tags the verses with the version
// selected at load time (`versionIdRef`), in the same update as the verses.
const mockLoadAudio = jest.fn((verses: AudioVerse[]) => {
  mockState.audio = {
    isVisible: true,
    verses,
    state: {
      ...mockState.audio.state,
      currentVerseIndex: 0,
      isPlaying: false,
      contentVersionId: mockState.version.id,
    },
  };
});
const mockGetChapter = jest.fn(
  async (bookId: number, chapter: number, version: string) =>
    [1, 2, 3].map(v => ({
      id: v,
      bookNumber: bookId,
      book: version === 'WEB' ? 'John' : 'Juan',
      chapter,
      verse: v,
      text: (version === 'WEB' ? 'web ' : 'rvr ') + v,
      version,
    })),
);

// Every hook hands back the SAME object on every render, as the real providers
// do: a fresh `[]` per render would loop the reader's effects.
jest.mock('expo-router', () => {
  const R = require('react');
  const router = {push: jest.fn(), replace: jest.fn(), back: jest.fn()};
  const params = {book: 'Juan', chapter: '3'};
  return {
    useLocalSearchParams: () => params,
    useRouter: () => router,
    useFocusEffect: (cb: () => void) => R.useEffect(() => cb(), [cb]),
    Stack: {Screen: () => null},
  };
});
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('react-native-safe-area-context', () => {
  const insets = {top: 0, bottom: 0, left: 0, right: 0};
  return {useSafeAreaInsets: () => insets};
});
jest.mock('react-native-gesture-handler', () => {
  const chain: object = new Proxy({}, {get: () => () => chain});
  return {
    Gesture: {Pan: () => chain, Tap: () => chain},
    GestureDetector: ({children}: {children: unknown}) => children,
  };
});
jest.mock('@hooks/useTheme', () => {
  const value = {
    colors: new Proxy({}, {get: () => '#888888'}),
    isDark: false,
    mode: 'light',
  };
  return {useTheme: () => value};
});
jest.mock('@hooks/useBibleVersion', () => {
  let cached: {
    selectedVersion: unknown;
    setVersion: jest.Mock;
    availableVersions: unknown[];
  } | null = null;
  return {
    useBibleVersion: () => {
      if (!cached || cached.selectedVersion !== mockState.version) {
        cached = {
          selectedVersion: mockState.version,
          setVersion: jest.fn(),
          availableVersions: [],
        };
      }
      return cached;
    },
  };
});
jest.mock('@hooks/useLanguage', () => {
  const value = {
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  };
  return {useLanguage: () => value};
});
jest.mock('@hooks/useContextualHint', () => {
  const value = {visible: false, dismiss: jest.fn()};
  return {useContextualHint: () => value};
});
jest.mock('@hooks/useBackHandlerStep', () => ({useBackHandlerStep: () => {}}));
jest.mock('@context/ToastContext', () => {
  const value = {
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
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
  const value = {
    markChapterRead: jest.fn(async () => []),
    getPlanDuration: jest.fn(),
  };
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
jest.mock('@/features/audio', () => {
  const actual = jest.requireActual('../src/features/audio');
  const noop = jest.fn();
  return {
    ...actual,
    getLastPosition: async () => null,
    KaraokeText: () => null,
    useAudioPlayer: () => {
      const base: Record<string, unknown> = {
        loadChapter: mockLoadAudio,
        state: mockState.audio.state,
        isVisible: mockState.audio.isVisible,
        verses: mockState.audio.verses,
        readerFollowsAudio: false,
      };
      return new Proxy(base, {
        get: (target, key) => (key in target ? target[key as string] : noop),
      });
    },
  };
});
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => {}),
    getChapter: (b: number, c: number, v: string) => mockGetChapter(b, c, v),
    updateReadingProgress: jest.fn(async () => {}),
    getNoteForVerse: jest.fn(async () => null),
    getNotesForChapter: jest.fn(async () => []),
  },
}));
jest.mock('@lib/sync', () => ({getSyncEngine: () => null}));
jest.mock('@components/reading/ImmersiveReader', () => ({
  ImmersiveReader: () => null,
}));
jest.mock('@components/reading/CrossReferencesSheet', () => ({
  CrossReferencesSheet: () => null,
}));
jest.mock('@components/reading/OriginalLanguagesSheet', () => ({
  OriginalLanguagesSheet: () => null,
}));
jest.mock('@components/reading/ImageShareModal', () => ({
  ImageShareModal: () => null,
}));
jest.mock('@components/reading/NoteEditorModal', () => ({
  NoteEditorModal: () => null,
}));
jest.mock('@components/reading/ReaderPreferencesSheet', () => ({
  ...jest.requireActual('../src/components/reading/ReaderPreferencesSheet'),
  ReaderPreferencesSheet: () => null,
}));
jest.mock('@components/reading/AlsoInVersionsPanel', () => ({
  AlsoInVersionsPanel: () => null,
}));
jest.mock('@components/hints/ContextualHintBanner', () => ({
  ContextualHintBanner: () => null,
}));
jest.mock('@/features/collections/AddToCollectionSheet', () => ({
  AddToCollectionSheet: () => null,
}));

import {ReaderPreferencesProvider} from '../src/context/ReaderPreferencesContext';
import VerseReadingScreen from '../app/(tabs)/verse/[book]/[chapter]';

const tree = () => (
  <ReaderPreferencesProvider>
    <VerseReadingScreen />
  </ReaderPreferencesProvider>
);

async function settle(r: ReturnType<typeof render>) {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      r.rerender(tree());
      await new Promise(res => setTimeout(res, 0));
    });
  }
}

/** «Escuchar»: load the verses ON SCREEN into the engine, and play. */
async function listen(r: ReturnType<typeof render>) {
  const shown = await mockGetChapter(43, 3, mockState.version.id);
  act(() => {
    mockLoadAudio(shown);
  });
  mockState.audio.state = {...mockState.audio.state, isPlaying: true};
  await settle(r);
}

async function switchTo(r: ReturnType<typeof render>, version: Version) {
  mockState.version = version;
  await settle(r);
  await waitFor(() =>
    expect(mockGetChapter).toHaveBeenCalledWith(43, 3, version.id),
  );
  await settle(r);
}

/** The ✕ of the player (`hidePlayer`): hidden and stopped; the engine keeps its verses. */
async function closePlayer(r: ReturnType<typeof render>) {
  mockState.audio.isVisible = false;
  mockState.audio.state = {...mockState.audio.state, isPlaying: false};
  await settle(r);
}

const loadsOfWeb = () =>
  mockLoadAudio.mock.calls.filter(c =>
    String(c[0][0]?.text ?? '').startsWith('web '),
  ).length;

beforeEach(() => {
  mockState = freshState();
  mockLoadAudio.mockClear();
  mockGetChapter.mockClear();
});

describe('R9-423 — the version re-sync latch', () => {
  it('control: listening in RVR1960 and switching to WEB re-syncs the voice', async () => {
    const r = render(tree());
    await settle(r);
    await listen(r);
    const before = loadsOfWeb();
    await switchTo(r, WEB);
    expect(loadsOfWeb() - before).toBe(1);
    expect(mockState.audio.state.contentVersionId).toBe('WEB');
    r.unmount();
  });

  it('after an earlier re-sync to WEB, close, back to RVR1960, listen, switch to WEB: re-syncs again', async () => {
    const r = render(tree());
    await settle(r);
    await listen(r); // RVR1960
    await switchTo(r, WEB); // re-sync 1
    expect(mockState.audio.state.contentVersionId).toBe('WEB');
    await closePlayer(r);
    await switchTo(r, RVR); // hidden: no re-sync
    await listen(r); // engine back on RVR1960
    expect(mockState.audio.state.contentVersionId).toBe('RVR1960');

    const before = loadsOfWeb();
    await switchTo(r, WEB);
    // The voice follows the text: one more WEB load, engine on WEB.
    expect(loadsOfWeb() - before).toBe(1);
    expect(mockState.audio.state.contentVersionId).toBe('WEB');
    r.unmount();
  });
});
