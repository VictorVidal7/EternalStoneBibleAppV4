/**
 * R9-465 / R9-623 — the reader's 5 s reading timer must fire once per chapter.
 *
 * It used to list `toast`, `t` and friends in its deps. The Toast provider
 * handed out a fresh value on every show and dismiss, so each toast re-armed
 * the timer and, 5 s later, the chapter was counted again (`trackVersesRead`
 * sums without dedup, R9-465) and re-read into the plan — since the 171,
 * re-reading a plan day completes it, so a day the user unticked came back
 * with a false toast (R9-623), also from a reader left mounted under another
 * screen.
 *
 * The REAL reader, with the REAL ToastProvider and the REAL
 * ReadingPlanProgressProvider (a stable context mock hides the cascade —
 * REGLAS, session 124). The language comes from a small stateful provider so
 * a language switch hands out a new `t`, like the app's.
 */
import React from 'react';
import {render, act} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockTrack = jest.fn(async (..._a: unknown[]) => []);
const mockNoop = jest.fn();
const mockVersion = {id: 'RVR1960', language: 'es', name: 'RVR1960'};
const mockStable: any = {
  router: {push: jest.fn(), replace: jest.fn(), back: jest.fn()},
  hint: {visible: false, dismiss: jest.fn()},
  favorites: {favorites: [], addFavorite: jest.fn(), removeFavorite: jest.fn()},
  progress: {progress: {}, updateChapterProgress: jest.fn()},
  services: {
    achievementService: {
      trackVersesRead: (...a: unknown[]) => mockTrack(...a),
      trackChapterCompleted: jest.fn(async () => []),
      syncBookCompletion: jest.fn(async () => []),
    },
    highlightService: null,
    notifyAchievements: jest.fn(),
  },
  bv: {
    selectedVersion: mockVersion,
    setVersion: jest.fn(),
    availableVersions: [],
  },
  audio: null as any,
};
const mockGetChapter = jest.fn(
  async (bookId: number, chapter: number, version: string) =>
    [1, 2, 3].map(v => ({
      id: v,
      bookNumber: bookId,
      book: 'Juan',
      chapter,
      verse: v,
      text: 'rvr ' + v,
      version,
    })),
);

jest.mock('expo-router', () => {
  const R = require('react');
  return {
    useLocalSearchParams: () => ({book: 'Juan', chapter: '6'}),
    useRouter: () => mockStable.router,
    useFocusEffect: (cb: any) => R.useEffect(() => cb(), [cb]),
    Stack: {Screen: () => null},
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  SafeAreaView: ({children}: any) => children,
  SafeAreaProvider: ({children}: any) => children,
}));
jest.mock('react-native-gesture-handler', () => {
  const chain: any = new Proxy({}, {get: () => () => chain});
  return {
    Gesture: {Pan: () => chain, Tap: () => chain},
    GestureDetector: ({children}: any) => children,
  };
});
jest.mock('@hooks/useTheme', () => {
  const actual = jest.requireActual('@hooks/useTheme');
  const theme = {colors: actual.lightColors, isDark: false};
  return {...actual, useTheme: () => theme};
});
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockStable.bv,
}));
jest.mock('@hooks/useLanguage', () => {
  const R = require('react');
  const {translations} = jest.requireActual('@/i18n/translations');
  const make = (language: 'es' | 'en') => ({
    t: translations[language],
    language,
  });
  const Ctx = R.createContext(make('es'));
  const mockLangControl: {set: null | ((l: 'es' | 'en') => void)} = {set: null};
  function MockLanguageProvider({children}: {children: React.ReactNode}) {
    const [lang, setLang] = R.useState(make('es'));
    mockLangControl.set = (l: 'es' | 'en') => setLang(make(l));
    return R.createElement(Ctx.Provider, {value: lang}, children);
  }
  return {
    useLanguage: () => R.useContext(Ctx),
    MockLanguageProvider,
    mockLangControl,
  };
});
jest.mock('@hooks/useContextualHint', () => ({
  useContextualHint: () => mockStable.hint,
}));
jest.mock('@hooks/useBackHandlerStep', () => ({useBackHandlerStep: () => {}}));
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockStable.services,
}));
jest.mock('@context/FavoritesContext', () => ({
  useFavorites: () => mockStable.favorites,
}));
jest.mock('@context/ReadingProgressContext', () => ({
  useReadingProgress: () => mockStable.progress,
}));
// The REAL plan provider, with markChapterRead counted. The wrapper is cached
// per original function so its identity is exactly as stable as the real one.
const mockMark = jest.fn();
jest.mock('@context/ReadingPlanProgressContext', () => {
  const actual = jest.requireActual('@context/ReadingPlanProgressContext');
  const wrapped = new WeakMap();
  const values = new WeakMap();
  const wrap = (fn: any) => {
    if (!wrapped.has(fn)) {
      wrapped.set(fn, (...a: unknown[]) => {
        mockMark(...a);
        return fn(...a);
      });
    }
    return wrapped.get(fn);
  };
  return {
    ...actual,
    useReadingPlanProgress: () => {
      const v = actual.useReadingPlanProgress();
      if (!values.has(v)) {
        values.set(v, {...v, markChapterRead: wrap(v.markChapterRead)});
      }
      return values.get(v);
    },
  };
});
jest.mock('@context/PremiumContext', () => {
  const p = {isPremium: false};
  return {usePremium: () => p};
});
jest.mock('@/features/audio', () => {
  const actual = jest.requireActual('@/features/audio');
  return {
    ...actual,
    getLastPosition: async () => null,
    KaraokeText: () => null,
    useAudioPlayer: () => {
      if (!mockStable.audio) {
        const base: any = {
          loadChapter: jest.fn(),
          state: {
            isPlaying: false,
            isPaused: false,
            currentVerseIndex: 0,
            contentVersionId: null,
          },
          isVisible: false,
          verses: [],
          readerFollowsAudio: false,
        };
        mockStable.audio = new Proxy(base, {
          get: (tgt, k) => (k in tgt ? tgt[k as string] : mockNoop),
        });
      }
      return mockStable.audio;
    },
  };
});
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => {}),
    getChapter: (...a: any[]) =>
      mockGetChapter(...(a as [number, number, string])),
    updateReadingProgress: jest.fn(async () => {}),
    getNoteForVerse: jest.fn(async () => null),
    getNotesForChapter: jest.fn(async () => []),
  },
}));
jest.mock('@lib/sync', () => ({getSyncEngine: () => null}));
jest.mock('@components/reading/ImmersiveReader', () => ({
  __esModule: true,
  default: () => null,
  ImmersiveReader: () => null,
}));
jest.mock('@components/reading/CrossReferencesSheet', () => ({
  __esModule: true,
  default: () => null,
  CrossReferencesSheet: () => null,
}));
jest.mock('@components/reading/OriginalLanguagesSheet', () => ({
  __esModule: true,
  default: () => null,
  OriginalLanguagesSheet: () => null,
}));
jest.mock('@components/reading/ImageShareModal', () => ({
  __esModule: true,
  default: () => null,
  ImageShareModal: () => null,
}));
jest.mock('@components/reading/NoteEditorModal', () => ({
  __esModule: true,
  default: () => null,
  NoteEditorModal: () => null,
}));
jest.mock('@components/reading/ReaderPreferencesSheet', () => ({
  ...jest.requireActual('@components/reading/ReaderPreferencesSheet'),
  __esModule: true,
  default: () => null,
  ReaderPreferencesSheet: () => null,
}));
jest.mock('@components/reading/AlsoInVersionsPanel', () => ({
  __esModule: true,
  default: () => null,
  AlsoInVersionsPanel: () => null,
}));
jest.mock('@components/hints/ContextualHintBanner', () => ({
  __esModule: true,
  default: () => null,
  ContextualHintBanner: () => null,
}));
jest.mock('@/features/collections/AddToCollectionSheet', () => ({
  __esModule: true,
  default: () => null,
  AddToCollectionSheet: () => null,
}));

import {ReaderPreferencesProvider} from '@context/ReaderPreferencesContext';
import {ToastProvider, useToast} from '@context/ToastContext';
import {
  ReadingPlanProgressProvider,
  useReadingPlanProgress,
} from '@context/ReadingPlanProgressContext';
import VerseReadingScreen from '../app/(tabs)/verse/[book]/[chapter]';

const {MockLanguageProvider, mockLangControl} =
  jest.requireMock('@hooks/useLanguage');

// "Los 'Yo soy' de Jesús" — day 1 is Juan 6 alone.
const PLAN_ID = 'iam-7';

const grab: {toast: any; plan: any; shown: string[]} = {
  toast: null,
  plan: null,
  shown: [],
};
function Grab() {
  grab.toast = useToast();
  grab.plan = useReadingPlanProgress();
  return null;
}

const tree = () => (
  <MockLanguageProvider>
    <ToastProvider>
      <ReadingPlanProgressProvider>
        <ReaderPreferencesProvider>
          <Grab />
          <VerseReadingScreen />
        </ReaderPreferencesProvider>
      </ReadingPlanProgressProvider>
    </ToastProvider>
  </MockLanguageProvider>
);

async function flush() {
  for (let i = 0; i < 8; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}
async function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 500) {
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await flush();
  }
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers();
  mockTrack.mockClear();
  mockMark.mockClear();
  mockStable.bv = {...mockStable.bv, selectedVersion: mockVersion};
});
afterEach(() => {
  jest.useRealTimers();
});

/** Mount the reader on Juan 6 with iam-7 started, and wait out the first count. */
async function mountStartedPlanAndRead() {
  const r = render(tree());
  await flush();
  await act(async () => {
    await grab.plan.setPlanStart(PLAN_ID, new Date().toISOString());
  });
  // Re-mounting the chapter isn't needed: the timer reads markChapterRead
  // when it fires, so the plan started above is seen at 5 s.
  await advance(6000);
  return r;
}

it('CONTROL: 30 s on the chapter with no toast counts it once', async () => {
  const r = render(tree());
  await flush();
  await advance(30000);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  r.unmount();
});

it('R9-465: a toast at 6 s does not count the chapter again', async () => {
  const r = render(tree());
  await flush();
  await advance(6000);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  await act(async () => {
    grab.toast.success('Agregado a favoritos');
  });
  await flush();
  await advance(24000);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  expect(mockMark).toHaveBeenCalledTimes(1);
  r.unmount();
});

it('R9-623: a day unticked after the read does not come back with an unrelated toast', async () => {
  const r = await mountStartedPlanAndRead();
  // The read at 5 s completed day 1 (that's the reader's own "Día 1" toast).
  expect(grab.plan.isDayComplete(PLAN_ID, 1)).toBe(true);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  expect(mockMark).toHaveBeenCalledTimes(1);

  await act(async () => {
    await grab.plan.toggleDay(PLAN_ID, 1);
  });
  expect(grab.plan.isDayComplete(PLAN_ID, 1)).toBe(false);

  await act(async () => {
    grab.toast.info('Nombre y pasaje, por favor');
  });
  await flush();
  await advance(24000);

  expect(grab.plan.isDayComplete(PLAN_ID, 1)).toBe(false);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  expect(mockMark).toHaveBeenCalledTimes(1);
  r.unmount();
});

it('a language switch at 6 s (a new `t`) does not count the chapter again', async () => {
  const r = render(tree());
  await flush();
  await advance(6000);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  await act(async () => {
    mockLangControl.set('en');
  });
  await flush();
  await advance(24000);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  r.unmount();
});

it('CONTROL: a new chapter load (a new `verses`) still arms the timer again', async () => {
  // The fix must not freeze the timer: the chapter changing is the one thing
  // that should re-arm it. A version switch reloads the same chapter's verses.
  const r = render(tree());
  await flush();
  await advance(6000);
  expect(mockTrack).toHaveBeenCalledTimes(1);
  mockStable.bv = {
    ...mockStable.bv,
    selectedVersion: {id: 'KJV', language: 'en', name: 'KJV'},
  };
  r.rerender(tree());
  await flush();
  await advance(6000);
  expect(mockTrack).toHaveBeenCalledTimes(2);
  r.unmount();
});
