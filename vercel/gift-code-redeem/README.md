# gift-code-redeem

Vercel serverless port of `functions/src/index.ts`'s `redeemGiftCode` — same
logic, deployed on Vercel's free Hobby tier instead of Firebase Cloud
Functions (which requires the Blaze billing plan). See project memory
`essb-gift-code-redemption` for the full decision trail.

## One-time setup (run these yourself — they touch your Vercel account and a secret key)

1. **Log in to Vercel** (opens a browser/email confirmation):
   ```
   npx vercel login
   ```
2. **Link this folder to a new Vercel project**, from inside `vercel/gift-code-redeem/`:
   ```
   npx vercel link
   ```
   When prompted for a project name, `essb-gift-redeem` matches the URL
   already hardcoded in `src/lib/offering/giftCodeService.ts`
   (`REDEEM_GIFT_CODE_URL`). If that name is taken, Vercel will suggest an
   alternative — update that constant to match whatever it actually assigns.
3. **Set the two required env vars** (do this in your own terminal, not
   through Claude — the second one is a real secret):
   ```
   npx vercel env add FIREBASE_SERVICE_ACCOUNT production
   ```
   Paste the full one-line JSON contents of `scripts/firebase-admin-key.json`
   when prompted (the same file `scripts/generate-gift-codes.js` and
   `scripts/device2.js` already use).
   ```
   npx vercel env add REVENUECAT_SECRET_KEY production
   ```
   Paste your RevenueCat **secret** key (starts with `sk_`, from the
   RevenueCat dashboard → API keys — NOT the public SDK key already in
   `src/lib/offering/offeringService.ts`).
4. **Deploy to production**:
   ```
   npx vercel --prod
   ```
   Note the real production URL it prints. If it's not
   `https://essb-gift-redeem.vercel.app`, update
   `REDEEM_GIFT_CODE_URL` in `src/lib/offering/giftCodeService.ts` to match.

## Verifying it works

```
curl -i -X POST https://essb-gift-redeem.vercel.app/api/redeem \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expect `HTTP 401` with `{"status":"invalid_token", ...}` (no Authorization
header sent) — confirms the function is live and reachable, not a 404.

Full end-to-end test: generate a real code
(`node scripts/generate-gift-codes.js create 1 --note="test"`), redeem it
from inside the app (Ajustes → ¿Tienes un código de regalo?), confirm
`usePremium()` flips to unlocked.

## Redeploying after a code change

```
npx vercel --prod
```
from inside this folder. No env var changes needed unless a key rotates.
