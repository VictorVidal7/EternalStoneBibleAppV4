/**
 * Tanda H — "Momento con Dios" guided devotion → lectio navigation fix.
 *
 * The flow is Home → guided.tsx (feeling picker) → user picks a feeling →
 * beginMoment() → lectio.tsx (lectio-divina steps, ending in a finale whose
 * X / "Listo" / hardware-back all call plain router.back()).
 *
 * beginMoment() used router.push to enter lectio, which left guided.tsx on
 * the nav stack. A router.back() from lectio's finale then landed back on
 * the feeling picker instead of Home — confusing, since the user just
 * "finished." Fix: router.replace, so guided.tsx drops off the stack the
 * moment a feeling is committed; a single router.back() from the finale then
 * naturally reaches Home. Zero changes to lectio.tsx's exit handlers, and
 * zero risk to lectio's other two entry points (Home's daily-verse card and
 * the reader's verse-selection overflow menu), which never go through
 * guided.tsx.
 *
 * This test locks the CALL itself: replace (not push), with the same
 * pathname/params shape beginMoment always sent. It computes the expected
 * book/chapter/verse the same way the component does (via the real,
 * deterministic feelingVerseRefForDay → parseThemeRef → getBookByName
 * chain) so it isn't pinned to "today"'s particular verse.
 */
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {View} from 'react-native';
import GuidedDevotionScreen from '../app/features/guided';
import {
  getAllFeelings,
  feelingVerseRefForDay,
} from '../src/features/study/feelings';
import {feelingsDateKey} from '../src/features/study/feelingsLog';
import {parseThemeRef} from '../src/features/study/themes';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

// RN's own TouchableOpacity drives its press/disabled feedback through an
// internal Animated.Value; under react-test-renderer that throws "Unable to
// locate attached view in the native tree" once a press synchronously flips
// the same element's `disabled` prop (the feeling chip does this: pressing
// it moves phase 'choose' -> 'resolving', which disables all chips
// mid-gesture). Swapping it for Pressable (no internal Animated opacity)
// keeps press/style/accessibility behavior but sidesteps that
// test-renderer-only failure mode entirely (same workaround as
// prepSeriesListScreen.test.tsx).
jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => {
    const ReactActual = require('react');
    const {Pressable} = jest.requireActual('react-native');
    const MockTouchableOpacity = ReactActual.forwardRef(
      ({children, ...props}: Record<string, unknown>, ref: unknown) =>
        ReactActual.createElement(Pressable, {...props, ref}, children),
    );
    return {__esModule: true, default: MockTouchableOpacity};
  },
);

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockPush, replace: mockReplace, back: jest.fn()}),
  // Runs the focus callback synchronously, like on a real screen mount —
  // needed for useBackHandlerStep's useFocusEffect subscription.
  useFocusEffect: (cb: () => void) => cb(),
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

const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
};

// The real HIGH_CONTRAST_GRADIENT is a flat black 3-stop — any distinct,
// clearly-not-primary/primaryDark value proves the swap actually happened
// (same fixture as hcHeaderGradients.test.tsx's Tanda L coverage).
const mockHeaderColors = ['#000000', '#000000', '#000000'] as const;
// Mutable per-test — set in each `it` before rendering.
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

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(async () => ({text: 'Mock verse text for the test.'})),
  },
}));

jest.mock('@lib/utils/logger', () => ({
  logger: {error: jest.fn(), info: jest.fn(), warn: jest.fn()},
}));

describe('GuidedDevotionScreen.beginMoment — navigation (Tanda H)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockHighContrast = false;
  });

  it('enters lectio with router.replace (not push), dropping guided.tsx off the stack', async () => {
    const feeling = getAllFeelings()[0];
    const feelingName =
      translations.es.feelings.list[
        feeling.id as keyof typeof translations.es.feelings.list
      ].name;

    // Compute the expected pathname/params the same way the component does,
    // so the assertion isn't pinned to whichever verse today's date hashes to.
    const todayKey = feelingsDateKey(Date.now());
    const ref = feelingVerseRefForDay(feeling, todayKey);
    expect(ref).not.toBeNull();
    const parsed = parseThemeRef(ref!);
    expect(parsed).not.toBeNull();
    const book = getBookByName(parsed!.book);
    expect(book).toBeDefined();

    const {getByLabelText, findByLabelText} = render(<GuidedDevotionScreen />);

    fireEvent.press(getByLabelText(feelingName));

    const beginButton = await findByLabelText(translations.es.guided.begin);
    fireEvent.press(beginButton);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/features/lectio',
      params: {
        book: book!.nameEn,
        chapter: String(parsed!.chapter),
        verse: String(parsed!.verse),
      },
    });
    // The whole point of the fix: push must never fire for this transition.
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// Finds the header LinearGradient (mocked to plain `View`) by the presence
// of its `colors` array prop — same technique as hcHeaderGradients.test.tsx.
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

describe('GuidedDevotionScreen header gradient — high contrast override (Tanda H)', () => {
  beforeEach(() => {
    mockHighContrast = false;
  });

  it('normal mode: header stays [colors.primaryDark, colors.primary], unchanged', () => {
    mockHighContrast = false;
    const {UNSAFE_getAllByType} = render(<GuidedDevotionScreen />);
    const header = findHeaderGradient(UNSAFE_getAllByType(View));
    expect(header.props.colors).toEqual([
      mockColors.primaryDark,
      mockColors.primary,
    ]);
  });

  it('high contrast: header switches to gradient.headerColors', () => {
    mockHighContrast = true;
    const {UNSAFE_getAllByType} = render(<GuidedDevotionScreen />);
    const header = findHeaderGradient(UNSAFE_getAllByType(View));
    expect(header.props.colors).toEqual(mockHeaderColors);
    // Proves it did NOT fall back to the washed-out amber/white pair.
    expect(header.props.colors).not.toEqual([
      mockColors.primaryDark,
      mockColors.primary,
    ]);
  });
});
