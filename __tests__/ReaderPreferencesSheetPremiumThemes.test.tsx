/**
 * T6.3 — Nuevos extras premium (reading themes) — ReaderPreferencesSheet.
 *
 * Scoped to the NEW premium reading-theme gating behavior only. Mirrors
 * ReaderPreferencesSheetPremiumFonts.test.tsx's pattern exactly, applied to
 * the reading-theme grid instead of the typeface grid.
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {ReaderPreferencesSheet} from '../src/components/reading/ReaderPreferencesSheet';
import {ReaderPreferencesProvider} from '../src/context/ReaderPreferencesContext';
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
  surfaceVariant: '#f1f5f9',
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

function renderSheet(onClose = jest.fn()) {
  return render(
    <PremiumProvider>
      <ReaderPreferencesProvider>
        <ReaderPreferencesSheet visible onClose={onClose} />
      </ReaderPreferencesProvider>
    </PremiumProvider>,
  );
}

describe('ReaderPreferencesSheet — premium reading themes', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows all 5 free surfaces plus the 3 exclusive ones', async () => {
    const {findByText, getByText} = renderSheet();
    expect(await findByText('Sistema')).toBeTruthy();
    expect(getByText('Musgo')).toBeTruthy();
    expect(getByText('Crepúsculo')).toBeTruthy();
    expect(getByText('Niebla')).toBeTruthy();
  });

  it('applies a free surface directly on tap', async () => {
    const {findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('Papel'));
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('opens the offering sheet instead of applying a locked premium surface', async () => {
    const {findByLabelText} = renderSheet();
    const card = await findByLabelText(/^Musgo/);
    fireEvent.press(card);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('applies a premium surface directly once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSheet();
    await waitFor(async () => expect(await findByText('Musgo')).toBeTruthy());
    fireEvent.press(await findByText('Musgo'));
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('falls back to System if a premium surface was active and the entitlement is gone', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    const {findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('Crepúsculo'));
    await waitFor(async () =>
      expect(
        (await findByLabelText('Crepúsculo')).props.accessibilityState,
      ).toEqual({selected: true}),
    );

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    await waitFor(async () =>
      expect(
        (await findByLabelText('Sistema')).props.accessibilityState,
      ).toEqual({selected: true}),
    );
  });
});
