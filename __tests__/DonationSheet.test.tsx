/**
 * Offering infrastructure tanda (T5 — Donación) — DonationSheet.
 *
 * Integration-style: renders against the REAL offeringService, backed by
 * the manual react-native-purchases mock, so this exercises the actual
 * load -> purchase -> outcome chain, not a stubbed one. Unlike
 * OfferingSheet, there is no entitlement here — giving never unlocks
 * anything and is repeatable, so there's no "already given" state to test.
 */

import {render, waitFor, fireEvent} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import Purchases from 'react-native-purchases';
import {DonationSheet} from '../src/components/donation/DonationSheet';
import {
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';

// `onPrimary` deliberately differs from staticColors.white (#FFFFFF) so a
// component that still reads the hardcoded white instead of colors.onPrimary
// (Tanda K regression) fails the assertion below instead of passing by
// coincidence.
const mockColors = {
  background: '#ffffff',
  card: '#f8fafc',
  surface: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  onPrimary: '#000000',
  border: '#cbd5e1',
};

const colorOf = (node: {props: {style?: unknown}}): string | undefined =>
  (StyleSheet.flatten(node.props.style) as {color?: string})?.color;

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
  purchaseStoreProduct: jest.Mock;
  __setProducts: (products: unknown) => void;
  __reset: () => void;
};

const fakeProducts = [
  {identifier: 'donacion_1', priceString: '$1.99'},
  {identifier: 'donacion_2', priceString: '$4.99'},
  {identifier: 'donacion_3', priceString: '$9.99'},
  {identifier: 'donacion_4', priceString: '$19.99'},
];

function renderSheet(onClose = jest.fn()) {
  return render(<DonationSheet visible onClose={onClose} />);
}

describe('DonationSheet', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
  });

  it('renders nothing when billing is unavailable (no API key / sideload)', async () => {
    const {toJSON} = renderSheet();
    await waitFor(() => expect(toJSON()).toBeNull());
  });

  it('shows all four repeatable amounts once configured', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setProducts(fakeProducts);

    const {findByText, getByText} = renderSheet();

    expect(await findByText('Donación')).toBeTruthy();
    expect(getByText('$1.99')).toBeTruthy();
    expect(getByText('$4.99')).toBeTruthy();
    expect(getByText('$9.99')).toBeTruthy();
    expect(getByText('$19.99')).toBeTruthy();
  });

  it('shows the thank-you state with a Bible verse after a successful donation', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setProducts(fakeProducts);
    mockPurchases.purchaseStoreProduct.mockResolvedValueOnce({
      customerInfo: {entitlements: {active: {}, all: {}}},
    });

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('$4.99'));

    expect(await findByText('Gracias por tu generosidad')).toBeTruthy();
    expect(await findByText('2 Corintios 13:14')).toBeTruthy();
    // The "Cerrar" CTA sits on a colors.primary-filled button — its ink must
    // come from colors.onPrimary (theme-aware), not a hardcoded white that
    // washes out under high contrast (Tanda K).
    expect(colorOf(await findByText('Cerrar'))).toBe(mockColors.onPrimary);
  });

  it('returns to the amount picker silently on a cancelled donation', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setProducts(fakeProducts);
    mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({
      userCancelled: true,
    });

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('$1.99'));

    expect(await findByText('$1.99')).toBeTruthy();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('shows an error toast and returns to the amount picker on a real failure', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setProducts(fakeProducts);
    mockPurchases.purchaseStoreProduct.mockRejectedValueOnce(
      new Error('network down'),
    );

    const {findByText, findByLabelText} = renderSheet();
    fireEvent.press(await findByLabelText('$9.99'));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
    expect(await findByText('$9.99')).toBeTruthy();
  });

  it('lets the same amount be given again right after a successful donation and close', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setProducts(fakeProducts);
    mockPurchases.purchaseStoreProduct.mockResolvedValueOnce({
      customerInfo: {entitlements: {active: {}, all: {}}},
    });

    const onClose = jest.fn();
    const {findByText, findByLabelText, rerender} = render(
      <DonationSheet visible onClose={onClose} />,
    );
    fireEvent.press(await findByLabelText('$1.99'));
    expect(await findByText('Gracias por tu generosidad')).toBeTruthy();

    fireEvent.press(await findByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Closing + reopening (as the real sheet-context round-trip does) should
    // land back on the amount picker, not stuck on the thank-you screen —
    // donating is repeatable, never a one-time state.
    rerender(<DonationSheet visible={false} onClose={onClose} />);
    rerender(<DonationSheet visible onClose={onClose} />);
    expect(await findByLabelText('$1.99')).toBeTruthy();
  });
});
