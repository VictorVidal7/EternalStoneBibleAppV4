/**
 * T8.3 — Interlineal visual verdadero ("Originales++").
 *
 * Scoped to the NEW `InterlinearSheet` component: the original words rendered
 * in manuscript order with translit/gloss, the reference-translation line, the
 * tap-to-reveal lexicon + morphology detail panel, and the premium gating
 * (only reachable/kept open while `isPremium`). Renders against the REAL
 * PremiumProvider, same integration-style pattern as
 * OriginalLanguagesSheetPremiumMorphology.test.tsx. The DB-backed originals
 * facade is mocked with fixed fixtures instead of hitting SQLite.
 */

import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {InterlinearSheet} from '../src/components/reading/InterlinearSheet';
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
  useTheme: () => ({colors: mockColors, isDark: false}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));

// John 3:16's ἠγάπησεν ("he loved"): a real bundled grammar code (V-AAI-3S)
// and a real Strong's number (G25) whose lexicon carries a kjv_def — same
// fixture as OriginalLanguagesSheetPremiumMorphology.test.tsx.
const testWords = [
  {
    position: 3,
    lang: 'G',
    word: 'ἠγάπησεν',
    translit: 'ēgapēsen',
    gloss_en: 'to love',
    gloss_es: 'amó',
    strongs: 'G25',
    grammar: 'V-AAI-3S',
  },
];

const testLexicon = {
  strongs: 'G25',
  lang: 'G',
  lemma: 'ἀγαπάω',
  translit: 'agapaō',
  definition: 'to love (in a social or moral sense)',
  definition_es: 'amar (en sentido social o moral)',
  kjv_def: '(be-)love(-ed)',
};

const REFERENCE_TEXT =
  'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito';

jest.mock('../src/features/study/originals', () => {
  const actual = jest.requireActual('../src/features/study/originals');
  return {
    ...actual,
    getStrongsDetail: jest.fn().mockResolvedValue(testLexicon),
    getVerseText: jest.fn().mockResolvedValue(REFERENCE_TEXT),
  };
});

function renderSheet(onClose = jest.fn(), words = testWords) {
  return render(
    <PremiumProvider>
      <InterlinearSheet
        visible
        sourceBook="Juan"
        sourceChapter={3}
        sourceVerse={16}
        version="RVR1960"
        words={words}
        onClose={onClose}
      />
    </PremiumProvider>,
  );
}

describe('InterlinearSheet — Interlineal visual (T8.3)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('renders the original word in manuscript order with translit + gloss', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSheet();
    expect(await findByText('ἠγάπησεν')).toBeTruthy();
    expect(await findByText('ēgapēsen')).toBeTruthy();
    expect(await findByText('amó')).toBeTruthy();
  });

  it('shows the fluent translation as a separate reference line', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSheet();
    expect(await findByText(REFERENCE_TEXT)).toBeTruthy();
  });

  it('shows the lexicon + decoded morphology when a word is tapped', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSheet();
    fireEvent.press(await findByText('ἠγάπησεν'));
    expect(await findByText(/ἀγαπάω/)).toBeTruthy();
    expect(
      await findByText(
        'Verbo, Aoristo, Activa, Indicativo, 3ª persona, Singular',
      ),
    ).toBeTruthy();
    expect(await findByText(/\(be-\)love\(-ed\)/)).toBeTruthy();
  });

  it('shows the empty-detail placeholder before any word is tapped', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSheet();
    expect(
      await findByText('Toca una palabra arriba para ver su análisis.'),
    ).toBeTruthy();
  });

  it('closes itself immediately for a free user (defends the entitlement)', async () => {
    const onClose = jest.fn();
    renderSheet(onClose);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('closes itself if the entitlement is revoked while open', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    const onClose = jest.fn();
    const {findByText} = renderSheet(onClose);
    expect(await findByText('ἠγάπησεν')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
