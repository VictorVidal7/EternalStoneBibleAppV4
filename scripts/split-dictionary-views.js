/**
 * 📖 split-dictionary-views — mechanical slicer for the two Tanda 5
 * `treatment: 'multi-view'` dictionary entries (Bautismo, Milenio).
 *
 * Unlike build-dictionary-v2-es.js's `SOURCES` (one signed article per
 * entry), these two entries' premium content is genuinely several signed
 * pieces (Bautismo, already so in the ISBE 1915 source itself) or several
 * distinct postures (Milenio, only one of which — premillennial — the ISBE
 * develops; postmillennial/amillennial are separately-authored, Victor-
 * approved drafts written for this integration). Each becomes one row in
 * `dictionary_multiview_sections` instead of a single `article_es` blob.
 *
 * CRITICAL: this script does pure string search/slice on the source .md
 * files — it never retypes, paraphrases, or summarizes a single sentence of
 * body prose. Every boundary below is an exact verbatim string that must be
 * found via `indexOf` in the source; a boundary that doesn't match throws
 * (fail loud, no silent partial/misaligned slice).
 *
 * Marker resolution (shared with build-dictionary-v2-es.js's intent, not
 * its exact regexes — this batch's sources use different marker dialects):
 *   - `[EXCISE BEFORE ANY USER-FACING USE — ...] ... [END EXCISE-MARKED
 *     PASSAGE]` — same convention as the annotated batches (Jerusalén/
 *     Herodes, Reino de Dios). The ENTIRE block, markers + contained text,
 *     is removed. Two such blocks were added to `v2-translation-baptism.md`
 *     by this same effort (see the script's header comment in that file's
 *     git-untracked scratchpad copy) — both mid-paragraph, so the marker is
 *     inline (no surrounding blank lines) rather than its own paragraph.
 *   - `` `[REVISAR -- ...]` `` (Bautismo; backtick-wrapped, `--` dash) and
 *     `[REVISAR — ...]` (Milenio; plain brackets, em-dash) — both mark a
 *     passage that puts one Christian tradition's doctrine directly against
 *     another's under the same nominal heading. For an `annotated` entry
 *     these get resolved into a contextual note or an excision (Victor's
 *     call, one at a time); for a `multi-view` entry the multi-view
 *     structure itself IS the resolution (the reader sees the competing
 *     posture as its own labeled card, not as an aside) — so the marker is
 *     simply removed, backticks and all (a stray backtick would render
 *     literally; `parseMarkdownSegments` only understands `*`/`**`).
 *   - `[APROBADO por Victor ...]` (Milenio drafts only) — an internal
 *     tracking annotation on the draft's own approval status, never meant
 *     for an end reader. Removed like `[CONFIRMADO ...]` in the annotated
 *     batches. It lives in each draft's front-matter, outside the sliced
 *     content region, so in practice this never fires — kept as a second
 *     line of defense in the fail-loud check below.
 *
 * Structural normalization (mechanical, not content-altering):
 *   - A section's own top-of-slice heading line (e.g. "### 1. BAUTISMO
 *     (La interpretación bautista) — A. T. Robertson") is stripped from the
 *     body — `dictionary_multiview_sections.label_es` already carries that
 *     label for the UI, so repeating it as a literal, unrendered "###" line
 *     in the body would be redundant AND broken (this app has no markdown-
 *     heading renderer, only parseMarkdownSegments' `**bold**`/`*italic*`).
 *   - Any remaining Markdown ATX heading line (`^#{2,6}\s+...`) inside a
 *     slice — the two newly-written Milenio drafts (posmilenialismo,
 *     amilenialismo) use real `###` subsection headings, unlike the ISBE
 *     translations' `**bold**` convention — is converted to `**bold**` so
 *     it actually renders instead of showing literal "#" characters.
 *   - Hard-wrapped prose (same two drafts, ~100-column line wrap) is
 *     rejoined into one logical line per paragraph, matching every other
 *     entry in the corpus (one physical line per paragraph, blank line
 *     between). A paragraph made up ENTIRELY of standalone `*italic*`
 *     one-liners (the drafts' and the ISBE premillennial piece's own
 *     table-of-contents blocks) is left alone, one bullet per line — that
 *     block is already correctly one-line-per-item in the source, not
 *     hard-wrapped prose that happens to need joining.
 *
 * Fails loud (throws, ships nothing) if, after all of the above, any
 * `[REVISAR`, `[EXCISE`, `[END EXCISE`, `[CONFIRMADO`, `[NOTA DE CONTEXTO`,
 * `[APROBADO`, a stray backtick, or an unbalanced markdown asterisk survives
 * in a shipped gloss or section body — mirrors build-dictionary-v2-es.js's
 * own safety net, applied here to the sliced-views shape instead.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT =
  process.argv[2] ||
  path.join(ROOT, 'assets', 'dictionary-v2-multiview-es.json');

// Multi-view sources live in a DIFFERENT scratchpad session than
// build-dictionary-v2-es.js's SOURCES (annotated batches 1-2) — the two
// were researched in separate sessions and never merged. Don't assume they
// share a base directory.
const SCRATCH_BASE =
  process.argv[3] ||
  'C:\\Users\\victo\\AppData\\Local\\Temp\\claude\\C--projects-EternalStoneBibleAppV4\\4583db85-9f41-40c2-85d2-6dfc2330a025\\scratchpad\\tanda5-multiview-src';

function readSource(relPath) {
  const abs = path.join(SCRATCH_BASE, relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Source file not found: ${abs}`);
  }
  return fs.readFileSync(abs, 'utf8');
}

/** Strip [EXCISE BEFORE ANY USER-FACING USE ...] ... [END EXCISE-MARKED
 *  PASSAGE] blocks entirely — markers and contained text alike. */
function stripExciseBlocks(text) {
  return text.replace(
    /\[EXCISE BEFORE ANY USER-FACING USE[\s\S]*?\[END EXCISE-MARKED PASSAGE\]/g,
    '',
  );
}

/** Strip [REVISAR ...] markers in either dialect this batch's sources use:
 *  backtick-wrapped (Bautismo) or plain-bracket (Milenio). Resolved by the
 *  multi-view structure itself, not by new text — see file header. Also
 *  strips Bautismo's backtick-wrapped `[nota: ...]` asides — internal notes
 *  about the OCR/scan extraction's own reliability (a stray digit, an
 *  illegible/damaged span), never meant for an end reader. Distinct from
 *  the *[Nota de traducción: ...]* asides elsewhere in the same file, which
 *  use the app's own italic syntax and ARE legitimate reader-facing content
 *  (explaining a real translation choice) — those are left alone. */
function stripRevisarMarkers(text) {
  return text
    .replace(/`?\[REVISAR[^\]]*\]`?/g, '')
    .replace(/`\[nota:[^\]]*\]`/gi, '');
}

/** Strip [APROBADO por Victor ...] / [CONFIRMADO ...] internal tracking
 *  annotations — never meant for an end reader. */
function stripTrackingAnnotations(text) {
  return text
    .replace(/\[APROBADO[^\]]*\]/g, '')
    .replace(/\[CONFIRMADO[^\]]*\]/g, '');
}

/** Convert a standalone Markdown ATX heading line ("### Title", "#### ...")
 *  into a "**Title**" bold line so it actually renders via
 *  parseMarkdownSegments instead of showing literal "#" characters. */
function headingLinesToBold(text) {
  return text.replace(/^#{2,6}[ \t]+(.+)$/gm, '**$1**');
}

/** Rejoin hard-wrapped prose into one physical line per paragraph, the
 *  convention every other entry in the corpus already follows. A paragraph
 *  block made up entirely of standalone "*italic*" one-liners (a
 *  table-of-contents list) is left as one bullet per line — see file
 *  header. No-op on input that's already one line per paragraph (every
 *  block then has exactly one line to "join"). */
function unwrapHardWrappedProse(text) {
  const blocks = text.split(/\n{2,}/);
  const rejoined = blocks.map(block => {
    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    if (lines.length === 0) return '';
    const isTocList = lines.every(l => /^\*[^*]+\*$/.test(l));
    return isTocList ? lines.join('\n') : lines.join(' ');
  });
  return rejoined.filter(b => b.length > 0).join('\n\n');
}

/** Collapse whitespace left behind by inline marker removal (a marker
 *  removed from between two spaces leaves a double space) — never touches
 *  newlines, unwrapHardWrappedProse already normalized those. Also drops a
 *  space that ends up sitting directly before ;:,.!? — e.g. a hard-wrapped
 *  line that used to start "[REVISAR ...]; en términos..." becomes, after
 *  unwrapHardWrappedProse's line join, "... ; en términos..." (found in
 *  Amilenialismo's own REVISAR removal) — no Spanish/English convention
 *  wants a space before that punctuation. */
function collapseInlineSpaces(text) {
  return text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([;:,.!?])/g, '$1')
    .trim();
}

/** Drop a trailing "---" Markdown horizontal-rule separator (the source
 *  files use one between a "## GLOSS GRATIS" section and the next "## "
 *  heading — extractH2Section's "next heading" scan stops just past it,
 *  leaving it as the section's last block) — mirrors
 *  build-dictionary-v2-es.js's own trimSection. */
function stripTrailingHr(text) {
  return text.replace(/\n{1,2}-{3,}\s*$/, '').trimEnd();
}

/** Run every marker-resolution + normalization step, in order, on one
 *  section body or gloss. */
function resolveAndNormalize(text) {
  let out = text;
  out = stripExciseBlocks(out);
  out = stripRevisarMarkers(out);
  out = stripTrackingAnnotations(out);
  out = headingLinesToBold(out);
  out = unwrapHardWrappedProse(out);
  out = stripTrailingHr(out);
  out = collapseInlineSpaces(out);
  return out;
}

/** Fail loud (matches build-dictionary-v2-es.js's own safety net): a
 *  surviving editorial marker, a stray backtick, or an unbalanced bold
 *  (double-asterisk) or italic (single-asterisk) span would ship as
 *  broken/leaked text to a real user. Never loosen this to "make the
 *  build pass". */
function assertShippable(label, text) {
  if (!text || !text.trim()) {
    throw new Error(`${label}: empty after slicing/normalization`);
  }
  const markerPattern =
    /\[REVISAR|\[EXCISE|\[END EXCISE|\[CONFIRMADO|\[NOTA DE CONTEXTO|\[APROBADO/;
  const stillOpen = text.match(markerPattern);
  if (stillOpen) {
    throw new Error(
      `${label}: unresolved marker survived to shipped text — "${stillOpen[0].slice(0, 80)}..."`,
    );
  }
  if (text.includes('`')) {
    throw new Error(
      `${label}: stray backtick survived — parseMarkdownSegments only understands *italic*/**bold**, a literal backtick would render as-is`,
    );
  }
  const strippedOfValidSpans = text.replace(/\*\*[^*]+\*\*|\*[^*]+\*/g, '');
  if (strippedOfValidSpans.includes('*')) {
    throw new Error(
      `${label}: unbalanced markdown asterisk — a stray "*" survived outside any valid **bold**/*italic* span`,
    );
  }
}

/** Slice `content` from immediately after `startHeadingVerbatim` (an exact
 *  substring — the heading text itself is dropped, `label_es` carries it
 *  separately in the UI) up to `endHeadingVerbatim` (exclusive), or to end
 *  of string when `endHeadingVerbatim` is null. Throws if either boundary
 *  isn't found verbatim, or found before the start — no silent misaligned
 *  slice. */
function sliceBetween(
  content,
  sourceLabel,
  startHeadingVerbatim,
  endHeadingVerbatim,
) {
  const startIdx = content.indexOf(startHeadingVerbatim);
  if (startIdx === -1) {
    throw new Error(
      `${sourceLabel}: start boundary not found verbatim: "${startHeadingVerbatim}"`,
    );
  }
  const bodyFrom = startIdx + startHeadingVerbatim.length;
  let endIdx = content.length;
  if (endHeadingVerbatim !== null) {
    endIdx = content.indexOf(endHeadingVerbatim, bodyFrom);
    if (endIdx === -1) {
      throw new Error(
        `${sourceLabel}: end boundary not found verbatim after start: "${endHeadingVerbatim}"`,
      );
    }
  }
  return content.slice(bodyFrom, endIdx);
}

/** Extract a "## HEADING" ... next "## " section's raw text (same shape as
 *  build-dictionary-v2-es.js's GLOSS GRATIS / ARTÍCULO COMPLETO PREMIUM
 *  split), trimmed of leading/trailing blank lines. */
function extractH2Section(content, sourceLabel, headingVerbatim) {
  const startIdx = content.indexOf(headingVerbatim);
  if (startIdx === -1) {
    throw new Error(`${sourceLabel}: heading not found: "${headingVerbatim}"`);
  }
  const bodyFrom = startIdx + headingVerbatim.length;
  const nextHeadingIdx = content.indexOf('\n## ', bodyFrom);
  const endIdx = nextHeadingIdx === -1 ? content.length : nextHeadingIdx;
  return content.slice(bodyFrom, endIdx).trim();
}

// ── Bautismo ────────────────────────────────────────────────────────────

// Exact verbatim boundary strings identified by the prior research pass
// (given, not re-derived) — see the workflow's task description. Each was
// independently confirmed present exactly once in the source file before
// this script was written.
const BAPTISM_VIEWS = [
  {
    position: 1,
    labelEs: 'Bautista',
    start: '### 1. BAUTISMO (La interpretación bautista) — A. T. Robertson',
    end: '### 2. BAUTISMO (Visión no inmersionista) — T. M. Lindsay',
  },
  {
    position: 2,
    labelEs: 'No-inmersionista',
    start: '### 2. BAUTISMO (Visión no inmersionista) — T. M. Lindsay',
    end: '### 3. BAUTISMO (Doctrina luterana) — W. H. T. Dau',
  },
  {
    position: 3,
    labelEs: 'Luterana',
    start: '### 3. BAUTISMO (Doctrina luterana) — W. H. T. Dau',
    end: '### 4. REGENERACIÓN BAUTISMAL — tres artículos firmados bajo un mismo encabezado (James Orr / William Samuel Bishop / W. H. T. Dau)',
  },
  // Note: the "### 4. REGENERACIÓN BAUTISMAL ..." master heading + its
  // one-paragraph editorial note (between position 3's end boundary and
  // position 4's start boundary below) is intentionally not shipped in any
  // section — it's pure structural signposting the 3 sub-articles below
  // already make clear on their own (each is separately labeled). The
  // shared "baptismal regeneration" super-topic that heading names is
  // instead folded into positions 4-6's own label_es below, so it isn't
  // lost to the reader entirely.
  {
    position: 4,
    labelEs: 'Regeneración bautismal — reformada',
    start: '#### Doctrina reformada (no sacramental) — James Orr',
    end: '#### Doctrina anglicana (de Alta Iglesia) — William Samuel Bishop',
  },
  {
    position: 5,
    labelEs: 'Regeneración bautismal — anglicana de Alta Iglesia',
    start: '#### Doctrina anglicana (de Alta Iglesia) — William Samuel Bishop',
    end: '#### Doctrina luterana — W. H. T. Dau',
  },
  {
    position: 6,
    labelEs: 'Regeneración bautismal — luterana',
    start: '#### Doctrina luterana — W. H. T. Dau',
    end: '### 5. BAUTISMO POR LOS MUERTOS — T. Rees',
  },
];

const BAPTISM_SUPPLEMENTARY = [
  {
    position: 7,
    labelEs: 'Bautismo por los muertos',
    start: '### 5. BAUTISMO POR LOS MUERTOS — T. Rees',
    end: '### 6. BAUTISMO DE FUEGO — Jacob W. Kapp',
  },
  {
    position: 8,
    labelEs: 'Bautismo de fuego',
    start: '### 6. BAUTISMO DE FUEGO — Jacob W. Kapp',
    end: '### 7. BAUTISMO DEL ESPÍRITU SANTO — E. Y. Mullins',
  },
  {
    position: 9,
    labelEs: 'Bautismo del Espíritu Santo',
    start: '### 7. BAUTISMO DEL ESPÍRITU SANTO — E. Y. Mullins',
    end: '### 8. BAUTISMO, INFANTIL (stub de referencia cruzada, sin firmar)',
  },
];

function buildBaptismEntry() {
  const file = 'v2-translation-baptism.md';
  const content = readSource(file);
  const label = file;

  const glossRaw = extractH2Section(
    content,
    label,
    '## GLOSS GRATIS (completo en sí mismo)',
  );
  const glossEs = resolveAndNormalize(glossRaw);
  assertShippable(`${label} gloss`, glossEs);

  const sections = [...BAPTISM_VIEWS, ...BAPTISM_SUPPLEMENTARY].map(v => {
    const raw = sliceBetween(content, label, v.start, v.end);
    const bodyEs = resolveAndNormalize(raw);
    assertShippable(`${label} position ${v.position} (${v.labelEs})`, bodyEs);
    return {position: v.position, labelEs: v.labelEs, bodyEs};
  });

  return {
    slug: 'bautismo',
    headwordEs: 'BAUTISMO',
    glossEs,
    articleEs: null,
    sourceTier: 'v2-doctrinal',
    treatment: 'multi-view',
    sections,
  };
}

// ── Milenio ─────────────────────────────────────────────────────────────

// The stale trailing sentence of the recovered file's gloss ("this article
// develops specifically the [premillennial] posture") stops being true once
// Posmilenialismo/Amilenialismo ship alongside it — a subtractive trim
// (drop this exact verbatim sentence, keep everything before it, which
// already names all 3 postures neutrally), not a rewrite.
const MILENIO_GLOSS_STALE_TAIL =
  ' El artículo del ISBE (1915) disponible aquí desarrolla en detalle, de forma extensa, específicamente esta segunda postura.';

function buildMilenioEntry() {
  const premilFile = 'v2-translation-milenio-RECOVERED.md';
  const premilContent = readSource(premilFile);

  const glossRaw = extractH2Section(
    premilContent,
    premilFile,
    '## GLOSS GRATIS (completo en sí mismo, doctrinalmente neutral)',
  );
  const staleIdx = glossRaw.indexOf(MILENIO_GLOSS_STALE_TAIL);
  if (staleIdx === -1) {
    throw new Error(
      `${premilFile}: expected stale trailing sentence not found verbatim in gloss — re-check MILENIO_GLOSS_STALE_TAIL`,
    );
  }
  const glossEs = resolveAndNormalize(glossRaw.slice(0, staleIdx));
  assertShippable(`${premilFile} gloss`, glossEs);

  const premilRaw = sliceBetween(
    premilContent,
    premilFile,
    "**MILENIO, mi-len'i-um (VISIÓN PREMILENIAL):**",
    null,
  );
  const premilBody = resolveAndNormalize(premilRaw);
  assertShippable(`${premilFile} (Premilenialismo)`, premilBody);

  const posmilFile = 'millennium-multiview/posmilenialismo-draft.md';
  const posmilContent = readSource(posmilFile);
  const posmilRaw = sliceBetween(
    posmilContent,
    posmilFile,
    '**MILENIO (VISIÓN POSMILENIAL):**',
    null,
  );
  const posmilBody = resolveAndNormalize(posmilRaw);
  assertShippable(`${posmilFile} (Posmilenialismo)`, posmilBody);

  const amilFile = 'millennium-multiview/amilenialismo-draft.md';
  const amilContent = readSource(amilFile);
  const amilRaw = sliceBetween(
    amilContent,
    amilFile,
    '## MILENIO (VISIÓN AMILENIAL)',
    // The line after "Literatura." is an internal process note ("Borrador
    // de redacción nueva ... Pendiente de revisión de Victor"), not part of
    // the article — excluded the same way the gloss's stale tail is.
    '— Borrador de redacción nueva para el tratamiento multi-vista de "Milenio"',
  );
  const amilBody = resolveAndNormalize(amilRaw);
  assertShippable(`${amilFile} (Amilenialismo)`, amilBody);

  return {
    slug: 'milenio',
    headwordEs: 'MILENIO',
    glossEs,
    articleEs: null,
    sourceTier: 'v2-doctrinal',
    treatment: 'multi-view',
    sections: [
      {position: 1, labelEs: 'Premilenialismo', bodyEs: premilBody},
      {position: 2, labelEs: 'Posmilenialismo', bodyEs: posmilBody},
      {position: 3, labelEs: 'Amilenialismo', bodyEs: amilBody},
    ],
  };
}

function main() {
  const entries = [buildBaptismEntry(), buildMilenioEntry()];

  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  fs.writeFileSync(OUT, JSON.stringify(entries, null, 2) + '\n', 'utf8');

  console.log(`✅ ${OUT}`);
  for (const e of entries) {
    console.log(
      `   - ${e.slug}: headword="${e.headwordEs}" gloss=${e.glossEs.length} chars, ${e.sections.length} sections`,
    );
    for (const s of e.sections) {
      console.log(
        `       ${s.position}. ${s.labelEs} — ${s.bodyEs.length} chars`,
      );
    }
  }
}

main();

module.exports = {
  resolveAndNormalize,
  sliceBetween,
  extractH2Section,
  assertShippable,
  unwrapHardWrappedProse,
  headingLinesToBold,
};
