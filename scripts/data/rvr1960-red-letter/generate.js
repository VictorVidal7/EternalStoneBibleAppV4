/**
 * 🔴 generate.js — build bible-data-rvr1960-redletter.ts (RVR1960 "words of
 * Jesus" spans) from the WEB red-letter data + this directory's editorial
 * decisions.
 *
 * WHY this exists: WEB_RED_LETTER (src/lib/database/bible-data-web-redletter.ts)
 * marks 2,059 WEB verses as containing (at least partly) Jesus's own spoken
 * words, anchored by construction to the WEB eBible.org USFM source. RVR1960
 * is a different translation with different sentence boundaries, so those
 * offsets cannot simply be copied over — a human editorial pass (this
 * session's `workbook/` + `decisions/` batches) worked through every WEB
 * verse whose red-letter span is a PARTIAL span of the verse (654 of the
 * 2,059) and recorded, per verse, the ORDERED list of literal RVR1960
 * substrings that are Jesus's own words. For the other 1,405 (WEB's span
 * covers the whole verse), the whole RVR1960 verse is mechanically Jesus's
 * words too — no editorial judgment needed — with exactly 2 confirmed
 * exceptions (see OVERRIDES below) found by an exhaustive automated screen
 * across all 1,405 (not a sample) during the session that wrote this script.
 *
 * ALGORITHM
 *   1. Parse WEB_RED_LETTER, WEB_DATA, RVR1960_DATA out of their .ts source
 *      files (parseTsArray, copied verbatim from scripts/build-web-packs.js —
 *      duplicated rather than imported, matching this repo's convention of
 *      standalone, self-contained data scripts).
 *   2. Load all 12 decisions/batch-*.json files into one Map keyed by
 *      "book_id|chapter:verse" -> quotes (an ordered array of literal
 *      substrings of the RVR1960 verse text).
 *   3. For each of the 2,059 WEB_RED_LETTER entries, look up the matching
 *      RVR1960 verse text and decide its RVR1960 span(s):
 *        a. One of the 2 hardcoded OVERRIDES -> use its quotes.
 *        b. Else in the decisions map -> sequential indexOf() each quote in
 *           order (same algorithm as verify-batch.js) to turn literal text
 *           back into [start,end) offsets. An empty `quotes: []` means "no
 *           red-letter marking for this verse" -> emit nothing.
 *        c. Else (mechanical, WEB's span already covers the whole verse) ->
 *           the whole RVR1960 verse is the span.
 *   4. Before writing, run a classification canary: every entry NOT in the
 *      decisions map must have a WEB span that itself covers the WHOLE WEB
 *      verse text (spans.length===1, start 0, end === verse length). If a
 *      future edit changes WEB_RED_LETTER or the decisions/ batches without
 *      updating the other, an entry could fall through the cracks (treated
 *      as mechanical when it's actually partial, or vice versa) — this
 *      canary fails loud (non-zero exit) instead of silently mis-marking
 *      Scripture.
 *   5. Sort by book_id, chapter, verse and write bible-data-rvr1960-redletter.ts,
 *      then run `prettier --write` on it so it's guaranteed to pass
 *      `npm run format:check` regardless of this script's own string
 *      formatting.
 *   6. Re-parse the just-written file from disk (not the in-memory array —
 *      this catches any writer/serialization bug) and independently verify
 *      EVERY span against RVR1960_DATA's real text: in-range and non-blank,
 *      the same rigor as build-web-packs.js's verifyRedLetterAlignment.
 *
 * Usage:
 *   node scripts/data/rvr1960-red-letter/generate.js
 *
 * This is the SOLE source of truth for bible-data-rvr1960-redletter.ts — do
 * not hand-edit that file; re-run this script instead. The workbook/ and
 * decisions/ directories are READ-ONLY editorial source data from this
 * session's audit; this script never writes to them.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const DECISIONS_DIR = path.join(__dirname, 'decisions');
const OUTPUT_FILE = path.join(
  ROOT,
  'src/lib/database/bible-data-rvr1960-redletter.ts',
);

/**
 * Parse a `export const X = [ ... ]` array literal out of a .ts data file.
 * Locates the array's opening `[` starting from the `export const X ... =`
 * declaration (not a naive first-`[`-in-file scan), so brackets appearing
 * earlier in header comments or in a `: Type[]` annotation don't confuse it.
 *
 * Most data files here are strict JSON (quoted keys, no trailing commas), so
 * that's tried first. Some (e.g. bible-data-web-redletter.ts, and this
 * script's own output) are plain JS object-literal syntax instead (unquoted
 * keys, trailing commas) — if strict JSON.parse fails, fall back to
 * normalizing just those two things before parsing again.
 *
 * Copied verbatim from scripts/build-web-packs.js — see that file's header
 * for the same helper; kept as a standalone copy rather than a shared
 * module, matching this repo's convention for one-off data scripts (see e.g.
 * redLetterText.web.ts duplicating constants from redLetterText.ts rather
 * than importing across the native/web split).
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

function verseKey(r) {
  return `${r.book_id}|${r.chapter}:${r.verse}`;
}

/**
 * HARDCODED OVERRIDES — the only 2 confirmed exceptions to "WEB's span
 * covers the whole verse, so the whole RVR1960 verse is mechanically Jesus's
 * words too", found by an exhaustive two-heuristic automated screen across
 * all 1,405 whole-verse WEB_RED_LETTER entries (not a sample) in the session
 * that wrote this script (2026-08-18). Both are cases where RVR1960's
 * textual tradition includes a clause WEB's underlying critical text does
 * not have at this verse — copying the whole RVR1960 verse red would
 * incorrectly mark non-Jesus text (a question TO Jesus, and a narrator
 * attribution) as if Jesus spoke it.
 */
const OVERRIDES = new Map([
  [
    '44|9:6', // Hechos 9:6 (Acts 9:6)
    {
      ref: 'Hechos 9:6',
      quotes: [
        'Levántate y entra en la ciudad, y se te dirá lo que debes hacer.',
      ],
      reason:
        "RVR1960 (Textus-Receptus tradition) prefixes Jesus's answer with " +
        'Saul/Pablo\'s own question to Jesus ("Señor, ¿qué quieres que yo ' +
        'haga?"), a clause WEB\'s critical text places differently / omits ' +
        'from this verse — WEB v6 is ONLY Jesus\'s answer ("But rise up and ' +
        'enter into the city, then you will be told what you must do."), no ' +
        'question preceding it. Only the answer is red here.',
    },
  ],
  [
    '42|7:31', // Lucas 7:31 (Luke 7:31)
    {
      ref: 'Lucas 7:31',
      quotes: [
        '¿A qué, pues, compararé los hombres de esta generación, y a qué son semejantes?',
      ],
      reason:
        'RVR1960 prepends a narrator attribution clause ("Y dijo el ' +
        'Señor:") naming Jesus mid-narrative, which WEB does not have at ' +
        'all — WEB v31 opens directly with the quoted question ("To what ' +
        'then should I compare the people of this generation? What are ' +
        'they like?"). Only the question is red here.',
    },
  ],
]);

/** Expected constants — hardcoded so a future drift in WEB_RED_LETTER or
 * decisions/ fails loud instead of silently changing scope. See the
 * classification canary in main(). */
const EXPECTED_WEB_TOTAL = 2059;
const EXPECTED_DECISIONS_SIZE = 654;
const EXPECTED_MECHANICAL_BUCKET = 1405; // includes the 2 overrides
const EXPECTED_OVERRIDES = 2;

function loadDecisions() {
  const map = new Map();
  for (let i = 1; i <= 12; i++) {
    const file = path.join(
      DECISIONS_DIR,
      `batch-${String(i).padStart(2, '0')}.json`,
    );
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const d of arr) {
      const k = verseKey(d);
      if (map.has(k)) {
        throw new Error(
          `Duplicate decision key ${k} (${d.ref}) — appears in more than ` +
            `one decisions/batch-*.json file.`,
        );
      }
      map.set(k, d);
    }
  }
  return map;
}

/**
 * Turn an ordered list of literal quotes into [start,end) spans by
 * sequential indexOf() from a running cursor — identical algorithm to
 * verify-batch.js's per-decision check, so a quote out of order or not
 * literally present throws instead of silently mis-anchoring.
 */
function quotesToSpans(text, quotes, refLabel) {
  let cursor = 0;
  const spans = [];
  for (const q of quotes) {
    if (typeof q !== 'string' || q.length === 0) {
      throw new Error(`Empty/invalid quote for ${refLabel}`);
    }
    const at = text.indexOf(q, cursor);
    if (at === -1) {
      const anywhere = text.indexOf(q);
      throw new Error(
        `Quote not literally found in order for ${refLabel}` +
          `${anywhere > -1 ? ' (present, but out of order)' : ''}\n` +
          `  quote: ${JSON.stringify(q)}\n  text : ${JSON.stringify(text)}`,
      );
    }
    spans.push([at, at + q.length]);
    cursor = at + q.length;
  }
  return spans;
}

function serializeEntries(entries) {
  const lines = entries.map(e => {
    const spans = e.spans.map(([s, en]) => `[${s}, ${en}]`).join(', ');
    return (
      `  {\n` +
      `    book_id: ${e.book_id},\n` +
      `    chapter: ${e.chapter},\n` +
      `    verse: ${e.verse},\n` +
      `    spans: [${spans}],\n` +
      `  },`
    );
  });
  return lines.join('\n');
}

function writeOutput(entries, counts) {
  const spanCount = entries.reduce((sum, e) => sum + e.spans.length, 0);
  const header =
    `// Auto-generated "words of Jesus" spans for the RVR1960 (Reina-Valera\n` +
    `// 1960) reading version.\n` +
    `// Generated on: ${new Date().toISOString()}\n` +
    `// Verses with >=1 span: ${entries.length}\n` +
    `// Total spans: ${spanCount}\n` +
    `// (${counts.mechanicalOutput} mechanical whole-verse, ` +
    `${counts.decisionOutput} from editorial decisions, ` +
    `${counts.overrideOutput} hardcoded overrides; ` +
    `${counts.skippedEmpty} verses deliberately have no red-letter marking)\n` +
    `//\n` +
    `// Each span is a [start, end) character offset (end-exclusive) into\n` +
    `// that verse's PLAIN text as stored in bible-data-rvr1960.ts. Unlike\n` +
    `// the WEB red-letter file (anchored by construction from a single USFM\n` +
    `// parse), these offsets are derived from a human editorial pass\n` +
    `// re-reading every partial-span WEB verse in RVR1960 and recording\n` +
    `// Jesus's own words as literal RVR1960 substrings, since translations\n` +
    `// don't share sentence boundaries.\n` +
    `//\n` +
    `// SOURCE OF TRUTH: this file is GENERATED, not hand-edited. Regenerate\n` +
    `// via:\n` +
    `//   node scripts/data/rvr1960-red-letter/generate.js\n` +
    `// from the editorial decisions committed under\n` +
    `//   scripts/data/rvr1960-red-letter/decisions/batch-01..12.json\n` +
    `// (see that directory and generate.js's own header comment for the\n` +
    `// full algorithm, including 2 hardcoded textual-tradition overrides).\n`;

  const body =
    `\nimport type {RedLetterVerse} from './bible-data-web-redletter';\n\n` +
    `export const RVR1960_RED_LETTER: RedLetterVerse[] = [\n` +
    `${serializeEntries(entries)}\n` +
    `];\n`;

  fs.writeFileSync(OUTPUT_FILE, header + body);

  // Guarantee `npm run format:check` compliance regardless of the manual
  // string formatting above — prettier is a devDependency already used by
  // this repo's own gate. Invoked as `node <prettier's own bin.cjs>` rather
  // than via `npx`/`npx.cmd` — npx's shim spawn is unreliable on Windows
  // (EINVAL) in some environments; requiring prettier's bin script directly
  // sidesteps the shell entirely.
  const prettierBin = require.resolve('prettier/bin/prettier.cjs');
  execFileSync(process.execPath, [prettierBin, '--write', OUTPUT_FILE], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

/**
 * Re-parse the just-written file straight off disk (NOT the in-memory
 * `entries` array — this exists specifically to catch a writer/serialization
 * bug that the in-memory array wouldn't reveal) and verify every span
 * in-range and non-blank against RVR1960_DATA's real text. A literal
 * `require()` of the .ts file isn't possible from plain Node (it uses
 * `import`/type-annotation syntax), so re-parsing with the same
 * parseTsArray used to read every other .ts data file is the equivalent
 * "trust only what's on disk" check.
 *
 * For entries backed by literal quotes (decisions + overrides — everything
 * except the mechanical whole-verse bucket), this does more than "non-blank":
 * it re-slices the ACTUAL written span out of RVR1960_DATA's real text and
 * asserts it's byte-for-byte EQUAL to the audited quote, in order. A plain
 * non-blank check would pass even if a span were off by a few characters
 * (sliced text merely non-blank, but wrong) — this closes that gap, the same
 * gap the disk re-read exists to catch in the first place.
 */
function verifyWrittenFile(rvrTextByKey, quotesByKey) {
  const written = parseTsArray(OUTPUT_FILE);
  const failures = [];
  let spanCount = 0;
  let exactChecked = 0;
  const seen = new Set();
  for (const e of written) {
    const k = verseKey(e);
    if (seen.has(k)) failures.push(`${k} — duplicate output entry`);
    seen.add(k);
    const text = rvrTextByKey.get(k);
    if (text === undefined) {
      failures.push(`${k} — verse not found in RVR1960_DATA`);
      continue;
    }
    const quotes = quotesByKey.get(k); // undefined for mechanical entries
    if (quotes && quotes.length !== e.spans.length) {
      failures.push(
        `${k} — ${e.spans.length} span(s) on disk but ${quotes.length} ` +
          `audited quote(s) for this verse`,
      );
    }
    e.spans.forEach(([s, en], i) => {
      spanCount++;
      if (s < 0 || en <= s || en > text.length) {
        failures.push(
          `${k} — span [${s},${en}) out of range for text length ${text.length}`,
        );
        return;
      }
      const slice = text.slice(s, en);
      if (slice.trim().length === 0) {
        failures.push(`${k} — span [${s},${en}) is blank`);
        return;
      }
      const expected = quotes && quotes[i];
      if (expected !== undefined) {
        exactChecked++;
        if (slice !== expected) {
          failures.push(
            `${k} — span [${s},${en}) = ${JSON.stringify(slice)} does NOT ` +
              `exactly match audited quote ${JSON.stringify(expected)}`,
          );
        }
      }
    });
  }
  return {
    ok: failures.length === 0,
    exactChecked,
    failures,
    entries: written.length,
    spanCount,
  };
}

function main() {
  console.log('Parsing source files…');
  const webRedLetter = parseTsArray(
    path.join(ROOT, 'src/lib/database/bible-data-web-redletter.ts'),
  );
  const webData = parseTsArray(
    path.join(ROOT, 'src/lib/database/bible-data-web.ts'),
  );
  const rvrData = parseTsArray(
    path.join(ROOT, 'src/lib/database/bible-data-rvr1960.ts'),
  );

  const webTextByKey = new Map(webData.map(r => [verseKey(r), r.text]));
  const rvrTextByKey = new Map(rvrData.map(r => [verseKey(r), r.text]));
  const decisions = loadDecisions();

  console.log(
    `  WEB_RED_LETTER: ${webRedLetter.length} entries | WEB_DATA: ` +
      `${webData.length} verses | RVR1960_DATA: ${rvrData.length} verses | ` +
      `decisions: ${decisions.size} verses`,
  );

  // --- Step 4: classification canary (BEFORE writing anything) -----------
  if (webRedLetter.length !== EXPECTED_WEB_TOTAL) {
    throw new Error(
      `CANARY: WEB_RED_LETTER has ${webRedLetter.length} entries, expected ` +
        `${EXPECTED_WEB_TOTAL}. WEB_RED_LETTER changed since this generator ` +
        `was designed — re-audit the decisions/ batches before trusting them.`,
    );
  }
  if (decisions.size !== EXPECTED_DECISIONS_SIZE) {
    throw new Error(
      `CANARY: decisions/ has ${decisions.size} verses, expected ` +
        `${EXPECTED_DECISIONS_SIZE}.`,
    );
  }
  let mechanicalBucket = 0;
  for (const entry of webRedLetter) {
    const k = verseKey(entry);
    if (decisions.has(k)) continue;
    const webText = webTextByKey.get(k);
    if (webText === undefined) {
      throw new Error(`CANARY: no WEB_DATA text for ${k} (in WEB_RED_LETTER).`);
    }
    const isWhole =
      entry.spans.length === 1 &&
      entry.spans[0][0] === 0 &&
      entry.spans[0][1] === webText.length;
    if (!isWhole) {
      throw new Error(
        `CANARY: ${k} is not in decisions/ but its WEB span ` +
          `${JSON.stringify(entry.spans)} does not cover the whole WEB verse ` +
          `(length ${webText.length}) — this verse needs an editorial ` +
          `decision that decisions/ doesn't have. WEB_RED_LETTER or ` +
          `decisions/ changed since this generator was designed.`,
      );
    }
    mechanicalBucket++;
  }
  if (mechanicalBucket + decisions.size !== webRedLetter.length) {
    throw new Error(
      `CANARY: mechanical bucket (${mechanicalBucket}) + decisions ` +
        `(${decisions.size}) !== WEB_RED_LETTER total (${webRedLetter.length}).`,
    );
  }
  if (mechanicalBucket !== EXPECTED_MECHANICAL_BUCKET) {
    throw new Error(
      `CANARY: mechanical bucket is ${mechanicalBucket}, expected ` +
        `${EXPECTED_MECHANICAL_BUCKET}.`,
    );
  }
  for (const overrideKey of OVERRIDES.keys()) {
    if (decisions.has(overrideKey)) {
      throw new Error(
        `CANARY: override ${overrideKey} is now ALSO present in decisions/ ` +
          `— data has changed since these overrides were hardcoded; re-audit ` +
          `before trusting either.`,
      );
    }
  }
  console.log(
    `  Canary OK: ${mechanicalBucket} mechanical + ${decisions.size} ` +
      `decisions === ${webRedLetter.length}; both hardcoded overrides ` +
      `confirmed inside the mechanical bucket, not in decisions/.`,
  );

  // --- Step 3: build output entries ---------------------------------------
  const outputEntries = [];
  // Ordered quotes per verse for every NON-mechanical entry (decisions +
  // overrides) — fed into the post-write verification pass so it can assert
  // each written span slices to EXACTLY the audited quote, not just
  // "non-blank". Mechanical (whole-verse) entries have no quotes list; the
  // verifier falls back to its non-blank/in-range check for those.
  const quotesByKey = new Map();
  let mechanicalOutput = 0,
    decisionOutput = 0,
    overrideOutput = 0,
    skippedEmpty = 0;
  let mechanicalSpans = 0,
    decisionSpans = 0,
    overrideSpans = 0;
  const overrideSummaries = [];

  for (const entry of webRedLetter) {
    const k = verseKey(entry);
    const rvrText = rvrTextByKey.get(k);
    if (rvrText === undefined) {
      throw new Error(
        `FATAL: no RVR1960 verse for ${k} — every WEB_RED_LETTER key must ` +
          `resolve against RVR1960_DATA (previously confirmed true).`,
      );
    }

    if (OVERRIDES.has(k)) {
      const override = OVERRIDES.get(k);
      const spans = quotesToSpans(rvrText, override.quotes, override.ref);
      outputEntries.push({
        book_id: entry.book_id,
        chapter: entry.chapter,
        verse: entry.verse,
        spans,
      });
      overrideOutput++;
      overrideSpans += spans.length;
      overrideSummaries.push({
        ref: override.ref,
        key: k,
        quotes: override.quotes,
        spans,
        reason: override.reason,
      });
      quotesByKey.set(k, override.quotes);
      continue;
    }

    if (decisions.has(k)) {
      const d = decisions.get(k);
      if (d.quotes.length === 0) {
        skippedEmpty++;
        continue;
      }
      const spans = quotesToSpans(rvrText, d.quotes, d.ref || k);
      outputEntries.push({
        book_id: entry.book_id,
        chapter: entry.chapter,
        verse: entry.verse,
        spans,
      });
      decisionOutput++;
      decisionSpans += spans.length;
      quotesByKey.set(k, d.quotes);
      continue;
    }

    // Mechanical whole-verse.
    outputEntries.push({
      book_id: entry.book_id,
      chapter: entry.chapter,
      verse: entry.verse,
      spans: [[0, rvrText.length]],
    });
    mechanicalOutput++;
    mechanicalSpans += 1;
  }

  outputEntries.sort(
    (a, b) =>
      a.book_id - b.book_id || a.chapter - b.chapter || a.verse - b.verse,
  );

  const totalOutput = mechanicalOutput + decisionOutput + overrideOutput;
  const totalSpans = mechanicalSpans + decisionSpans + overrideSpans;
  console.log(
    `\nBuilt ${totalOutput} output entries (${totalSpans} spans): ` +
      `${mechanicalOutput} mechanical, ${decisionOutput} decision-derived, ` +
      `${overrideOutput} hardcoded overrides. Skipped ${skippedEmpty} ` +
      `verse(s) with deliberately empty quotes (no red-letter marking).`,
  );

  // --- Step 5: write + prettier --------------------------------------------
  console.log(`\nWriting ${path.relative(ROOT, OUTPUT_FILE)}…`);
  writeOutput(outputEntries, {
    mechanicalOutput,
    decisionOutput,
    overrideOutput,
    skippedEmpty,
  });

  // --- Step 6: re-verify from disk -----------------------------------------
  console.log('\nRe-parsing written file from disk and verifying alignment…');
  const verification = verifyWrittenFile(rvrTextByKey, quotesByKey);
  if (!verification.ok) {
    console.error(
      `\nVERIFICATION FAILED (${verification.failures.length} issues):`,
    );
    for (const f of verification.failures.slice(0, 20)) console.error('  ' + f);
    throw new Error('Red-letter alignment verification FAILED.');
  }

  // --- Final summary --------------------------------------------------------
  console.log('\n=== SUMMARY ===');
  console.log(`Total entries written: ${verification.entries}`);
  console.log(`Total spans written:   ${verification.spanCount}`);
  console.log(`  Mechanical (whole-verse, from WEB):     ${mechanicalOutput}`);
  console.log(`  Decision-derived (editorial, 654 batch): ${decisionOutput}`);
  console.log(`  Hardcoded overrides:                     ${overrideOutput}`);
  console.log(`  Skipped (empty quotes, no marking):      ${skippedEmpty}`);
  console.log(
    '\nHardcoded overrides (RVR1960-only textual-tradition clauses):',
  );
  for (const o of overrideSummaries) {
    console.log(`  - ${o.ref} (${o.key})`);
    console.log(`      quotes: ${JSON.stringify(o.quotes)}`);
    console.log(`      spans:  ${JSON.stringify(o.spans)}`);
    console.log(`      why:    ${o.reason}`);
  }
  console.log(
    `\nAlignment verification: PASS (0 issues; ${verification.exactChecked} ` +
      `of ${verification.spanCount} spans exact-matched against their ` +
      `audited quote — the rest are mechanical whole-verse spans, checked ` +
      `in-range/non-blank).`,
  );
  console.log('\nDone.');
}

main();
