#!/usr/bin/env node
/* eslint-disable */
/**
 * Gift-code redemption — local admin script.
 *
 * Creates/lists/revokes rows in the top-level `giftCodes` Firestore
 * collection, which the `redeemGiftCode` Cloud Function (functions/src/
 * index.ts) reads/writes via the Admin SDK. The mobile app never reads or
 * writes this collection directly.
 *
 * Auth: requires scripts/firebase-admin-key.json (gitignored), exactly like
 * scripts/device2.js. The key grants full admin rights; do NOT commit,
 * paste, or share it.
 *
 * Usage:
 *   node scripts/generate-gift-codes.js create <n> [--note="..."]
 *   node scripts/generate-gift-codes.js list
 *   node scripts/generate-gift-codes.js revoke <code>
 *
 * `create` prints each generated code to stdout — that's the only place
 * they're shown; copy them out before closing the terminal.
 *
 * `revoke` DELETES an unredeemed code outright (refuses to touch an already-
 * redeemed one — the person already has the entitlement, deleting the row
 * would just orphan the record). There's no separate "revoked" status: a
 * mistakenly-created code is meant to simply stop existing.
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, 'firebase-admin-key.json');
if (!fs.existsSync(KEY_PATH)) {
  console.error(`error: service-account key missing at ${KEY_PATH}`);
  console.error(
    'Generate one in Firebase Console → Project settings → Service accounts ' +
      '→ Generate new private key, save it at that exact path.',
  );
  process.exit(1);
}

admin.initializeApp({credential: admin.credential.cert(require(KEY_PATH))});
const db = admin.firestore();
const COLLECTION = 'giftCodes';

// Unambiguous, human-typeable charset — excludes 0/O, 1/I/L (easily confused
// when read aloud or hand-copied). 31 symbols, not power-of-two; randomInt()
// below is used specifically because it's unbiased for a non-power-of-two range.
const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GROUP_LEN = 4;
const GROUPS = 2;
const MAX_GENERATE_ATTEMPTS = 10;

function randomCode() {
  let out = '';
  for (let g = 0; g < GROUPS; g++) {
    if (g > 0) out += '-';
    for (let i = 0; i < GROUP_LEN; i++) {
      out += CODE_CHARSET[crypto.randomInt(0, CODE_CHARSET.length)];
    }
  }
  return out;
}

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, ...rest] = a.slice(2).split('=');
      flags[k] = rest.length ? rest.join('=') : true;
    } else {
      positional.push(a);
    }
  }
  return {flags, positional};
}

function usage() {
  console.error('commands: create | list | revoke');
  console.error('  create <n> [--note="..."]');
  console.error('  list');
  console.error('  revoke <code>');
  process.exit(1);
}

/** Reserves one never-before-seen code via Firestore's create() (fails if the doc id already exists). */
async function createOneCode(note) {
  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
    const code = randomCode();
    try {
      await db
        .collection(COLLECTION)
        .doc(code)
        .create({
          redeemed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          redeemedByUid: null,
          redeemedAt: null,
          note: note || null,
        });
      return code;
    } catch (err) {
      // ALREADY_EXISTS (gRPC code 6) — vanishingly unlikely at this charset
      // size, but retry with a fresh code rather than fail the whole batch.
      if (err && err.code === 6) continue;
      throw err;
    }
  }
  throw new Error(
    `could not reserve a unique code after ${MAX_GENERATE_ATTEMPTS} attempts`,
  );
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd) usage();
  const {flags, positional} = parseFlags(rest);

  switch (cmd) {
    case 'create': {
      const n = parseInt(positional[0], 10);
      if (!n || n < 1) usage();
      const note = typeof flags.note === 'string' ? flags.note : null;
      console.log(
        `Generating ${n} code(s)${note ? ` (note: ${note})` : ''}...`,
      );
      const codes = [];
      for (let i = 0; i < n; i++) {
        codes.push(await createOneCode(note));
      }
      console.log('');
      console.log('Generated codes:');
      codes.forEach(c => console.log(`  ${c}`));
      console.log('');
      console.log(
        `${codes.length} code(s) written to ${COLLECTION}/ — copy them out now.`,
      );
      return;
    }
    case 'list': {
      const snap = await db
        .collection(COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();
      console.log(`${snap.size} code(s) in ${COLLECTION}:`);
      snap.forEach(d => {
        const data = d.data();
        const status = data.redeemed ? 'REDEEMED' : 'available';
        const by = data.redeemedByUid ? ` by=${data.redeemedByUid}` : '';
        const note = data.note ? ` note="${data.note}"` : '';
        console.log(`  ${d.id}  [${status}]${by}${note}`);
      });
      return;
    }
    case 'revoke': {
      const [code] = positional;
      if (!code) usage();
      const ref = db.collection(COLLECTION).doc(code);
      const snap = await ref.get();
      if (!snap.exists) {
        console.error(`error: no such code ${code}`);
        process.exit(1);
      }
      const data = snap.data();
      if (data.redeemed) {
        console.error(
          `error: ${code} was already redeemed (by ${data.redeemedByUid}) — refusing to delete a fulfilled code.`,
        );
        process.exit(1);
      }
      await ref.delete();
      console.log(`revoked (deleted) ${code}`);
      return;
    }
    default:
      console.error(`unknown command: ${cmd}`);
      usage();
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(
      'generate-gift-codes error:',
      err && err.message ? err.message : err,
    );
    process.exit(1);
  });
