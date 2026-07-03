/**
 * Offering infrastructure tanda (T4 — UI) — OfferingSheet.
 *
 * Integration-style: renders against the REAL PremiumContext + offeringService,
 * backed by the manual react-native-purchases mock, so this exercises the
 * actual load → purchase/restore → entitlement-sync chain, not a stubbed one.
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import Purchases from 'react-native-purchases';
import * as SecureStore from 'expo-secure-store';
import {OfferingSheet} from '../src/components/offering/OfferingSheet';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  ENTITLEMENT_ID,
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';

const mockColors = {
  background: '#ffffff',
  card: '#f8fafc',
  surface: '#f8fafc',
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

const mockToast = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => mockToast,
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));

const mockPurchases = Purchases as unknown as {
  purchasePackage: jest.Mock;
  restorePurchases: jest.Mock;
  __setCustomerInfo: (info: unknown) => void;
  __setOfferings: (offerings: unknown) => void;
  __reset: () => void;
};

const activeEntitlementInfo = {
  entitlements: {
    active: {[ENTITLEMENT_ID]: {identifier: ENTITLEMENT_ID}},
    all: {},
  },
};
const noEntitlementInfo = {entitlements: {active: {}, all: {}}};

const fakePackages = [
  {identifier: 'ofrenda_extras_1', product: {priceString: '$0.99'}},
  {identifier: 'ofrenda_extras_2', product: {priceString: '$2.99'}},
  {identifier: 'ofrenda_extras_3', product: {priceString: '$6.99'}},
];

function renderSheet(onClose = jest.fn()) {
  return render(
    <PremiumProvider>
      <OfferingSheet visible onClose={onClose} />
    </PremiumProvider>,
  );
}

describe('OfferingSheet', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('renders nothing when billing is unavailable (no API key / sideload)', async () => {
    const {toJSON} = renderSheet();
    // Waits for the FULL async load() chain to settle into 'unavailable'
    // (not just the loading state, which also renders no visible text).
    await waitFor(() => expect(toJSON()).toBeNull());
  });

  it('shows the three tiers, middle one marked suggested, once configured', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setOfferings({
      all: {default: {availablePackages: fakePackages}},
    });

    const {findByText, getByText} = renderSheet();

    expect(await findByText('Una ofrenda voluntaria')).toBeTruthy();
    expect(getByText('$0.99')).toBeTruthy();
    expect(getByText('$2.99')).toBeTruthy();
    expect(getByText('$6.99')).toBeTruthy();
    expect(getByText('Sugerido')).toBeTruthy();
  });

  it('shows the thank-you state after a successful purchase', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setOfferings({
      all: {default: {availablePackages: fakePackages}},
    });
    mockPurchases.purchasePackage.mockResolvedValueOnce({
      customerInfo: activeEntitlementInfo,
    });

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('$0.99'));

    expect(await findByText('Gracias por sembrar en esta obra')).toBeTruthy();
  });

  it('returns to the tier picker silently on a cancelled purchase', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setOfferings({
      all: {default: {availablePackages: fakePackages}},
    });
    mockPurchases.purchasePackage.mockRejectedValueOnce({
      userCancelled: true,
    });

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('$0.99'));

    expect(await findByText('$0.99')).toBeTruthy();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('shows an error toast and returns to the tier picker on a real failure', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setOfferings({
      all: {default: {availablePackages: fakePackages}},
    });
    mockPurchases.purchasePackage.mockRejectedValueOnce(
      new Error('network down'),
    );

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('$0.99'));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
    expect(await findByText('$0.99')).toBeTruthy();
  });

  it('restores a previous offering and shows the thank-you state', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setOfferings({
      all: {default: {availablePackages: fakePackages}},
    });
    mockPurchases.restorePurchases.mockResolvedValueOnce(activeEntitlementInfo);

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('Restaurar mi ofrenda anterior'));

    expect(await findByText('Gracias por sembrar en esta obra')).toBeTruthy();
    expect(mockToast.success).toHaveBeenCalled();
  });

  it('toasts "not found" and stays on the tier picker when restore finds nothing', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setOfferings({
      all: {default: {availablePackages: fakePackages}},
    });
    mockPurchases.restorePurchases.mockResolvedValueOnce(noEntitlementInfo);

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('Restaurar mi ofrenda anterior'));

    await waitFor(() => expect(mockToast.info).toHaveBeenCalled());
    expect(await findByText('$0.99')).toBeTruthy();
  });

  it('shows the already-unlocked state instead of tiers when isPremium is true', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setOfferings({
      all: {default: {availablePackages: fakePackages}},
    });

    const {findByText, queryByText} = renderSheet();

    expect(await findByText('Extras desbloqueados')).toBeTruthy();
    expect(queryByText('$0.99')).toBeNull();
  });
});
