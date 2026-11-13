/**
 * The account whose RevenueCat logIn failed while RevenueCat was on an id
 * that is not one of its own `$RCAnonymousID` ids (R9-135; usually the
 * account that left). Kept on disk so the retry survives
 * the process: see offeringService's notePendingLink / initialize.
 *
 * Same store as the entitlement cache (expo-secure-store), same rule: a
 * storage failure is logged and never thrown.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import * as SecureStore from 'expo-secure-store';
import {logger} from '@lib/utils/logger';

export const PENDING_LINK_KEY = 'offering_pending_link_uid';

/** The uid still waiting for its logIn, or `null`. */
export async function getPendingLinkUid(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(PENDING_LINK_KEY)) || null;
  } catch (error) {
    logger.warn('Failed to read the pending RevenueCat link', {
      component: 'pendingLink',
      error: String(error),
    });
    return null;
  }
}

/** Notes the uid waiting for its logIn; `null` clears it. */
export async function setPendingLinkUid(uid: string | null): Promise<void> {
  try {
    if (uid === null) {
      await SecureStore.deleteItemAsync(PENDING_LINK_KEY);
    } else {
      await SecureStore.setItemAsync(PENDING_LINK_KEY, uid);
    }
  } catch (error) {
    logger.warn('Failed to persist the pending RevenueCat link', {
      component: 'pendingLink',
      error: String(error),
    });
  }
}
