/**
 * Offering infrastructure tanda — offeringService state machine.
 *
 * Exercises the wrapper against the manual react-native-purchases mock
 * (see __mocks__/react-native-purchases.js), not the real SDK.
 */

import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {
  ENTITLEMENT_ID,
  initialize,
  isBillingAvailable,
  linkUser,
  linkUpgradedUser,
  getUnlockPackages,
  getDonationProducts,
  purchaseUnlock,
  purchaseDonation,
  restore,
  refreshEntitlement,
  onEntitlementChange,
  getLastKnownEntitlement,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';
import {
  ENTITLEMENT_CACHE_KEY,
  getCachedEntitlement,
} from '../src/lib/offering/entitlementCache';
import {
  getPendingLinkUid,
  setPendingLinkUid,
} from '../src/lib/offering/pendingLink';

const mockPurchases = Purchases as unknown as {
  configure: jest.Mock;
  getCustomerInfo: jest.Mock;
  getOfferings: jest.Mock;
  getProducts: jest.Mock;
  purchasePackage: jest.Mock;
  purchaseStoreProduct: jest.Mock;
  restorePurchases: jest.Mock;
  logIn: jest.Mock;
  invalidateCustomerInfoCache: jest.Mock;
  canMakePayments: jest.Mock;
  __setCustomerInfo: (info: unknown) => void;
  __setOfferings: (offerings: unknown) => void;
  __setProducts: (products: unknown) => void;
  __getListenerCount: () => number;
  __reset: () => void;
};

const activeEntitlementInfo = {
  entitlements: {
    active: {[ENTITLEMENT_ID]: {identifier: ENTITLEMENT_ID}},
    all: {},
  },
};
const noEntitlementInfo = {entitlements: {active: {}, all: {}}};

describe('offeringService', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  describe('initialize', () => {
    it('stays dormant without an API key — never calls Purchases.configure', async () => {
      await initialize();
      expect(mockPurchases.configure).not.toHaveBeenCalled();
      expect(await isBillingAvailable()).toBe(false);
    });

    it('configures the SDK and syncs entitlement once an API key is set', async () => {
      mockPurchases.__setCustomerInfo(activeEntitlementInfo);
      __setApiKeyForTests('test-key');
      await initialize();
      expect(mockPurchases.configure).toHaveBeenCalledWith({
        apiKey: 'test-key',
      });
      expect(getLastKnownEntitlement()).toBe(true);
      await expect(getCachedEntitlement()).resolves.toBe(true);
    });

    it('is idempotent — a second call does not re-configure', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      await initialize();
      expect(mockPurchases.configure).toHaveBeenCalledTimes(1);
    });
  });

  describe('entitlement change listener', () => {
    it('notifies subscribers only when the entitlement actually flips', async () => {
      __setApiKeyForTests('test-key');
      await initialize();

      const seen: boolean[] = [];
      const unsubscribe = onEntitlementChange(unlocked => seen.push(unlocked));

      // The mock's listener firing kicks off offeringService's async
      // handleCustomerInfo chain (it awaits the secure-store write before
      // notifying) — flush microtasks between each change so assertions see
      // the settled state, not a mid-flight one.
      mockPurchases.__setCustomerInfo(activeEntitlementInfo);
      await Promise.resolve();
      await Promise.resolve();
      mockPurchases.__setCustomerInfo(activeEntitlementInfo); // no-op, still active
      await Promise.resolve();
      await Promise.resolve();
      mockPurchases.__setCustomerInfo(noEntitlementInfo);
      await Promise.resolve();
      await Promise.resolve();

      expect(seen).toEqual([true, false]);
      unsubscribe();

      mockPurchases.__setCustomerInfo(activeEntitlementInfo);
      await Promise.resolve();
      await Promise.resolve();
      expect(seen).toEqual([true, false]); // no more updates after unsubscribe
    });

    it('persists every entitlement flip to the secure cache', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.__setCustomerInfo(activeEntitlementInfo);
      await expect(getCachedEntitlement()).resolves.toBe(true);
      mockPurchases.__setCustomerInfo(noEntitlementInfo);
      await expect(getCachedEntitlement()).resolves.toBe(false);
    });
  });

  describe('linkUser', () => {
    it('no-ops when not configured or uid is null', async () => {
      await linkUser('some-uid');
      expect(mockPurchases.logIn).not.toHaveBeenCalled();
      __setApiKeyForTests('test-key');
      await initialize();
      await linkUser(null);
      expect(mockPurchases.logIn).not.toHaveBeenCalled();
    });

    it('logs in and syncs the returned entitlement', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.logIn.mockResolvedValueOnce({
        customerInfo: activeEntitlementInfo,
      });
      await linkUser('firebase-uid-123');
      expect(mockPurchases.logIn).toHaveBeenCalledWith('firebase-uid-123');
      expect(getLastKnownEntitlement()).toBe(true);
    });
  });

  describe('getUnlockPackages / getDonationProducts', () => {
    it('returns an empty list when not configured', async () => {
      expect(await getUnlockPackages()).toEqual([]);
      expect(await getDonationProducts()).toEqual([]);
    });

    it('returns the configured offering packages once initialized', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      const pkgs = [
        {identifier: 'ofrenda_extras_1'},
        {identifier: 'ofrenda_extras_2'},
      ];
      mockPurchases.__setOfferings({all: {default: {availablePackages: pkgs}}});
      await expect(getUnlockPackages()).resolves.toEqual(pkgs);
    });

    it('returns the donation products once initialized', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      const products = [{identifier: 'donacion_1'}, {identifier: 'donacion_2'}];
      mockPurchases.__setProducts(products);
      await expect(getDonationProducts()).resolves.toEqual(products);
      // donación products are one-time ("Productos únicos" in Play
      // Console), not subscriptions — the SDK defaults to SUBSCRIPTION
      // when no type is passed, which silently returns [] for these ids.
      expect(mockPurchases.getProducts).toHaveBeenCalledWith(
        expect.any(Array),
        'NON_SUBSCRIPTION',
      );
    });
  });

  describe('purchaseUnlock / purchaseDonation', () => {
    it('reports success and syncs entitlement on a successful unlock purchase', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.purchasePackage.mockResolvedValueOnce({
        customerInfo: activeEntitlementInfo,
      });
      const outcome = await purchaseUnlock({
        identifier: 'ofrenda_extras_1',
      } as never);
      expect(outcome).toEqual({status: 'success'});
      expect(getLastKnownEntitlement()).toBe(true);
    });

    describe('R9-17 — success quiere decir «la entitlement esta activa»', () => {
      it('cobrado pero sin entitlement: notActivated, nunca success', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.purchasePackage.mockResolvedValueOnce({
          customerInfo: noEntitlementInfo,
        });
        const outcome = await purchaseUnlock({
          identifier: 'ofrenda_extras_1',
        } as never);
        expect(outcome).toEqual({status: 'notActivated'});
        expect(getLastKnownEntitlement()).toBe(false);
        await expect(getCachedEntitlement()).resolves.toBe(false);
      });

      it('relee UNA vez saltando la cache del SDK: si ahi ya esta activa, success', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.getCustomerInfo.mockClear();
        mockPurchases.purchasePackage.mockResolvedValueOnce({
          customerInfo: noEntitlementInfo,
        });
        // El SDK ya tiene la entitlement; la foto que devolvio la compra, no.
        mockPurchases.getCustomerInfo.mockResolvedValueOnce(
          activeEntitlementInfo,
        );
        const outcome = await purchaseUnlock({
          identifier: 'ofrenda_extras_1',
        } as never);
        expect(outcome).toEqual({status: 'success'});
        expect(getLastKnownEntitlement()).toBe(true);
        await expect(getCachedEntitlement()).resolves.toBe(true);
        expect(mockPurchases.getCustomerInfo).toHaveBeenCalledTimes(1);
        expect(
          mockPurchases.invalidateCustomerInfoCache.mock.invocationCallOrder[0],
        ).toBeLessThan(
          mockPurchases.getCustomerInfo.mock.invocationCallOrder[0],
        );
      });

      it('si la relectura falla, sigue siendo notActivated: tras cobrar no se dice error', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.purchasePackage.mockResolvedValueOnce({
          customerInfo: noEntitlementInfo,
        });
        mockPurchases.getCustomerInfo.mockRejectedValueOnce({
          code: '10',
          message: 'network',
        });
        const outcome = await purchaseUnlock({
          identifier: 'ofrenda_extras_1',
        } as never);
        expect(outcome).toEqual({status: 'notActivated'});
      });

      it('con la entitlement en la respuesta de la compra no relee nada', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.getCustomerInfo.mockClear();
        mockPurchases.purchasePackage.mockResolvedValueOnce({
          customerInfo: activeEntitlementInfo,
        });
        const outcome = await purchaseUnlock({
          identifier: 'ofrenda_extras_1',
        } as never);
        expect(outcome).toEqual({status: 'success'});
        expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled();
        expect(
          mockPurchases.invalidateCustomerInfoCache,
        ).not.toHaveBeenCalled();
      });
    });

    it('reports cancelled when the store reports PURCHASE_CANCELLED_ERROR', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.purchasePackage.mockRejectedValueOnce({code: '1'});
      const outcome = await purchaseUnlock({
        identifier: 'ofrenda_extras_1',
      } as never);
      expect(outcome).toEqual({status: 'cancelled'});
    });

    it('reports cancelled via the deprecated userCancelled flag too', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.purchasePackage.mockRejectedValueOnce({
        userCancelled: true,
      });
      const outcome = await purchaseUnlock({
        identifier: 'ofrenda_extras_1',
      } as never);
      expect(outcome).toEqual({status: 'cancelled'});
    });

    it('reports alreadyOwned when the store reports PRODUCT_ALREADY_PURCHASED_ERROR', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.purchasePackage.mockRejectedValueOnce({code: '6'});
      const outcome = await purchaseUnlock({
        identifier: 'ofrenda_extras_1',
      } as never);
      expect(outcome).toEqual({status: 'alreadyOwned'});
    });

    describe('R9-18 — el pago pendiente no es un fallo', () => {
      it('purchaseUnlock: PAYMENT_PENDING_ERROR es pending, no error', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.purchasePackage.mockRejectedValueOnce({
          code: '20',
          message: 'The payment is pending.',
        });
        const outcome = await purchaseUnlock({
          identifier: 'ofrenda_extras_1',
        } as never);
        expect(outcome).toEqual({status: 'pending'});
        expect(getLastKnownEntitlement()).toBe(false);
      });

      it('purchaseDonation: PAYMENT_PENDING_ERROR es pending, no error', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({
          code: '20',
          message: 'The payment is pending.',
        });
        const outcome = await purchaseDonation({
          identifier: 'donacion_1',
        } as never);
        expect(outcome).toEqual({status: 'pending'});
      });

      it.each([
        ['STORE_PROBLEM_ERROR', '2'],
        ['PURCHASE_NOT_ALLOWED_ERROR', '3'],
        ['RECEIPT_ALREADY_IN_USE_ERROR', '7'],
        ['NETWORK_ERROR', '10'],
        ['OFFLINE_CONNECTION_ERROR', '35'],
      ])('%s sigue siendo error', async (_name, code) => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.purchasePackage.mockRejectedValueOnce({code});
        const outcome = await purchaseUnlock({
          identifier: 'ofrenda_extras_1',
        } as never);
        expect(outcome.status).toBe('error');
      });

      // R9-578 — la guarda de outcomeFromError contra `undefined ===
      // undefined`: un SDK sin la constante y un error sin codigo.
      describe('con un SDK que no trae PAYMENT_PENDING_ERROR', () => {
        const codes = (
          Purchases as unknown as {
            PURCHASES_ERROR_CODE: Record<string, string | undefined>;
          }
        ).PURCHASES_ERROR_CODE;
        let saved: string | undefined;
        beforeEach(() => {
          saved = codes.PAYMENT_PENDING_ERROR;
          delete codes.PAYMENT_PENDING_ERROR;
        });
        afterEach(() => {
          codes.PAYMENT_PENDING_ERROR = saved;
        });

        it('purchaseUnlock: un error SIN codigo sigue siendo error, no pending', async () => {
          __setApiKeyForTests('test-key');
          await initialize();
          mockPurchases.purchasePackage.mockRejectedValueOnce(
            new Error('boom'),
          );
          await expect(purchaseUnlock({} as never)).resolves.toEqual({
            status: 'error',
            message: 'boom',
          });
        });

        it('purchaseDonation: un error SIN codigo sigue siendo error, no pending', async () => {
          __setApiKeyForTests('test-key');
          await initialize();
          mockPurchases.purchaseStoreProduct.mockRejectedValueOnce(
            new Error('boom'),
          );
          await expect(purchaseDonation({} as never)).resolves.toEqual({
            status: 'error',
            message: 'boom',
          });
        });

        it('y un error CON el codigo 20 tampoco es pending: ese SDK no lo conoce', async () => {
          __setApiKeyForTests('test-key');
          await initialize();
          mockPurchases.purchasePackage.mockRejectedValueOnce({
            code: '20',
            message: 'pending',
          });
          await expect(purchaseUnlock({} as never)).resolves.toEqual({
            status: 'error',
            message: '[object Object]',
          });
        });
      });

      it('los codigos del mock son los del SDK real', () => {
        // El mock es la frontera: si su '20' no fuera el del SDK, las
        // pruebas de arriba pasarian y en el dispositivo no se reconoceria.
        const real = jest.requireActual(
          '@revenuecat/purchases-typescript-internal',
        ).PURCHASES_ERROR_CODE;
        const mocked = (
          Purchases as unknown as {
            PURCHASES_ERROR_CODE: Record<string, string>;
          }
        ).PURCHASES_ERROR_CODE;
        expect(real.PAYMENT_PENDING_ERROR).toBe('20');
        for (const name of Object.keys(mocked)) {
          expect([name, mocked[name]]).toEqual([name, real[name]]);
        }
      });
    });

    it('R9-19 — purchaseDonation tambien reporta alreadyOwned (PRODUCT_ALREADY_PURCHASED_ERROR)', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.purchaseStoreProduct.mockRejectedValueOnce({code: '6'});
      const outcome = await purchaseDonation({
        identifier: 'donacion_1',
      } as never);
      expect(outcome).toEqual({status: 'alreadyOwned'});
    });

    it('reports a generic error for any other failure', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.purchasePackage.mockRejectedValueOnce(
        new Error('network down'),
      );
      const outcome = await purchaseUnlock({
        identifier: 'ofrenda_extras_1',
      } as never);
      expect(outcome).toEqual({status: 'error', message: 'network down'});
    });

    it('purchaseDonation never touches the entitlement', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.purchaseStoreProduct.mockResolvedValueOnce({
        customerInfo: noEntitlementInfo,
      });
      const outcome = await purchaseDonation({
        identifier: 'donacion_1',
      } as never);
      expect(outcome).toEqual({status: 'success'});
      expect(getLastKnownEntitlement()).toBe(false);
    });

    it('errors clearly when purchasing before initialization', async () => {
      const outcome = await purchaseUnlock({
        identifier: 'ofrenda_extras_1',
      } as never);
      expect(outcome).toEqual({
        status: 'error',
        message: 'Offering system not initialized',
      });
    });
  });

  describe('restore', () => {
    // R9-16 — estas tres pruebas fijaban `{unlocked: false}` para «la tienda
    // dijo que no hay compra», para «no se pudo preguntar» y para «sin
    // configurar»: la confusion, congelada como esperada. Ahora son tres
    // respuestas, y `notFound` solo la puede dar la tienda.
    it('reports error (never notFound) when not configured', async () => {
      await expect(restore()).resolves.toEqual({status: 'error'});
    });

    it('restores a previous unlock and syncs the cache', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.restorePurchases.mockResolvedValueOnce(
        activeEntitlementInfo,
      );
      await expect(restore()).resolves.toEqual({status: 'restored'});
      await expect(getCachedEntitlement()).resolves.toBe(true);
    });

    it('reports notFound only when the store ANSWERED with no entitlement', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.restorePurchases.mockResolvedValueOnce(noEntitlementInfo);
      await expect(restore()).resolves.toEqual({status: 'notFound'});
    });

    describe('R9-574 — «la tienda respondio sin entitlement» no es «no hay compra»', () => {
      const tx = (productIdentifier: string) => ({
        transactionIdentifier: 'tx-' + productIdentifier,
        productIdentifier,
        purchaseDate: '2026-11-12T00:00:00Z',
      });

      it('la cuenta tiene una ofrenda y la entitlement no esta: notActivated, nunca notFound', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.restorePurchases.mockResolvedValueOnce({
          ...noEntitlementInfo,
          nonSubscriptionTransactions: [tx('ofrenda_extras_1')],
        });
        await expect(restore()).resolves.toEqual({status: 'notActivated'});
        await expect(getCachedEntitlement()).resolves.toBe(false);
      });

      it('una donacion no es una ofrenda: con solo donaciones sigue siendo notFound', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.restorePurchases.mockResolvedValueOnce({
          ...noEntitlementInfo,
          nonSubscriptionTransactions: [tx('donacion_1'), tx('donacion_4')],
        });
        await expect(restore()).resolves.toEqual({status: 'notFound'});
      });

      it('una ofrenda entre donaciones: notActivated', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.restorePurchases.mockResolvedValueOnce({
          ...noEntitlementInfo,
          nonSubscriptionTransactions: [
            tx('donacion_2'),
            tx('ofrenda_extras_3'),
          ],
        });
        await expect(restore()).resolves.toEqual({status: 'notActivated'});
      });

      it('con la entitlement activa es restored, tenga o no la transaccion', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.restorePurchases.mockResolvedValueOnce({
          ...activeEntitlementInfo,
          nonSubscriptionTransactions: [tx('ofrenda_extras_1')],
        });
        await expect(restore()).resolves.toEqual({status: 'restored'});
      });

      it('una respuesta sin la lista de transacciones es notFound, no un error', async () => {
        __setApiKeyForTests('test-key');
        await initialize();
        // `noEntitlementInfo` no trae `nonSubscriptionTransactions`.
        mockPurchases.restorePurchases.mockResolvedValueOnce(noEntitlementInfo);
        await expect(restore()).resolves.toEqual({status: 'notFound'});
      });
    });

    it.each([
      ['an Error', new Error('offline')],
      ['NETWORK_ERROR', {code: '10', message: 'network'}],
      ['OFFLINE_CONNECTION_ERROR', {code: '35', message: 'offline'}],
      ['STORE_PROBLEM_ERROR', {code: '2', message: 'store problem'}],
    ])(
      'R9-16 — resolves error (not throw, and NOT notFound) when the store call fails with %s',
      async (_label, rejection) => {
        __setApiKeyForTests('test-key');
        await initialize();
        mockPurchases.restorePurchases.mockRejectedValueOnce(rejection);
        await expect(restore()).resolves.toEqual({status: 'error'});
      },
    );
  });

  describe('refreshEntitlement', () => {
    it('is a no-op when not configured', async () => {
      await refreshEntitlement();
      expect(mockPurchases.invalidateCustomerInfoCache).not.toHaveBeenCalled();
    });

    it('invalidates the SDK cache BEFORE re-reading customer info, and syncs the result', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.__setCustomerInfo(noEntitlementInfo);
      expect(getLastKnownEntitlement()).toBe(false);

      // Simulate an out-of-band grant (a redeemed gift code) landing
      // between the cache invalidation and the subsequent getCustomerInfo()
      // read — exactly the case invalidateCustomerInfoCache() exists for.
      mockPurchases.getCustomerInfo.mockResolvedValueOnce(
        activeEntitlementInfo,
      );

      await refreshEntitlement();

      expect(mockPurchases.invalidateCustomerInfoCache).toHaveBeenCalledTimes(
        1,
      );
      const invalidateOrder =
        mockPurchases.invalidateCustomerInfoCache.mock.invocationCallOrder[0];
      const getInfoOrder =
        mockPurchases.getCustomerInfo.mock.invocationCallOrder[
          mockPurchases.getCustomerInfo.mock.invocationCallOrder.length - 1
        ];
      expect(invalidateOrder).toBeLessThan(getInfoOrder);
      expect(getLastKnownEntitlement()).toBe(true);
      await expect(getCachedEntitlement()).resolves.toBe(true);
    });

    it('never throws when the SDK call fails', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.invalidateCustomerInfoCache.mockRejectedValueOnce(
        new Error('offline'),
      );
      await expect(refreshEntitlement()).resolves.toBeUndefined();
    });
  });

  describe('R9-9 — la revocacion tiene que propagarse', () => {
    it('un arranque en frio con la entitlement ya revocada corrige la cache Y avisa', async () => {
      // Pago, y le reembolsaron. En disco quedo su compra.
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      mockPurchases.__setCustomerInfo(noEntitlementInfo);
      __setApiKeyForTests('test-key');

      const seen: boolean[] = [];
      onEntitlementChange(unlocked => seen.push(unlocked));
      await initialize();

      // Pre-fix `lastKnownUnlocked` arrancaba en `false` en CADA arranque del
      // proceso, asi que el dedupe `false === false` cortaba ANTES de escribir
      // la cache y ANTES de avisar a los listeners. El 'true' viejo no se
      // corregia jamas: solo lo borraba desinstalar la app.
      await expect(getCachedEntitlement()).resolves.toBe(false);
      expect(seen).toEqual([false]);
      expect(getLastKnownEntitlement()).toBe(false);
    });

    it('si el arranque no pudo resolver, la primera respuesta que llegue corrige igual', async () => {
      // El vecino del caso de arriba: el defecto NO es de `initialize()`, es
      // del dedupe, asi que el arreglo tiene que estar en el punto de paso
      // —`handleCustomerInfo`— y no en un llamador. Aqui `initialize()` deja
      // el SDK configurado pero sin resolver (arranque sin red), y quien
      // resuelve primero es `linkUser`: el telefono compartido, con Beto
      // entrando sobre la compra de Ana.
      await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      __setApiKeyForTests('test-key');
      mockPurchases.getCustomerInfo.mockRejectedValueOnce(new Error('sin red'));
      await initialize();

      // Nada se resolvio todavia, asi que la cache NO se toca: 'true' aqui
      // significa «no lo se», no «premium confirmado».
      await expect(getCachedEntitlement()).resolves.toBe(true);

      await linkUser('uid-beto');
      await expect(getCachedEntitlement()).resolves.toBe(false);
      expect(getLastKnownEntitlement()).toBe(false);
    });

    it('sigue sin avisar dos veces de lo mismo', async () => {
      // Control: el dedupe tiene que seguir haciendo su trabajo. Lo que estaba
      // mal no era deduplicar, era tomar `false` por estado CONOCIDO cuando en
      // realidad era «todavia no se».
      __setApiKeyForTests('test-key');
      await initialize();
      const seen: boolean[] = [];
      onEntitlementChange(unlocked => seen.push(unlocked));
      mockPurchases.__setCustomerInfo(noEntitlementInfo);
      await Promise.resolve();
      await Promise.resolve();
      mockPurchases.__setCustomerInfo(noEntitlementInfo);
      await Promise.resolve();
      await Promise.resolve();
      expect(seen).toEqual([]);
    });
  });
});

describe('R9-105 — la linea exacta de R9-9 con el modulo RECIEN CARGADO', () => {
  // El arreglo de R9-9 vive en el inicializador de nivel de modulo,
  // `let lastKnownUnlocked: boolean | null = null`. Las pruebas de arriba NO lo
  // ejercitan: su `beforeEach` llama a `__resetForTests()`, que pone `null` por
  // su cuenta, asi que bajo jest ese inicializador no corria nunca. Revertido a
  // `= false` —el P0 tal cual— la suite entera seguia en verde.
  //
  // Por eso esta prueba carga el modulo de cero con `isolateModulesAsync` y no
  // llama ni a `__resetForTests()` ni a `__setApiKeyForTests()`: lo que corre es
  // exactamente lo que corre al arrancar el proceso. Todo se pide DENTRO del
  // registro aislado —tambien el mock de SecureStore y el de RevenueCat—, porque
  // los de fuera son otras instancias con otro estado.
  it('un arranque en frio con la entitlement revocada corrige la cache Y avisa', async () => {
    await jest.isolateModulesAsync(async () => {
      const isolatedSecureStore =
        require('expo-secure-store') as typeof SecureStore;
      const isolatedPurchases = require('react-native-purchases') as {
        configure: jest.Mock;
        __setCustomerInfo: (info: unknown) => void;
      };
      const service =
        require('../src/lib/offering/offeringService') as typeof import('../src/lib/offering/offeringService');
      const cache =
        require('../src/lib/offering/entitlementCache') as typeof import('../src/lib/offering/entitlementCache');

      // Pago, y le reembolsaron. En disco quedo su compra.
      await isolatedSecureStore.setItemAsync(
        cache.ENTITLEMENT_CACHE_KEY,
        'true',
      );
      isolatedPurchases.__setCustomerInfo(noEntitlementInfo);

      const seen: boolean[] = [];
      service.onEntitlementChange(unlocked => seen.push(unlocked));
      await service.initialize();

      // Control del mecanismo: el modulo tiene que haber configurado el SDK con
      // la clave de su propia constante. Si alguien lo deja dormido (clave
      // vacia), `initialize()` sale antes de mirar RevenueCat y la cache sigue
      // en 'true' — y entonces es ESTO lo que falla, no la asercion de abajo,
      // que culparia a R9-9 de algo que no hizo.
      expect(isolatedPurchases.configure).toHaveBeenCalledTimes(1);

      // Con `= false` en el inicializador, la primera respuesta «inactiva» del
      // proceso se deduplica contra ese `false`: sale antes de escribir la cache
      // y antes de avisar. Queda `{cache: 'true', seen: []}` — premium despues
      // del reembolso.
      await expect(cache.getCachedEntitlement()).resolves.toBe(false);
      expect(seen).toEqual([false]);
    });
  });
});

// ---------------------------------------------------------------------------
// R9-135 — el logIn que falla al CAMBIAR de cuenta se reintenta. El mock del
// SDK no modela clientes: solo sabe en que id esta (ver __mocks__).
// ---------------------------------------------------------------------------
describe('R9-135 — un logIn que falla al cambiar de cuenta se reintenta', () => {
  const sdk = Purchases as unknown as {
    logIn: jest.Mock;
    isAnonymous: jest.Mock;
    purchasePackage: jest.Mock;
    restorePurchases: jest.Mock;
    __reset: () => void;
  };
  const active = {
    entitlements: {
      active: {[ENTITLEMENT_ID]: {identifier: ENTITLEMENT_ID}},
      all: {},
    },
  };
  const pkg = {identifier: 'o1'} as never;
  const offline = {code: '10', message: 'network'};

  beforeEach(async () => {
    __resetForTests();
    sdk.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
    await setPendingLinkUid(null);
    __setApiKeyForTests('test-key');
    await initialize();
  });

  /** Ana (con la ofrenda) esta enlazada; entra Beto y su logIn falla. */
  async function betoFailsAfterAna(): Promise<void> {
    sdk.logIn.mockResolvedValueOnce({customerInfo: active});
    await linkUser('ana');
    // El mock responde con Once sin pasar por su implementacion: se dice a
    // mano que el SDK quedo en la cuenta de Ana.
    (
      Purchases as unknown as {__setAppUserID: (id: string) => void}
    ).__setAppUserID('ana');
    expect(getLastKnownEntitlement()).toBe(true);
    sdk.logIn.mockRejectedValueOnce(offline);
    await linkUser('beto');
    expect(sdk.logIn.mock.calls).toEqual([['ana'], ['beto']]);
    // Mientras no se pueda preguntar por Beto, se sigue viendo lo de Ana.
    expect(getLastKnownEntitlement()).toBe(true);
  }

  /** Un proceso nuevo: el servicio arranca de cero; el SDK y el disco no. */
  async function nextProcess(earlyUid: string | null): Promise<void> {
    __resetForTests();
    sdk.logIn.mockClear();
    __setApiKeyForTests('test-key');
    // El orden del arranque en frio: AuthContext llama antes de initialize().
    await linkUser(earlyUid);
    await initialize();
  }

  it('queda anotado en disco y se reintenta antes de una compra', async () => {
    await betoFailsAfterAna();
    await expect(getPendingLinkUid()).resolves.toBe('beto');

    sdk.purchasePackage.mockResolvedValueOnce({customerInfo: active});
    await expect(purchaseUnlock(pkg)).resolves.toEqual({status: 'success'});

    expect(sdk.logIn.mock.calls).toEqual([['ana'], ['beto'], ['beto']]);
    expect(sdk.logIn.mock.invocationCallOrder[2]).toBeLessThan(
      sdk.purchasePackage.mock.invocationCallOrder[0],
    );
    await expect(getPendingLinkUid()).resolves.toBeNull();
  });

  it('se reintenta antes de restaurar, y lo que se ve pasa a ser lo de la cuenta que entro', async () => {
    await betoFailsAfterAna();

    await expect(restore()).resolves.toEqual({status: 'notFound'});

    expect(sdk.logIn.mock.calls).toEqual([['ana'], ['beto'], ['beto']]);
    expect(sdk.logIn.mock.invocationCallOrder[2]).toBeLessThan(
      sdk.restorePurchases.mock.invocationCallOrder[0],
    );
    expect(getLastKnownEntitlement()).toBe(false);
  });

  it('en el arranque siguiente, con esa cuenta en sesion, se reintenta al terminar initialize()', async () => {
    await betoFailsAfterAna();

    await nextProcess('beto');

    expect(sdk.logIn.mock.calls).toEqual([['beto']]);
    expect(getLastKnownEntitlement()).toBe(false);
    await expect(getCachedEntitlement()).resolves.toBe(false);
    await expect(getPendingLinkUid()).resolves.toBeNull();

    // Y ya no queda nada que reintentar en los arranques que siguen.
    await nextProcess('beto');
    expect(sdk.logIn).not.toHaveBeenCalled();
  });

  it('si el reintento del arranque vuelve a fallar, sigue pendiente', async () => {
    await betoFailsAfterAna();
    sdk.logIn.mockRejectedValueOnce(offline);

    await nextProcess('beto');

    expect(sdk.logIn.mock.calls).toEqual([['beto']]);
    await expect(getPendingLinkUid()).resolves.toBe('beto');
    await nextProcess('beto');
    expect(sdk.logIn.mock.calls).toEqual([['beto']]);
    await expect(getPendingLinkUid()).resolves.toBeNull();
  });

  it.each([
    ['nadie (cerro sesion)', null],
    ['otra cuenta', 'carla'],
  ])(
    'en el arranque siguiente con %s en sesion NO se reintenta',
    async (_label, early) => {
      await betoFailsAfterAna();

      await nextProcess(early);

      expect(sdk.logIn).not.toHaveBeenCalled();
      await expect(getPendingLinkUid()).resolves.toBe('beto');
    },
  );

  it('un logIn que sale bien borra el pendiente: ya no hay nada que reintentar', async () => {
    await betoFailsAfterAna();

    await linkUser('carla');
    await expect(getPendingLinkUid()).resolves.toBeNull();
    sdk.purchasePackage.mockResolvedValueOnce({customerInfo: active});
    await purchaseUnlock(pkg);

    expect(sdk.logIn.mock.calls).toEqual([['ana'], ['beto'], ['carla']]);
  });

  describe('lo que NO se reintenta (espera la medicion en vivo)', () => {
    it('un logIn que falla con RevenueCat en su id ANONIMO no queda pendiente', async () => {
      sdk.logIn.mockRejectedValueOnce(offline);
      await linkUser('ana');

      await expect(getPendingLinkUid()).resolves.toBeNull();
      sdk.purchasePackage.mockResolvedValueOnce({customerInfo: active});
      await purchaseUnlock(pkg);
      await restore();
      expect(sdk.logIn.mock.calls).toEqual([['ana']]);

      await nextProcess('ana');
      expect(sdk.logIn).not.toHaveBeenCalled();
    });

    it('una cuenta que llega antes de initialize() sin nada pendiente NO se enlaza al terminar', async () => {
      await nextProcess('ana');

      expect(sdk.logIn).not.toHaveBeenCalled();
      expect(sdk.isAnonymous).not.toHaveBeenCalled();
    });

    it('si el SDK no sabe decir si esta en un id anonimo, no se anota nada', async () => {
      sdk.logIn.mockResolvedValueOnce({customerInfo: active});
      await linkUser('ana');
      sdk.isAnonymous.mockRejectedValueOnce(new Error('no configurado'));
      sdk.logIn.mockRejectedValueOnce(offline);
      await linkUser('beto');

      await expect(getPendingLinkUid()).resolves.toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// R9-580 — una cuenta nacida del anonimo por linkWithCredential (sin evento de
// Firebase) se enlaza solo si RevenueCat NO esta en un `$RCAnonymousID`. El
// mock no modela clientes: estas pruebas afirman LLAMADAS, no de quien quedan
// las compras, y el id del SDK se dice a mano (__setAppUserID).
// ---------------------------------------------------------------------------
describe('R9-580 — linkUpgradedUser', () => {
  const sdk = Purchases as unknown as {
    logIn: jest.Mock;
    isAnonymous: jest.Mock;
    __setAppUserID: (id: string) => void;
    __reset: () => void;
  };

  beforeEach(async () => {
    __resetForTests();
    sdk.__reset();
    await setPendingLinkUid(null);
    __setApiKeyForTests('test-key');
    await initialize();
  });
  afterEach(async () => {
    __resetForTests();
    sdk.__reset();
    await setPendingLinkUid(null);
  });

  it('con RevenueCat en la cuenta que salio, enlaza la cuenta nueva', async () => {
    sdk.__setAppUserID('ana');
    await linkUpgradedUser('anon-nuevo');
    expect(sdk.logIn.mock.calls).toEqual([['anon-nuevo']]);
  });

  it('con RevenueCat en su id anonimo, no enlaza (espera la medicion en vivo)', async () => {
    sdk.__setAppUserID('$RCAnonymousID:0123456789abcdef0123456789abcdef');
    await linkUpgradedUser('anon-nuevo');
    expect(sdk.isAnonymous).toHaveBeenCalledTimes(1);
    expect(sdk.logIn).not.toHaveBeenCalled();
  });

  it('si el SDK no sabe decir si esta en un id anonimo, no enlaza', async () => {
    sdk.__setAppUserID('ana');
    sdk.isAnonymous.mockRejectedValueOnce(new Error('no configurado'));
    await linkUpgradedUser('anon-nuevo');
    expect(sdk.logIn).not.toHaveBeenCalled();
  });

  it('sin configurar, no enlaza', async () => {
    __resetForTests();
    __setApiKeyForTests('test-key');
    sdk.__setAppUserID('ana');
    await linkUpgradedUser('anon-nuevo');
    expect(sdk.logIn).not.toHaveBeenCalled();
    expect(sdk.isAnonymous).not.toHaveBeenCalled();
  });

  it('si el ultimo logIn pedido ya es ese uid (un evento llego a linkUser), no lo repite', async () => {
    await linkUser('anon-nuevo');
    await linkUpgradedUser('anon-nuevo');
    expect(sdk.logIn.mock.calls).toEqual([['anon-nuevo']]);
  });

  it('si su logIn falla, queda pendiente y se reintenta antes de comprar', async () => {
    sdk.__setAppUserID('ana');
    sdk.logIn.mockRejectedValueOnce({code: '10', message: 'network'});
    await linkUpgradedUser('anon-nuevo');
    await expect(getPendingLinkUid()).resolves.toBe('anon-nuevo');
    await purchaseUnlock({identifier: 'o1'} as never);
    expect(sdk.logIn.mock.calls).toEqual([['anon-nuevo'], ['anon-nuevo']]);
  });
});

// ---------------------------------------------------------------------------
// R9-581 — un rechazo de logIn que llega DESPUES de que otro logIn ya se pidio
// no anota nada: la nota lleva el orden del pedido.
// ---------------------------------------------------------------------------
describe('R9-581 — un rechazo tardio no anota a una cuenta que ya no es la ultima', () => {
  const sdk = Purchases as unknown as {
    logIn: jest.Mock;
    __setAppUserID: (id: string) => void;
    __reset: () => void;
  };

  beforeEach(async () => {
    __resetForTests();
    sdk.__reset();
    await setPendingLinkUid(null);
    __setApiKeyForTests('test-key');
    await initialize();
  });
  afterEach(async () => {
    __resetForTests();
    sdk.__reset();
    await setPendingLinkUid(null);
  });

  it('beto en vuelo; carla entra y resuelve; despues rechaza beto: nada pendiente, y la compra no hace logIn', async () => {
    sdk.__setAppUserID('ana');
    let rejectBeto!: (e: unknown) => void;
    sdk.logIn.mockImplementationOnce(
      () =>
        new Promise((_res, rej) => {
          rejectBeto = rej;
        }),
    );
    const beto = linkUser('beto');
    await linkUser('carla');
    sdk.__setAppUserID('carla');
    rejectBeto({code: '10', message: 'network'});
    await beto;

    await expect(getPendingLinkUid()).resolves.toBeNull();
    await purchaseUnlock({identifier: 'o1'} as never);
    expect(sdk.logIn.mock.calls).toEqual([['beto'], ['carla']]);
  });

  it('control: el rechazo del ultimo pedido si se anota', async () => {
    sdk.__setAppUserID('ana');
    sdk.logIn.mockRejectedValueOnce({code: '10', message: 'network'});
    await linkUser('beto');
    await expect(getPendingLinkUid()).resolves.toBe('beto');
  });
});
