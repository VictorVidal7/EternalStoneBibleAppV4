/**
 * Offering infrastructure tanda (T5 — Donación) — DonationSheet.
 *
 * Integration-style: renders against the REAL offeringService, backed by
 * the manual react-native-purchases mock, so this exercises the actual
 * load -> purchase -> outcome chain, not a stubbed one. Unlike
 * OfferingSheet, there is no entitlement here — giving never unlocks
 * anything and is repeatable, so there's no "already given" state to test.
 */

import {render, waitFor, fireEvent, act} from '@testing-library/react-native';
import {Modal, Pressable, StyleSheet, Text} from 'react-native';
import Purchases from 'react-native-purchases';
import {DonationSheet} from '../src/components/donation/DonationSheet';
import {
  DonationSheetProvider,
  useDonationSheet,
} from '../src/context/DonationSheetContext';
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
  restorePurchases: jest.Mock;
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

  describe('R9-18 — el pago pendiente (OXXO, SPEI)', () => {
    const es = require('../src/i18n/translations').translations.es;

    it('avisa que quedó pendiente; ni «Inténtalo de nuevo» ni los montos', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.__setProducts(fakeProducts);
      mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({
        code: '20',
        message: 'The payment is pending.',
      });

      const {findByText, findByLabelText, queryByText} = renderSheet();
      fireEvent.press(await findByLabelText('$4.99'));

      expect(await findByText(es.donation.pendingTitle)).toBeTruthy();
      expect(await findByText(es.donation.pendingMessage)).toBeTruthy();
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(queryByText('$4.99')).toBeNull();
      // Todavia no se dio nada: no se agradece.
      expect(queryByText('Gracias por tu generosidad')).toBeNull();
      expect(colorOf(await findByText('Cerrar'))).toBe(mockColors.onPrimary);
    });

    it('al cerrar y reabrir vuelve a los montos', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.__setProducts(fakeProducts);
      mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({code: '20'});

      const onClose = jest.fn();
      const {findByText, findByLabelText, rerender} = render(
        <DonationSheet visible onClose={onClose} />,
      );
      fireEvent.press(await findByLabelText('$4.99'));
      expect(await findByText(es.donation.pendingTitle)).toBeTruthy();

      fireEvent.press(await findByLabelText('Cerrar'));
      expect(onClose).toHaveBeenCalledTimes(1);
      rerender(<DonationSheet visible={false} onClose={onClose} />);
      rerender(<DonationSheet visible onClose={onClose} />);
      expect(await findByLabelText('$4.99')).toBeTruthy();
    });
  });

  describe('R9-19 — «ya comprado»: la tienda todavía tiene una donación de ese monto', () => {
    const es = require('../src/i18n/translations').translations.es;

    it('intenta liquidarla y avisa en la hoja; no dice «Inténtalo de nuevo»', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.__setProducts(fakeProducts);
      mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({
        code: '6',
        message: 'This product is already active for the user.',
      });

      const {findByText, findByLabelText, queryByText} = renderSheet();
      fireEvent.press(await findByLabelText('$4.99'));

      expect(await findByText(es.donation.inProgressTitle)).toBeTruthy();
      expect(await findByText(es.donation.inProgressMessage)).toBeTruthy();
      expect(mockPurchases.restorePurchases).toHaveBeenCalledTimes(1);
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(queryByText('$4.99')).toBeNull();
      expect(queryByText('Gracias por tu generosidad')).toBeNull();
    });

    describe('R9-579 — esa restauracion trae tambien la ofrenda', () => {
      const withExtras = {
        entitlements: {active: {extras: {identifier: 'extras'}}, all: {}},
      };

      it('si es ella la que desbloquea los extras, lo dice; el aviso de la donacion sigue', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.__setProducts(fakeProducts);
        mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({code: '6'});
        mockPurchases.restorePurchases.mockResolvedValueOnce(withExtras);

        const {findByText, findByLabelText} = renderSheet();
        fireEvent.press(await findByLabelText('$4.99'));

        expect(await findByText(es.donation.inProgressTitle)).toBeTruthy();
        expect(mockToast.success).toHaveBeenCalledTimes(1);
        expect(mockToast.success).toHaveBeenCalledWith(
          es.offering.restoreSuccess,
        );
      });

      it('si los extras ya estaban activos, no anuncia nada', async () => {
        __setApiKeyForTests('test-key');
        (
          mockPurchases as unknown as {__setCustomerInfo: (i: unknown) => void}
        ).__setCustomerInfo(withExtras);
        await initialize();
        mockPurchases.__setProducts(fakeProducts);
        mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({code: '6'});

        const {findByText, findByLabelText} = renderSheet();
        fireEvent.press(await findByLabelText('$4.99'));

        expect(await findByText(es.donation.inProgressTitle)).toBeTruthy();
        expect(mockPurchases.restorePurchases).toHaveBeenCalledTimes(1);
        expect(mockToast.success).not.toHaveBeenCalled();
      });

      it('si la cuenta no tiene la ofrenda, no anuncia nada', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.__setProducts(fakeProducts);
        mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({code: '6'});

        const {findByText, findByLabelText} = renderSheet();
        fireEvent.press(await findByLabelText('$4.99'));

        expect(await findByText(es.donation.inProgressTitle)).toBeTruthy();
        expect(mockPurchases.restorePurchases).toHaveBeenCalledTimes(1);
        expect(mockToast.success).not.toHaveBeenCalled();
      });
    });

    it('si liquidarla falla (sin red), el aviso es el mismo y nada revienta', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.__setProducts(fakeProducts);
      mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({code: '6'});
      mockPurchases.restorePurchases.mockRejectedValueOnce({
        code: '10',
        message: 'network',
      });

      const {findByText, findByLabelText} = renderSheet();
      fireEvent.press(await findByLabelText('$4.99'));

      expect(await findByText(es.donation.inProgressTitle)).toBeTruthy();
      expect(mockPurchases.restorePurchases).toHaveBeenCalledTimes(1);
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    // R9-578 — el mock no modela un consumible trabado: esto NO mide que la
    // restauracion lo liquide (eso es del SDK real), solo que el aviso no
    // deja la hoja trabada. Pasa con y sin la llamada a restore().
    it('tras el aviso, al cerrar y reabrir el mismo monto se puede volver a tocar', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.__setProducts(fakeProducts);
      mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({code: '6'});

      const onClose = jest.fn();
      const {findByText, findByLabelText, rerender} = render(
        <DonationSheet visible onClose={onClose} />,
      );
      fireEvent.press(await findByLabelText('$4.99'));
      expect(await findByText(es.donation.inProgressTitle)).toBeTruthy();

      fireEvent.press(await findByLabelText('Cerrar'));
      rerender(<DonationSheet visible={false} onClose={onClose} />);
      rerender(<DonationSheet visible onClose={onClose} />);
      fireEvent.press(await findByLabelText('$4.99'));
      expect(await findByText('Gracias por tu generosidad')).toBeTruthy();
    });
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

describe('R9-576 — dos toques en el mismo cuadro, una sola donación', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setProducts(fakeProducts);
  });

  async function flush() {
    for (let i = 0; i < 12; i++) {
      await act(async () => {
        await new Promise(r => setImmediate(r));
      });
    }
  }

  it('dos toques al mismo monto antes del re-render: un solo cobro, y las gracias no quedan pisadas', async () => {
    let resolveFirst!: (v: unknown) => void;
    mockPurchases.purchaseStoreProduct.mockImplementationOnce(
      () => new Promise(res => (resolveFirst = res)),
    );
    mockPurchases.purchaseStoreProduct.mockImplementationOnce(() =>
      Promise.resolve({customerInfo: {entitlements: {active: {}, all: {}}}}),
    );
    const view = renderSheet();
    const amount = await view.findByLabelText('$1.99');
    act(() => {
      fireEvent.press(amount);
      fireEvent.press(amount);
    });

    await flush();
    expect(mockPurchases.purchaseStoreProduct).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveFirst({customerInfo: {entitlements: {active: {}, all: {}}}});
    });
    expect(await view.findByText('Gracias por tu generosidad')).toBeTruthy();
  });

  it('CONTROL: terminada una donación (cancelada), el monto se puede volver a tocar', async () => {
    mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({
      userCancelled: true,
    });
    mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({
      userCancelled: true,
    });
    const view = renderSheet();
    fireEvent.press(await view.findByLabelText('$1.99'));
    await waitFor(() =>
      expect(mockPurchases.purchaseStoreProduct).toHaveBeenCalledTimes(1),
    );
    fireEvent.press(await view.findByLabelText('$1.99'));
    await waitFor(() =>
      expect(mockPurchases.purchaseStoreProduct).toHaveBeenCalledTimes(2),
    );
  });
});

describe('R9-576 — cerrar y reabrir la hoja con la tienda sin responder', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setProducts(fakeProducts);
  });

  async function flush() {
    for (let i = 0; i < 12; i++) {
      await act(async () => {
        await new Promise(r => setImmediate(r));
      });
    }
  }

  function OpenButton() {
    const {open} = useDonationSheet();
    return (
      <Pressable onPress={open}>
        <Text>abrir la hoja</Text>
      </Pressable>
    );
  }

  // La hoja real, montada por su provider real (que la deja montada cerrada).
  function renderWithProvider() {
    return render(
      <DonationSheetProvider>
        <OpenButton />
      </DonationSheetProvider>,
    );
  }

  async function closeAndReopen(view: ReturnType<typeof renderWithProvider>) {
    act(() => {
      view.UNSAFE_getByType(Modal).props.onRequestClose();
    });
    await flush();
    expect(view.UNSAFE_getByType(Modal).props.visible).toBe(false);
    fireEvent.press(view.getByText('abrir la hoja'));
    await flush();
  }

  it('una donación que no vuelve: al reabrir, «Procesando…», no montos que no hacen nada', async () => {
    mockPurchases.purchaseStoreProduct.mockImplementation(
      () => new Promise(() => {}),
    );
    const view = renderWithProvider();
    fireEvent.press(view.getByText('abrir la hoja'));
    fireEvent.press(await view.findByLabelText('$1.99'));
    await flush();

    await closeAndReopen(view);

    expect(view.queryByLabelText('$1.99')).toBeNull();
    expect(view.queryByLabelText('$4.99')).toBeNull();
    expect(view.getByText('Procesando…')).toBeTruthy();
    expect(mockPurchases.purchaseStoreProduct).toHaveBeenCalledTimes(1);
  });

  it('CONTROL: cancelada después de reabrir, los montos vuelven y donar funciona', async () => {
    let rejectFirst!: (e: unknown) => void;
    mockPurchases.purchaseStoreProduct.mockImplementationOnce(
      () => new Promise((_res, rej) => (rejectFirst = rej)),
    );
    mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({
      userCancelled: true,
    });
    const view = renderWithProvider();
    fireEvent.press(view.getByText('abrir la hoja'));
    fireEvent.press(await view.findByLabelText('$1.99'));
    await flush();

    await closeAndReopen(view);
    await act(async () => {
      rejectFirst({userCancelled: true});
    });

    fireEvent.press(await view.findByLabelText('$4.99'));
    await waitFor(() =>
      expect(mockPurchases.purchaseStoreProduct).toHaveBeenCalledTimes(2),
    );
  });
});
