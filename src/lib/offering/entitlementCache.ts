/**
 * Entitlement cache — expo-secure-store-backed cache of the premium
 * entitlement, for a correct-looking cold start before RevenueCat's
 * CustomerInfo has had a chance to load over the network.
 *
 * RevenueCat's CustomerInfo (via offeringService) is the real source of
 * truth and overwrites this cache the moment it resolves; this is only ever
 * a bridge value for the first paint. It replaces the old plaintext
 * AsyncStorage boolean (`@premium_unlocked`), which was trivially editable
 * on a rooted/jailbroken device — not a real security boundary, but no
 * reason to leave an entitlement flag in plain AsyncStorage once
 * expo-secure-store is already a dependency.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import * as SecureStore from 'expo-secure-store';
import {logger} from '@lib/utils/logger';

export const ENTITLEMENT_CACHE_KEY = 'offering_entitlement_cache';

/** Whether premium features were last known to be unlocked. Defaults to false. */
export async function getCachedEntitlement(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY);
    return value === 'true';
  } catch (error) {
    logger.warn('Failed to read entitlement cache, defaulting to locked', {
      component: 'entitlementCache',
      error: String(error),
    });
    return false;
  }
}

/** Persist the last-known entitlement state. */
export async function setCachedEntitlement(value: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      ENTITLEMENT_CACHE_KEY,
      value ? 'true' : 'false',
    );
  } catch (error) {
    logger.warn('Failed to persist entitlement cache', {
      component: 'entitlementCache',
      error: String(error),
    });
  }
}
