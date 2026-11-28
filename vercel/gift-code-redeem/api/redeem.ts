/**
 * redeemGiftCode — Vercel serverless port of functions/src/index.ts.
 *
 * Same request/response shape; the logic is AHEAD of that undeployed copy
 * since R9-20 (the code's shape is checked first) and R9-21 (the code is
 * claimed before the grant), which were fixed here only (the client, giftCodeService.ts,
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

/**
 * R9-20 — what a code can look like: two groups of 4 A-Z0-9, the shape the
 * app's RedeemCodeSheet formatCodeInput() always sends. Deliberately wider
 * than scripts/generate-gift-codes.js's CODE_CHARSET (no 0/O, 1/I/L): a typo
 * with an O still reaches the lookup and answers "not found", as before.
 */
const CODE_SHAPE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

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
  // R9-20 — the shape BEFORE anything that costs a quota: verifyIdToken and a
  // Firestore read per POST, on a Hobby plan whose hard cap takes the endpoint
  // offline once spent. It also keeps a "/" out of the document path (that used
  // to throw inside doc() and answer 500). Exactly as lenient as the app's
  // formatCodeInput (RedeemCodeSheet.tsx: A-Z0-9, XXXX-XXXX), so every code the
  // app can send is still looked up and a typo still reads as "not found".
  if (!CODE_SHAPE.test(code)) {
    return {
      httpStatus: 400,
      body: {status: 'invalid_request', message: 'Malformed "code"'},
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

  // R9-21 — claim FIRST, grant SECOND. The code used to be granted first and
  // marked after; when that bookkeeping write failed, the reader got a 200 and
  // the code stayed available, so a second account could redeem it for a
  // second lifetime entitlement. Now the mark is a transaction that binds the
  // code to THIS uid before anything is granted, which keeps both promises:
  //  - no second account after a grant: once claimed, any other uid gets 409
  //    (a concurrent second request loses the same transaction, so the old
  //    double-grant race is gone too);
  //  - never burned without the grant: a code claimed by this uid answers
  //    THIS uid's retry with the grant (again) and a 200. That is also what
  //    makes a client-side timeout safe (R9-620): a retry after a redemption
  //    the app never heard back from is a success, not "already redeemed".
  // A claimed code is never released, not even when RevenueCat refuses (Victor's
  // decision): a parallel retry of this uid may already hold the grant.
  let claim: 'claimed' | 'ownRetry' | 'not_found' | 'already_redeemed';
  try {
    claim = await db.runTransaction(async tx => {
      const snap = await tx.get(codeRef);
      if (!snap.exists) return 'not_found';
      const data = snap.data() as GiftCodeDoc;
      if (data.redeemed) {
        return data.redeemedByUid === uid ? 'ownRetry' : 'already_redeemed';
      }
      tx.update(codeRef, {
        redeemed: true,
        redeemedByUid: uid,
        redeemedAt: FieldValue.serverTimestamp(),
      });
      return 'claimed';
    });
  } catch (err) {
    console.error('redeemGiftCode: claim transaction failed', {
      code,
      uid,
      error: String(err),
    });
    return {
      httpStatus: 500,
      body: {
        status: 'server_error',
        message: 'Could not claim the code — nothing was granted, safe to retry',
      },
    };
  }
  if (claim === 'not_found') {
    return {httpStatus: 404, body: {status: 'not_found'}};
  }
  if (claim === 'already_redeemed') {
    return {httpStatus: 409, body: {status: 'already_redeemed'}};
  }

  try {
    await grantPromotionalEntitlement(uid, revenueCatSecretKey);
  } catch (err) {
    console.error('redeemGiftCode: RevenueCat grant failed', {
      code,
      uid,
      claim,
      error: String(err),
    });
    // No release, even on a refusal: see "never released" above.
    return {
      httpStatus: 500,
      body: {
        status: 'server_error',
        message: 'Could not grant the entitlement — safe to retry',
      },
    };
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
