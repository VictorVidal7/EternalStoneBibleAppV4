/**
 * redeemGiftCode — Cloud Functions for Firebase (2nd gen) HTTPS function.
 *
 * Lets a signed-in, NON-anonymous Firebase user redeem a one-time gift code
 * for a REAL RevenueCat entitlement grant on `extras` — the same
 * entitlement id a real "ofrenda" purchase grants client-side (see
 * ENTITLEMENT_ID in the app's src/lib/offering/offeringService.ts). This
 * exists so Victor can hand out redemption codes without manually granting
 * each one from the RevenueCat dashboard.
 *
 * Deliberately `onRequest`, NOT `onCall`: `onCall` needs the
 * @react-native-firebase/functions native module on the client, which the
 * app does not currently depend on — adding it would force every existing
 * debug/release APK to be rebuilt just for this one feature. The app calls
 * this with a plain `fetch()` instead (see
 * src/lib/offering/giftCodeService.ts), the same pattern the app already
 * uses for src/lib/database/version-download-service.ts's catalog fetch.
 *
 * Anonymous Firebase uids are not stable across reinstalls, so a gifted
 * entitlement granted to one would become unrecoverable the moment the user
 * reinstalls or clears app data — redemption REQUIRES a real signed-in user
 * (Victor's explicit product decision).
 *
 * Grant-then-mark-redeemed ordering is deliberate (see handleRedeem below):
 * a code must never be marked "burned" without the person actually
 * receiving the entitlement. A narrow race window on two concurrent
 * redemptions of the exact same code (both could pass the initial
 * read-before-transaction check and both get granted, before the Firestore
 * transaction lets only one "win" the bookkeeping write) is an accepted
 * tradeoff at this app's expected volume — Victor manually creates and
 * hands out a small number of codes, not a public self-serve flow. This is
 * NOT engineered into a bigger distributed-lock design.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import {onRequest, Request} from 'firebase-functions/v2/https';
import {defineSecret} from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import type {Response} from 'express';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {
  getFirestore,
  FieldValue,
  type Firestore,
} from 'firebase-admin/firestore';

initializeApp();

/**
 * RevenueCat SECRET key (starts with `sk_`) — NOT the public SDK key
 * hardcoded in the app's offeringService.ts (that one is client-safe and
 * fine to commit; this one is not and must never be). Set once via:
 *
 *   firebase functions:secrets:set REVENUECAT_SECRET_KEY
 *
 * `defineSecret` below both declares the dependency and (via the `secrets`
 * option passed to `onRequest`) grants this function access to the stored
 * value at runtime through Secret Manager — nothing is ever hardcoded here.
 */
const REVENUECAT_SECRET_KEY = defineSecret('REVENUECAT_SECRET_KEY');

/**
 * RevenueCat entitlement identifier. MUST match ENTITLEMENT_ID in the app's
 * src/lib/offering/offeringService.ts — there is no shared module between
 * this Node project and the Expo app, so keep these two constants in sync
 * by hand if the entitlement is ever renamed in the RevenueCat dashboard.
 */
const ENTITLEMENT_ID = 'extras';

/**
 * Grant duration for a redeemed code. RevenueCat's promotional-entitlement
 * endpoint accepts a fixed set of duration keywords; `lifetime` is the
 * longest one available (RevenueCat documents it as effectively permanent).
 *
 * JUDGMENT CALL / UNVERIFIED ASSUMPTION: this assumes the app's real
 * "ofrenda" purchase packages ALSO grant a lifetime (non-expiring)
 * entitlement — offeringService.ts's comment says all 3 unlock-tier
 * packages grant the identical entitlement id, but does not document
 * their duration. VERIFY this against the real RevenueCat/Play Console
 * product configuration before distributing any real gift codes. If the
 * real packages are actually a renewing subscription rather than a true
 * one-time lifetime grant, change this constant to match so a gifted code
 * doesn't out-live (or under-cut) a real purchase.
 */
const GRANT_DURATION = 'lifetime';

/** Firestore doc shape at `giftCodes/{code}` (top-level collection). */
interface GiftCodeDoc {
  redeemed: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  redeemedByUid: string | null;
  redeemedAt: FirebaseFirestore.Timestamp | null;
  note: string | null;
}

/**
 * Every possible response shape, paired with the HTTP status it's sent
 * under. The client (giftCodeService.ts) maps `body.status` to its own
 * RedeemOutcome union — keep the string values here in sync with that
 * mapping if either side ever changes.
 */
type RedeemResult =
  | {httpStatus: 200; body: {status: 'success'}}
  | {httpStatus: 400; body: {status: 'invalid_request'; message: string}}
  | {httpStatus: 401; body: {status: 'invalid_token'; message: string}}
  | {httpStatus: 404; body: {status: 'not_found'}}
  | {httpStatus: 409; body: {status: 'already_redeemed'}}
  | {httpStatus: 500; body: {status: 'server_error'; message: string}};

/** Calls RevenueCat's REST API to grant the promotional entitlement. Throws on failure. */
async function grantPromotionalEntitlement(
  uid: string,
  secretKey: string,
): Promise<void> {
  const url =
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}` +
    `/entitlements/${encodeURIComponent(ENTITLEMENT_ID)}/promotional`;

  // No `X-Platform` header on purpose — RevenueCat treats a secret-key
  // request that carries a platform header as a potential leaked-secret
  // signal (it expects platform headers only from client SDK requests,
  // which never carry a secret key) and rejects it.
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({duration: GRANT_DURATION}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `RevenueCat promotional-entitlement grant failed: ${res.status} ${detail}`,
    );
  }
}

/**
 * Core handler, separated from the onRequest wrapper so it's testable
 * in isolation if a test harness is ever added (none exists yet — see the
 * task report for why: no Blaze/emulator access from this environment).
 */
async function handleRedeem(
  req: Request,
  db: Firestore,
  revenueCatSecretKey: string,
): Promise<RedeemResult> {
  if (req.method !== 'POST') {
    return {
      httpStatus: 400,
      body: {status: 'invalid_request', message: 'POST required'},
    };
  }

  const rawCode = (req.body as {code?: unknown} | undefined)?.code;
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';
  if (!code) {
    return {
      httpStatus: 400,
      body: {status: 'invalid_request', message: 'Missing "code" in body'},
    };
  }

  const authHeader = req.get('Authorization') ?? '';
  const bearerMatch = /^Bearer (.+)$/.exec(authHeader);
  if (!bearerMatch) {
    return {
      httpStatus: 401,
      body: {
        status: 'invalid_token',
        message: 'Missing Authorization: Bearer <idToken> header',
      },
    };
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(bearerMatch[1]);
  } catch (err) {
    logger.warn('redeemGiftCode: verifyIdToken failed', {error: String(err)});
    return {
      httpStatus: 401,
      body: {status: 'invalid_token', message: 'Invalid or expired token'},
    };
  }

  // Victor's explicit product decision: an anonymous Firebase uid is not
  // stable across reinstalls, so a gift would become unrecoverable.
  if (decoded.firebase?.sign_in_provider === 'anonymous') {
    return {
      httpStatus: 401,
      body: {
        status: 'invalid_token',
        message: 'Anonymous accounts cannot redeem gift codes',
      },
    };
  }
  const uid = decoded.uid;

  const codeRef = db.collection('giftCodes').doc(code);
  const snap = await codeRef.get();
  if (!snap.exists) {
    return {httpStatus: 404, body: {status: 'not_found'}};
  }
  const data = snap.data() as GiftCodeDoc;
  if (data.redeemed) {
    return {httpStatus: 409, body: {status: 'already_redeemed'}};
  }

  // Grant FIRST, mark-redeemed SECOND (see file header) — the code must
  // never be burned without the person actually receiving the entitlement.
  try {
    await grantPromotionalEntitlement(uid, revenueCatSecretKey);
  } catch (err) {
    logger.error('redeemGiftCode: RevenueCat grant failed', {
      code,
      uid,
      error: String(err),
    });
    return {
      httpStatus: 500,
      body: {
        status: 'server_error',
        message: 'Could not grant the entitlement — code was NOT marked redeemed, safe to retry',
      },
    };
  }

  try {
    await db.runTransaction(async tx => {
      const fresh = await tx.get(codeRef);
      if (!fresh.exists) return; // deleted mid-flight — nothing left to mark
      const freshData = fresh.data() as GiftCodeDoc;
      // A concurrent request already won the race and marked this code
      // redeemed (see the file header's accepted-tradeoff note) — leave
      // their record as the canonical one instead of overwriting it. The
      // grant to THIS caller's uid already happened either way.
      if (freshData.redeemed) return;
      tx.update(codeRef, {
        redeemed: true,
        redeemedByUid: uid,
        redeemedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    // The entitlement WAS granted; only the bookkeeping write failed. Log
    // loudly for manual follow-up rather than telling this user it failed —
    // they already received what they redeemed for.
    logger.error(
      'redeemGiftCode: grant succeeded but mark-redeemed write failed',
      {code, uid, error: String(err)},
    );
  }

  return {httpStatus: 200, body: {status: 'success'}};
}

export const redeemGiftCode = onRequest(
  {region: 'us-central1', secrets: [REVENUECAT_SECRET_KEY]},
  async (req: Request, res: Response) => {
    try {
      const result = await handleRedeem(
        req,
        getFirestore(),
        REVENUECAT_SECRET_KEY.value(),
      );
      res.status(result.httpStatus).json(result.body);
    } catch (err) {
      logger.error('redeemGiftCode: unhandled error', {error: String(err)});
      res
        .status(500)
        .json({status: 'server_error', message: 'Unexpected server error'});
    }
  },
);
