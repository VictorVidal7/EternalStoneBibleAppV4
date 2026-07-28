/**
 * T8.3 — Interlineal visual verdadero ("Originales++").
 *
 * Scoped to the NEW "Interlineal visual" entry row in OriginalLanguagesSheet:
 * always-visible title + "Exclusivo" pill regardless of entitlement, tapping
 * it opens the offering sheet for a free user and the InterlinearSheet for a
 * premium one. The sheet's pre-existing behavior (word list, lexicon card,
 * morphology gating, word-study link) is untouched by this tanda and is
 * already covered by OriginalLanguagesSheetPremiumMorphology.test.tsx.
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {OriginalLanguagesSheet} from '../src/components/reading/OriginalLanguagesSheet';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

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

jest.mock('../src/features/study/originals', () => {
  const actual = jest.requireActual('../src/features/study/originals');
  return {
    ...actual,
    isOriginalsInstalled: jest.fn().mockResolvedValue(true),
    getVerseOriginal: jest.fn().mockResolvedValue([testWord]),
    getStrongsDetail: jest.fn().mockResolvedValue(null),
    getVerseText: jest.fn().mockResolvedValue('Porque de tal manera...'),
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

describe('OriginalLanguagesSheet — Interlineal visual entry (T8.3)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows the entry row with the always-visible Exclusivo pill for a free user', async () => {
    const {findByText, findAllByText} = renderSheet();
    expect(await findByText('Interlineal visual')).toBeTruthy();
    // "Exclusivo" also labels the morphology section further down, so there
    // may be more than one — assert at least one is present.
    expect((await findAllByText('Exclusivo')).length).toBeGreaterThan(0);
  });

  it('opens the offering sheet (not the interlinear view) when a free user taps the entry', async () => {
    const {findByLabelText, queryByText} = renderSheet();
    fireEvent.press(
      await findByLabelText(
        'Interlineal visual — Extra — se desbloquea con premium',
      ),
    );
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    // The exclusive sheet's own title never mounts visibly for a free tap.
    expect(queryByText('Traducción de referencia')).toBeNull();
  });

  it('opens the interlinear view for a premium user without touching the offering sheet', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText, findByText} = renderSheet();
    fireEvent.press(await findByLabelText('Ver interlineal'));
    expect(await findByText('Traducción de referencia')).toBeTruthy();
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('still shows the free word list untouched alongside the new entry row', async () => {
    const {findByText} = renderSheet();
    expect(await findByText('ἠγάπησεν')).toBeTruthy();
    expect(await findByText('amó')).toBeTruthy();
  });
});
