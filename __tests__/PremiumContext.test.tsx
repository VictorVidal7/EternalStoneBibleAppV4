/**
 * Sprint 50 — PremiumContext integration.
 *
 * Rewired for the offering infrastructure tanda: verifies the provider (1)
 * reads the cached entitlement on mount (defaulting locked), (2) reacts to
 * offeringService's real entitlement changes, and (3) gates the manual
 * __DEV__-only override so it no-ops in production builds.
 */

import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import {
  PremiumProvider,
  usePremium,
  type PremiumContextValue,
} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import Purchases from 'react-native-purchases';
import {
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

let captured: PremiumContextValue | null = null;
function Capture() {
  captured = usePremium();
  return <Text>{captured.isPremium ? 'premium' : 'free'}</Text>;
}

async function mountAndSettle() {
  render(
    <PremiumProvider>
      <Capture />
    </PremiumProvider>,
  );
  await waitFor(() => expect(captured?.isLoading).toBe(false));
}

describe('PremiumContext', () => {
  beforeEach(async () => {
    captured = null;
    __resetForTests();
    mockPurchases.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  afterEach(() => {
    cleanup();
  });

  it('defaults to locked when nothing is persisted', async () => {
    await mountAndSettle();
    expect(captured!.isPremium).toBe(false);
  });

  it('loads a persisted unlock from the cache', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    await mountAndSettle();
    expect(captured!.isPremium).toBe(true);
  });

  it('reacts live to a RevenueCat entitlement change with no remount', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    await mountAndSettle();
    expect(captured!.isPremium).toBe(false);

    act(() => {
      // Simulates RevenueCat reporting a newly-active entitlement (e.g.
      // right after a successful purchase) — PremiumContext must pick it up
      // via offeringService's listener without a remount.
      mockPurchases.__setCustomerInfo({
        entitlements: {active: {extras: {identifier: 'extras'}}, all: {}},
      });
    });

    await waitFor(() => expect(captured!.isPremium).toBe(true));
    await expect(SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY)).resolves.toBe(
      'true',
    );
  });

  it('setPremium in __DEV__ flips and persists the flag', async () => {
    await mountAndSettle();

    await act(async () => {
      await captured!.setPremium(true);
    });
    await waitFor(() => expect(captured!.isPremium).toBe(true));
    await expect(SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY)).resolves.toBe(
      'true',
    );

    await act(async () => {
      await captured!.setPremium(false);
    });
    await waitFor(() => expect(captured!.isPremium).toBe(false));
  });

  describe('R9-9 / R9-10 — quitar el acceso tambien tiene que llegar a la pantalla', () => {
    it('la revocacion apaga premium en la MISMA sesion, sin esperar a otro arranque', async () => {
      // La mitad visible de R9-9: corregir la cache en disco no sirve de nada
      // si `isPremium` sigue en `true` toda la sesion. El usuario reembolsado
      // conserva el acceso de pago hasta que le apetezca reiniciar la app.
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      __setApiKeyForTests('test-key');

      await mountAndSettle();
      expect(captured!.isPremium).toBe(true); // arranque en frio: la cache manda

      await act(async () => {
        await initialize(); // RevenueCat responde: entitlement INACTIVA
      });

      await waitFor(() => expect(captured!.isPremium).toBe(false));
      await expect(
        SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY),
      ).resolves.toBe('false');
    });

    it('una lectura de cache lenta no puede resucitar el premium ya revocado', async () => {
      // El vecino: con R9-9 arreglado la verdad SI llega, pero el `setIsPremium`
      // incondicional de la lectura de cache la pisa si esa lectura resuelve
      // despues (R9-10). El primer acceso al keystore de Android en un arranque
      // en frio es justo el caso lento, y ahi el orden se invierte. Sin esto,
      // arreglar R9-9 no cambia nada para el usuario en esta sesion.
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      __setApiKeyForTests('test-key');

      // Diferimos a mano la lectura de cache del montaje para que el push de
      // RevenueCat gane la carrera.
      let releaseCache!: (value: string | null) => void;
      (SecureStore.getItemAsync as jest.Mock).mockImplementationOnce(
        () =>
          new Promise<string | null>(resolve => {
            releaseCache = resolve;
          }),
      );

      render(
        <PremiumProvider>
          <Capture />
        </PremiumProvider>,
      );

      await act(async () => {
        await initialize(); // revocada: el listener dice `false`
      });
      expect(captured!.isPremium).toBe(false);

      await act(async () => {
        releaseCache('true'); // ...y AHORA llega la cache vieja
      });

      await waitFor(() => expect(captured?.isLoading).toBe(false));
      expect(captured!.isPremium).toBe(false);
    });
  });

  it('setPremium is a no-op outside __DEV__', async () => {
    const original = __DEV__;
    // __DEV__ is declared as a read-only constant in RN's types/eslint
    // config, but is a plain `var` at runtime; this test needs to flip it to
    // exercise the production branch.
    // @ts-expect-error — see comment above.
    __DEV__ = false; // eslint-disable-line no-global-assign
    try {
      await mountAndSettle();
      await act(async () => {
        await captured!.setPremium(true);
      });
      expect(captured!.isPremium).toBe(false);
      await expect(
        SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY),
      ).resolves.toBeNull();
    } finally {
      // @ts-expect-error — see comment above.
      __DEV__ = original; // eslint-disable-line no-global-assign
    }
  });
});
