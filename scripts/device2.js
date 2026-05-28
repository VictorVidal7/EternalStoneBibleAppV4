#!/usr/bin/env node
/* eslint-disable */
/**
 * Sprint 43 — simulate a 2nd device for multi-device sync verification.
 *
 * Writes against Firestore using the firebase-admin SDK so we can drive
 * the device 1 emulator's onSnapshot listeners (S42 SyncEngine) without
 * needing a second Android device.
 *
 * Auth: requires scripts/firebase-admin-key.json (gitignored). The key
 * grants full admin rights; do NOT commit, paste, or share it.
 *
 * Usage:
 *   node scripts/device2.js list <collection> [--uid=<uid>]
 *   node scripts/device2.js read <collection> <docId> [--uid=<uid>]
 *   node scripts/device2.js write <collection> <docId> '<json>' [--uid=<uid>]
 *   node scripts/device2.js delete <collection> <docId> [--uid=<uid>]
 *   node scripts/device2.js conflict <collection> <docId> '<json>' [--offset-ms=N] [--uid=<uid>]
 *
 * The `conflict` subcommand stamps updatedAt = Date.now() - offset so the
 * remote write lands inside the SyncEngine CONFLICT_WINDOW_MS relative to
 * a near-simultaneous local edit on device 1.
 *
 * Default uid is the S41/S42 verification user (victorvdu@gmail.com).
 * Override with --uid=<otherUid>.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, 'firebase-admin-key.json');
if (!fs.existsSync(KEY_PATH)) {
  console.error(`error: service-account key missing at ${KEY_PATH}`);
  console.error('See sprint-43 setup in essb-review-roadmap memory.');
  process.exit(1);
}

admin.initializeApp({credential: admin.credential.cert(require(KEY_PATH))});
const db = admin.firestore();
const DEFAULT_UID = '8AW0chqs3vOdAZ5v51R9IjDt2Z02';
const COLLECTIONS = [
  'favorites',
  'notes',
  'highlights',
  'bookmarks',
  'memoryCards',
  'conflicts',
];

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
  console.error('commands: list | read | write | delete | conflict');
  console.error('  list <collection> [--uid=<uid>]');
  console.error('  read <collection> <docId> [--uid=<uid>]');
  console.error('  write <collection> <docId> <json> [--uid=<uid>]');
  console.error('  delete <collection> <docId> [--uid=<uid>]');
  console.error(
    '  conflict <collection> <docId> <json> [--offset-ms=N] [--uid=<uid>]',
  );
  console.error(`known collections: ${COLLECTIONS.join(', ')}`);
  process.exit(1);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd) usage();
  const {flags, positional} = parseFlags(rest);
  const uid = flags.uid || DEFAULT_UID;
  const now = Date.now();
  const colPath = collection => `users/${uid}/${collection}`;

  switch (cmd) {
    case 'list': {
      const [collection] = positional;
      if (!collection) usage();
      const snap = await db.collection(colPath(collection)).get();
      console.log(`${snap.size} docs in ${colPath(collection)}:`);
      snap.forEach(d => {
        const data = d.data();
        const flag = data && data.deleted ? ' [TOMBSTONE]' : '';
        console.log(`  ${d.id}${flag}: ${JSON.stringify(data)}`);
      });
      return;
    }
    case 'read': {
      const [collection, docId] = positional;
      if (!collection || !docId) usage();
      const doc = await db.collection(colPath(collection)).doc(docId).get();
      console.log(
        doc.exists ? JSON.stringify(doc.data(), null, 2) : '(not found)',
      );
      return;
    }
    case 'write': {
      const [collection, docId, jsonStr] = positional;
      if (!collection || !docId || !jsonStr) usage();
      const payload = JSON.parse(jsonStr);
      if (typeof payload.updatedAt !== 'number') payload.updatedAt = now;
      await db
        .collection(colPath(collection))
        .doc(docId)
        .set(payload, {merge: true});
      console.log(
        `wrote ${colPath(collection)}/${docId} updatedAt=${payload.updatedAt}`,
      );
      return;
    }
    case 'delete': {
      const [collection, docId] = positional;
      if (!collection || !docId) usage();
      const existing = await db
        .collection(colPath(collection))
        .doc(docId)
        .get();
      const base = existing.exists ? existing.data() : {};
      const tombstone = {
        ...base,
        deleted: true,
        deletedAt: now,
        updatedAt: now,
      };
      await db
        .collection(colPath(collection))
        .doc(docId)
        .set(tombstone, {merge: true});
      console.log(`tombstoned ${colPath(collection)}/${docId} at ${now}`);
      return;
    }
    case 'conflict': {
      const [collection, docId, jsonStr] = positional;
      if (!collection || !docId || !jsonStr) usage();
      const offset = parseInt(flags['offset-ms'] || '2000', 10);
      const payload = JSON.parse(jsonStr);
      payload.updatedAt = now - offset;
      await db
        .collection(colPath(collection))
        .doc(docId)
        .set(payload, {merge: true});
      console.log(
        `conflict-wrote ${colPath(collection)}/${docId} updatedAt=${payload.updatedAt} (now-${offset}ms)`,
      );
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
    console.error('device2 error:', err && err.message ? err.message : err);
    process.exit(1);
  });
