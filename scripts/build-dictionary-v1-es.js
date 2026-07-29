/**
 * 📖 build-dictionary-v1-es — one-time ingestion of the v1-factual Bible
 * dictionary entries (ISBE 1915, public domain, faithfully translated to
 * Spanish and gloss/article-leveled) into a small bundled JSON asset.
 *
 * Produces `assets/dictionary-v1-es.json`: an array of
 *   {slug, headwordEs, glossEs, articleEs, sourceTier, treatment}
 * — one object per entry. Only 10 rows in v1, so (unlike the downloadable
 * originals/strongs-defs packs) this is embedded directly as JSON, imported
 * with a plain `require(...)` at runtime (see seedDictionaryV1IfNeeded in
 * src/lib/database/index.ts) — no Asset.fromModule/download machinery needed
 * for a dataset this small.
 *
 * Source: the approved `v1-translation-*.md` files, expected under
 * `scripts/dictionary-sources/v1-factual/` (repo-relative, gitignored — the
 * translated .md source files aren't committed, only this script and its
 * JSON output are). Override with the `DICTIONARY_V1_SRC_DIR` env var or a
 * 3rd CLI arg if they live elsewhere. Each file follows the molde confirmed
 * in the Nazaret pilot entry:
 *   # HEADWORD — ...
 *   ## GLOSS GRATIS (completo en sí mismo)
 *   <one free paragraph>
 *   ## ARTÍCULO COMPLETO PREMIUM (...)
 *   <full translated article>
 * The `verify-*.md` / `*-extracted.md` / `SYNTHESIS.md` files living
 * alongside them are NOT entries — they are QA notes, and are excluded.
 *
 * Re-run is deterministic: same 10 source files in → same JSON out (module
 * order the only re-generation input, and this script sorts by slug for a
 * stable diff).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT =
  process.argv[2] || path.join(ROOT, 'assets', 'dictionary-v1-es.json');

// Location of the approved v1-factual translations (not part of the repo's
// shipped content — this script's whole job is to pull them in and emit the
// small JSON asset that IS committed). Resolution order: explicit 3rd CLI
// arg, then DICTIONARY_V1_SRC_DIR env var, then this repo-relative default.
//
// IMPORTANT: this used to be hardcoded to a personal Windows Temp scratchpad
// path. Windows "Storage Sense" auto-cleanup silently wiped that directory
// (see the Tanda 5 dictionary track's memory notes), which broke this script
// with no warning until someone next tried to run it. Never point this back
// at a scratch/temp directory — use the gitignored repo-relative default
// below, or an explicit override that lives somewhere durable.
const DEFAULT_SRC_DIR = path.join(
  ROOT,
  'scripts',
  'dictionary-sources',
  'v1-factual',
);
const SRC_DIR =
  process.argv[3] || process.env.DICTIONARY_V1_SRC_DIR || DEFAULT_SRC_DIR;

/** Filenames in this directory that follow the `v1-translation-*.md` pattern
 *  but are NOT dictionary entries (independent QA/verification reports). */
const EXCLUDE_RE = /verify/i;

/** `poc-nazaret` (the pilot entry's filename) normalizes to `nazaret`. */
function slugFromFilename(filename) {
  const base = filename.replace(/^v1-translation-/, '').replace(/\.md$/, '');
  return base === 'poc-nazaret' ? 'nazaret' : base;
}

/** Trim leading/trailing blank lines from a line array, then drop a
 *  trailing "---" horizontal-rule separator (and any blank lines before
 *  it) if present — the molde's separator between GLOSS and the next
 *  heading, which isn't part of either section's actual content. */
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

/** Parse one `v1-translation-*.md` file into a dictionary entry object. */
function parseEntry(filename, content) {
  const lines = content.split(/\r?\n/);

  const titleLine = lines[0] || '';
  const titleMatch = titleLine.match(/^#\s+(.+)$/);
  if (!titleMatch) {
    throw new Error(`${filename}: first line is not a "# ..." heading`);
  }
  const headwordEs = titleMatch[1].split(/\s+—\s+/)[0].trim();
  if (!headwordEs) {
    throw new Error(
      `${filename}: could not extract a headword from the title line`,
    );
  }

  const glossIdx = lines.findIndex(l => /^##\s+GLOSS GRATIS/.test(l));
  if (glossIdx === -1) {
    throw new Error(`${filename}: no "## GLOSS GRATIS" heading found`);
  }
  const articuloIdx = lines.findIndex(l =>
    /^##\s+ARTÍCULO COMPLETO PREMIUM/.test(l),
  );
  if (articuloIdx === -1) {
    throw new Error(
      `${filename}: no "## ARTÍCULO COMPLETO PREMIUM" heading found`,
    );
  }
  if (articuloIdx <= glossIdx) {
    throw new Error(
      `${filename}: ARTÍCULO heading appears before GLOSS heading`,
    );
  }

  const glossEs = trimSection(lines.slice(glossIdx + 1, articuloIdx));

  // A "## ADDENDUM: ..." heading after the ARTÍCULO heading marks trailing
  // content about a DIFFERENT biblical person that the English ISBE source
  // happened to print immediately after this headword's article (e.g.
  // Josué's addendum on "Josué, hijo de Josadac", a distinct high priest —
  // confirmed against the original 1915 source as a separately-signed
  // article, not a subsection of this one). Excluded from articleEs, never
  // silently folded in; logged below for manual follow-up per Victor.
  const addendumIdx = lines.findIndex(
    (l, i) => i > articuloIdx && /^##\s+ADDENDUM/i.test(l),
  );
  const articleEnd = addendumIdx === -1 ? lines.length : addendumIdx;
  const articleEs = trimSection(lines.slice(articuloIdx + 1, articleEnd));

  if (!glossEs) throw new Error(`${filename}: GLOSS GRATIS section is empty`);
  if (!articleEs)
    throw new Error(`${filename}: ARTÍCULO COMPLETO PREMIUM section is empty`);

  const excludedAddendum =
    addendumIdx === -1
      ? null
      : {
          filename,
          heading: lines[addendumIdx].trim(),
        };

  return {
    entry: {
      slug: slugFromFilename(filename),
      headwordEs,
      glossEs,
      articleEs,
      sourceTier: 'v1-factual',
      treatment: 'as-is',
    },
    excludedAddendum,
  };
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(
      `Source directory not found: ${SRC_DIR}\n` +
        'Expected the approved `v1-translation-*.md` files there (see this ' +
        "file's header comment for the format). This directory is meant to " +
        'be a durable, non-scratchpad location — do not point it at a ' +
        'Windows Temp / scratch directory; those get silently wiped by ' +
        'Storage Sense (that is exactly how this script broke before).\n' +
        `Fix by either: (1) placing the source files under ${DEFAULT_SRC_DIR}, ` +
        'or (2) setting the DICTIONARY_V1_SRC_DIR env var, or (3) passing a ' +
        '3rd CLI arg: node scripts/build-dictionary-v1-es.js [outPath] [srcDir]',
    );
  }

  const filenames = fs
    .readdirSync(SRC_DIR)
    .filter(f => /^v1-translation-.+\.md$/.test(f) && !EXCLUDE_RE.test(f))
    .sort();

  if (filenames.length === 0) {
    throw new Error(`No v1-translation-*.md entry files found in ${SRC_DIR}`);
  }

  const parsed = filenames.map(filename => {
    const content = fs.readFileSync(path.join(SRC_DIR, filename), 'utf8');
    return parseEntry(filename, content);
  });

  const entries = parsed.map(p => p.entry);
  const excludedAddenda = parsed.map(p => p.excludedAddendum).filter(Boolean);

  // Stable output order regardless of directory-listing order.
  entries.sort((a, b) => a.slug.localeCompare(b.slug));

  // Guard against a filename collision producing two rows with the same
  // slug (e.g. a future file that also normalizes to an existing slug).
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
    console.log(
      `   - ${e.slug}: headword="${e.headwordEs}" gloss=${e.glossEs.length} chars, article=${e.articleEs.length} chars`,
    );
  }
  if (excludedAddenda.length > 0) {
    console.warn(
      `\n⚠️  ${excludedAddenda.length} addendum block(s) excluded (about a different biblical person than this entry's headword — not merged, needs Victor's separate follow-up):`,
    );
    for (const a of excludedAddenda) {
      console.warn(`   - ${a.filename}: "${a.heading}"`);
    }
  }
}

main();
