/**
 * Sprint 50 — device-local premium flag store.
 *
 * Rewired for the offering infrastructure tanda: premiumStore is now a thin
 * shim over the expo-secure-store-backed entitlementCache (see
 * src/lib/offering/entitlementCache.ts), keeping the exact same public API
 * so every usePremium() consumer needed zero changes.
 */

import * as SecureStore from 'expo-secure-store';
import {
  getPremiumUnlocked,
  setPremiumUnlocked,
} from '../src/lib/premium/premiumStore';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';

describe('premiumStore', () => {
  beforeEach(async () => {
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('defaults to locked when nothing is persisted', async () => {
    await expect(getPremiumUnlocked()).resolves.toBe(false);
  });

  it('persists and reads back the unlocked flag', async () => {
    await setPremiumUnlocked(true);
    await expect(getPremiumUnlocked()).resolves.toBe(true);
    await expect(SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY)).resolves.toBe(
      'true',
    );
  });

  it('can be locked again after unlocking', async () => {
    await setPremiumUnlocked(true);
    await setPremiumUnlocked(false);
    await expect(getPremiumUnlocked()).resolves.toBe(false);
  });

  it('treats any non-"true" stored value as locked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'yes');
    await expect(getPremiumUnlocked()).resolves.toBe(false);
  });
});
