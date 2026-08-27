/**
 * 📖 dictionary — pure helpers for the Bible-dictionary browse/search screen
 * (Tanda 5, v1).
 *
 * The bundled data (`assets/dictionary-v1-es.json`, seeded into the
 * `dictionary_entries` SQLite table by `seedDictionaryV1IfNeeded`) stores
 * `headword_es` in ALL CAPS (matching the source ISBE 1915 headword style).
 * `titleCaseHeadword` converts that to a readable sentence-case display label
 * WITHOUT touching the stored data — a per-word title-case would mangle the
 * one multi-word headword ("CAMINO DE UN DÍA DE REPOSO" → "Camino De Un Día
 * De Reposo" is wrong Spanish); sentence-case ("Camino de un día de reposo")
 * is correct for most entries, EXCEPT a parenthetical qualifier that is
 * itself a proper noun rather than a descriptive common noun — e.g.
 * "CALVARIO (GÓLGOTA)" must render as "Calvario (Gólgota)", not "(gólgota)".
 * `titleCaseHeadword` special-cases those against a small explicit allowlist
 * (see `PROPER_NOUN_QUALIFIERS`) rather than every entry following the same
 * blanket rule.
 *
 * `filterDictionaryEntries` mirrors `searchNotes`/`matchesNoteQuery`
 * ([[noteFilter]]) — diacritic-insensitive substring match over both the
 * headword and the free gloss, so a search for "sabado" also surfaces an
 * entry whose headword doesn't literally contain that word but whose gloss
 * explains it.
 *
 * `parseMarkdownSegments` handles the translated ISBE articles' own markdown
 * — "**...**" for section headings inline in the running prose (e.g.
 * "**I. Forma y significado del nombre.**") and "*...*" for italicized
 * transliterated Hebrew/Greek/Latin terms (e.g. "*beth-lehem*", "*sanhedhrin*") —
 * both real typographic structure worth keeping, not noise to strip. No
 * markdown-rendering library exists in this codebase yet (`prepMarkdown.ts`
 * only GENERATES markdown for PDF export, never renders it), so this is a
 * small, purpose-built parser for exactly these two constructs rather than
 * pulling in a general-purpose dependency.
 *
 * A bold span may itself wrap one or more italic runs — e.g. "pascua"'s own
 * numbered section headings, "**1. *Pesaḥ* y *matsot***" (a Hebrew/Greek
 * transliteration italicized inside an otherwise-bold heading). The parser
 * resolves this one level of nesting (bold-wraps-italic is the only
 * direction ever used in the bundled content — confirmed against all 3
 * bundled JSON assets, v1/v2/multiview) by first matching the *outer* bold
 * span (its content may contain complete "*...*" runs), then re-splitting
 * that captured inner text for nested italics, tagging those runs
 * `'bold-italic'` rather than dropping the bold. Getting this wrong is not
 * cosmetic: because the whole function is one sequential split, a single
 * misread nested span desyncs every markdown marker for the REST of the
 * document (this is exactly what happened before this was fixed — see
 * `dictionary.test.ts`'s "pascua" regression case).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {matchesNoteQuery} from '@lib/notes/noteFilter';

export interface DictionaryListEntry {
  slug: string;
  headword_es: string;
  gloss_es: string;
}

export type MarkdownSegmentStyle = 'plain' | 'bold' | 'italic' | 'bold-italic';

export interface MarkdownSegment {
  text: string;
  style: MarkdownSegmentStyle;
}

/** Known proper-noun parenthetical qualifiers, stored in their correct
 *  DISPLAY capitalization and matched case-insensitively against the
 *  lowercased qualifier text — e.g. "Gólgota" in "CALVARIO (GÓLGOTA)" is
 *  itself a place name, not a descriptive common noun like "persona" in
 *  "JOSUÉ (persona)". A small explicit allowlist (rather than a
 *  proper-noun-detection heuristic) is enough because the dictionary's
 *  bundled headwords are a small, curated, known dataset — add new
 *  qualifiers here, in their correct display form, as they show up, not a
 *  general detector that could misfire on a future entry. Storing the
 *  display form (rather than re-deriving it by upper-casing just the first
 *  letter) also keeps this correct for any future multi-word or hyphenated
 *  qualifier (e.g. "Mar de Galilea", "Bet-el"). */
const PROPER_NOUN_QUALIFIERS = ['Gólgota'];

/** Known proper-noun WHOLE headwords, stored in correct DISPLAY
 *  capitalization and matched case-insensitively against the trimmed raw
 *  headword. "Espíritu Santo" and "Reino de Dios" are theological proper
 *  nouns throughout the phrase, not just first-letter-capitalized common
 *  phrases like "CAMINO DE UN DÍA DE REPOSO" — the blanket sentence-case
 *  rule under-capitalizes "Santo"/"Dios" for these two. Same small-explicit-
 *  allowlist rationale as `PROPER_NOUN_QUALIFIERS` above: the bundled
 *  headwords are a small, curated, known dataset, so list exceptions rather
 *  than build a general proper-noun detector. */
const PROPER_NOUN_HEADWORDS: Record<string, string> = {
  'espíritu santo': 'Espíritu Santo',
  'reino de dios': 'Reino de Dios',
};

/** Sentence-case a stored ALL-CAPS headword: first character upper, rest
 *  lower. Two exceptions apply, checked in order:
 *  1. The whole headword matches `PROPER_NOUN_HEADWORDS` (e.g. "ESPÍRITU
 *     SANTO" → "Espíritu Santo"), in which case its listed display form is
 *     used verbatim instead of sentence-casing.
 *  2. A parenthetical qualifier is lowercased the same way as the rest of
 *     the headword (e.g. "JOSUÉ (persona)" → "Josué (persona)") UNLESS it's
 *     a known proper noun listed in `PROPER_NOUN_QUALIFIERS`, in which case
 *     its listed display capitalization is used instead (e.g. "CALVARIO
 *     (GÓLGOTA)" → "Calvario (Gólgota)", not "(gólgota)"). Only the first
 *     parenthetical group is checked — correct for every headword shipped
 *     today, none of which has more than one. */
export function titleCaseHeadword(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return trimmed;
  const wholeHeadwordOverride = PROPER_NOUN_HEADWORDS[trimmed.toLowerCase()];
  if (wholeHeadwordOverride) return wholeHeadwordOverride;
  const sentenceCased =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return sentenceCased.replace(/\(([^)]+)\)/, (match, qualifier: string) => {
    const properNoun = PROPER_NOUN_QUALIFIERS.find(
      q => q.toLowerCase() === qualifier.toLowerCase(),
    );
    return properNoun ? `(${properNoun})` : match;
  });
}

/** Filter + alphabetically sort entries by their display title, using
 *  `localeCompare` (not raw string/SQL comparison) so accented Spanish
 *  sorts correctly. Returns a NEW array, never mutates the input. */
export function filterDictionaryEntries<T extends DictionaryListEntry>(
  entries: readonly T[],
  query: string,
): T[] {
  const filtered = entries.filter(e =>
    matchesNoteQuery(`${e.headword_es} ${e.gloss_es}`, query),
  );
  return filtered.sort((a, b) =>
    titleCaseHeadword(a.headword_es).localeCompare(
      titleCaseHeadword(b.headword_es),
      'es',
    ),
  );
}

/** Split article text on "**bold**" and "*italic*" spans into styled
 *  segments, so a screen can render each with its own style instead of
 *  showing the literal asterisks. Bold is matched before italic at each
 *  position (the alternation order below) so a "**bold**" span is never
 *  misread as italic-inside-italic. A bold span's content may itself contain
 *  one or more complete "*italic*" runs (see the file header comment) —
 *  `SPLIT_RE`'s bold alternative matches the whole outer span in one go (its
 *  `(?:[^*]|\*[^*]+\*)+` content group accepts either a non-"*" run or a
 *  complete italic pair, so an inner "***" boundary collision like
 *  "*matsot***" resolves as italic-close-then-bold-close instead of
 *  desyncing the rest of the split). The captured inner text is then
 *  re-split on plain italic pairs so nested runs get `'bold-italic'` instead
 *  of losing their bold weight. Unmatched/stray "*"/"**" (an odd count, or a
 *  lone "*" with no partner) are left as literal text rather than guessed at
 *  — never drop source content over a formatting ambiguity. Empty input
 *  returns an empty array. */
const BOLD_WITH_OPTIONAL_ITALIC_SRC = '\\*\\*(?:[^*]|\\*[^*]+\\*)+\\*\\*';
const ITALIC_ONLY_SRC = '\\*[^*]+\\*';
// Capturing groups so `.split` keeps the matched delimiters in the result
// (an uncaptured `.split` regex would silently discard them).
const SPLIT_RE = new RegExp(
  `(${BOLD_WITH_OPTIONAL_ITALIC_SRC}|${ITALIC_ONLY_SRC})`,
  'g',
);
const NESTED_ITALIC_RE = new RegExp(`(${ITALIC_ONLY_SRC})`, 'g');

export function parseMarkdownSegments(text: string): MarkdownSegment[] {
  if (!text) return [];
  return text
    .split(SPLIT_RE)
    .filter(part => part.length > 0)
    .flatMap((part): MarkdownSegment[] => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Re-split the raw inner text (asterisks intact) for nested italic
        // runs — see the doc comment above for why this always resolves
        // cleanly for content `SPLIT_RE`'s bold alternative accepted.
        return part
          .slice(2, -2)
          .split(NESTED_ITALIC_RE)
          .filter(inner => inner.length > 0)
          .map(inner =>
            inner.startsWith('*') && inner.endsWith('*')
              ? {text: inner.slice(1, -1), style: 'bold-italic' as const}
              : {text: inner, style: 'bold' as const},
          );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return [{text: part.slice(1, -1), style: 'italic' as const}];
      }
      return [{text: part, style: 'plain' as const}];
    });
}

/**
 * "Ver también" related-entry map — a small, static, DATA-DRIVEN list of
 * genuinely related sibling slugs per dictionary entry. Purely additive
 * navigation, never new prose: every pair below is justified either by the
 * entries' OWN existing gloss text explicitly discussing or naming the
 * other entry —
 *   - sabado ↔ jornada-sabado: jornada-sabado's whole entry is about a
 *     sabbath-observance rule.
 *   - sabado ↔ creacion: sabado's gloss cites "los seis días de la
 *     creación" as the reason for sabbath rest.
 *   - aaron ↔ tabernaculo: aaron's gloss describes his priestly ministry
 *     "en el tabernáculo".
 *   - josue ↔ jerico: jerico's gloss credits its conquest to "el mando de
 *     Josué".
 *   - nazaret ↔ galilea: nazaret's gloss locates it "en las colinas de
 *     Galilea".
 *   - nazaret ↔ sinagoga: sinagoga's gloss names Nazaret specifically as
 *     the site of Jesus's synagogue reading (Lc 4:16-21).
 *   - bautismo ↔ espiritu-santo: espiritu-santo's gloss explicitly
 *     discusses how traditions relate the Spirit's work "con el bautismo".
 *   - milenio ↔ reino-de-dios: milenio's gloss defines itself in terms of
 *     "el reino de Dios".
 *   - predestinacion ↔ salvacion: predestinacion's gloss is specifically
 *     about God determining "la salvación del creyente".
 *   - eleccion ↔ predestinacion, eleccion ↔ salvacion: eleccion's gloss
 *     frames the whole entry as being about how "esa elección soberana y
 *     la respuesta de fe de la persona" relate — the same ground both
 *     predestinacion and salvacion cover, and the two doctrines the
 *     Calvinism/Arminianism debate turns on.
 * — or, for nazaret ↔ belen only, the well-established, uncontroversial
 * biblical fact that they're Jesus's birthplace and childhood hometown
 * (the one pair here with no in-gloss cross-reference, called out
 * separately since it's thematic rather than textual).
 *
 * Kept intentionally small: an entry not listed here simply gets no "Ver
 * también" section, rather than a forced/loose link. Symmetric by
 * construction (see the `related-slugs are symmetric` test).
 */
export const RELATED_DICTIONARY_SLUGS: Readonly<
  Record<string, readonly string[]>
> = {
  sabado: ['jornada-sabado', 'creacion'],
  'jornada-sabado': ['sabado'],
  creacion: ['sabado'],
  aaron: ['tabernaculo'],
  tabernaculo: ['aaron'],
  josue: ['jerico'],
  jerico: ['josue'],
  nazaret: ['belen', 'galilea', 'sinagoga'],
  belen: ['nazaret'],
  galilea: ['nazaret'],
  sinagoga: ['nazaret'],
  bautismo: ['espiritu-santo'],
  'espiritu-santo': ['bautismo'],
  milenio: ['reino-de-dios'],
  'reino-de-dios': ['milenio'],
  eleccion: ['predestinacion', 'salvacion'],
  predestinacion: ['salvacion', 'eleccion'],
  salvacion: ['predestinacion', 'eleccion'],
};

/** Related sibling slugs for a dictionary entry's "Ver también" section, or
 *  an empty array when the entry has none listed. Never throws on an
 *  unknown slug. */
export function getRelatedSlugs(slug: string): readonly string[] {
  return RELATED_DICTIONARY_SLUGS[slug] ?? [];
}
