/**
 * Bug fix — live report from Victor: on the word-study screen for κύριος
 * (G2962, 753 occurrences), tapping the "Hch" (Hechos) distribution bar
 * showed a "Filtrando por Hechos" chip but the occurrence list underneath
 * came back EMPTY, even though the bar itself correctly showed 112
 * occurrences. Root cause: `study.occurrences` is capped GLOBALLY in
 * canonical book order (see strongsOccurrencesByBookDb.test.ts's header for
 * the full writeup) — Mateo alone can fill that cap, starving Hechos out of
 * the array entirely — and the screen used to just client-side-filter that
 * already-truncated array.
 *
 * Scoped to the NEW behavior: tapping a bar now fetches that book's REAL
 * occurrences via `getWordStudyBookOccurrences` instead of narrowing
 * `study.occurrences`. The screen's other pre-existing behavior (lexicon
 * card, KJV premium gating, initial load states) is covered by
 * wordStudyScreenPremiumKjv.test.tsx and untouched here.
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {ActivityIndicator} from 'react-native';
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
  useLocalSearchParams: () => ({strongs: 'G2962', version: 'RVR1960'}),
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

// κύριος-shaped fixture: `occurrences` is the GLOBALLY canonical-order-capped
// list (what `getWordStudy` would actually return) — it holds only a Mateo
// (book 40) row. Hechos (book 44) has a real, nonzero count in `distribution`
// (the bars' uncapped source) but NONE of its rows made it into the capped
// `occurrences` array, reproducing the exact bug: bar says 112, old
// client-side filter of `occurrences` would show nothing.
//
// NOTE: this object is captured by `jest.mock(...)` below, whose factory runs
// while this file's hoisted `import`s are still resolving — BEFORE any later
// `const` in this file has been assigned. So every value it needs must be
// written inline here rather than referencing another module-level `const`
// declared further down (that would silently capture `undefined`).
const testStudy = {
  lexicon: {
    strongs: 'G2962',
    lang: 'G',
    lemma: 'κύριος',
    translit: 'kyrios',
    definition: 'lord, master',
    definition_es: null,
    kjv_def: null,
  },
  count: 753,
  occurrences: [{book_id: 40, chapter: 1, verse: 20, word: 'κύριος'}],
  distribution: [
    {book_id: 40, count: 83},
    {book_id: 44, count: 112},
  ],
  first: null,
  last: null,
};

const mockGetWordStudyBookOccurrences = jest.fn();

jest.mock('../src/features/study/wordStudy', () => {
  const actual = jest.requireActual('../src/features/study/wordStudy');
  return {
    ...actual,
    getWordStudy: jest.fn().mockResolvedValue(testStudy),
    getWordStudyBookOccurrences: (...args: unknown[]) =>
      mockGetWordStudyBookOccurrences(...args),
  };
});

// Hechos' real occurrences, used inside `it()` bodies only (test-execution
// time, well after every module-level `const` above has been assigned — the
// hoisting caveat above does not apply here).
const hechosOccurrence1 = {book_id: 44, chapter: 2, verse: 36, word: 'κύριον'};
const hechosOccurrence2 = {book_id: 44, chapter: 10, verse: 36, word: 'κύριος'};

// MiniBarChart's tappable bars are plain `TouchableOpacity`, whose built-in
// activeOpacity fade uses a native-driven `Animated.timing`. React Native's
// own Animated internals (AnimatedProps#connectAnimatedView) only fall back
// to a safe no-op view tag when `process.env.NODE_ENV === 'test'` — otherwise
// they throw "Unable to locate attached view in the native tree" the moment a
// bar is pressed, since react-test-renderer has no real host view to attach
// to. Jest's CLI only *sets* NODE_ENV=test when it's unset; it does not
// override an already-set value, so a shell that exports NODE_ENV=development
// (as this repo's dev shell does) silently defeats that safety net for any
// test that presses a native-driven-animated Touchable. Force it locally for
// this file only, restoring it afterward so no other test file is affected.
const originalNodeEnv = process.env.NODE_ENV;
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});
afterAll(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

function renderScreen() {
  return render(
    <PremiumProvider>
      <WordStudyScreen />
    </PremiumProvider>,
  );
}

describe('WordStudyScreen — book-filter bar fetches the REAL occurrences (bug fix)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockGetWordStudyBookOccurrences.mockReset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows the globally-capped list and its "more" note before any filter is applied (unchanged)', async () => {
    const {findByText} = renderScreen();
    expect(await findByText('Mateo 1:20')).toBeTruthy();
    // 753 total, only 1 row in the capped `study.occurrences` fixture.
    expect(await findByText('Mostrando las primeras 1')).toBeTruthy();
  });

  it("fetches and shows Hechos' REAL occurrences on tap — not an empty client-side filter of the capped list", async () => {
    mockGetWordStudyBookOccurrences.mockResolvedValue([
      hechosOccurrence1,
      hechosOccurrence2,
    ]);

    const {findByText, queryByText} = renderScreen();
    await findByText('Mateo 1:20'); // wait for the initial ready render

    fireEvent.press(await findByText('Hch'));

    expect(await findByText('Filtrando por Hechos')).toBeTruthy();
    expect(await findByText('Hechos 2:36')).toBeTruthy();
    expect(await findByText('Hechos 10:36')).toBeTruthy();
    // The stale Mateo row from the capped global list must be gone.
    expect(queryByText('Mateo 1:20')).toBeNull();
    expect(mockGetWordStudyBookOccurrences).toHaveBeenCalledWith('G2962', 44);
  });

  it('shows a loading state while the scoped fetch is in flight, then swaps in the real rows', async () => {
    let resolveFetch: (occs: (typeof hechosOccurrence1)[]) => void = () => {};
    mockGetWordStudyBookOccurrences.mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve;
      }),
    );

    const {findByText, queryByText, UNSAFE_getAllByType} = renderScreen();
    await findByText('Mateo 1:20');

    fireEvent.press(await findByText('Hch'));

    await waitFor(() => {
      expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
    });
    // Neither the stale global list nor the not-yet-fetched Hechos rows show
    // while the scoped fetch is pending — the loading state replaces the
    // list, it doesn't narrow it.
    expect(queryByText('Mateo 1:20')).toBeNull();
    expect(queryByText('Hechos 2:36')).toBeNull();

    resolveFetch([hechosOccurrence1]);
    expect(await findByText('Hechos 2:36')).toBeTruthy();
  });

  it('reverts cleanly to the original unfiltered view when the filter chip is cleared', async () => {
    mockGetWordStudyBookOccurrences.mockResolvedValue([hechosOccurrence1]);

    const {findByText, queryByText} = renderScreen();
    await findByText('Mateo 1:20');

    fireEvent.press(await findByText('Hch'));
    expect(await findByText('Hechos 2:36')).toBeTruthy();

    fireEvent.press(await findByText('Filtrando por Hechos'));

    expect(await findByText('Mateo 1:20')).toBeTruthy();
    expect(queryByText('Filtrando por Hechos')).toBeNull();
    expect(queryByText('Hechos 2:36')).toBeNull();
  });

  it('reverts cleanly when tapping the same bar again (toggle off)', async () => {
    mockGetWordStudyBookOccurrences.mockResolvedValue([hechosOccurrence1]);

    const {findByText, queryByText} = renderScreen();
    await findByText('Mateo 1:20');

    fireEvent.press(await findByText('Hch'));
    expect(await findByText('Hechos 2:36')).toBeTruthy();

    fireEvent.press(await findByText('Hch'));

    expect(await findByText('Mateo 1:20')).toBeTruthy();
    expect(queryByText('Hechos 2:36')).toBeNull();
  });

  it('shows no "more" note for a filtered book once the fetched count matches its true distribution total', async () => {
    // The fixture's Hechos distribution count is 112 — resolve exactly that
    // many rows so the fetched count is complete and no disclosure is due.
    const full = Array.from({length: 112}, (_, i) => ({
      book_id: 44,
      chapter: 1,
      verse: i + 1,
      word: 'κύριος',
    }));
    mockGetWordStudyBookOccurrences.mockResolvedValue(full);

    const {findByText, queryByText} = renderScreen();
    await findByText('Mateo 1:20');
    fireEvent.press(await findByText('Hch'));

    await findByText('Hechos 1:112');
    expect(queryByText(/Mostrando las primeras/)).toBeNull();
  });

  it('discloses truncation for the filtered case too, when the fetch returns fewer rows than the true per-book total (never silently incomplete)', async () => {
    // Distribution says Hechos has 112 total; the scoped fetch here only
    // resolves 1 — the generalized "more" note must still fire for the
    // filtered view, exactly as it already does for the unfiltered one.
    mockGetWordStudyBookOccurrences.mockResolvedValue([hechosOccurrence1]);

    const {findByText} = renderScreen();
    await findByText('Mateo 1:20');
    fireEvent.press(await findByText('Hch'));

    expect(await findByText('Mostrando las primeras 1')).toBeTruthy();
  });
});
