/**
 * T6.4 — Nuevos extras premium ("Originales+": morfología + traducción KJV).
 *
 * Scoped to the NEW premium morphology/KJV-gloss gating in
 * OriginalLanguagesSheet — the sheet's pre-existing behavior (word list,
 * lemma/definition card, word-study link) is untouched by this tanda.
 * Renders against the REAL PremiumProvider, same integration-style pattern
 * as ColorThemeSettings/ReaderPreferencesSheet's premium tests. The DB-backed
 * originals facade is mocked with fixed fixtures (a real Strong's number and
 * a real bundled grammar code) instead of hitting SQLite.
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {OriginalLanguagesSheet} from '../src/components/reading/OriginalLanguagesSheet';
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

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

jest.mock('../src/lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(),
  importLocalOriginalsIfPresent: jest.fn().mockResolvedValue(false),
}));

// John 3:16's ἠγάπησεν ("he loved"): a real bundled grammar code (V-AAI-3S)
// and a real Strong's number (G25) whose lexicon carries a kjv_def.
const testWord = {
  position: 3,
  lang: 'G',
  word: 'ἠγάπησεν',
  translit: 'ēgapēsen',
  gloss_en: 'to love',
  gloss_es: 'amó',
  strongs: 'G25',
  grammar: 'V-AAI-3S',
};

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
    getVerseOriginal: jest.fn().mockResolvedValue([testWord]),
    getStrongsDetail: jest.fn().mockResolvedValue(testLexicon),
  };
});

function renderSheet(onClose = jest.fn()) {
  return render(
    <PremiumProvider>
      <OriginalLanguagesSheet
        visible
        sourceBook="Juan"
        sourceChapter={3}
        sourceVerse={16}
        version="RVR1960"
        onClose={onClose}
      />
    </PremiumProvider>,
  );
}

describe('OriginalLanguagesSheet — premium morphology (Originales+)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows a locked teaser (not the parsing) for a free user', async () => {
    const {findByText, queryByText} = renderSheet();
    fireEvent.press(await findByText('ἠγάπησεν'));
    expect(await findByText('Se desbloquea con una ofrenda')).toBeTruthy();
    expect(queryByText(/Verbo, Aoristo/)).toBeNull();
  });

  it('opens the offering sheet when tapping the locked morphology teaser', async () => {
    const {findByText} = renderSheet();
    fireEvent.press(await findByText('ἠγάπησεν'));
    fireEvent.press(await findByText('Se desbloquea con una ofrenda'));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('shows the decoded morphology and KJV gloss once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSheet();
    fireEvent.press(await findByText('ἠγάπησεν'));
    expect(
      await findByText(
        'Verbo, Aoristo, Activa, Indicativo, 3ª persona, Singular',
      ),
    ).toBeTruthy();
    expect(await findByText(/\(be-\)love\(-ed\)/)).toBeTruthy();
  });

  it('reverts to the locked teaser if the entitlement is revoked while open', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    const {findByText, queryByText} = renderSheet();
    fireEvent.press(await findByText('ἠγάπησεν'));
    expect(
      await findByText(
        'Verbo, Aoristo, Activa, Indicativo, 3ª persona, Singular',
      ),
    ).toBeTruthy();

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    await waitFor(async () =>
      expect(await findByText('Se desbloquea con una ofrenda')).toBeTruthy(),
    );
    expect(queryByText(/Verbo, Aoristo/)).toBeNull();
  });
});
