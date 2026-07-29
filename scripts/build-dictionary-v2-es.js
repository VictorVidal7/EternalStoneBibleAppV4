/**
 * 📖 build-dictionary-v2-es — ingestion of the v2-doctrinal Bible dictionary
 * entries (ISBE 1915, public domain) into a small bundled JSON asset.
 *
 * Unlike v1-factual (mechanically clean translations), every v2 entry is a
 * contested doctrinal article translated faithfully-but-unsoftened, with
 * inline editorial markers tracking Victor's review of one-sided framing:
 *   - `[NOTA DE CONTEXTO AGREGADA — ...]` + a following `> *Nota: ...*`
 *     blockquote — an approved contextual note. Stripped down to just the
 *     italic note text (still rendered via parseMarkdownSegments), dropping
 *     the marker bracket and the blockquote "> " prefix, which have no
 *     meaning to an end reader.
 *   - A bare `[NOTA DE CONTEXTO AGREGADA — ver nota general ...]` pointer
 *     (no attached blockquote) — a duplicate-avoidance pointer back to an
 *     already-shown general note. Dropped entirely, no replacement text.
 *   - `[CONFIRMADO por Victor ...]` — a sign-off annotation on an already
 *     -applied edit (e.g. an excision). Dropped entirely.
 *   - `[EXCISE BEFORE ANY USER-FACING USE ...] ... [END EXCISE-MARKED
 *     PASSAGE]` — a passage Victor decided must never ship in any form.
 *     The ENTIRE block (markers + contained text) is removed, not just the
 *     markers — the contained text is retained-for-research-record in the
 *     scratchpad source only, never in the shipped JSON.
 *
 * Fails loud (throws, does not ship partial output) if, after all of the
 * above substitutions, a `[REVISAR` bracket is still present anywhere in an
 * entry's extracted gloss/article text — that means a real, undecided
 * editorial marker would otherwise ship as literal bracket text to a real
 * user. This is the safety net for entries not yet fully resolved (e.g. a
 * future Baptism/Milenio batch, once those get a multi-view schema) — don't
 * loosen this check to "make the build pass". Also fails loud on any stray
 * `*` left outside a valid `**bold**`/`*italic*` span — usually a marker
 * that got bold-wrapped (`**[...]**`) without a following blockquote, which
 * cascades into silently corrupting the rest of the article's formatting
 * (caught 2026-07-21 in two already-written entries).
 *
 * Source files (explicit list, not a filename-prefix scan like v1 — the
 * scratchpad's v2 filenames don't follow one consistent naming scheme, and
 * an explicit list keeps this run's actual scope — only the entries Victor
 * approved as ready — auditable at a glance).
 *
 * Batch 3 (Bautismo, Milenio — `treatment: 'multi-view'`) doesn't go
 * through `SOURCES`/`parseEntry` at all: those two entries are several
 * signed pieces/postures, not one article, so their premium content is a
 * `sections` array (→ `dictionary_multiview_sections` rows) instead of a
 * single `articleEs` string, and `articleEs` ships `null`. They're sliced
 * by the separate `scripts/split-dictionary-views.js` (run first, writes
 * `assets/dictionary-v2-multiview-es.json`) — this script just reads that
 * already-resolved JSON and merges it in below, unchanged.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT =
  process.argv[2] || path.join(ROOT, 'assets', 'dictionary-v2-es.json');

// Base dir for the raw v2-doctrinal source files listed in SOURCES below
// (each entry is a subpath under it, e.g. `isbe-v2-translations/...` or
// `isbe-v2-reextract/...`). Resolution order: explicit 3rd CLI arg, then
// DICTIONARY_V2_SRC_DIR env var, then this repo-relative default.
//
// IMPORTANT: this used to be hardcoded to a personal Windows Temp scratchpad
// path, same as build-dictionary-v1-es.js was — Windows "Storage Sense"
// auto-cleanup silently wiped that directory (see the Tanda 5 dictionary
// track's memory notes), breaking this script with no warning until someone
// next tried to run it. Never point this back at a scratch/temp directory —
// use the gitignored repo-relative default below, or an explicit override
// that lives somewhere durable.
const DEFAULT_SCRATCH_BASE = path.join(ROOT, 'scripts', 'dictionary-sources');
const SCRATCH_BASE =
  process.argv[3] || process.env.DICTIONARY_V2_SRC_DIR || DEFAULT_SCRATCH_BASE;

if (!fs.existsSync(SCRATCH_BASE)) {
  throw new Error(
    `Source directory not found: ${SCRATCH_BASE}\n` +
      'Expected the raw `isbe-v2-translations/`/`isbe-v2-reextract/` ' +
      'subfolders (see SOURCES below for the exact expected file list) ' +
      'there. This directory is meant to be a durable, non-scratchpad ' +
      'location — do not point it at a Windows Temp / scratch directory; ' +
      'those get silently wiped by Storage Sense (that is exactly how this ' +
      'script broke before).\n' +
      `Fix by either: (1) placing the source files under ${DEFAULT_SCRATCH_BASE}, ` +
      'or (2) setting the DICTIONARY_V2_SRC_DIR env var, or (3) passing a ' +
      '3rd CLI arg: node scripts/build-dictionary-v2-es.js [outPath] [srcBaseDir]',
  );
}

// Batch 3's already-sliced multi-view entries (Bautismo, Milenio) — written
// by `node scripts/split-dictionary-views.js`, run BEFORE this script.
// Always a repo-relative build artifact, never scratchpad-relative (unlike
// SCRATCH_BASE above), since it's the OUTPUT of that other script, not a
// raw source file.
const MULTIVIEW_JSON = path.join(
  ROOT,
  'assets',
  'dictionary-v2-multiview-es.json',
);

// Batch 1 (2026-07-21): the 4 v2-doctrinal entries Victor confirmed as fully
// resolved (zero open `[REVISAR]` markers, verified before this script was
// written). Baptism/Milenio (multi-view, needs new schema) are deliberately
// NOT listed here — those need a `dictionary_multiview_sections` schema, a
// separate future tanda.
//
// Batch 2 (2026-07-21, same day, continuation after context compaction):
// Kingdom of God, Predestination, Holy Spirit, Salvation — all 4 had open
// `[REVISAR]` markers as of batch 1; all 4 resolved this session (12
// contextual notes + 1 excision, the latter following the same
// Jerusalem/Herod precedent already applied within Kingdom of God itself).
const SOURCES = [
  {file: 'isbe-v2-translations/v2-translation-atonement.md', slug: 'expiacion'},
  {
    file: 'isbe-v2-reextract/v2-translation-sabado-parte1.md',
    slug: 'sabado',
  },
  {file: 'isbe-v2-reextract/v2-translation-creation.md', slug: 'creacion'},
  {
    file: 'isbe-v2-translations/v2-translation-tabernaculo.md',
    slug: 'tabernaculo',
  },
  {
    file: 'isbe-v2-translations/v2-translation-kingdom-de-dios.md',
    slug: 'reino-de-dios',
  },
  {
    file: 'isbe-v2-translations/v2-translation-predestination.md',
    slug: 'predestinacion',
  },
  {
    file: 'isbe-v2-translations/v2-translation-espiritu-santo.md',
    slug: 'espiritu-santo',
  },
  {file: 'isbe-v2-reextract/v2-translation-salvation.md', slug: 'salvacion'},
];

/** Trim leading/trailing blank lines from a line array, then drop a
 *  trailing "---" horizontal-rule separator (and any blank lines before
 *  it) if present — mirrors build-dictionary-v1-es.js's trimSection. */
function trimSection(lines) {
  const out = lines.slice();
  const isBlank = l => l.trim() === '';
  while (out.length && isBlank(out[0])) out.shift();
  while (out.length && isBlank(out[out.length - 1])) out.pop();
  if (out.length && /^-{3,}$/.test(out[out.length - 1].trim())) {
    out.pop();
    while (out.length && isBlank(out[out.length - 1])) out.pop();
  }
  return out.join('\n').trim();
}

/** Resolve every editorial marker convention into its shipped form (or
 *  removes it entirely, for pure-process markers). Order matters: the
 *  bold-marker+blockquote form must be handled before the bare-pointer
 *  form, since the bare form's pattern would also match the bold form's
 *  bracket text if run first. */
function resolveMarkers(text) {
  let out = text;

  // The source OCR/extraction left literal "&nbsp;" HTML entities as the
  // indentation device for numbered outline sub-points (e.g. Atonement's
  // and Tabernáculo's "Esquema" sections) — RN Text renders them as the
  // literal string, not a space. Decode to a real space; this app has no
  // HTML renderer, so a plain space is the correct target, not U+00A0.
  out = out.replace(/&nbsp;/g, ' ');

  // [EXCISE BEFORE ANY USER-FACING USE ...] ... [END EXCISE-MARKED PASSAGE]
  // — remove the whole block, contained text included.
  out = out.replace(
    /\[EXCISE BEFORE ANY USER-FACING USE[\s\S]*?\[END EXCISE-MARKED PASSAGE\]/g,
    '',
  );

  // Bold marker + following blockquote note: keep only the italic note
  // text (already valid parseMarkdownSegments syntax), drop the marker
  // bracket, the "\n> " that would otherwise render as a literal line
  // break + ">" character.
  out = out.replace(/\*\*\[NOTA DE CONTEXTO AGREGADA[^\]]*\]\*\*\n>\s?/g, '');

  // Any remaining bare pointer/marker brackets (no attached note text) —
  // duplicate-avoidance pointers and sign-off annotations. Drop entirely.
  out = out.replace(/\[NOTA DE CONTEXTO AGREGADA[^\]]*\]/g, '');
  out = out.replace(/\[CONFIRMADO[^\]]*\]/g, '');

  // A marker that was its own standalone paragraph leaves an empty
  // paragraph behind once stripped — collapse 3+ consecutive newlines
  // (and any trailing spaces on now-blank lines) down to a normal single
  // paragraph break, so no extra vertical whitespace survives into the
  // shipped text.
  out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  return out;
}

/** Parse one v2 source file into a dictionary entry object. */
function parseEntry(relPath, slug, content) {
  const lines = content.split(/\r?\n/);

  const titleLine = lines[0] || '';
  const titleMatch = titleLine.match(/^#\s+(.+)$/);
  if (!titleMatch) {
    throw new Error(`${relPath}: first line is not a "# ..." heading`);
  }
  const headwordEs = titleMatch[1].split(/\s+—\s+/)[0].trim();
  if (!headwordEs) {
    throw new Error(
      `${relPath}: could not extract a headword from the title line`,
    );
  }

  const glossIdx = lines.findIndex(l => /^##\s+GLOSS GRATIS/.test(l));
  if (glossIdx === -1) {
    throw new Error(`${relPath}: no "## GLOSS GRATIS" heading found`);
  }
  const articuloIdx = lines.findIndex(l =>
    /^##\s+ARTÍCULO COMPLETO PREMIUM/.test(l),
  );
  if (articuloIdx === -1) {
    throw new Error(
      `${relPath}: no "## ARTÍCULO COMPLETO PREMIUM" heading found`,
    );
  }
  if (articuloIdx <= glossIdx) {
    throw new Error(
      `${relPath}: ARTÍCULO heading appears before GLOSS heading`,
    );
  }

  const glossEsRaw = trimSection(lines.slice(glossIdx + 1, articuloIdx));
  const articleEsRaw = trimSection(lines.slice(articuloIdx + 1));

  if (!glossEsRaw) throw new Error(`${relPath}: GLOSS GRATIS section is empty`);
  if (!articleEsRaw)
    throw new Error(`${relPath}: ARTÍCULO COMPLETO PREMIUM section is empty`);

  const glossEs = resolveMarkers(glossEsRaw);
  const articleEs = resolveMarkers(articleEsRaw);

  // Fail loud: any surviving `[REVISAR` means a real, undecided marker would
  // ship as literal bracket text. Never loosen this to ship partial content.
  for (const [label, value] of [
    ['GLOSS GRATIS', glossEs],
    ['ARTÍCULO COMPLETO PREMIUM', articleEs],
  ]) {
    const stillOpen = value.match(/\[REVISAR[^\]]*\]/);
    if (stillOpen) {
      throw new Error(
        `${relPath}: unresolved marker in ${label} — "${stillOpen[0].slice(0, 80)}..." — this entry is not ready to ship`,
      );
    }

    // Fail loud: a stray, unmatched "*" left after stripping every valid
    // **bold**/*italic* span means the app's parseMarkdownSegments will
    // pair it with the NEXT unrelated "*" it finds — silently swallowing
    // everything in between into one wrong italic span, and cascading
    // (each subsequent "**heading**" then contributes only one of its two
    // asterisks to close that span, corrupting formatting for the rest of
    // the article). Caught 2026-07-21: a bold-wrapped "**[CONFIRMADO ...]**"
    // marker had only its bracket stripped, leaving "**" + "**" behind.
    const strippedOfValidSpans = value.replace(/\*\*[^*]+\*\*|\*[^*]+\*/g, '');
    if (strippedOfValidSpans.includes('*')) {
      throw new Error(
        `${relPath}: unbalanced markdown asterisk in ${label} — a stray "*" survived outside any valid **bold**/*italic* span. Likely a bold-wrapped marker (e.g. "**[CONFIRMADO ...]**") that only had its bracket stripped. This would silently corrupt formatting for the rest of the article — fix the source markdown, don't ship it.`,
      );
    }
  }

  return {
    slug,
    headwordEs,
    glossEs,
    articleEs,
    sourceTier: 'v2-doctrinal',
    treatment: 'annotated',
  };
}

/** Load + lightly validate batch 3's already-sliced multi-view entries.
 *  Only structural checks here — the actual marker-resolution/asterisk-
 *  balance fail-loud checks already ran per-section inside
 *  split-dictionary-views.js; re-running the SAME checks against its
 *  output here (like the annotated batches' parseEntry does against ITS
 *  own freshly-resolved text) is cheap insurance against a hand-edit of
 *  the intermediate JSON reintroducing a marker after the fact. */
function loadMultiviewEntries() {
  if (!fs.existsSync(MULTIVIEW_JSON)) {
    throw new Error(
      `Multi-view JSON not found: ${MULTIVIEW_JSON} — run ` +
        `"node scripts/split-dictionary-views.js" first.`,
    );
  }
  const entries = JSON.parse(fs.readFileSync(MULTIVIEW_JSON, 'utf8'));
  const markerPattern =
    /\[REVISAR|\[EXCISE|\[END EXCISE|\[CONFIRMADO|\[NOTA DE CONTEXTO|\[APROBADO/;
  for (const e of entries) {
    if (e.treatment !== 'multi-view') {
      throw new Error(
        `${MULTIVIEW_JSON}: ${e.slug} treatment must be 'multi-view'`,
      );
    }
    if (e.articleEs !== null) {
      throw new Error(`${MULTIVIEW_JSON}: ${e.slug} articleEs must be null`);
    }
    if (!Array.isArray(e.sections) || e.sections.length === 0) {
      throw new Error(`${MULTIVIEW_JSON}: ${e.slug} has no sections`);
    }
    for (const field of [e.glossEs, ...e.sections.map(s => s.bodyEs)]) {
      if (markerPattern.test(field)) {
        throw new Error(
          `${MULTIVIEW_JSON}: ${e.slug} still has an unresolved marker — "${field.match(markerPattern)[0].slice(0, 60)}..."`,
        );
      }
      if (field.includes('`')) {
        throw new Error(`${MULTIVIEW_JSON}: ${e.slug} has a stray backtick`);
      }
      const strippedOfValidSpans = field.replace(
        /\*\*[^*]+\*\*|\*[^*]+\*/g,
        '',
      );
      if (strippedOfValidSpans.includes('*')) {
        throw new Error(
          `${MULTIVIEW_JSON}: ${e.slug} has an unbalanced markdown asterisk`,
        );
      }
    }
  }
  return entries;
}

function main() {
  const annotatedEntries = SOURCES.map(({file, slug}) => {
    const abs = path.join(SCRATCH_BASE, file);
    if (!fs.existsSync(abs)) {
      throw new Error(`Source file not found: ${abs}`);
    }
    const content = fs.readFileSync(abs, 'utf8');
    return parseEntry(file, slug, content);
  });

  const multiviewEntries = loadMultiviewEntries();

  const entries = [...annotatedEntries, ...multiviewEntries];
  entries.sort((a, b) => a.slug.localeCompare(b.slug));

  const seen = new Set();
  for (const e of entries) {
    if (seen.has(e.slug)) {
      throw new Error(`Duplicate slug produced: ${e.slug}`);
    }
    seen.add(e.slug);
  }

  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  fs.writeFileSync(OUT, JSON.stringify(entries, null, 2) + '\n', 'utf8');

  console.log(`✅ ${OUT}`);
  console.log(
    `   ${entries.length} entries: ${entries.map(e => e.slug).join(', ')}`,
  );
  for (const e of entries) {
    if (e.treatment === 'multi-view') {
      console.log(
        `   - ${e.slug}: headword="${e.headwordEs}" gloss=${e.glossEs.length} chars, ${e.sections.length} multi-view sections`,
      );
    } else {
      console.log(
        `   - ${e.slug}: headword="${e.headwordEs}" gloss=${e.glossEs.length} chars, article=${e.articleEs.length} chars`,
      );
    }
  }
}

main();
