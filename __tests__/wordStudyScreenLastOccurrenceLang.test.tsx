/**
 * Bug fix — live report from Victor: on the word-study screen for H3665
 * (כָּנַע, 35 apariciones · en 13 libros), the "Última aparición" field showed
 * the book name in English ("Isaiah") instead of Spanish ("Isaías"), even
 * though the rest of the screen (count line, distribution chart) looked
 * correctly localized.
 *
 * Root cause (see `src/features/study/christConnections.ts`'s
 * `bookLangForVersion`): the screen derived `bookLang` from
 * `christLangForVersion(version)`, which defaults to `'en'` for ANY
 * unrecognized/missing version id. That default is intentional for the
 * "Christ in this passage" card, but wrong here — it's not that the
 * last-occurrence field alone was unlocalized, `bookLang` itself silently
 * resolved to `'en'` for the WHOLE screen whenever the `version` param didn't
 * match a known `BIBLE_VERSIONS` entry (e.g. no version param at all). This
 * test reproduces exactly that: no `version` in `useLocalSearchParams`, a
 * Spanish UI language — and asserts book names across the screen (not just
 * "Última aparición") come out in Spanish, matching the app's Spanish-first
 * fallback used everywhere else (e.g. Home's `bookLang`).
 */
import {render} from '@testing-library/react-native';
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

// No `version` param — reproduces the reported bug (a stale/missing deep-link
// param, or any id `BIBLE_VERSIONS` doesn't recognize).
jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => ({strongs: 'H3665'}),
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

// Spanish UI — the fallback `bookLangForVersion` should land on when the
// version id can't be resolved.
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

// H3665-shaped fixture: 2 books, first in Génesis (book 1), last in Isaías
// (book 23) — a spelled-out book name is exactly where the English-fallback
// bug was visible ("Isaiah" vs "Isaías").
const testStudy = {
  lexicon: {
    strongs: 'H3665',
    lang: 'H',
    lemma: 'כָּנַע',
    translit: 'kana',
    definition: 'to be humbled, subdued',
    definition_es: null,
    kjv_def: null,
  },
  count: 35,
  occurrences: [
    {book_id: 1, chapter: 1, verse: 1, word: 'כָּנַע'},
    {book_id: 23, chapter: 25, verse: 5, word: 'כָּנַע'},
  ],
  distribution: [
    {book_id: 1, count: 1},
    {book_id: 23, count: 1},
  ],
  first: {book_id: 1, chapter: 1, verse: 1, word: 'כָּנַע'},
  last: {book_id: 23, chapter: 25, verse: 5, word: 'כָּנַע'},
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

describe('WordStudyScreen — book names stay Spanish with no/unknown version param (bug fix)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows the LAST occurrence\'s book name in Spanish ("Isaías"), not English ("Isaiah")', async () => {
    // Book/verse refs render twice (the extent card + the full occurrence
    // list below), so target the extent card's unique accessibilityLabel
    // rather than the plain text, which is ambiguous.
    const {findByLabelText, queryByLabelText, findAllByText, queryByText} =
      renderScreen();
    expect(await findByLabelText('Última aparición: Isaías 25:5')).toBeTruthy();
    expect(queryByLabelText('Última aparición: Isaiah 25:5')).toBeNull();
    expect((await findAllByText('Isaías 25:5')).length).toBeGreaterThan(0);
    expect(queryByText('Isaiah 25:5')).toBeNull();
  });

  it('shows the FIRST occurrence\'s book name in Spanish too ("Génesis")', async () => {
    const {findByLabelText, queryByLabelText, findAllByText, queryByText} =
      renderScreen();
    expect(
      await findByLabelText('Primera aparición: Génesis 1:1'),
    ).toBeTruthy();
    expect(queryByLabelText('Primera aparición: Genesis 1:1')).toBeNull();
    expect((await findAllByText('Génesis 1:1')).length).toBeGreaterThan(0);
    expect(queryByText('Genesis 1:1')).toBeNull();
  });
});
