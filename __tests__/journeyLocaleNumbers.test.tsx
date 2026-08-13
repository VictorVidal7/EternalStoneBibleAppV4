/**
 * Regression guard — the "Tu camino" journey screen's shared `num()`
 * formatter (app/features/journey/index.tsx) must thread the app's CHOSEN
 * language into `toLocaleString`, not silently fall back to the device's
 * system locale. Before the fix `num` called `n.toLocaleString()` with no
 * locale argument, and the finale card's three summary rows called
 * `.toLocaleString()` directly (same bug, now unified onto the same `num`).
 *
 * `buildJourneyRecap` is mocked to a minimal, fixed recap (`versesRead` only,
 * everything else 0/null) so the slide deck collapses to exactly
 * [intro, verses, finale] — a single `fireEvent.press` on the "next" tap
 * zone reaches the "verses read" slide where `num()` renders its big number.
 * All other heavy screen dependencies (achievementService, review events,
 * listening stats, feelings log, favorites/cards) are stubbed to empty so
 * the async `loadRecap` resolves immediately without touching real storage
 * or a native DB. Mirrors quizExitConfirm.test.tsx's full-route mocking
 * pattern for this same app/features/* screen family.
 */
import {render, fireEvent, act} from '@testing-library/react-native';
import JourneyScreen from '../app/features/journey/index';
import {translations} from '../src/i18n/translations';

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn(), replace: jest.fn(), push: jest.fn()}),
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    press: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockColors = {
  background: '#000000',
  primary: '#6366f1',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
};
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
}));

let mockLanguage: 'es' | 'en' = 'es';
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: require('../src/i18n/translations').translations[mockLanguage],
  }),
}));

jest.mock('@hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));

// STABLE references (module-level, not re-created per render) — journey's
// `loadRecap` is a `useCallback` depending on `[achievementService, cards,
// favorites]`. A mock factory that returns a fresh object/array literal on
// every call (e.g. `() => ({cards: []})`) changes that dependency identity
// every render, which retriggers the `useEffect(() => loadRecap(), [loadRecap])`
// forever — an infinite reload loop that never settles into 'ready'.
const mockAchievementService = {
  getUserStats: jest.fn().mockResolvedValue({}),
  getReadingLog: jest.fn().mockResolvedValue([]),
  getBookReadingLog: jest.fn().mockResolvedValue([]),
};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => ({achievementService: mockAchievementService}),
}));

const mockCards: unknown[] = [];
jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => ({cards: mockCards}),
}));

const mockFavorites: unknown[] = [];
jest.mock('@context/FavoritesContext', () => ({
  useFavorites: () => ({favorites: mockFavorites}),
}));

jest.mock('@lib/memory/reviewEventStore', () => ({
  getAllReviewEvents: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/features/audio', () => ({
  getListeningStats: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/features/study/feelingsLogStore', () => ({
  // `FeelingsLog` is `{days: Record<string, string>}`, not an array (see
  // readingInsightsLocaleNumbers.test.tsx's docblock for why this matters);
  // harmless here since `recap.mood` is null in `mockRecap`, but kept
  // consistent with the real shape in case a future edit un-mocks
  // `buildJourneyRecap`.
  getFeelingsLog: jest.fn().mockResolvedValue({days: {}}),
}));

jest.mock('@components/insights/PeriodRecapModal', () => ({
  PeriodRecapModal: () => null,
}));

// Minimal recap: only `versesRead` is non-zero (5+ digits — Spanish CLDR data
// omits the grouping separator below that, which would mask the bug) and
// `hasData: true`. Every other conditional slide (chapters/books/streak/
// time/listening/mostRead/favorite/engagement/mood/memory/achievements)
// stays at 0/null so it's skipped, leaving exactly [intro, verses, finale].
const mockRecap = {
  versesRead: 123456,
  chaptersRead: 0,
  booksCompleted: 0,
  activeDays: 0,
  busiestDay: null,
  readingTimeSeconds: 0,
  currentStreak: 0,
  longestStreak: 0,
  favoritesCount: 0,
  notesCount: 0,
  highlightsCount: 0,
  bookmarksCount: 0,
  favoriteBook: null,
  mostReadBook: null,
  listeningTimeMs: 0,
  versesHeard: 0,
  listeningDays: 0,
  listeningCurrentStreak: 0,
  listeningLongestStreak: 0,
  cardsTotal: 0,
  versesMastered: 0,
  memoryReviews: 0,
  retentionPercent: null,
  memoryStreak: 0,
  mood: null,
  achievementsUnlocked: 0,
  totalAchievements: 0,
  level: 1,
  totalPoints: 0,
  journeyStartMs: Date.now(),
  daysSinceStart: 1,
  hasData: true,
};

jest.mock('@/features/journey/journeyRecap', () => ({
  buildJourneyRecap: jest.fn(() => mockRecap),
}));

describe('Journey screen locale-aware number formatting', () => {
  it('renders the verses-read slide grouped the Spanish way when language is es', async () => {
    mockLanguage = 'es';
    const j = translations.es.journey;
    const {getByLabelText, findByText} = render(<JourneyScreen />);

    await findByText(j.introTitle); // ready (past the loading spinner)
    act(() => {
      fireEvent.press(getByLabelText(j.next));
    });

    await findByText(j.versesReadTitle);
    expect(await findByText('123.456')).toBeTruthy();
  });

  it('renders the verses-read slide grouped the English way when language is en', async () => {
    mockLanguage = 'en';
    const j = translations.en.journey;
    const {getByLabelText, findByText} = render(<JourneyScreen />);

    await findByText(j.introTitle);
    act(() => {
      fireEvent.press(getByLabelText(j.next));
    });

    await findByText(j.versesReadTitle);
    expect(await findByText('123,456')).toBeTruthy();
  });
});
