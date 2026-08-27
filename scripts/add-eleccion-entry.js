/**
 * 📖 add-eleccion-entry — splice the "ELECCIÓN" (Calvinism / Arminianism)
 * multi-view v2-doctrinal dictionary entry into BOTH bundled dictionary
 * assets, at the correct sorted position and in byte-identical formatting to
 * what `scripts/build-dictionary-v2-es.js` + `scripts/split-dictionary-
 * views.js` would produce — so `git diff` shows ONLY the added entry.
 *
 * Same rationale as the Comunión precedent (commit 04c1fd8): the ISBE
 * `SOURCES` scratchpad that `build-dictionary-v2-es.js` reads is long gone,
 * and `split-dictionary-views.js` is hardcoded to Bautismo/Milenio's own
 * source .md files — neither applies to a freshly-authored entry with no
 * source markdown. So this splices the new entry directly into both files,
 * replicating exactly what those scripts would emit:
 *   - the same sort comparator: `entries.sort((a,b) => a.slug.localeCompare(b.slug))`
 *   - the same serializer: `JSON.stringify(entries, null, 2) + '\n'`
 * (`assets/dictionary-v2-multiview-es.json` is the source of truth for
 * multi-view entries; `assets/dictionary-v2-es.json` is the asset
 * `seedDictionaryV2IfNeeded()` actually reads. The two store the IDENTICAL
 * entry object — verified against the Bautismo/Comunión/Milenio rows.)
 *
 * IDEMPOTENT: an existing "eleccion" entry in either file is REPLACED, not
 * duplicated. Re-run freely after editing the section text.
 *
 * ── Usage ───────────────────────────────────────────────────────────────
 *   node scripts/add-eleccion-entry.js
 *       Reads the clean, committed input `scripts/eleccion-entry.json`,
 *       validates it, and splices it into both asset files.
 *
 *   node scripts/add-eleccion-entry.js --from-draft
 *       (Re)generates `scripts/eleccion-entry.json` by parsing the 4
 *       sections + gloss out of `DOCS/drafts/eleccion-integrated-draft.md`
 *       (converting prettier's `_italic_` back to the app parser's
 *       `*italic*`), then splices. Use this to refresh the input file after
 *       the draft's prose is updated; then sanity-check the JSON and the
 *       `labelEs` values (the draft's quoted section titles are long — the
 *       committed `SECTION_LABELS` below are the short display labels).
 *
 *   node scripts/add-eleccion-entry.js --check
 *       Validate the input + report where `eleccion` sorts, write nothing.
 *
 * ── At final-text time ──────────────────────────────────────────────────
 * See DOCS/INTEGRATION-eleccion.md for the full runbook (which test lines
 * to touch, the expected diff, the DICT_V2_VERSION bump).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENTRY_JSON = path.join(ROOT, 'scripts', 'eleccion-entry.json');
const DRAFT_MD = path.join(
  ROOT,
  'DOCS',
  'drafts',
  'eleccion-integrated-draft.md',
);
const V2_ES = path.join(ROOT, 'assets', 'dictionary-v2-es.json');
const V2_MULTIVIEW_ES = path.join(
  ROOT,
  'assets',
  'dictionary-v2-multiview-es.json',
);

const SLUG = 'eleccion';
const HEADWORD = 'ELECCIÓN';

// Short display labels for the section chips/tabs, matching the precedent's
// style (Bautismo: "Bautista"; Comunión: "Conmemorativa"; Milenio:
// "Premilenialismo"). The draft's own headings quote much longer titles —
// those don't fit the UI. PROVISIONAL pending Victor's sign-off; keyed by
// `position`. NOTE: section 2-vs-3 order (arminian-first) follows the newest
// harmonized draft (da393ad); to flip it, swap the two `position` integers
// in scripts/eleccion-entry.json and re-run — labels here are position-keyed
// so they follow automatically.
const SECTION_LABELS = {
  1: 'El debate',
  2: 'Arminiana y wesleyana',
  3: 'Reformada (calvinista)',
  4: 'Lo que confiesan juntas',
};
const EXPECTED_POSITIONS = [1, 2, 3, 4];

// ── Markdown normalization (mirrors build-dictionary-v2-es.js intent) ─────

/**
 * prettier's markdown formatter rewrites `*emphasis*` → `_emphasis_` on
 * every commit (lint-staged runs `prettier --write` on *.md), but the app's
 * `parseMarkdownSegments` only understands `*italic*` / `**bold**`. Convert
 * single-underscore spans back to asterisks. `**bold**` already survives
 * prettier untouched, so it is left alone.
 */
function underscoreItalicToAsterisk(text) {
  return text.replace(/_([^_\n]+)_/g, '*$1*');
}

/** Trim leading/trailing blank lines, drop a trailing "---" rule, collapse
 *  3+ newlines to a normal paragraph break — same shape as the build
 *  scripts' trimSection / resolveMarkers. */
function tidyBody(text) {
  let out = text.replace(/\r\n/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/[ \t]+\n/g, '\n');
  out = out.replace(/\n*-{3,}\s*$/, '');
  return out.trim();
}

/** Fail loud on anything that would ship as broken/leaked text — same net
 *  as build-dictionary-v2-es.js and split-dictionary-views.js. */
function assertShippable(label, text) {
  if (!text || !text.trim()) {
    throw new Error(`${label}: empty`);
  }
  const marker =
    /\[REVISAR|\[EXCISE|\[END EXCISE|\[CONFIRMADO|\[NOTA DE CONTEXTO|\[APROBADO/;
  const hit = text.match(marker);
  if (hit) {
    throw new Error(`${label}: unresolved editorial marker "${hit[0]}..."`);
  }
  if (text.includes('&nbsp;')) {
    throw new Error(`${label}: literal "&nbsp;" — decode to a real space`);
  }
  if (text.includes('`')) {
    throw new Error(
      `${label}: stray backtick — parseMarkdownSegments has no backtick span`,
    );
  }
  if (/(^|[^*])_[^_\n]+_/.test(text)) {
    throw new Error(
      `${label}: a "_italic_" span survived — the app parser needs "*italic*" (run --from-draft, or fix the JSON)`,
    );
  }
  const strippedOfValidSpans = text.replace(/\*\*[^*]+\*\*|\*[^*]+\*/g, '');
  if (strippedOfValidSpans.includes('*')) {
    throw new Error(
      `${label}: unbalanced markdown asterisk outside any **bold**/*italic* span`,
    );
  }
}

// ── Draft parser (--from-draft) ─────────────────────────────────────────

/** Slice the body under a "## ..." heading that matches `headingRe`, up to
 *  the next "## " heading, a "---" rule, or EOF. */
function sliceHeadingBody(lines, headingRe) {
  const start = lines.findIndex(l => headingRe.test(l));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]) || /^-{3,}\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

function buildEntryFromDraft() {
  if (!fs.existsSync(DRAFT_MD)) {
    throw new Error(`Draft not found: ${DRAFT_MD}`);
  }
  const lines = fs
    .readFileSync(DRAFT_MD, 'utf8')
    .replace(/\r\n/g, '\n')
    .split('\n');

  const glossRaw = sliceHeadingBody(lines, /^##\s+glossEs\b/i);
  if (glossRaw === null) throw new Error('Draft: no "## glossEs" heading');
  const glossEs = tidyBody(underscoreItalicToAsterisk(glossRaw));

  const sections = EXPECTED_POSITIONS.map(position => {
    const re = new RegExp(`^##\\s+Secci[oó]n\\s+${position}\\s*[—-]`);
    const raw = sliceHeadingBody(lines, re);
    if (raw === null) {
      throw new Error(`Draft: no "## Sección ${position} — ..." heading`);
    }
    return {
      position,
      labelEs: SECTION_LABELS[position],
      bodyEs: tidyBody(underscoreItalicToAsterisk(raw)),
    };
  });

  return {
    slug: SLUG,
    headwordEs: HEADWORD,
    glossEs,
    articleEs: null,
    sourceTier: 'v2-doctrinal',
    treatment: 'multi-view',
    sections,
  };
}

// ── Input validation (shared by both source modes) ──────────────────────

function validateEntry(entry) {
  if (entry.slug !== SLUG) throw new Error(`slug must be "${SLUG}"`);
  if (entry.headwordEs !== HEADWORD) {
    throw new Error(`headwordEs must be "${HEADWORD}"`);
  }
  if (entry.articleEs !== null) {
    throw new Error('articleEs must be null (multi-view entry)');
  }
  if (entry.sourceTier !== 'v2-doctrinal') {
    throw new Error('sourceTier must be "v2-doctrinal"');
  }
  if (entry.treatment !== 'multi-view') {
    throw new Error('treatment must be "multi-view"');
  }
  if (!Array.isArray(entry.sections) || entry.sections.length === 0) {
    throw new Error('sections must be a non-empty array');
  }
  const positions = entry.sections.map(s => s.position).sort((a, b) => a - b);
  const contiguous = positions.every((p, i) => p === i + 1);
  if (!contiguous) {
    throw new Error(
      `section positions must be contiguous from 1, got [${positions}]`,
    );
  }
  assertShippable('glossEs', entry.glossEs);
  for (const s of entry.sections) {
    if (!s.labelEs || !s.labelEs.trim()) {
      throw new Error(`section ${s.position}: labelEs is empty`);
    }
    assertShippable(`sections[${s.position}] (${s.labelEs})`, s.bodyEs);
  }
  // Normalize key order to match the corpus exactly (slug, headwordEs,
  // glossEs, articleEs, sourceTier, treatment, sections[position,labelEs,bodyEs]).
  return {
    slug: entry.slug,
    headwordEs: entry.headwordEs,
    glossEs: entry.glossEs,
    articleEs: null,
    sourceTier: entry.sourceTier,
    treatment: entry.treatment,
    sections: entry.sections
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(s => ({
        position: s.position,
        labelEs: s.labelEs,
        bodyEs: s.bodyEs,
      })),
  };
}

// ── Splice ─────────────────────────────────────────────────────────────

/** Insert (or replace) `entry` in the JSON array at `file`, re-sorted by the
 *  build script's comparator, serialized identically. Returns a short report. */
function spliceInto(file, entry) {
  const raw = fs.readFileSync(file, 'utf8');
  const arr = JSON.parse(raw);
  const had = arr.some(e => e.slug === entry.slug);
  const next = arr.filter(e => e.slug !== entry.slug);
  next.push(entry);
  next.sort((a, b) => a.slug.localeCompare(b.slug));

  const seen = new Set();
  for (const e of next) {
    if (seen.has(e.slug)) throw new Error(`Duplicate slug produced: ${e.slug}`);
    seen.add(e.slug);
  }

  const idx = next.findIndex(e => e.slug === entry.slug);
  const out = JSON.stringify(next, null, 2) + '\n';
  fs.writeFileSync(file, out, 'utf8');
  return {
    file: path.relative(ROOT, file),
    action: had ? 'replaced' : 'inserted',
    position: `${idx + 1}/${next.length}`,
    after: idx > 0 ? next[idx - 1].slug : '(first)',
    before: idx < next.length - 1 ? next[idx + 1].slug : '(last)',
  };
}

// ── Main ───────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const fromDraft = args.includes('--from-draft');
  const checkOnly = args.includes('--check');

  let entry;
  if (fromDraft) {
    entry = validateEntry(buildEntryFromDraft());
    fs.writeFileSync(ENTRY_JSON, JSON.stringify(entry, null, 2) + '\n', 'utf8');
    console.log(
      `✅ regenerated ${path.relative(ROOT, ENTRY_JSON)} from the draft`,
    );
  } else {
    if (!fs.existsSync(ENTRY_JSON)) {
      throw new Error(
        `${path.relative(ROOT, ENTRY_JSON)} not found — run with --from-draft first`,
      );
    }
    entry = validateEntry(JSON.parse(fs.readFileSync(ENTRY_JSON, 'utf8')));
  }

  console.log(
    `   entry: ${entry.slug} "${entry.headwordEs}" · gloss ${entry.glossEs.length} chars · ${entry.sections.length} sections`,
  );
  for (const s of entry.sections) {
    console.log(`     ${s.position}. ${s.labelEs} — ${s.bodyEs.length} chars`);
  }

  if (checkOnly) {
    // Report sort position without writing.
    for (const file of [V2_ES, V2_MULTIVIEW_ES]) {
      const arr = JSON.parse(fs.readFileSync(file, 'utf8')).filter(
        e => e.slug !== SLUG,
      );
      arr.push({slug: SLUG});
      arr.sort((a, b) => a.slug.localeCompare(b.slug));
      const idx = arr.findIndex(e => e.slug === SLUG);
      console.log(
        `   ${path.relative(ROOT, file)}: would sort to ${idx + 1}/${arr.length} ` +
          `(after ${idx > 0 ? arr[idx - 1].slug : '(first)'}, before ${
            idx < arr.length - 1 ? arr[idx + 1].slug : '(last)'
          })`,
      );
    }
    console.log('   --check: no files written');
    return;
  }

  for (const file of [V2_ES, V2_MULTIVIEW_ES]) {
    const r = spliceInto(file, entry);
    console.log(
      `✅ ${r.file}: ${r.action} at ${r.position} (after ${r.after}, before ${r.before})`,
    );
  }
  console.log(
    '\nNext: bump DICT_V2_VERSION in src/lib/database/index.ts, update the ' +
      'test counts (see DOCS/INTEGRATION-eleccion.md), run the gate.',
  );
}

main();
