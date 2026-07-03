/**
 * Premium entitlement — thin read/write shim over the entitlement cache.
 *
 * Originally (Sprint 50) this was a device-local AsyncStorage boolean with
 * no real purchase behind it. As of the offering infrastructure tanda, the
 * real source of truth is RevenueCat's CustomerInfo (see
 * src/lib/offering/offeringService.ts), which writes into the
 * expo-secure-store-backed entitlementCache whenever the entitlement
 * changes; this module just exposes that cache under the SAME public API so
 * every existing usePremium() consumer needed zero changes.
 *
 * setPremiumUnlocked is now a __DEV__-only manual override (see
 * PremiumContext.setPremium, which gates it) — it writes straight to the
 * cache for local testing without a real purchase. It never talks to
 * RevenueCat, so flipping it does not create or revoke a real entitlement.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import {
  getCachedEntitlement,
  setCachedEntitlement,
} from '@lib/offering/entitlementCache';

/** Whether premium features are unlocked on this device. Defaults to false. */
export async function getPremiumUnlocked(): Promise<boolean> {
  return getCachedEntitlement();
}

/** Persist the premium-unlocked flag. See the module docstring — __DEV__-only in practice. */
export async function setPremiumUnlocked(value: boolean): Promise<void> {
  await setCachedEntitlement(value);
}
