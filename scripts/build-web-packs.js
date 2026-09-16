/**
 * 📦 build-web-packs.js — build the two web-only bootstrap packs (T21).
 *
 * The web reader ships with NO embedded seed (unlike native, which bundles
 * RVR1960 + WEB in assets/bible-seed.db) — it boots empty and downloads one
 * of these packs on first run (src/lib/database/data-loader.web.ts). Both
 * packs are emitted directly from the SAME in-repo source files that build
 * the native bundled seed (bible-data-rvr1960.ts / bible-data-web.ts,
 * consumed by rebuild-seed.js) — NOT re-fetched from a network source — so
 * the web text is byte-identical to what native users already read.
 *
 * Each pack is the SAME shape every other downloadable pack uses: a single
 * `verses(book_id, book_name, chapter, verse, text)` table — NO version
 * column (added at import time by data-loader.web.ts), NO FTS (the web
 * build has no fts5 module at all — T20 finding).
 *
 * Deliberately NOT added to web/packs/versions.json — that catalog is also
 * read by the NATIVE app's "download extra versions" screen
 * (ManageVersionsSection.tsx), which renders every entry with no filtering
 * against already-bundled versions. Listing RVR1960/WEB there would offer
 * native users a "download" of a version they already have. The web
 * bootstrap instead reads a small, separate manifest generated alongside
 * these packs (see WEB_PACKS_JSON below).
 *
 * Also emits ONE red-letter JSON per reading version that has "Words of
 * Christ" data — web-red-letter.json from bible-data-web-redletter.ts and
 * rvr1960-red-letter.json from bible-data-rvr1960-redletter.ts — each
 * flattened to plain JSON and verified span-by-span against ITS OWN
 * just-built .sqlite before being written out. Verifying each against its
 * own pack is the whole point: a span is a character offset into that
 * version's verse text, so checking RVR1960 spans against web.sqlite would
 * be meaningless. That verification also refuses to pass on an empty array
 * or on entries with no spans (R9-66) — see verifyRedLetterAlignment — and
 * the run as a whole refuses to emit anything if a count went DOWN or a whole
 * version WENT MISSING vs the published manifest (R9-73), unless
 * --allow-shrink says the removal is deliberate (see assertNoShrink).
 *
 * Nothing reaches the output directory until that gate has passed: every file
 * is built into a scratch directory and moved in afterwards (R9-72). That
 * ordering is load-bearing rather than tidy — publishing is a MANUAL upload of
 * whatever sits in the output directory, so a run that judged itself
 * unpublishable must not leave anything there that looks publishable.
 *
 * RVR1960 was missing here until 2026-09-15, which is why red-letter worked
 * on web only in English: native reads both arrays straight from the bundle,
 * but the web build fetches packs, and nobody emitted the Spanish one.
 *
 * Requires Node ≥ 22 (node:sqlite). Usage:
 *   node --experimental-sqlite scripts/build-web-packs.js [outDir] [--allow-shrink]
 *   (default outDir: %USERPROFILE%/Desktop/web-packs)
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

/**
 * R9-82: `node:sqlite` is required HERE rather than at module load, and that is
 * load-bearing rather than tidy. Two jest suites import this file — one for the
 * shrink/vanish/pins gates, one purely to read RED_LETTER_SPECS and PACK_SPECS
 * — and neither needs a database. With the require at the top, a Node without
 * node:sqlite made both suites fail to LOAD, which reports zero assertions
 * instead of a failure anyone can act on. CI is pinned to a Node that has it
 * (see ciNodeVersion.test.ts); this makes sure that the day it is not, the gate
 * logic still runs and only the cases that truly need a database complain.
 */
function openDatabase(dbFile, options) {
  const {DatabaseSync} = require('node:sqlite');
  return options ? new DatabaseSync(dbFile, options) : new DatabaseSync(dbFile);
}

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
/** First non-flag argument, so `--allow-shrink` can't be mistaken for a path. */
const OUT =
  ARGS.find(a => !a.startsWith('--')) ||
  path.join(os.homedir(), 'Desktop', 'web-packs');
/** Escape hatch for a DELIBERATE editorial removal — see assertNoShrink. */
const ALLOW_SHRINK = ARGS.includes('--allow-shrink');
const WEB_PACKS_JSON = path.join(ROOT, 'web', 'packs', 'web-bootstrap.json');

/**
 * Parse a `export const X = [ ... ]` array literal out of a .ts data file.
 * Locates the array's opening `[` starting from the `export const X ... =`
 * declaration (not a naive first-`[`-in-file scan), so brackets appearing
 * earlier in header comments or in a `: Type[]` annotation don't confuse it.
 *
 * Most data files here are strict JSON (quoted keys, no trailing commas),
 * so that's tried first. Some (e.g. bible-data-web-redletter.ts) are plain
 * JS object-literal syntax instead (unquoted keys, trailing commas) — if
 * strict JSON.parse fails, fall back to normalizing just those two things
 * before parsing again.
 */
function parseTsArray(file) {
  const c = fs.readFileSync(file, 'utf8');
  const decl = c.match(/export const \w+[^=]*=/);
  const searchFrom = decl ? decl.index + decl[0].length : 0;
  const start = c.indexOf('[', searchFrom);
  const raw = c.slice(start, c.lastIndexOf(']') + 1);
  try {
    return JSON.parse(raw);
  } catch {
    const normalized = raw
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(normalized);
  }
}

function buildPack(rows, dbFile) {
  fs.rmSync(dbFile, {force: true});
  const db = openDatabase(dbFile);
  db.exec('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF;');
  db.exec(
    `CREATE TABLE verses (book_id INTEGER NOT NULL, book_name TEXT NOT NULL,
       chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT NOT NULL)`,
  );
  const ins = db.prepare(
    `INSERT INTO verses (book_id, book_name, chapter, verse, text)
     VALUES (?, ?, ?, ?, ?)`,
  );
  db.exec('BEGIN');
  for (const r of rows) {
    ins.run(r.book_id, r.book_name, r.chapter, r.verse, r.text);
  }
  db.exec('COMMIT');
  db.exec('VACUUM');
  db.close();
}

function verifyPack(dbFile, expectCount) {
  const db = openDatabase(dbFile, {readOnly: true});
  const n = db.prepare('SELECT COUNT(*) c FROM verses').get().c;
  const books = db
    .prepare('SELECT COUNT(DISTINCT book_id) b FROM verses')
    .get().b;
  const range = db
    .prepare('SELECT MIN(book_id) lo, MAX(book_id) hi FROM verses')
    .get();
  const empty = db
    .prepare("SELECT COUNT(*) c FROM verses WHERE TRIM(text)=''")
    .get().c;
  const j = db
    .prepare(
      'SELECT text FROM verses WHERE book_id=43 AND chapter=3 AND verse=16',
    )
    .get();
  db.close();
  const ok =
    n === expectCount &&
    books === 66 &&
    range.lo === 1 &&
    range.hi === 66 &&
    empty === 0 &&
    !!j &&
    j.text.length > 0;
  console.log(
    `  verify ${path.basename(dbFile)}: n=${n} books=${books} ` +
      `range=${range.lo}-${range.hi} empty=${empty} ` +
      `John3:16=${j ? 'present' : 'MISSING'} => ${ok ? 'OK' : 'FAIL'}`,
  );
  if (j) console.log('    John 3:16 =', JSON.stringify(j.text));
  if (!ok) throw new Error('Pack verification FAILED: ' + dbFile);
}

/**
 * Verify every red-letter span against the ACTUAL text stored in that
 * version's just-built .sqlite (not the source .ts file) — a hard failure
 * here means a span would render as garbled/wrong-highlighted text for real
 * users, so this throws rather than warns.
 *
 * R9-66: the two floors below come FIRST and LAST because everything between
 * them is a per-entry loop, and a loop over nothing collects no failures. An
 * empty array used to print "ALL slices non-blank and in-range" and pass; the
 * caller would then write a 2-byte `[]` pack, hash it, and record
 * `entries: 0, spans: 0` in web-bootstrap.json. Published, that is red-letter
 * silently dead for that version on the web — the exact symptom of R9-13,
 * with the build's blessing on it. Both source arrays are AUTO-GENERATED
 * (bible-data-rvr1960-redletter.ts from decisions/*.json), so a regeneration
 * that yields nothing is the ordinary way in, not a hypothetical. The .sqlite
 * half of this script has had a floor all along (`n === expectCount`,
 * `books === 66`, the 1..66 id range, zero blank verses); this half had none.
 */
function verifyRedLetterAlignment(entries, dbFile, versionId) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(
      `Red-letter alignment verification FAILED for ${versionId}: the source ` +
        'array parsed to NO ENTRIES at all. Nothing below this line can fail ' +
        'on an empty list, so this has to. Check that the source .ts still ' +
        'holds its generated array before publishing anything.',
    );
  }
  const db = openDatabase(dbFile, {readOnly: true});
  const stmt = db.prepare(
    'SELECT text FROM verses WHERE book_id=? AND chapter=? AND verse=?',
  );
  const failures = [];
  let spanCount = 0;
  for (const e of entries) {
    const row = stmt.get(e.book_id, e.chapter, e.verse);
    if (!row) {
      failures.push(`${e.book_id}/${e.chapter}:${e.verse} — verse not found`);
      continue;
    }
    for (const [s, en] of e.spans) {
      spanCount++;
      if (en > row.text.length) {
        failures.push(
          `${e.book_id}/${e.chapter}:${e.verse} — span [${s},${en}) exceeds ` +
            `text length ${row.text.length}`,
        );
        continue;
      }
      const slice = row.text.slice(s, en);
      if (slice.trim().length === 0) {
        failures.push(
          `${e.book_id}/${e.chapter}:${e.verse} — span [${s},${en}) is blank`,
        );
      }
    }
  }
  if (failures.length > 0) {
    db.close();
    throw new Error(
      'Red-letter alignment verification FAILED ' +
        `(${failures.length} of ${spanCount} spans across ${entries.length} entries):\n` +
        failures.slice(0, 10).join('\n'),
    );
  }
  if (spanCount === 0) {
    // The same hole in its second shape: rows present, every `spans` array
    // empty. Zero spans checked is zero spans verified, and the pack renders
    // exactly as red-letter-free as an empty one would.
    db.close();
    throw new Error(
      `Red-letter alignment verification FAILED for ${versionId}: ` +
        `${entries.length} entries carry NO SPANS between them, so nothing ` +
        'was actually verified and the pack would render red-letter-free.',
    );
  }
  console.log(
    `  ${versionId} red-letter alignment: ${entries.length} entries, ` +
      `${spanCount} spans, ALL slices non-blank and in-range against ` +
      path.basename(dbFile),
  );
  const jw = entries.find(
    e => e.book_id === 43 && e.chapter === 3 && e.verse === 16,
  );
  if (jw) {
    const row = stmt.get(jw.book_id, jw.chapter, jw.verse);
    for (const [s, en] of jw.spans) {
      console.log(
        `    ${versionId} John 3:16 red-letter span [${s},${en}) =`,
        JSON.stringify(row.text.slice(s, en)),
      );
    }
  }
  db.close();
}

/**
 * The manifest this script wrote LAST time, which is committed and describes
 * what is actually published — the ONLY baseline assertNoShrink has.
 *
 * R9-74: ABSENT and UNREADABLE are not the same thing, and this used to
 * collapse both (plus every IO error) into `null`. A `null` baseline turns the
 * entire shrink check off, and it did so in complete silence: the run printed
 * not one word about having skipped the comparison, then overwrote the file.
 * Absent really is fine — a first run has nothing to compare against, and it
 * says so out loud below. Present-but-unreadable is a different animal and it
 * is reachable: this script writes that file with a single writeFileSync, so
 * its OWN interrupted run leaves a truncated JSON behind, and a bad merge
 * leaves conflict markers. Either way the next run could neither refuse a
 * shrink nor tell anyone it had stopped looking, which is exactly the
 * pass-in-a-vacuum shape R9-66 was about. So this refuses instead.
 */
function readPreviousManifest(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null; // announced by assertNoShrink
    throw new Error(
      `Could not READ the published manifest ${file}: ${error.message}\n\n` +
        'That file is the only baseline the shrink check has, and continuing ' +
        'without it would silently disable the check, so this stops instead. ' +
        'Restore it (git checkout web/packs/web-bootstrap.json), or move it ' +
        'aside deliberately if this really is a first run.',
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Could not PARSE the published manifest ${file}: ${error.message}\n\n` +
        'A truncated or conflict-marked baseline reads as "nothing to compare ' +
        'against", which would let a shrink through unnoticed. Restore it ' +
        '(git checkout web/packs/web-bootstrap.json) before rebuilding.',
    );
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.packs)) {
    throw new Error(
      `The published manifest ${file} parsed but carries no \`packs\` array, ` +
        'so every count comparison below would have nothing to compare ' +
        'against and pass vacuously. Restore it before rebuilding.',
    );
  }
  // R9-77: same reasoning, applied to the OTHER list. `redLetter` may be an
  // ARRAY (current), a single OBJECT (pre-2026-09-15) or absent (pre-red-letter
  // entirely) — all three are shapes this file really carried — but a string or
  // a number is a mangled baseline, not a historical one. Absence is NOT
  // rejected here: it is indistinguishable from "nothing was ever published",
  // so the floor that catches it lives in assertNoShrink, where the run knows
  // what it is about to emit.
  if (
    parsed.redLetter !== undefined &&
    parsed.redLetter !== null &&
    !Array.isArray(parsed.redLetter) &&
    typeof parsed.redLetter !== 'object'
  ) {
    throw new Error(
      `The published manifest ${file} carries a \`redLetter\` field that is ` +
        `neither an array nor an object (got ${typeof parsed.redLetter}), so ` +
        'every red-letter comparison below would silently find nothing to ' +
        'compare against. Restore it before rebuilding.',
    );
  }
  console.log(
    `  baseline: ${file} (${parsed.packs.length} packs, ` +
      `${Array.isArray(parsed.redLetter) ? parsed.redLetter.length : parsed.redLetter ? 1 : 0} red-letter)`,
  );
  return parsed;
}

/** The baseline's `packs` list, or an empty one if it carries none. */
function previousPacksOf(previous) {
  return previous && Array.isArray(previous.packs) ? previous.packs : [];
}

/**
 * The baseline's red-letter list, normalized. `redLetter` was a single OBJECT
 * until 2026-09-15 and is an ARRAY now, so a manifest written before that date
 * still has to be readable here; before red-letter existed at all there was no
 * field, which reads as an empty list.
 */
function previousRedLetterOf(previous) {
  if (!previous) return [];
  if (Array.isArray(previous.redLetter)) return previous.redLetter;
  if (previous.redLetter && typeof previous.redLetter === 'object') {
    return [{versionId: 'WEB', ...previous.redLetter}];
  }
  return [];
}

/**
 * R9-77. How many of the entries this run EMITS the baseline actually pins a
 * number for — which is not the same as how many this run emits, and that gap
 * is the whole finding. Every comparison in shrinkComplaints skips silently
 * when its `before` is missing or carries a non-numeric count, and
 * assertNoShrink then printed the size of the NEW lists as if it were the
 * number of comparisons made: "2 packs and 2 red-letter packs compared against
 * the published manifest, nothing went down and nothing went missing" over
 * ZERO actual comparisons.
 *
 * The reachable way in is a baseline with `packs` but NO `redLetter` key. That
 * is not hypothetical: web/packs/web-bootstrap.json carried exactly that shape
 * from c3a9aac (2026-07-08) until a0782a6, so a `git checkout` of an older
 * revision, a revert, or a merge that takes the old side reproduces it — and
 * `redLetter: []` (what this script itself writes if the spec list is ever
 * emptied once) is just as vacuous while passing every shape check. With that
 * baseline, dropping RVR1960 from RED_LETTER_SPECS — R9-13 verbatim — emits,
 * reports success, and rewrites the manifest without RVR1960, destroying the
 * only baseline the NEXT run had. Verified end to end against the real main().
 *
 * Counts a pin, never a match: a count that GREW is still pinned.
 */
function baselineComparisonCounts(previous, packs, redLetter) {
  const previousPacks = previousPacksOf(previous);
  const previousRedLetter = previousRedLetterOf(previous);
  const pinnedPacks = packs.filter(pack => {
    const before = previousPacks.find(x => x && x.id === pack.id);
    return !!before && typeof before.verseCount === 'number';
  }).length;
  const pinnedRedLetter = redLetter.filter(entry => {
    const before = previousRedLetter.find(
      x => x && x.versionId === entry.versionId,
    );
    return (
      !!before &&
      (typeof before.entries === 'number' || typeof before.spans === 'number')
    );
  }).length;
  return {packs: pinnedPacks, redLetter: pinnedRedLetter};
}

/**
 * R9-66, second half. The floors inside verifyRedLetterAlignment are floors of
 * ZERO — they catch a source file that regenerated to nothing, and nothing
 * else. A regeneration that yields 3 entries instead of 2057 is the same
 * accident with a less convenient number, and it would sail through.
 *
 * There is a free reference point for that: the committed web-bootstrap.json
 * already records what the last run produced, so a count going DOWN is a
 * question worth stopping for. Deliberate editorial removals do happen
 * (`decisions/*.json` is a human pass), so this is a stop sign, not a wall:
 * `--allow-shrink` continues, and the flag in the shell history is the record
 * of the decision.
 *
 * Compares only counts, never the sha256 — the bytes are expected to change.
 */
function shrinkComplaints(previous, packs, redLetter) {
  const complaints = [];
  if (!previous) return complaints;

  const previousPacks = previousPacksOf(previous);
  const previousRedLetter = previousRedLetterOf(previous);

  for (const pack of packs) {
    const before = previousPacks.find(x => x.id === pack.id);
    if (!before || typeof before.verseCount !== 'number') continue;
    if (pack.verseCount < before.verseCount) {
      complaints.push(
        `${pack.id}: ${before.verseCount} verses -> ${pack.verseCount} ` +
          `(${before.verseCount - pack.verseCount} fewer)`,
      );
    }
  }

  for (const entry of redLetter) {
    const before = previousRedLetter.find(x => x.versionId === entry.versionId);
    if (!before) continue;
    for (const field of ['entries', 'spans']) {
      if (typeof before[field] !== 'number') continue;
      if (entry[field] < before[field]) {
        complaints.push(
          `${entry.versionId} red-letter: ${before[field]} ${field} -> ` +
            `${entry[field]} (${before[field] - entry[field]} fewer)`,
        );
      }
    }
  }

  // R9-73. Both loops above walk the NEW lists, so a version that VANISHES
  // from PACK_SPECS/RED_LETTER_SPECS produces no complaint at all — and that is
  // the LARGEST shrink there is, 2057 entries down to none. Same vice as R9-66,
  // one level out: a loop body that never runs for the thing that went missing.
  // It is also the accident that already happened here. Both lists are
  // hand-maintained (the third known blind spot of this repo), and the last
  // time RED_LETTER_SPECS was short of RVR1960, red-letter was silently dead in
  // Spanish on the web for a month — that IS R9-13. Worse, the run would then
  // rewrite the manifest without the missing version, erasing the only
  // baseline the NEXT run has to notice with. So the disappearance has to be
  // read off the PREVIOUS lists, which is the only place it is still visible.
  for (const before of previousPacks) {
    if (!before || typeof before.id !== 'string') continue;
    if (packs.some(p => p.id === before.id)) continue;
    complaints.push(
      `${before.id}: published with ${before.verseCount ?? '?'} verses, and ` +
        'this run emits NO PACK for it at all',
    );
  }
  for (const before of previousRedLetter) {
    if (!before || typeof before.versionId !== 'string') continue;
    if (redLetter.some(e => e.versionId === before.versionId)) continue;
    complaints.push(
      `${before.versionId} red-letter: published with ` +
        `${before.entries ?? '?'} entries, and this run emits NO PACK for it ` +
        'at all',
    );
  }
  return complaints;
}

function assertNoShrink(previous, packs, redLetter, allowShrink) {
  const complaints = shrinkComplaints(previous, packs, redLetter);
  // R9-74: say which of the two happened. Silence used to be the success
  // signal AND the skipped-entirely signal, so an operator had no way to tell a
  // verified run from one that never compared anything.
  if (!previous) {
    console.log(
      '  shrink check SKIPPED: no published manifest to compare against ' +
        '(first run for this output). Nothing pins these counts.',
    );
    return;
  }
  // R9-77: BEFORE reporting on the complaints, establish that there was
  // anything to complain WITH. A baseline that pins no numbers at all produces
  // zero complaints for the same reason an empty loop does, and the line below
  // used to call that success while naming the size of the NEW lists. This is a
  // stop sign rather than a wall for the same reason the shrink itself is: the
  // very first run that emits a whole new CATEGORY legitimately has nothing
  // pinning it, and --allow-shrink is how a human says so.
  const pinned = baselineComparisonCounts(previous, packs, redLetter);
  const vacuous = [];
  if (packs.length > 0 && pinned.packs === 0) {
    vacuous.push(
      `packs: this run emits ${packs.length} (${packs
        .map(p => p.id)
        .join(', ')}) and the published manifest pins a verseCount for NONE ` +
        `of them (it lists ${previousPacksOf(previous).length})`,
    );
  }
  if (redLetter.length > 0 && pinned.redLetter === 0) {
    vacuous.push(
      `red-letter: this run emits ${redLetter.length} (${redLetter
        .map(e => e.versionId)
        .join(
          ', ',
        )}) and the published manifest pins counts for NONE of them ` +
        `(it lists ${previousRedLetterOf(previous).length})`,
    );
  }
  if (vacuous.length > 0 && !allowShrink) {
    throw new Error(
      'The published manifest pins NOTHING about part of what this run ' +
        'emits:\n  ' +
        vacuous.join('\n  ') +
        '\n\nEvery comparison for that part would have found nothing to ' +
        'compare against and passed vacuously - including the check for a ' +
        'version that VANISHED, which reads the PREVIOUS list and therefore ' +
        'sees nothing when that list is empty. web/packs/web-bootstrap.json ' +
        'really did carry `packs` with no `redLetter` until 2026-09-15, so an ' +
        'older revision of it, a revert, or a merge that took the old side ' +
        'lands here.\n\n' +
        'NOTHING was written: the run aborted before anything left its ' +
        'staging directory, so no pack file was emitted into the output ' +
        'directory and the manifest was not touched.\n' +
        'CAREFUL: files ALREADY sitting in the output directory are from an ' +
        'EARLIER run - this run did not refresh them.\n' +
        'Restore the baseline (git checkout web/packs/web-bootstrap.json). If ' +
        'this really is the FIRST run to emit that part, re-run with ' +
        '--allow-shrink.',
    );
  }
  if (vacuous.length > 0) {
    console.warn(
      '\n  WARNING: the published manifest pins nothing about part of this ' +
        'run, continuing because --allow-shrink was passed:\n    ' +
        vacuous.join('\n    '),
    );
  }

  if (complaints.length === 0) {
    // Says how many comparisons were actually MADE, not how many packs the run
    // happens to emit. Those two numbers were the same on every good run, which
    // is exactly why the difference went unnoticed on the bad one.
    console.log(
      `  shrink check: ${pinned.packs} of ${packs.length} packs and ` +
        `${pinned.redLetter} of ${redLetter.length} red-letter packs were ` +
        'PINNED by the published manifest, nothing went down and nothing ' +
        'went missing',
    );
    return;
  }
  if (allowShrink) {
    console.warn(
      '\n  ⚠️  Counts went DOWN vs the published manifest, continuing because ' +
        '--allow-shrink was passed:\n    ' +
        complaints.join('\n    '),
    );
    return;
  }
  throw new Error(
    'Pack counts went DOWN vs the published manifest:\n  ' +
      complaints.join('\n  ') +
      '\n\nNOTHING was written: the run aborted before anything left its ' +
      'staging directory, so no pack file was emitted into the output ' +
      'directory and the manifest was not touched.\n' +
      'CAREFUL: files ALREADY sitting in the output directory are from an ' +
      'EARLIER run — this run did not refresh them. Check their sha256 ' +
      'against the manifest before publishing anything.\n' +
      'Check that the source arrays regenerated correctly. If the removal IS ' +
      'deliberate, re-run with --allow-shrink.',
  );
}

/** The two .sqlite packs, in manifest order. */
const PACK_SPECS = [
  {
    id: 'RVR1960',
    file: path.join(ROOT, 'src/lib/database/bible-data-rvr1960.ts'),
    arrayName: 'RVR1960_DATA',
  },
  {
    id: 'WEB',
    file: path.join(ROOT, 'src/lib/database/bible-data-web.ts'),
    arrayName: 'WEB_DATA',
  },
];

// One pack per version WITH red-letter data. Keep this list in sync with
// RED_LETTER_PACKS in src/lib/reading/redLetterText.web.ts (the filenames
// below are exactly what that module fetches) and with
// redLetterByVersion in src/lib/reading/redLetterText.ts (native). A
// version present in the native map and missing here reads red-letter-free
// on web while claiming otherwise — that was the RVR1960 bug.
const RED_LETTER_SPECS = [
  {
    versionId: 'WEB',
    source: 'src/lib/database/bible-data-web-redletter.ts',
    out: 'web-red-letter.json',
  },
  {
    versionId: 'RVR1960',
    source: 'src/lib/database/bible-data-rvr1960-redletter.ts',
    out: 'rvr1960-red-letter.json',
  },
];

/**
 * Every argument is injectable so __tests__/buildWebPacks.test.js can run the
 * REAL main() end to end against tiny fixtures, in a temp directory, with its
 * own throwaway manifest. The ORDER of the writes in here is itself a
 * load-bearing property (R9-72), and a property of main() cannot be pinned by
 * testing the pure helpers around it.
 */
function main(options = {}) {
  const {
    out = OUT,
    allowShrink = ALLOW_SHRINK,
    manifestFile = WEB_PACKS_JSON,
    specs = PACK_SPECS,
    redLetterSpecs = RED_LETTER_SPECS,
  } = options;

  fs.mkdirSync(out, {recursive: true});

  // R9-72. EVERYTHING is built into a scratch directory first and moved into
  // `out` only once assertNoShrink has passed. Before this, only the
  // red-letter JSON writes were deferred: buildPack() had already written both
  // .sqlite packs straight into `out`, so the abort message's "no pack file was
  // emitted, so nothing here is publishable yet" was FALSE, and it was false in
  // the worst possible way — publishing is a MANUAL upload of whatever sits in
  // that directory, and the directory is known to hold stale packs from earlier
  // runs. A message that ASSERTS the directory is untouched is worse than no
  // message. Proven before the fix: a source that quietly lost 492 Psalms
  // verses satisfies every verifyPack floor (they pin the DB against the same
  // shrunken SOURCE), aborts in assertNoShrink, and leaves a 30 606-verse
  // web.sqlite sitting in `out` looking exactly like a good one.
  //
  // The scratch lives INSIDE `out` so the moves are same-volume renames (a
  // rename across volumes fails with EXDEV on Windows), and the `finally`
  // removes it on every path, abort included.
  const staging = fs.mkdtempSync(path.join(out, '.staging-'));
  try {
    emit({staging, out, manifestFile, allowShrink, specs, redLetterSpecs});
  } finally {
    fs.rmSync(staging, {recursive: true, force: true});
  }
}

function emit({
  staging,
  out,
  manifestFile,
  allowShrink,
  specs,
  redLetterSpecs,
}) {
  const manifest = [];
  for (const s of specs) {
    console.log(`Building ${s.id} from ${path.basename(s.file)}…`);
    const rawRows = parseTsArray(s.file);
    // Source rows use book_id/book_name (already the pack shape) plus a
    // `version` field we drop (the pack has no version column).
    const rows = rawRows.map(r => ({
      book_id: r.book_id,
      book_name: r.book_name,
      chapter: r.chapter,
      verse: r.verse,
      text: r.text,
    }));
    const dbFile = path.join(staging, s.id.toLowerCase() + '.sqlite');
    buildPack(rows, dbFile);
    verifyPack(dbFile, rows.length);
    const buf = fs.readFileSync(dbFile);
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    console.log(
      `  ${s.id}: ${rows.length} verses -> ${buf.length} bytes, sha256 ${sha.slice(0, 16)}…`,
    );
    manifest.push({
      id: s.id,
      file: s.id.toLowerCase() + '.sqlite',
      bytes: buf.length,
      sha256: sha,
      verseCount: rows.length,
    });
  }

  // Parse, verify and COUNT every red-letter pack before anything is moved
  // into `out`, so the shrink check below can refuse the whole run.
  const redLetterManifest = [];
  for (const rl of redLetterSpecs) {
    console.log(`Building ${rl.out} from ${path.basename(rl.source)}…`);
    // `path.resolve`, not `path.join`: a spec may carry an ABSOLUTE source
    // path (the fixtures in __tests__/buildWebPacks.test.js do), and joining
    // an absolute path onto ROOT concatenates instead of honouring it.
    const entries = parseTsArray(path.resolve(ROOT, rl.source));
    // Against ITS OWN pack, never web.sqlite: spans are offsets into this
    // version's text.
    const ownDbFile = path.join(
      staging,
      rl.versionId.toLowerCase() + '.sqlite',
    );
    verifyRedLetterAlignment(entries, ownDbFile, rl.versionId);
    const body = Buffer.from(JSON.stringify(entries), 'utf8');
    const sha = crypto.createHash('sha256').update(body).digest('hex');
    const spanCount = entries.reduce((sum, e) => sum + e.spans.length, 0);
    console.log(
      `  ${rl.versionId} red-letter: ${entries.length} entries, ${spanCount} ` +
        `spans -> ${body.length} bytes, sha256 ${sha.slice(0, 16)}…`,
    );
    fs.writeFileSync(path.join(staging, rl.out), body);
    redLetterManifest.push({
      versionId: rl.versionId,
      file: rl.out,
      bytes: body.length,
      sha256: sha,
      entries: entries.length,
      spans: spanCount,
    });
  }

  assertNoShrink(
    readPreviousManifest(manifestFile),
    manifest,
    redLetterManifest,
    allowShrink,
  );

  // Past this line the run is judged publishable, so now — and only now —
  // does anything appear in `out`. A rename over an existing file replaces it
  // atomically enough that a reader never sees a half-written pack.
  //
  // R9-81: the LOOP, though, is not atomic. One failing rename leaves `out`
  // holding some of this run's packs and some of the previous run's, with the
  // manifest - written below - describing neither, and the staging directory
  // already swept away by main()'s finally, so nothing survives to say the move
  // was partial. Proven by blocking the last destination: a fresh
  // rvr1960.sqlite sat beside a stale web.sqlite under a raw EPERM carrying
  // none of the "check their sha256 before publishing" guidance every other
  // abort here carries. And `out` defaults to the Desktop, which is exactly
  // where a file gets held open by a sync client or a SQLite browser.
  //
  // So: prove every destination is replaceable BEFORE moving the first one -
  // that covers the whole realistic cause while `out` is still untouched - and
  // if a rename fails anyway, say precisely what moved and what did not.
  const names = fs.readdirSync(staging);
  for (const name of names) {
    const destination = path.join(out, name);
    if (!fs.existsSync(destination)) continue;
    try {
      // Two different ways a destination refuses to be replaced, and Windows
      // only reports one of them from open(): a file held open by another
      // process throws here, while a DIRECTORY sitting where a pack belongs
      // opens perfectly happily and then fails the rename. Check both.
      fs.closeSync(fs.openSync(destination, 'r+'));
      if (!fs.statSync(destination).isFile()) {
        throw new Error('destination is not a file');
      }
    } catch (error) {
      throw new Error(
        `Cannot replace ${destination}: ${error.message}\n\n` +
          'Every destination has to be replaceable before the first one moves, ' +
          'because moving them is not one operation: stopping halfway would ' +
          'leave this directory holding some of this run and some of the last, ' +
          'with nothing to tell them apart.\n' +
          'NOTHING was written: the files in the output directory are exactly ' +
          'as an EARLIER run left them, and the manifest was not touched. ' +
          'Close whatever is holding that file (a SQLite browser, a sync ' +
          'client, an antivirus scan) and re-run.',
      );
    }
  }
  const moved = [];
  for (const name of names) {
    try {
      fs.renameSync(path.join(staging, name), path.join(out, name));
    } catch (error) {
      const stranded = names.filter(n => !moved.includes(n));
      throw new Error(
        `Moving the built packs into ${out} FAILED HALFWAY: ${error.message}\n\n` +
          `  moved (THIS run's bytes):        ${moved.join(', ') || 'none'}\n` +
          `  not moved (an EARLIER run's):    ${stranded.join(', ')}\n\n` +
          'That directory is MIXED and the manifest was not written, so it ' +
          'describes neither state. Do NOT upload anything from it. Fix the ' +
          'cause and re-run - a clean run replaces all of them together.',
      );
    }
    moved.push(name);
  }

  fs.writeFileSync(
    manifestFile,
    JSON.stringify(
      {
        schema: 1,
        generated: new Date().toISOString().slice(0, 10),
        note:
          'Web-only bootstrap packs (RVR1960 + WEB), byte-identical to the ' +
          'native bundled seed. NOT part of web/packs/versions.json ' +
          '(that catalog is also read by the native download-versions ' +
          'screen, which does not filter bundled versions).',
        packs: manifest,
        // An ARRAY as of 2026-09-15 (was a single object, when only WEB had
        // a pack). Nothing reads this field at runtime — data-loader.web.ts
        // only reads `packs` and says so — so the shape change is safe.
        redLetter: redLetterManifest,
      },
      null,
      2,
    ) + '\n',
  );

  console.log('\nDone.');
  for (const s of specs)
    console.log(`  ${path.join(out, s.id.toLowerCase() + '.sqlite')}`);
  for (const rl of redLetterSpecs) console.log(`  ${path.join(out, rl.out)}`);
  console.log(`  ${manifestFile} written`);
  console.log(
    '  Upload the *.sqlite AND *-red-letter.json to the Pages repo under ' +
      '/packs/ (Victor — no gh CLI access from this session).',
  );
}

// Only when run as a script. Exported below so __tests__/buildWebPacks.test.js
// can exercise the verification functions directly — they are the only thing
// standing between a bad regeneration and DATA THAT GETS PUBLISHED, so they
// need a gate of their own.
if (require.main === module) main();

module.exports = {
  parseTsArray,
  buildPack,
  verifyPack,
  verifyRedLetterAlignment,
  readPreviousManifest,
  shrinkComplaints,
  baselineComparisonCounts,
  assertNoShrink,
  main,
  PACK_SPECS,
  RED_LETTER_SPECS,
};
