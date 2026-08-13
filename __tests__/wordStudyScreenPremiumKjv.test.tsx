/**
 * T6.4 — Nuevos extras premium ("Originales+": traducción KJV en el estudio
 * de palabra). Scoped to the NEW premium KJV-gloss gating on the word-study
 * screen — its pre-existing behavior (lemma card, distribution chart,
 * occurrence list) is untouched by this tanda.
 */

import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import WordStudyScreen from '../app/(tabs)/features/word-study';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  ENTITLEMENT_ID,
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

const activeEntitlementInfo = {
  entitlements: {
    active: {[ENTITLEMENT_ID]: {identifier: ENTITLEMENT_ID}},
    all: {},
  },
};
const noEntitlementInfo = {entitlements: {active: {}, all: {}}};

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => ({
    strongs: 'G25',
    version: 'RVR1960',
    gloss: 'amó',
  }),
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

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

const testLexicon = {
  strongs: 'G25',
  lang: 'G',
  lemma: 'ἀγαπάω',
  translit: 'agapaō',
  definition: 'to love (in a social or moral sense)',
  definition_es: 'amar (en sentido social o moral)',
  kjv_def: '(be-)love(-ed)',
};

jest.mock('../src/features/study/originals', () => {
  const actual = jest.requireActual('../src/features/study/originals');
  return {
    ...actual,
    isOriginalsInstalled: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('../src/features/study/wordStudy', () => {
  const actual = jest.requireActual('../src/features/study/wordStudy');
  return {
    ...actual,
    getWordStudy: jest.fn().mockResolvedValue({
      lexicon: testLexicon,
      count: 1,
      occurrences: [],
      distribution: [],
      first: null,
      last: null,
    }),
  };
});

function renderScreen() {
  return render(
    <PremiumProvider>
      <WordStudyScreen />
    </PremiumProvider>,
  );
}

describe('WordStudyScreen — premium KJV gloss (Originales+)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows a locked teaser (not the KJV gloss) for a free user', async () => {
    const {findByText, queryByText} = renderScreen();
    expect(await findByText('Se desbloquea con premium')).toBeTruthy();
    expect(queryByText(/be-\)love/)).toBeNull();
  });

  it('opens the offering sheet when tapping the locked KJV teaser', async () => {
    const {findByText} = renderScreen();
    fireEvent.press(await findByText('Se desbloquea con premium'));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('shows the KJV gloss once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderScreen();
    expect(await findByText('(be-)love(-ed)')).toBeTruthy();
  });

  it('reverts to the locked teaser if the entitlement is revoked while open', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    const {findByText} = renderScreen();
    expect(await findByText('(be-)love(-ed)')).toBeTruthy();

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    await waitFor(async () =>
      expect(await findByText('Se desbloquea con premium')).toBeTruthy(),
    );
  });
});
