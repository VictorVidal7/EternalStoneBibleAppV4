/**
 * redeemGiftCode — Vercel serverless port of functions/src/index.ts.
 *
 * Same logic, same request/response shape (the client, giftCodeService.ts,
 * only needed its REDEEM_GIFT_CODE_URL constant updated — outcomeFromResponse()
 * there already parses a generic `{status: ...}` body). Ported off Firebase
 * Cloud Functions because Cloud Functions requires the Blaze billing plan
 * (unavailable on Spark at any usage level), which converts the WHOLE
 * Firebase project to overage-billed instead of hard-capped. Vercel's free
 * Hobby tier has a genuine hard usage cap with NO overage billing — the
 * deployment just pauses until the next cycle instead of charging anything.
 * See project memory essb-gift-code-redemption for the full decision trail.
 *
 * Env vars required (set via `vercel env add`, never committed):
 *   FIREBASE_SERVICE_ACCOUNT — the full JSON contents of
 *     scripts/firebase-admin-key.json, as a single-line string.
 *   REVENUECAT_SECRET_KEY — RevenueCat's secret API key (starts with `sk_`),
 *     from the RevenueCat dashboard. NOT the public SDK key already
 *     hardcoded client-side in offeringService.ts.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import type {VercelRequest, VercelResponse} from '@vercel/node';
import {cert, getApps, initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {
  getFirestore,
  FieldValue,
  type Firestore,
} from 'firebase-admin/firestore';

// Vercel reuses the process across warm invocations — guard against
// re-initializing the Admin SDK on every request.
if (getApps().length === 0) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  }
  initializeApp({credential: cert(JSON.parse(raw))});
}

/**
 * MUST match ENTITLEMENT_ID in the app's src/lib/offering/offeringService.ts
 * and in functions/src/index.ts — no shared module across these 3 places,
 * keep in sync by hand if the entitlement is ever renamed in RevenueCat.
 */
const ENTITLEMENT_ID = 'extras';

/**
 * See functions/src/index.ts's GRANT_DURATION comment — same unverified
 * assumption applies here (verify the real "ofrenda" packages actually
 * grant a lifetime entitlement before distributing real codes).
 */
const GRANT_DURATION = 'lifetime';

interface GiftCodeDoc {
  redeemed: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  redeemedByUid: string | null;
  redeemedAt: FirebaseFirestore.Timestamp | null;
  note: string | null;
}

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

  // No X-Platform header on purpose — see functions/src/index.ts's identical
  // comment: RevenueCat treats a secret-key request carrying a platform
  // header as a possible leaked-secret signal and rejects it.
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

async function handleRedeem(
  req: VercelRequest,
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

  const authHeader = req.headers.authorization ?? '';
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
    console.warn('redeemGiftCode: verifyIdToken failed', String(err));
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

  // Grant FIRST, mark-redeemed SECOND — a code must never be burned without
  // the person actually receiving the entitlement.
  try {
    await grantPromotionalEntitlement(uid, revenueCatSecretKey);
  } catch (err) {
    console.error('redeemGiftCode: RevenueCat grant failed', {
      code,
      uid,
      error: String(err),
    });
    return {
      httpStatus: 500,
      body: {
        status: 'server_error',
        message:
          'Could not grant the entitlement — code was NOT marked redeemed, safe to retry',
      },
    };
  }

  try {
    await db.runTransaction(async tx => {
      const fresh = await tx.get(codeRef);
      if (!fresh.exists) return; // deleted mid-flight — nothing left to mark
      const freshData = fresh.data() as GiftCodeDoc;
      // A concurrent request already won the race and marked this code
      // redeemed — leave their record canonical. The grant to THIS caller's
      // uid already happened either way (see file header's accepted tradeoff).
      if (freshData.redeemed) return;
      tx.update(codeRef, {
        redeemed: true,
        redeemedByUid: uid,
        redeemedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    // The entitlement WAS granted; only the bookkeeping write failed. Log
    // loudly for manual follow-up rather than telling this user it failed.
    console.error(
      'redeemGiftCode: grant succeeded but mark-redeemed write failed',
      {code, uid, error: String(err)},
    );
  }

  return {httpStatus: 200, body: {status: 'success'}};
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const revenueCatSecretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!revenueCatSecretKey) {
    console.error('redeemGiftCode: REVENUECAT_SECRET_KEY env var is not set');
    res
      .status(500)
      .json({status: 'server_error', message: 'Server misconfigured'});
    return;
  }

  try {
    const result = await handleRedeem(req, getFirestore(), revenueCatSecretKey);
    res.status(result.httpStatus).json(result.body);
  } catch (err) {
    console.error('redeemGiftCode: unhandled error', String(err));
    res
      .status(500)
      .json({status: 'server_error', message: 'Unexpected server error'});
  }
}
