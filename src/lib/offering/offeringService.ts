/**
 * Offering service — the ONLY module that talks to react-native-purchases
 * (RevenueCat) directly. Everything else (premiumStore, PremiumContext, and
 * eventually the offering/donation UI in a later tanda) goes through this
 * wrapper, so the SDK itself can be swapped or mocked without touching
 * consumers. Mirrors the app's established lazy-require pattern (see
 * AuthContext.tsx / logger.ts's Crashlytics loader) so a missing/unlinked
 * native module never crashes the app or jest.
 *
 * Android-first: only an Android product/entitlement setup exists today (see
 * the plan) — nothing here hard-blocks iOS at the code level, so adding an
 * iOS key/products later needs no rewiring here. Dormant by design until:
 *  1. `apiKey` below is set to a real key from https://app.revenuecat.com
 *     (leave empty to keep the system dormant — the default today).
 *  2. The app is installed from an app store (Play Billing doesn't work on a
 *     sideloaded APK) — isBillingAvailable() reflects this at runtime.
 * Until both hold, every function here safely no-ops and usePremium()
 * behaves exactly as it did before this module existed (local flag only).
 *
 * Para la gloria de Dios Todopoderoso.
 */

import {logger} from '@lib/utils/logger';
import {setCachedEntitlement} from './entitlementCache';
import type {
  CustomerInfo,
  PurchasesPackage,
  PurchasesStoreProduct,
} from 'react-native-purchases';

// RevenueCat's Android public SDK key for the "Eternal Stone Bible" app
// (project "Eternal Stone"). Client-safe public key (like a Firebase
// apiKey), not a secret — fine to commit.
let apiKey = 'goog_pNQZBGDwlYVmDydhAtPBIVvVDbY';

/** Test-only: simulates a configured API key without editing the constant above. */
export function __setApiKeyForTests(key: string): void {
  apiKey = key;
}

/** RevenueCat entitlement identifier configured in the dashboard. */
export const ENTITLEMENT_ID = 'extras';
/** RevenueCat offering identifier holding the 3 unlock-tier packages. */
export const OFFERING_ID = 'default';
/** Consumable donation product ids (Play Console), not tied to any entitlement. */
export const DONATION_PRODUCT_IDS = [
  'donacion_1',
  'donacion_2',
  'donacion_3',
  'donacion_4',
] as const;

export type EntitlementListener = (isUnlocked: boolean) => void;

export type PurchaseOutcome =
  | {status: 'success'}
  | {status: 'cancelled'}
  | {status: 'alreadyOwned'}
  /** The store charged, but the entitlement is not active (R9-17). */
  | {status: 'notActivated'}
  /** The payment was started and is awaiting confirmation (R9-18). */
  | {status: 'pending'}
  | {status: 'error'; message: string};

/**
 * `'notFound'` = the store answered, and there is no previous offering.
 * `'error'` = the store could not be asked. Never collapse the two (R9-16).
 */
export type RestoreOutcome =
  {status: 'restored'} | {status: 'notFound'} | {status: 'error'};

type PurchasesStatic = {
  configure: (config: {apiKey: string; appUserID?: string}) => void;
  addCustomerInfoUpdateListener: (cb: (info: CustomerInfo) => void) => void;
  removeCustomerInfoUpdateListener: (cb: (info: CustomerInfo) => void) => void;
  getCustomerInfo: () => Promise<CustomerInfo>;
  getOfferings: () => Promise<{
    all: Record<string, {availablePackages: PurchasesPackage[]}>;
  }>;
  getProducts: (
    ids: string[],
    type?: 'SUBSCRIPTION' | 'NON_SUBSCRIPTION',
  ) => Promise<PurchasesStoreProduct[]>;
  purchasePackage: (
    pkg: PurchasesPackage,
  ) => Promise<{customerInfo: CustomerInfo}>;
  purchaseStoreProduct: (
    product: PurchasesStoreProduct,
  ) => Promise<{customerInfo: CustomerInfo}>;
  restorePurchases: () => Promise<CustomerInfo>;
  logIn: (uid: string) => Promise<{customerInfo: CustomerInfo}>;
  invalidateCustomerInfoCache: () => Promise<void>;
  canMakePayments: () => Promise<boolean>;
  setLogHandler: (handler: (level: string, message: string) => void) => void;
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: string;
    PRODUCT_ALREADY_PURCHASED_ERROR: string;
    PAYMENT_PENDING_ERROR?: string;
  };
};

let _purchases: PurchasesStatic | null | undefined;
function getPurchases(): PurchasesStatic | null {
  if (_purchases !== undefined) return _purchases;
  try {
    const mod = require('react-native-purchases');
    _purchases = (mod.default || mod) as PurchasesStatic;
  } catch {
    _purchases = null;
  }
  return _purchases;
}

/** Test-only: forces the next getPurchases() call to re-resolve the module. */
export function __resetForTests(): void {
  _purchases = undefined;
  configured = false;
  lastKnownUnlocked = null;
  listeners.clear();
  apiKey = '';
}

let configured = false;
/**
 * R9-9 — `null` means "RevenueCat has not answered yet in this process", and
 * that is NOT the same as "not unlocked". This used to be a plain `boolean`
 * initialised to `false` on every process start, which made the dedupe below
 * read `false === false` on the first answer of any launch where the
 * entitlement was INACTIVE — so it returned early, before writing the cache
 * and before notifying. A stale `'true'` in the secure cache was therefore
 * never corrected: paid access survived a refund, and the second user of a
 * shared phone inherited the first one's premium. Only uninstalling cleared
 * it (`grep` of SecureStore: `entitlementCache.ts` is the sole writer, and
 * neither sign-out, nor delete-account, nor the Settings reset touch it).
 *
 * The defect was asymmetric — only the direction that TAKES ACCESS AWAY
 * failed — which is exactly why no test and no manual pass caught it.
 */
let lastKnownUnlocked: boolean | null = null;
const listeners = new Set<EntitlementListener>();

function isEntitlementActive(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

async function handleCustomerInfo(info: CustomerInfo): Promise<void> {
  const unlocked = isEntitlementActive(info);
  // R9-9 — deduping was never the problem; taking `false` for a KNOWN state
  // was. The first answer of a process is always a change (`null` !== either
  // boolean), so it always reaches the cache write and the listeners below.
  if (unlocked === lastKnownUnlocked) return;
  lastKnownUnlocked = unlocked;
  await setCachedEntitlement(unlocked);
  for (const cb of listeners) {
    try {
      cb(unlocked);
    } catch (err) {
      logger.warn('offeringService: entitlement listener threw', {
        component: 'offeringService',
        error: err,
      });
    }
  }
}

/** Configures the SDK and syncs the current entitlement. Safe to call more than once. */
export async function initialize(): Promise<void> {
  if (configured) return;
  if (!apiKey) {
    logger.info(
      'offeringService: no RevenueCat API key configured — offering system stays dormant',
      {component: 'offeringService', action: 'initialize'},
    );
    return;
  }
  const Purchases = getPurchases();
  if (!Purchases) {
    logger.warn(
      'offeringService: react-native-purchases native module unavailable',
      {
        component: 'offeringService',
        action: 'initialize',
      },
    );
    return;
  }
  try {
    // RevenueCat logs its own internal SDK activity straight to
    // console.error/warn, which LogBox surfaces as a scary red banner even
    // for conditions this module already handles gracefully (e.g. "billing
    // unavailable" on a sideloaded install — expected until the app is on
    // Play). Route it through our own logger instead, at low severity.
    Purchases.setLogHandler((level, message) => {
      logger.debug(`offeringService: [RevenueCat ${level}] ${message}`, {
        component: 'offeringService',
      });
    });
    Purchases.configure({apiKey});
    configured = true;
    Purchases.addCustomerInfoUpdateListener(info => {
      handleCustomerInfo(info).catch(err =>
        logger.warn('offeringService: handling customerInfo update failed', {
          component: 'offeringService',
          error: err,
        }),
      );
    });
    const info = await Purchases.getCustomerInfo();
    await handleCustomerInfo(info);
  } catch (err) {
    logger.error('offeringService: initialize failed', err as Error, {
      component: 'offeringService',
      action: 'initialize',
    });
  }
}

/** Whether Play Billing is actually usable right now (false on a sideloaded APK). */
export async function isBillingAvailable(): Promise<boolean> {
  if (!configured) return false;
  const Purchases = getPurchases();
  if (!Purchases) return false;
  try {
    return await Purchases.canMakePayments();
  } catch {
    return false;
  }
}

/**
 * Associates the current device's purchases with a stable app user id
 * (the Firebase uid — anonymous or signed-in, see AuthContext). Best-effort
 * and safe to call repeatedly.
 *
 * R9-119 — this comment used to say «never call the corresponding logOut on
 * sign-out, so an offering already given stays unlocked on this device».
 * The first half holds (RevenueCat's logOut is never called); the conclusion
 * does not. AuthContext signs a new anonymous user in right after a
 * sign-out and links THAT uid here; RevenueCat answers for it with a
 * customer that has no purchases, and handleCustomerInfo() locks the extras
 * until the buyer signs back in (measured with the real AuthProvider and
 * this service). Whether the offering belongs to the account or to the
 * device is an open product decision: this only describes what the code
 * does today.
 *
 * It is also a silent no-op until initialize() has configured the SDK —
 * which, on a cold start, is after AuthContext's first call (R9-135, open).
 */
export async function linkUser(uid: string | null): Promise<void> {
  if (!configured || !uid) return;
  const Purchases = getPurchases();
  if (!Purchases) return;
  try {
    const {customerInfo} = await Purchases.logIn(uid);
    await handleCustomerInfo(customerInfo);
  } catch (err) {
    logger.warn('offeringService: linkUser failed', {
      component: 'offeringService',
      action: 'linkUser',
      error: err,
    });
  }
}

/** The 3 one-time "ofrenda" unlock packages, all granting the same entitlement. */
export async function getUnlockPackages(): Promise<PurchasesPackage[]> {
  const Purchases = getPurchases();
  if (!configured || !Purchases) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all[OFFERING_ID]?.availablePackages ?? [];
  } catch (err) {
    logger.warn('offeringService: getUnlockPackages failed', {
      component: 'offeringService',
      error: err,
    });
    return [];
  }
}

/** The repeatable, non-entitlement "donación" products. */
export async function getDonationProducts(): Promise<PurchasesStoreProduct[]> {
  const Purchases = getPurchases();
  if (!configured || !Purchases) return [];
  try {
    // Play Console's donación products are one-time ("Productos únicos"),
    // not subscriptions — the SDK's getProducts() defaults to querying
    // SUBSCRIPTION when no type is passed, which silently returned an
    // empty array for these ids on every real device (confirmed live
    // 2026-08-19: the sheet auto-closed instantly, no error surfaced).
    return await Purchases.getProducts(
      [...DONATION_PRODUCT_IDS],
      'NON_SUBSCRIPTION',
    );
  } catch (err) {
    logger.warn('offeringService: getDonationProducts failed', {
      component: 'offeringService',
      error: err,
    });
    return [];
  }
}

function outcomeFromError(err: unknown): PurchaseOutcome {
  const code = (err as {code?: string})?.code;
  // `code` matching PURCHASE_CANCELLED_ERROR is RevenueCat's recommended
  // check; `userCancelled` is its older, now-deprecated equivalent — kept
  // as a fallback in case a store/platform only reports the boolean.
  const codes = getPurchases()?.PURCHASES_ERROR_CODE;
  // Never `undefined === undefined`: an error without a code, compared with
  // a constant this SDK version does not have, must stay a plain error.
  const is = (known: string | undefined): boolean =>
    code !== undefined && known !== undefined && code === known;
  const cancelled =
    (err as {userCancelled?: boolean})?.userCancelled === true ||
    is(codes?.PURCHASE_CANCELLED_ERROR);
  if (cancelled) return {status: 'cancelled'};
  if (is(codes?.PRODUCT_ALREADY_PURCHASED_ERROR)) {
    return {status: 'alreadyOwned'};
  }
  // R9-18 — a payment that is PENDING (cash at a convenience store, a bank
  // transfer: OXXO and SPEI in this app's main market) is reported by the
  // SDK as a rejection, but it is not a failure: the payment is under way.
  // It used to fall through to the generic error below, and both sheets
  // asked the reader to «try again» — to repeat a payment already started.
  if (is(codes?.PAYMENT_PENDING_ERROR)) return {status: 'pending'};
  return {
    status: 'error',
    message: err instanceof Error ? err.message : String(err),
  };
}

/**
 * Purchases one of the unlock-tier packages. All three grant the same entitlement.
 *
 * R9-17 — `'success'` means the entitlement IS active, not "the store call
 * resolved". This used to return `'success'` without looking at the
 * `CustomerInfo` it had just been handed (while `restore()` did look, at the
 * same data): if the entitlement was not on it — a product not attached to
 * the entitlement in the dashboard, a stale snapshot — the store charged, the
 * sheet said «Gracias por sembrar en esta obra» and everything stayed locked.
 *
 * Only the store call itself may answer `'error'`/`'cancelled'`. Once it has
 * resolved the reader HAS been charged, so nothing after it may tell them to
 * try again: it re-reads once (bypassing the SDK's cache) and, if the
 * entitlement still is not there, answers `'notActivated'`.
 */
export async function purchaseUnlock(
  pkg: PurchasesPackage,
): Promise<PurchaseOutcome> {
  const Purchases = getPurchases();
  if (!configured || !Purchases) {
    return {status: 'error', message: 'Offering system not initialized'};
  }
  let customerInfo: CustomerInfo;
  try {
    ({customerInfo} = await Purchases.purchasePackage(pkg));
  } catch (err) {
    return outcomeFromError(err);
  }
  try {
    await handleCustomerInfo(customerInfo);
    if (isEntitlementActive(customerInfo)) return {status: 'success'};
    await Purchases.invalidateCustomerInfoCache();
    const fresh = await Purchases.getCustomerInfo();
    await handleCustomerInfo(fresh);
    if (isEntitlementActive(fresh)) return {status: 'success'};
  } catch (err) {
    logger.warn('offeringService: confirming the entitlement failed', {
      component: 'offeringService',
      action: 'purchaseUnlock',
      error: err,
    });
  }
  logger.warn('offeringService: purchase resolved without the entitlement', {
    component: 'offeringService',
    action: 'purchaseUnlock',
  });
  return {status: 'notActivated'};
}

/** Purchases one donation tier (consumable, no entitlement granted). */
export async function purchaseDonation(
  product: PurchasesStoreProduct,
): Promise<PurchaseOutcome> {
  const Purchases = getPurchases();
  if (!configured || !Purchases) {
    return {status: 'error', message: 'Offering system not initialized'};
  }
  try {
    await Purchases.purchaseStoreProduct(product);
    return {status: 'success'};
  } catch (err) {
    return outcomeFromError(err);
  }
}

/**
 * Restores a previous offering on a new install / device, via the store account.
 *
 * R9-16 — three answers, not two. This used to return `{unlocked: false}`
 * both when the store answered "no previous offering" and when the store
 * could not be asked at all (no network, store problem, not configured), and
 * the sheet turned both into «No encontramos una ofrenda anterior en esta
 * cuenta». Someone who HAD paid and restored on a bad connection was told
 * their purchase did not exist. `'notFound'` is now only ever said by the
 * store itself; everything else is `'error'`.
 */
export async function restore(): Promise<RestoreOutcome> {
  const Purchases = getPurchases();
  if (!configured || !Purchases) return {status: 'error'};
  try {
    const info = await Purchases.restorePurchases();
    await handleCustomerInfo(info);
    return {status: isEntitlementActive(info) ? 'restored' : 'notFound'};
  } catch (err) {
    logger.warn('offeringService: restore failed', {
      component: 'offeringService',
      error: err,
    });
    return {status: 'error'};
  }
}

/**
 * Forces an immediate re-sync with RevenueCat's CustomerInfo, bypassing the
 * wait for its async `addCustomerInfoUpdateListener` push. Used right after
 * an entitlement was granted out-of-band from a normal in-app purchase —
 * today that's only gift-code redemption (see giftCodeService.ts's
 * redeemGiftCode(), which grants the entitlement server-side via the
 * RevenueCat REST API) — so the UI reflects it immediately instead of
 * waiting on RevenueCat's next push, which can lag by several seconds.
 * Reuses the same handleCustomerInfo() the listener itself calls, so this
 * stays the identical single source of truth described at the top of this
 * file — it's just an on-demand trigger for it, not a new state path.
 *
 * Explicitly invalidates the SDK's own CustomerInfo cache first —
 * RevenueCat's docs call this out by name for exactly this situation
 * ("customer information...updated outside of the app, like if a
 * promotional subscription is granted through the RevenueCat dashboard"),
 * which is precisely what a gift-code redemption is. Without this,
 * getCustomerInfo() can keep serving a pre-grant cached snapshot for its
 * normal TTL, silently defeating the whole point of this function.
 */
export async function refreshEntitlement(): Promise<void> {
  const Purchases = getPurchases();
  if (!configured || !Purchases) return;
  try {
    await Purchases.invalidateCustomerInfoCache();
    const info = await Purchases.getCustomerInfo();
    await handleCustomerInfo(info);
  } catch (err) {
    logger.warn('offeringService: refreshEntitlement failed', {
      component: 'offeringService',
      error: err,
    });
  }
}

/** Subscribes to entitlement changes; returns an unsubscribe function. */
export function onEntitlementChange(cb: EntitlementListener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * The last entitlement state seen from RevenueCat (not the persisted cache).
 * Reports `false` while still unresolved (R9-9's `null`): callers asking
 * "is this unlocked" must never be told `true` on a guess.
 */
export function getLastKnownEntitlement(): boolean {
  return lastKnownUnlocked === true;
}
