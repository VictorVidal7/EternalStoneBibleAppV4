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
    it('returns unlocked: false when not configured', async () => {
      await expect(restore()).resolves.toEqual({unlocked: false});
    });

    it('restores a previous unlock and syncs the cache', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.restorePurchases.mockResolvedValueOnce(
        activeEntitlementInfo,
      );
      await expect(restore()).resolves.toEqual({unlocked: true});
      await expect(getCachedEntitlement()).resolves.toBe(true);
    });

    it('resolves unlocked: false (not throw) when the store call fails', async () => {
      __setApiKeyForTests('test-key');
      await initialize();
      mockPurchases.restorePurchases.mockRejectedValueOnce(
        new Error('offline'),
      );
      await expect(restore()).resolves.toEqual({unlocked: false});
    });
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
});
