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
import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
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

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => ({
    book: 'John',
    chapter: '3',
    startVerse: '16',
    version: 'RVR1960',
  }),
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
  haptics: {tap: jest.fn(), success: jest.fn()},
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
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  describe('cross-references — expanded cap only with premium', () => {
    it('free reader: keeps the free 12-ref cap unchanged and invites to unlock more', async () => {
      const {findByText, queryByText} = renderScreen();
      await waitFor(() => expect(queryByText('Salmos 1:12')).toBeTruthy());
      // The 13th+ curated parallel is NOT shown — the free experience is
      // byte-for-byte what it was before this tanda.
      expect(queryByText('Salmos 1:13')).toBeNull();
      expect(await findByText('+8 más con una ofrenda')).toBeTruthy();
    });

    it('opens the offering sheet when tapping the "+N more" invitation', async () => {
      const {findByText} = renderScreen();
      fireEvent.press(await findByText('+8 más con una ofrenda'));
      expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    });

    it('premium reader: shows cross-refs beyond the free cap, with the Exclusivo badge', async () => {
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      const {findByText, queryByText, getAllByText} = renderScreen();
      expect(await findByText('Salmos 1:13')).toBeTruthy();
      expect(await findByText('Salmos 1:20')).toBeTruthy();
      expect(queryByText(/más con una ofrenda/)).toBeNull();
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
});
