/**
 * Tanda L — QA2 high-contrast header fix.
 *
 * 24 screens under `app/features/**` (and `app/(tabs)/features/study.tsx`)
 * built their own 2-stop header gradient straight from
 * `[colors.primary, colors.primaryDark]` (or `[accent, colors.primaryDark]`),
 * bypassing the theme's `gradient.headerColors`. Under high contrast,
 * `colors.primary` is amber (`#FFD60A`) and `colors.primaryDark` is white
 * (`#FFFFFF`) — a washed-out gradient with illegible white header text on
 * top. The fix: gate the header gradient on `highContrast` and use
 * `gradient.headerColors` (a flat dark surface) instead, with zero change to
 * the normal-mode gradient.
 *
 * This locks that wiring for one plain `colors.primary` case
 * (ScripturePrayerHubScreen) and one `accent`-driven case
 * (ThemeDetailScreen) so a refactor can't silently reintroduce the
 * unreadable amber-to-white header under high contrast.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {View} from 'react-native';
import ScripturePrayerHubScreen from '../app/features/prayer/scripture/index';
import ThemeDetailScreen from '../app/features/themes/[theme]';

const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
};

// The real HIGH_CONTRAST_GRADIENT is a flat black 3-stop — any distinct,
// clearly-not-primary/primaryDark value proves the swap actually happened
// rather than coincidentally matching.
const mockHeaderColors = ['#000000', '#000000', '#000000'] as const;

// Mutable per-test — set in each `it` before rendering (same pattern as
// memoryInsightsRestoreBanner.test.tsx's mockShowRestoreBanner).
let mockHighContrast = false;

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: mockColors,
    gradient: {
      colors: mockHeaderColors,
      headerColors: mockHeaderColors,
      accentGlow: '#FFD60A',
    },
    highContrast: mockHighContrast,
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn(), canGoBack: () => true}),
  useLocalSearchParams: () => ({theme: 'peace'}),
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
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));

// ThemeDetailScreen-only deps — never reached by ScripturePrayerHubScreen.
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {getVerse: jest.fn(async () => ({text: 'mock verse text'}))},
}));

jest.mock('@/features/audio', () => ({
  buildVersePlaylist: jest.fn(() => []),
  useAudioPlayer: () => ({loadChapter: jest.fn(), play: jest.fn()}),
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));

jest.mock('@lib/utils/logger', () => ({
  logger: {error: jest.fn(), info: jest.fn(), warn: jest.fn()},
}));

// The header LinearGradient (mocked to plain `View`) is the only element in
// either screen carrying a `colors` array prop — react-test-renderer's
// UNSAFE_getByProps does a strict `!==` match per key, which never matches
// the freshly-constructed `start`/`end` object literals, so find by the
// presence of `colors` instead of by value. `react-test-renderer` ships no
// type declarations in this repo, so `UNSAFE_getAllByType`'s element type is
// already `any` — routing through it (rather than a hand-typed predicate
// parameter) avoids `noImplicitAny` without adding an explicit `any`.
function findHeaderGradient(
  views: ReturnType<ReturnType<typeof render>['UNSAFE_getAllByType']>,
) {
  const matches = views.filter(v => Array.isArray(v.props.colors));
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one header gradient View, found ${matches.length}`,
    );
  }
  return matches[0];
}

describe('header gradient — high contrast override (Tanda L)', () => {
  beforeEach(() => {
    mockHighContrast = false;
  });

  describe('ScripturePrayerHubScreen (plain colors.primary case)', () => {
    it('normal mode: header stays [colors.primary, colors.primaryDark], unchanged', () => {
      mockHighContrast = false;
      const {UNSAFE_getAllByType} = render(<ScripturePrayerHubScreen />);
      const header = findHeaderGradient(UNSAFE_getAllByType(View));
      expect(header.props.colors).toEqual([
        mockColors.primary,
        mockColors.primaryDark,
      ]);
    });

    it('high contrast: header switches to gradient.headerColors', () => {
      mockHighContrast = true;
      const {UNSAFE_getAllByType} = render(<ScripturePrayerHubScreen />);
      const header = findHeaderGradient(UNSAFE_getAllByType(View));
      expect(header.props.colors).toEqual(mockHeaderColors);
      // Proves it did NOT fall back to the illegible amber/white pair.
      expect(header.props.colors).not.toEqual([
        mockColors.primary,
        mockColors.primaryDark,
      ]);
    });
  });

  describe('ThemeDetailScreen (accent-driven case)', () => {
    it('normal mode: header stays [accent, colors.primaryDark], unchanged', () => {
      mockHighContrast = false;
      const {UNSAFE_getAllByType} = render(<ThemeDetailScreen />);
      const header = findHeaderGradient(UNSAFE_getAllByType(View));
      // 'peace' theme's accent (src/features/study/themes.ts) — the header
      // keeps the topic's own identity colour in normal mode.
      expect(header.props.colors).toEqual(['#10B981', mockColors.primaryDark]);
    });

    it('high contrast: header switches to gradient.headerColors, dropping the accent', () => {
      mockHighContrast = true;
      const {UNSAFE_getAllByType} = render(<ThemeDetailScreen />);
      const header = findHeaderGradient(UNSAFE_getAllByType(View));
      expect(header.props.colors).toEqual(mockHeaderColors);
      expect(header.props.colors).not.toEqual([
        '#10B981',
        mockColors.primaryDark,
      ]);
    });
  });
});
