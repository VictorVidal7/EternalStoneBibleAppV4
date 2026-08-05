/**
 * Regression guard — the "Mi lectura" reading-insights screen's two
 * `.toLocaleString()` call sites (the most-read-book verse count, and the
 * `WeekDeltaRow` "this week vs last week" verses format) must thread the
 * app's CHOSEN language, not fall back to the device's system locale.
 * Before the fix both called `.toLocaleString()` with no locale argument,
 * and `mostReadMeta`'s `useMemo` was also missing `language` from its deps
 * (would have gone stale after a language switch even once fixed).
 *
 * Heavy data-layer calls (`buildReadingInsights`, `compareWeeks`,
 * `buildWeeklyRecap`, listening/mood helpers) are mocked to fixed values so
 * the screen reaches its "ready" state deterministically without touching
 * real storage or a native DB — same strategy as journeyLocaleNumbers.test.tsx.
 * Context mocks that feed the `load` `useCallback`'s dependency array
 * (`achievementService`, `progress`) use STABLE module-level references —
 * a fresh object/array literal per render would retrigger the load effect
 * forever (the exact trap that first hand-tripped the journey-screen test).
 *
 * A second, unrelated regression guard lives at the bottom of this file (its
 * own `describe` block): the screen's root ScrollView was missing
 * `style={{flex: 1}}`, unlike sibling dashboard screens (memory/insights.tsx,
 * memory/index.tsx, conflicts/insights.tsx). It reuses this file's render
 * setup rather than duplicating the mock scaffolding in a new file.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {ScrollView, StyleSheet} from 'react-native';
import ReadingInsightsScreen from '../app/features/reading-insights/index';
import {translations} from '../src/i18n/translations';

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn(), push: jest.fn()}),
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
  haptics: {tap: jest.fn(), press: jest.fn()},
}));

const mockColors = {
  background: '#000000',
  border: '#222222',
  card: '#111111',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  success: '#22c55e',
  surfaceVariant: '#1e293b',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  warning: '#f59e0b',
};
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, gradient: {}, highContrast: false}),
}));

let mockLanguage: 'es' | 'en' = 'es';
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: require('../src/i18n/translations').translations[mockLanguage],
  }),
}));

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

// STABLE references — `load` is a `useCallback` depending on
// `[achievementService, progress]`. A factory returning a fresh object each
// render would retrigger the load effect forever (see journeyLocaleNumbers
// test's docblock for the full story of this trap).
const mockAchievementService = {
  getUserStats: jest.fn().mockResolvedValue({
    totalVersesRead: 0,
    totalChaptersRead: 0,
    totalBooksCompleted: 0,
    totalReadingTime: 0,
  }),
  getReadingLog: jest.fn().mockResolvedValue([]),
  getBookReadingLog: jest.fn().mockResolvedValue([]),
};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => ({achievementService: mockAchievementService}),
}));

const mockProgress = {};
jest.mock('@context/ReadingProgressContext', () => ({
  useReadingProgress: () => ({progress: mockProgress}),
}));

jest.mock('@/features/audio', () => ({
  getListeningStats: jest.fn().mockResolvedValue([]),
  summarizeListening: jest.fn(() => ({
    totalMs: 0,
    thisWeekMs: 0,
    todayMs: 0,
  })),
  listeningStreaks: jest.fn(() => ({currentStreak: 0, longestStreak: 0})),
}));

jest.mock('@/features/study/feelingsLogStore', () => ({
  // `FeelingsLog` is `{days: Record<string, string>}`, not an array —
  // `weekMood`/`monthMood`/`moodTrend` index straight into `.days` and throw
  // on anything else (caught by the screen's `load()`, which then falls to
  // its 'error' status — the wrong empty shape masked this test entirely).
  getFeelingsLog: jest.fn().mockResolvedValue({days: {}}),
}));

// The most-read book (5+ digit verse count — Spanish CLDR data omits the
// grouping separator below that, which would mask the bug) with
// `source: 'log'` so the screen renders `mostReadMeta`'s "{verses} · {time}"
// line (index.tsx:255).
const mockInsights = {
  hasData: true,
  heatmap: [],
  heatmapWeeks: 0,
  windowVerses: 0,
  activeDays: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalVersesRead: 0,
  totalChaptersRead: 0,
  totalBooksCompleted: 0,
  bestDayVerses: 0,
  thisWeekVerses: 0,
  lastWeekVerses: 0,
  mostReadBook: {
    book: 'Genesis',
    chapters: 5,
    versesRead: 123456,
    timeSpent: 0,
    source: 'log' as const,
  },
  totalReadingSeconds: 0,
  thisWeekReadingSeconds: 0,
  bestDayReadingSeconds: 0,
};
jest.mock('@/features/reading-insights/readingInsights', () => ({
  buildReadingInsights: jest.fn(() => mockInsights),
}));

jest.mock('@/features/reading-insights/weeklyRecap', () => ({
  buildWeeklyRecap: jest.fn(() => null),
  RECAP_WINDOW_DAYS: 7,
}));

// The week-vs-week verses delta (index.tsx's WeekDeltaRow, `format={num}` at
// index.tsx:411) — 5+ digits for the same grouping-visibility reason above.
const mockWeekCompare = {
  hasAnyActivity: true,
  currentHasActivity: true,
  previousHasActivity: true,
  hasListening: false,
  versesRead: {current: 54321, previous: 12345, delta: 41976, trend: 'up'},
  readingSeconds: {current: 0, previous: 0, delta: 0, trend: 'same'},
  listeningMs: {current: 0, previous: 0, delta: 0, trend: 'same'},
  versesHeard: {current: 0, previous: 0, delta: 0, trend: 'same'},
  daysActive: {current: 0, previous: 0, delta: 0, trend: 'same'},
};
jest.mock('@/features/reading-insights/weekComparison', () => ({
  compareWeeks: jest.fn(() => mockWeekCompare),
}));

// `monthMood`/`moodTrend` (real, unmocked pure functions fed an empty
// `{days: {}}` log) always return a defined summary object — `monthSummary`
// is never null, so `{monthSummary && <MoodImageModal .../>}` always mounts
// it. MoodImageModal assumes a populated month/trend and isn't the surface
// under test here, so it's stubbed out (mirrors PeriodRecapModal in the
// journey screen's test).
jest.mock('@components/insights/MoodImageModal', () => ({
  MoodImageModal: () => null,
}));

describe('Reading-insights screen locale-aware number formatting', () => {
  it('groups the most-read-book verses and week-delta verses the Spanish way when language is es', async () => {
    mockLanguage = 'es';
    const ri = translations.es.readingInsights;
    const {findByText} = render(<ReadingInsightsScreen />);

    // mostReadMeta: `${num(mr.versesRead)} ${ri.versesUnit}` (index.tsx:255).
    expect(await findByText(`123.456 ${ri.versesUnit}`)).toBeTruthy();
    // WeekDeltaRow renders `format(delta.previous)` and `format(delta.current)`.
    expect(await findByText('12.345')).toBeTruthy();
    expect(await findByText('54.321')).toBeTruthy();
  });

  it('groups the most-read-book verses and week-delta verses the English way when language is en', async () => {
    mockLanguage = 'en';
    const ri = translations.en.readingInsights;
    const {findByText} = render(<ReadingInsightsScreen />);

    expect(await findByText(`123,456 ${ri.versesUnit}`)).toBeTruthy();
    expect(await findByText('12,345')).toBeTruthy();
    expect(await findByText('54,321')).toBeTruthy();
  });
});

// Regression guard for a real deviation from sibling dashboard screens
// (memory/insights.tsx, memory/index.tsx, conflicts/insights.tsx): this
// screen's ScrollView was missing `style={{flex: 1}}` alongside its
// `contentContainerStyle`, unlike every sibling. Same
// `UNSAFE_getByType(ScrollView)` + `StyleSheet.flatten` idiom as
// dictionaryMultiviewScreen.test.tsx's contentContainerStyle assertion.
describe('Reading-insights screen layout', () => {
  it('gives the ScrollView its own flex: 1, matching sibling dashboard screens', async () => {
    mockLanguage = 'es';
    const ri = translations.es.readingInsights;
    const {findByText, UNSAFE_getByType} = render(<ReadingInsightsScreen />);
    await findByText(`123.456 ${ri.versesUnit}`);

    const scrollView = UNSAFE_getByType(ScrollView);
    const flat = StyleSheet.flatten(scrollView.props.style) as {
      flex?: number;
    };
    expect(flat.flex).toBe(1);
  });
});
