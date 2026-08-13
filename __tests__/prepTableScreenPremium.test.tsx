/**
 * T8.4.2 — "Mesa de preparación" premium additions: an expanded (but still
 * bounded) cross-reference cap for a premium reader, and the new "Palabras
 * clave en el idioma original" section. Scoped to what's NEW in this tanda —
 * the screen's pre-existing free behaviour (outline scaffold, base 12
 * cross-refs, guardrail…) is covered by prepTableScreen.test.tsx and is
 * unchanged here. Renders against the REAL PremiumProvider, same
 * integration-style pattern as the other Originales+ premium tests
 * (OriginalLanguagesSheetPremiumMorphology.test.tsx).
 */
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';
import {translations} from '../src/i18n/translations';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

// Mutable route params — reassigned by the BUG-2 regression test below (needs
// a render with NO version param). Read at CALL time by the closure, so
// reassigning before a render (not before the whole file loads) is enough,
// same pattern as prepTableScreenVersionCompare.test.tsx.
let mockRouteParams: Record<string, string> = {
  book: 'John',
  chapter: '3',
  startVerse: '16',
  version: 'RVR1960',
};
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockRouterPush, back: jest.fn()}),
    useLocalSearchParams: () => mockRouteParams,
    // Tanda 4 — the screen now uses this for a narrow notes-only refresh on
    // refocus; a dependency-aware stand-in (mirrors prepSeriesListScreen's
    // own mock) is enough for these tests, which don't exercise refocus.
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, [cb]),
    Stack: {Screen: () => null},
  };
});

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    show: jest.fn(),
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      card: '#111111',
      border: '#222222',
      primary: '#6366f1',
      primaryDark: '#4338ca',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

// A generous, deterministic curated list for John 3:16 — real curation is
// only 2-3 refs per verse, too few to reliably exercise the >12 premium cap
// as the curated data set grows/shrinks over time.
const mockManyCrossRefs = Array.from(
  {length: 20},
  (_, i) => `Psalms/1/${i + 1}`,
);
jest.mock('@/constants/cross-references', () => {
  const actual = jest.requireActual('@/constants/cross-references');
  return {
    ...actual,
    getCrossReferences: jest.fn(
      (_book: string, _chapter: number, verse: number) =>
        verse === 16 ? mockManyCrossRefs : [],
    ),
  };
});

// John 3:16's ἠγάπησεν ("he loved") — the same real bundled grammar code and
// Strong's number used by OriginalLanguagesSheetPremiumMorphology.test.tsx.
const testOriginalWord = {
  position: 1,
  lang: 'G',
  word: 'ἠγάπησεν',
  translit: 'ēgapēsen',
  gloss_en: 'to love',
  gloss_es: 'amó',
  strongs: 'G25',
  grammar: 'V-AAI-3S',
};

const mockOriginalsInstalled = jest.fn(async () => true);
const mockGetOriginalWords = jest.fn(
  async (_bookId: number, _chapter: number, verse: number) =>
    verse === 16 ? [testOriginalWord] : [],
);

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(async (_b: number, _c: number, v: number) => ({
      text: `Texto del versículo ${v}`,
    })),
    getChapterVerseCount: jest.fn(async () => 36),
    // Wrapped in closures (not referenced directly) — a direct property
    // value would be captured EAGERLY when this factory object is built,
    // which can happen before the `const mock*` below is assigned; a
    // closure defers the lookup until the mock is actually CALLED, by
    // which point the whole file has finished loading.
    originalsInstalled: (...args: unknown[]) =>
      (mockOriginalsInstalled as (...a: unknown[]) => unknown)(...args),
    getOriginalWords: (...args: unknown[]) =>
      (mockGetOriginalWords as (...a: unknown[]) => unknown)(...args),
  },
}));

jest.mock('@lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
}));

// T8.4.3 — the screen now always mounts a "Comparar versiones" section too
// (out of scope for THIS file, covered by prepTableScreenVersionCompare.test.tsx);
// stub it here so these T8.4.2 tests don't hit the real SQLite-backed service.
jest.mock('@lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    getAvailableVersions: jest.fn(async () => []),
    compareVerseRange: jest.fn(async () => []),
  },
}));

const p = translations.es.prepTable;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

describe('Mesa de preparación — T8.4.2 premium additions', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    mockOriginalsInstalled.mockClear();
    mockOriginalsInstalled.mockResolvedValue(true);
    mockGetOriginalWords.mockClear();
    mockRouterPush.mockClear();
    // Reset in case the BUG-2 regression test below overrode this with a
    // key-specific mockImplementation — every other test needs the plain
    // "nothing stored" default back.
    (AsyncStorage.getItem as jest.Mock).mockReset().mockResolvedValue(null);
    mockRouteParams = {
      book: 'John',
      chapter: '3',
      startVerse: '16',
      version: 'RVR1960',
    };
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  describe('cross-references — expanded cap only with premium', () => {
    it('free reader: keeps the free 12-ref cap unchanged and invites to unlock more', async () => {
      const {findByText, queryByText} = renderScreen();
      await waitFor(() => expect(queryByText('Salmos 1:12')).toBeTruthy());
      // The 13th+ curated parallel is NOT shown — the free experience is
      // byte-for-byte what it was before this tanda.
      expect(queryByText('Salmos 1:13')).toBeNull();
      expect(await findByText('+8 más con premium')).toBeTruthy();
    });

    it('opens the offering sheet when tapping the "+N more" invitation', async () => {
      const {findByText} = renderScreen();
      fireEvent.press(await findByText('+8 más con premium'));
      expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    });

    it('premium reader: shows cross-refs beyond the free cap, with the Exclusivo badge', async () => {
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      const {findByText, queryByText, getAllByText} = renderScreen();
      expect(await findByText('Salmos 1:13')).toBeTruthy();
      expect(await findByText('Salmos 1:20')).toBeTruthy();
      expect(queryByText(/más con premium/)).toBeNull();
      // Three "Exclusivo" pills: the cross-refs extension, the entirely-
      // premium original-words section header (see below), and the T8.4.3
      // "Comparar versiones" section header (always shown, like original
      // words — see prepTableScreenVersionCompare.test.tsx).
      expect(getAllByText('Exclusivo')).toHaveLength(3);
    });
  });

  describe('"Palabras clave en el idioma original" — locked/unlocked + pack state', () => {
    it('free reader: shows a locked teaser, never reaches the pack-installed check', async () => {
      const {findByText, queryByText} = renderScreen();
      expect(
        await findByText('Palabras clave en el idioma original'),
      ).toBeTruthy();
      expect(queryByText('ἠγάπησεν')).toBeNull();
      await waitFor(() =>
        expect(mockOriginalsInstalled).not.toHaveBeenCalled(),
      );
    });

    it('opens the offering sheet when tapping the locked teaser', async () => {
      const {findByText} = renderScreen();
      fireEvent.press(await findByText(p.originalWordsLockedBody));
      expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    });

    it('premium reader with the pack NOT installed: invites to download it', async () => {
      mockOriginalsInstalled.mockResolvedValue(false);
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      const {findByText} = renderScreen();
      expect(await findByText(p.originalWordsNotInstalledBody)).toBeTruthy();
      expect(await findByText(translations.es.originals.download)).toBeTruthy();
    });

    it('premium reader with the pack installed: shows the deduped, decoded word list', async () => {
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      const {findByText} = renderScreen();
      expect(await findByText('ἠγάπησεν')).toBeTruthy();
      expect(await findByText('G25')).toBeTruthy();
      expect(
        await findByText(
          'Verbo, Aoristo, Activa, Indicativo, 3ª persona, Singular',
        ),
      ).toBeTruthy();
      expect(await findByText(p.originalWordsCountOne)).toBeTruthy();
    });
  });

  describe('Modo púlpito card', () => {
    it('free reader: shows the pulpit card locked with an offering invitation', async () => {
      const {findByText} = renderScreen();
      expect(await findByText(p.pulpitLockedBody)).toBeTruthy();
    });

    it('premium reader with no notes: shows the empty prompt AND the enter button', async () => {
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      const {findByText} = renderScreen();
      expect(await findByText(p.pulpitEmptyBody)).toBeTruthy();
      // Pulpit is reachable even without notes (to present the passage in large
      // type) — the enter button is always shown for a premium reader.
      expect(await findByText(p.pulpitEnterButton)).toBeTruthy();
    });

    // Regression (BUG-2, QA revision): the Mesa used to forward `version`
    // to the pulpit screen only when IT was opened with an explicit version
    // param. When it wasn't, the pulpit fell back to a DIFFERENT source
    // (selectedVersion, UI-language-based) than the Mesa's own fallback
    // (AsyncStorage, then 'RVR1960'), so the two screens could disagree.
    // The Mesa must now always forward the exact version IT resolved.
    //
    // AsyncStorage is stubbed to return a version ('KJV') distinct from
    // both the route param (absent here) and the mocked selectedVersion
    // ('RVR1960', see @hooks/useBibleVersion above) — asserting on 'KJV'
    // proves the pushed param came from the Mesa's OWN resolveVersion()
    // fallback, not a coincidental match with the pulpit's independent one.
    it("premium reader with no version param: forwards the Mesa's own resolved version to the pulpit screen", async () => {
      mockRouteParams = {book: 'John', chapter: '3', startVerse: '16'};
      (AsyncStorage.getItem as jest.Mock).mockImplementation(
        async (key: string) => (key === '@bible_version' ? 'KJV' : null),
      );
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      const {findByText} = renderScreen();
      fireEvent.press(await findByText(p.pulpitEnterButton));
      await waitFor(() => expect(mockRouterPush).toHaveBeenCalledTimes(1));
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/features/prep/pulpit',
          params: expect.objectContaining({version: 'KJV'}),
        }),
      );
    });
  });
});
