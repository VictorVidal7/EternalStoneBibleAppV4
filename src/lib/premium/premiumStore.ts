/**
 * Premium entitlement — device-local feature flag (Sprint 50).
 *
 * "Premium" was purely a visual style until now (PremiumBadge/Button/etc.).
 * This is the first REAL gate: a single device-local boolean persisted to
 * AsyncStorage, defaulting to LOCKED. There is no IAP/paywall yet — unlocking
 * is a local toggle in Settings that stands in for a future purchase. Kept
 * deliberately small (mirrors goalStore.ts): if real in-app purchases land
 * later (e.g. RevenueCat), they replace this store's read/write while the
 * `usePremium()` gate consuming it stays put.
 *
 * Not synced — a real entitlement would come from store receipts, not our
 * Firestore user-data sync, so it stays out of the SyncEngine.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';

export const PREMIUM_STORAGE_KEY = '@premium_unlocked';

/** Whether premium features are unlocked on this device. Defaults to false. */
export async function getPremiumUnlocked(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
    return value === 'true';
  } catch (error) {
    logger.warn('Failed to read premium flag, defaulting to locked', {
      error: String(error),
    });
    return false;
  }
}

/** Persist the premium-unlocked flag. */
export async function setPremiumUnlocked(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, value ? 'true' : 'false');
  } catch (error) {
    logger.warn('Failed to persist premium flag', {error: String(error)});
  }
}
