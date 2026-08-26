/**
 * Tanda 7 — word-study: per-book verse snippets (7a) + testament split in
 * the distribution chart (7b). Mirrors the mocking scaffold already used by
 * wordStudyScreenBookFilter.test.tsx / wordStudySingleBookChart.test.tsx.
 *
 * 7a: occurrence rows resolve a translated-verse snippet via
 * `getOccurrenceSnippet`, but only for a BOUNDED window of rows (not the
 * whole 200-500-row occurrence list) — this file's fixture uses 40
 * occurrences (> the 30-row window) to prove the fetch stays bounded on
 * initial render and grows on scroll.
 *
 * 7b: the distribution section shows an "AT n · NT n" summary line above the
 * chart, summed across the FULL distribution (not just the charted bars).
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {ScrollView} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import WordStudyScreen from '../app/(tabs)/features/word-study';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => ({strongs: 'G2532', version: 'RVR1960'}),
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));

const mockColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  secondary: '#7c3aed',
  accent: '#a855f7',
  border: '#cbd5e1',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, gradient: null}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: jest.fn()}),
}));

jest.mock('../src/features/study/originals', () => {
  const actual = jest.requireActual('../src/features/study/originals');
  return {
    ...actual,
    isOriginalsInstalled: jest.fn().mockResolvedValue(true),
  };
});

// 40 occurrences, all in Juan (book_id 43) — MORE than the 30-row snippet
// window, so a fetch call count of 30 (not 40) on initial render proves the
// window is genuinely bounded, not just "usually small enough not to show".
const OCCURRENCE_COUNT = 40;
const mockTestStudy = {
  lexicon: {
    strongs: 'G2532',
    lang: 'G',
    lemma: 'καί',
    translit: 'kai',
    definition: 'and',
    definition_es: null,
    kjv_def: null,
  },
  count: 288,
  occurrences: Array.from({length: OCCURRENCE_COUNT}, (_, i) => ({
    book_id: 43,
    chapter: 1,
    verse: i + 1,
    word: 'καί',
  })),
  // Old Testament (Isaías, book 23) + New Testament (Juan, book 43) — the
  // summary must read "AT 248 · NT 40", summed from THIS full distribution,
  // not just whatever buildBookBars ends up charting.
  distribution: [
    {book_id: 23, count: 248},
    {book_id: 43, count: 40},
  ],
  first: null,
  last: null,
};

const mockGetOccurrenceSnippet = jest.fn();
const mockGetWordStudy = jest.fn();

// `getWordStudy` is delegated (not `jest.fn().mockResolvedValue(mockTestStudy)`
// inline) because `mockTestStudy.occurrences` is built with `Array.from(...)`
// — a call expression, not a hoistable pure literal — so babel-plugin-jest-hoist
// can't safely hoist `mockTestStudy`'s declaration above this factory. Setting
// the resolved value from `beforeEach` instead (well after `mockTestStudy` is
// actually assigned) sidesteps that hoisting order entirely.
jest.mock('../src/features/study/wordStudy', () => {
  const actual = jest.requireActual('../src/features/study/wordStudy');
  return {
    ...actual,
    getWordStudy: (...args: unknown[]) => mockGetWordStudy(...args),
    getOccurrenceSnippet: (...args: unknown[]) =>
      mockGetOccurrenceSnippet(...args),
  };
});

function renderScreen() {
  return render(
    <PremiumProvider>
      <WordStudyScreen />
    </PremiumProvider>,
  );
}

describe('WordStudyScreen — verse snippets + testament split (Tanda 7)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockGetWordStudy.mockReset();
    mockGetWordStudy.mockResolvedValue(mockTestStudy);
    mockGetOccurrenceSnippet.mockReset();
    mockGetOccurrenceSnippet.mockImplementation(
      async (occ: {verse: number}) => `snippet v${occ.verse}`,
    );
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('fetches snippets only for the bounded window, not the whole 40-row occurrence list', async () => {
    const {findByText} = renderScreen();
    await findByText('Juan 1:1');

    await waitFor(() =>
      expect(mockGetOccurrenceSnippet).toHaveBeenCalledTimes(30),
    );
    // Give any errant extra fetch a chance to fire before asserting it never
    // eagerly covered the whole list.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockGetOccurrenceSnippet).toHaveBeenCalledTimes(30);
  });

  it('renders a resolved snippet under its occurrence row, once resolved', async () => {
    const {findByText} = renderScreen();
    expect(await findByText('snippet v1')).toBeTruthy();
  });

  it('extends the fetch window on scroll (onMomentumScrollEnd)', async () => {
    const {findByText, UNSAFE_getByType} = renderScreen();
    await findByText('Juan 1:1');
    await waitFor(() =>
      expect(mockGetOccurrenceSnippet).toHaveBeenCalledTimes(30),
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    fireEvent(scrollView, 'momentumScrollEnd', {nativeEvent: {}});

    await waitFor(() =>
      expect(mockGetOccurrenceSnippet).toHaveBeenCalledTimes(OCCURRENCE_COUNT),
    );
    expect(await findByText('snippet v40')).toBeTruthy();
  });

  it('shows the testament-split summary line above the distribution chart, summed from the FULL distribution', async () => {
    const {findByText} = renderScreen();
    expect(await findByText('AT 248 · NT 40')).toBeTruthy();
  });
});
