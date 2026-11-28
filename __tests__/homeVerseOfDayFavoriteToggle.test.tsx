/**
 * R9-437 — el corazón del versículo del día en Home no decía si el versículo
 * ya era favorito (estado local de la tarjeta, `false` en cada montaje), y
 * «Quitar de favoritos» no quitaba nada (el `onFavorite` de Home solo
 * agregaba).
 *
 * Home real, la `VerseOfDayCard` real y el `FavoritesProvider` real sobre una
 * tabla de favoritos en memoria (lo que guarda la base). Lo demás de Home, de
 * relleno (la forma de la sonda S119-homeFoco). El versículo del día viene de
 * RVR1960 («Juan»); el favorito se guarda con el canónico («John»).
 */
import {render, screen, act, fireEvent} from '@testing-library/react-native';

const mockRouter = {push: jest.fn(), back: jest.fn()};
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (effect: () => void) => {
      React.useEffect(() => {
        effect();
      }, [effect]);
    },
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
}));

/** La tabla `favorites` de la base. */
const mockFavRows: {current: Record<string, unknown>[]} = {current: []};
jest.mock('@lib/database', () => {
  const db = {
    initialize: jest.fn(async () => {}),
    getVerse: jest.fn(async () => ({
      book: 'Juan',
      bookNumber: 43,
      chapter: 3,
      verse: 16,
      text: 'Porque de tal manera',
    })),
    getRandomVerse: jest.fn(async () => null),
    getReadingProgress: jest.fn(async () => null),
    getFavoritesCount: jest.fn(async () => mockFavRows.current.length),
    getNotesCount: jest.fn(async () => 0),
    getFavorites: jest.fn(async () => [...mockFavRows.current]),
    addFavorite: jest.fn(async (f: Record<string, unknown>) => {
      mockFavRows.current = [f, ...mockFavRows.current];
    }),
    removeFavorite: jest.fn(async (id: string) => {
      mockFavRows.current = mockFavRows.current.filter(f => f.id !== id);
    }),
    getFavoriteById: jest.fn(
      async (id: string) => mockFavRows.current.find(f => f.id === id) ?? null,
    ),
  };
  return {__esModule: true, default: db, bibleDB: db};
});
jest.mock('@lib/sync', () => ({
  ...jest.requireActual('@lib/sync'),
  getSyncEngine: () => null,
}));
jest.mock('@lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {
  isDark: false,
  colors: mockColors,
  gradient: undefined,
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockVersion = {
  selectedVersion: {
    id: 'RVR1960',
    language: 'es',
    abbreviation: 'RVR1960',
    name: 'RVR1960',
  },
  availableVersions: [],
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockServices = {
  achievementService: {
    getUserStats: jest.fn(async () => ({
      totalVersesRead: 0,
      currentStreak: 0,
      level: 1,
    })),
    trackBookmark: jest.fn(async () => undefined),
  },
  highlightService: {getAllHighlights: jest.fn(async () => [])},
  initialized: true,
};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockServices,
}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
jest.mock('@/services/ShareService', () => ({__esModule: true, default: {}}));
const mockProgress = {getChapterProgress: () => 0};
jest.mock('@context/ReadingProgressContext', () => ({
  useReadingProgress: () => mockProgress,
}));
const mockPlans = {
  getCompletedDays: () => [],
  getStartedAt: () => null,
  getPlanDuration: () => undefined,
};
jest.mock('@context/ReadingPlanProgressContext', () => ({
  useReadingPlanProgress: () => mockPlans,
}));
const mockTogether = {getMembership: () => null};
jest.mock('@context/TogetherContext', () => ({
  useTogether: () => mockTogether,
}));
const mockCustom = {customPlans: []};
jest.mock('@context/CustomPlansContext', () => ({
  useCustomPlans: () => mockCustom,
}));
const mockDeck = {stats: new Proxy({}, {get: () => 0})};
jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => mockDeck,
}));
const mockPremium = {isPremium: false};
jest.mock('@context/PremiumContext', () => ({usePremium: () => mockPremium}));
const mockToast = {show: jest.fn(), success: jest.fn(), error: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockAudio = {
  isVisible: false,
  autoAdvanceChapter: false,
  state: {isPlaying: false, currentVerseIndex: 0},
  currentVerse: null,
  verses: [],
  play: jest.fn(),
};
jest.mock('@/features/audio', () => {
  const actual = jest.requireActual('@/features/audio');
  return {
    ...actual,
    useAudioPlayer: () => mockAudio,
    getLastPosition: jest.fn(async () => null),
  };
});
jest.mock('@/features/study/crossReferences', () => ({
  getMergedStudyConnections: jest.fn(async () => ({totalConnections: 0})),
}));
jest.mock('@components/celestial', () => {
  const R = require('react');
  const {View} = require('react-native');
  return {
    StatsCard: () => null,
    // La tarjeta real: lo que se prueba.
    VerseOfDayCard: jest.requireActual(
      '../src/components/celestial/VerseOfDayCard',
    ).default,
    ReadingPlanCard: () => null,
    ShimmerCard: ({children}: {children: unknown}) =>
      R.createElement(View, null, children),
  };
});
jest.mock('@components/SkeletonLoader', () => ({Skeleton: () => null}));
jest.mock('@components/FeelingChips', () => ({FeelingChips: () => null}));
jest.mock('@components/MoodVerseCard', () => ({MoodVerseCard: () => null}));
jest.mock('@components/DevotionStreakCard', () => ({
  DevotionStreakCard: () => null,
}));
jest.mock('@components/ConstancyRingsCard', () => ({
  ConstancyRingsCard: () => null,
}));
jest.mock('@components/NextMilestoneCard', () => ({
  NextMilestoneCard: () => null,
}));
jest.mock('@components/PrayerCard', () => ({PrayerCard: () => null}));
jest.mock('@components/home/DiscoverTile', () => ({DiscoverTile: () => null}));
jest.mock('@components/hints/ContextualHintBanner', () => ({
  ContextualHintBanner: () => null,
}));
const mockHint = {visible: false, dismiss: jest.fn(), show: jest.fn()};
jest.mock('@hooks/useContextualHint', () => ({
  useContextualHint: () => mockHint,
}));

import HomeScreen from '../app/(tabs)/index';
import {FavoritesProvider} from '../src/context/FavoritesContext';

const t = mockLang.t;

async function flush() {
  for (let i = 0; i < 8; i++) {
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
  }
}
function heart(): 'añadir' | 'quitar' | null {
  if (screen.queryByLabelText(t.verse.addFavorite)) return 'añadir';
  if (screen.queryByLabelText(t.verse.removeFavorite)) return 'quitar';
  return null;
}
const john316 = () =>
  mockFavRows.current.filter(
    f => f.book === 'John' && f.chapter === 3 && f.verse === 16,
  ).length;

beforeEach(() => {
  mockFavRows.current = [];
});

it('un versículo del día que ya es favorito: el corazón lo dice («Quitar de favoritos»)', async () => {
  mockFavRows.current = [
    {
      id: 'fav_1',
      verseId: 'John_3_16',
      book: 'John',
      chapter: 3,
      verse: 16,
      text: 'Porque de tal manera',
      category: 'worship',
      rating: 5,
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    },
  ];
  render(
    <FavoritesProvider>
      <HomeScreen />
    </FavoritesProvider>,
  );
  await flush();
  expect(heart()).toBe('quitar');
});

it('dos toques: agrega y después quita de verdad (el corazón y Favoritos dicen lo mismo)', async () => {
  render(
    <FavoritesProvider>
      <HomeScreen />
    </FavoritesProvider>,
  );
  await flush();
  expect(heart()).toBe('añadir');

  fireEvent.press(screen.getByLabelText(t.verse.addFavorite));
  await flush();
  expect({corazon: heart(), favoritos: john316()}).toEqual({
    corazon: 'quitar',
    favoritos: 1,
  });

  fireEvent.press(screen.getByLabelText(t.verse.removeFavorite));
  await flush();
  expect({corazon: heart(), favoritos: john316()}).toEqual({
    corazon: 'añadir',
    favoritos: 0,
  });
});
