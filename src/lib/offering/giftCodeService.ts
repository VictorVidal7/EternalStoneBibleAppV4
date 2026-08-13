/**
 * Gift-code redemption — the client half of the `redeemGiftCode` Cloud
 * Function (functions/src/index.ts). Lets a signed-in, non-anonymous user
 * trade a one-time code (generated via scripts/generate-gift-codes.js) for
 * a REAL RevenueCat entitlement grant on `extras` — the same entitlement a
 * real "ofrenda" purchase grants (see offeringService.ts's ENTITLEMENT_ID).
 *
 * Calls the function with a plain fetch(), NOT
 * @react-native-firebase/functions' onCall wrapper — deliberately, to avoid
 * adding a new native dependency just for this feature (every existing
 * debug/release APK would need rebuilding). Mirrors the fetch() pattern
 * already used by src/lib/database/version-download-service.ts's catalog
 * fetch. The ID token comes from @react-native-firebase/auth, which the app
 * already depends on (see AuthContext.tsx's own lazy-require pattern,
 * mirrored here so this module is also safe to import under Jest without a
 * native binding).
 *
 * This module never touches PremiumContext/offeringService's cached
 * entitlement state directly — the grant happens server-side against
 * RevenueCat, which is the single source of truth (see offeringService.ts's
 * header comment). After a 'success' outcome, call
 * offeringService.refreshEntitlement() so the UI updates immediately
 * instead of waiting on RevenueCat's async CustomerInfo listener push.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import {logger} from '@lib/utils/logger';

/**
 * Deployed Cloud Function URL. This is the standard deterministic URL shape
 * for a 2nd-gen `onRequest` function
 * (`https://<region>-<project-id>.cloudfunctions.net/<name>`), built from
 * this repo's real Firebase project id (see .firebaserc) and the function's
 * declared `region: 'us-central1'` (functions/src/index.ts) — so it should
 * already be correct once deployed. It only resolves AFTER Victor runs
 * `firebase deploy --only functions` (see the gift-code-redemption report's
 * setup steps). Occasionally a 2nd-gen function's deterministic
 * cloudfunctions.net URL fails to provision; if this 404s after deploying,
 * use the Cloud Run-style URL from the `firebase deploy` output instead and
 * update this constant.
 */
export const REDEEM_GIFT_CODE_URL =
  'https://us-central1-eternal-stone-bible-app-5ad27.cloudfunctions.net/redeemGiftCode';

/** Mirrors offeringService.ts's PurchaseOutcome shape/style for consistency. */
export type RedeemOutcome =
  | {status: 'success'}
  | {status: 'already_redeemed'}
  | {status: 'not_found'}
  | {status: 'invalid'}
  | {status: 'error'; message: string};

type FirebaseUser = {getIdToken: () => Promise<string>};
type AuthModule = {(): {currentUser: FirebaseUser | null}};

let _authModule: AuthModule | null | undefined;
function getAuthModule(): AuthModule | null {
  if (_authModule !== undefined) return _authModule;
  try {
    const mod = require('@react-native-firebase/auth');
    _authModule = (mod.default || mod) as AuthModule;
  } catch {
    _authModule = null;
  }
  return _authModule;
}

/** Test-only: forces the next getAuthModule() call to re-resolve the module. */
export function __resetForTests(): void {
  _authModule = undefined;
}

/** Shape of the Cloud Function's JSON response (see functions/src/index.ts's RedeemResult). */
interface RedeemResponseBody {
  status?: string;
  message?: string;
}

/** Maps the function's response status string to this module's RedeemOutcome. */
function outcomeFromResponse(
  httpStatus: number,
  body: RedeemResponseBody,
): RedeemOutcome {
  switch (body.status) {
    case 'success':
      return {status: 'success'};
    case 'already_redeemed':
      return {status: 'already_redeemed'};
    case 'not_found':
      return {status: 'not_found'};
    // The function returns two distinct server-side reasons (a malformed
    // request vs. a bad/missing/anonymous token) that the UI doesn't need
    // to tell apart — both mean "this can't be redeemed as-is."
    case 'invalid_request':
    case 'invalid_token':
      return {status: 'invalid'};
    default:
      return {
        status: 'error',
        message: body.message ?? `Unexpected response (HTTP ${httpStatus})`,
      };
  }
}

/**
 * Redeems a one-time gift code for a real RevenueCat entitlement grant.
 * Requires a signed-in, non-anonymous Firebase user — the UI entry point
 * should already gate on that (see RedeemCodeSheet / settings.tsx), so the
 * "not signed in" case here mostly guards against a stale/transient auth
 * state rather than being the primary check; the server re-verifies the
 * token either way and is the actual source of truth.
 */
export async function redeemGiftCode(code: string): Promise<RedeemOutcome> {
  const trimmed = code.trim();
  if (!trimmed) {
    return {status: 'invalid'};
  }

  const authMod = getAuthModule();
  const currentUser = authMod ? authMod().currentUser : null;
  if (!currentUser) {
    logger.warn(
      'giftCodeService: redeemGiftCode called with no signed-in user',
      {
        component: 'giftCodeService',
        action: 'redeemGiftCode',
      },
    );
    return {status: 'invalid'};
  }

  let idToken: string;
  try {
    idToken = await currentUser.getIdToken();
  } catch (err) {
    logger.warn('giftCodeService: getIdToken failed', {
      component: 'giftCodeService',
      action: 'redeemGiftCode',
      error: err,
    });
    return {status: 'error', message: 'Could not get an auth token'};
  }

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(REDEEM_GIFT_CODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({code: trimmed}),
    });
  } catch (err) {
    logger.warn('giftCodeService: network request failed', {
      component: 'giftCodeService',
      action: 'redeemGiftCode',
      error: err,
    });
    return {status: 'error', message: 'Network error'};
  }

  let body: RedeemResponseBody = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (e.g. a proxy/edge error page) — falls through to the
    // generic error mapping below via the empty `body`.
  }

  return outcomeFromResponse(res.status, body);
}
