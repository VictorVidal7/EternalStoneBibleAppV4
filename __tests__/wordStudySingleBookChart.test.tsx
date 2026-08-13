/**
 * Bug fix — real-device screenshot from Victor: the word-study "Distribución
 * por libro" chart degenerates to a single, meaningless bar when a word
 * appears in only one book (nothing to compare it against). Fix: when the
 * distribution covers exactly one book, skip the bar chart entirely and show
 * a compact stat line instead, tappable straight to the verse — mirroring
 * the multi-book case's mocking scaffold in wordStudyScreenBookFilter.test.tsx.
 */
import {render, fireEvent} from '@testing-library/react-native';
import WordStudyScreen from '../app/(tabs)/features/word-study';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: (...args: unknown[]) => mockRouterPush(...args)}),
  useLocalSearchParams: () => ({strongs: 'G2316', version: 'RVR1960'}),
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

// A word that occurs only in Apocalipsis (book_id 66) — the exact casuistry
// that degenerates the bar chart to one meaningless bar.
const testStudy = {
  lexicon: {
    strongs: 'G2316',
    lang: 'G',
    lemma: 'θεός',
    translit: 'theos',
    definition: 'god',
    definition_es: null,
    kjv_def: null,
  },
  count: 3,
  occurrences: [
    {book_id: 66, chapter: 1, verse: 1, word: 'θεοῦ'},
    {book_id: 66, chapter: 1, verse: 2, word: 'θεοῦ'},
    {book_id: 66, chapter: 1, verse: 8, word: 'θεός'},
  ],
  distribution: [{book_id: 66, count: 3}],
  first: {book_id: 66, chapter: 1, verse: 1, word: 'θεοῦ'},
  last: {book_id: 66, chapter: 1, verse: 8, word: 'θεός'},
};

jest.mock('../src/features/study/wordStudy', () => {
  const actual = jest.requireActual('../src/features/study/wordStudy');
  return {
    ...actual,
    getWordStudy: jest.fn().mockResolvedValue(testStudy),
  };
});

function renderScreen() {
  return render(
    <PremiumProvider>
      <WordStudyScreen />
    </PremiumProvider>,
  );
}

describe('WordStudyScreen — single-book distribution (bug fix)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockRouterPush.mockReset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows a stat line instead of a chart when the word appears in only one book', async () => {
    const {findByText, queryByText} = renderScreen();

    expect(await findByText('Distribución por libro')).toBeTruthy();
    expect(await findByText('Aparece únicamente en Apocalipsis')).toBeTruthy();
    // No per-book bar label should render — there's no chart to tap.
    expect(queryByText('Apo')).toBeNull();
  });

  it('tapping the stat line opens the reader at the first occurrence', async () => {
    const {findByText} = renderScreen();

    fireEvent.press(await findByText('Aparece únicamente en Apocalipsis'));

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining('/verse/Apocalipsis/1?verse=1'),
    );
  });
});
