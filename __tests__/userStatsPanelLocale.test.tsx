/**
 * Regression guard — UserStatsPanel's two `.toLocaleString()` call sites (the
 * hero "verses read" stat, and the shared `StatRow` used for highlights/
 * notes/favorites/searches) must thread the app's CHOSEN language, not fall
 * back to the device's system locale. Mirrors nextMilestoneCard.test.tsx's
 * mocking pattern (useTheme/useLanguage as plain jest.mock factories).
 */
import {render} from '@testing-library/react-native';
import {UserStatsPanel} from '../src/components/achievements/UserStatsPanel';
import type {UserStats} from '../src/lib/achievements/types';

const mockColors = {
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  primary: '#6366f1',
  secondary: '#0ea5e9',
  card: '#ffffff',
  border: '#e2e8f0',
  background: '#f8fafc',
};

let mockLanguage: 'es' | 'en' = 'es';
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: false, colors: mockColors}),
}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: require('../src/i18n/translations').translations[mockLanguage],
  }),
}));
jest.mock('../src/hooks/useContentBottomInset', () => ({
  useContentBottomInset: () => 0,
}));

const makeStats = (): UserStats => ({
  totalVersesRead: 1234567,
  totalChaptersRead: 42,
  totalBooksCompleted: 3,
  totalReadingTime: 600,
  currentStreak: 5,
  longestStreak: 10,
  lastReadDate: '2026-01-01',
  // 5+ digits: Spanish grouping (CLDR `minimumGroupingDigits: 2`) omits the
  // separator for 4-digit numbers like 2,345/2.345 — both would render
  // "2345", masking the bug. A 5-digit value tells es ("12.345") and en
  // ("12,345") apart unambiguously.
  totalHighlights: 12345,
  totalNotes: 12,
  totalFavorites: 8,
  totalBookmarks: 4,
  totalSearches: 6,
  totalShares: 2,
  level: 3,
  totalPoints: 300,
  pointsToNextLevel: 100,
  achievementsUnlocked: 5,
  totalAchievements: 40,
});

describe('UserStatsPanel locale-aware number formatting', () => {
  it('groups the hero stat and a StatRow value the Spanish way when language is es', () => {
    mockLanguage = 'es';
    const {getByText} = render(<UserStatsPanel stats={makeStats()} />);
    // stats.totalVersesRead (1234567) — the hero stat at UserStatsPanel.tsx:150.
    expect(getByText('1.234.567')).toBeTruthy();
    // stats.totalHighlights (12345) rendered via the shared StatRow at :308.
    expect(getByText('12.345')).toBeTruthy();
  });

  it('groups the hero stat and a StatRow value the English way when language is en', () => {
    mockLanguage = 'en';
    const {getByText} = render(<UserStatsPanel stats={makeStats()} />);
    expect(getByText('1,234,567')).toBeTruthy();
    expect(getByText('12,345')).toBeTruthy();
  });
});
