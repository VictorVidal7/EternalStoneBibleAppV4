/**
 * T6.2 — Nuevos extras premium (reader typefaces) — ReaderPreferencesSheet.
 *
 * Scoped to the NEW premium-font gating behavior only (this sheet's other
 * controls — theme, size, line spacing, alignment, margins — are pre-existing
 * and unrelated to this tanda). Renders against the REAL
 * PremiumContext + ReaderPreferencesProvider, the same integration-style
 * pattern as OfferingSheet/ColorThemeSettings.
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

describe('ReaderPreferencesSheet — premium typefaces', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows all 6 free faces plus the 3 exclusive ones', async () => {
    const {findByText, getByText} = renderSheet();
    expect(await findByText('Sans')).toBeTruthy();
    expect(getByText('Sólida')).toBeTruthy();
    expect(getByText('Elegante')).toBeTruthy();
    expect(getByText('Suave')).toBeTruthy();
  });

  it('applies a free face directly on tap', async () => {
    const {findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('Serif'));
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('opens the offering sheet instead of applying a locked premium face', async () => {
    const {findByLabelText} = renderSheet();
    const card = await findByLabelText(/^Sólida/);
    fireEvent.press(card);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('applies a premium face directly once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSheet();
    await waitFor(async () => expect(await findByText('Sólida')).toBeTruthy());
    // Once unlocked the a11y label drops the offering suffix.
    fireEvent.press(await findByText('Sólida'));
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('falls back to the default face if a premium one was active and the entitlement is gone', async () => {
    // Real entitlement changes reach PremiumContext only through
    // offeringService's customerInfo listener, not by editing SecureStore
    // directly (an already-mounted PremiumProvider only reads its cache
    // once, at mount) — so this drives the same path a real refund would.
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    const {findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('Elegante'));
    await waitFor(async () =>
      expect(
        (await findByLabelText('Elegante')).props.accessibilityState,
      ).toEqual({selected: true}),
    );

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    await waitFor(async () =>
      expect((await findByLabelText('Sans')).props.accessibilityState).toEqual({
        selected: true,
      }),
    );
  });
});
