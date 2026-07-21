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
 * is correct for every entry in the v1 batch.
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
 * Para la gloria de Dios Todopoderoso ✨
 */

import {matchesNoteQuery} from '@lib/notes/noteFilter';

export interface DictionaryListEntry {
  slug: string;
  headword_es: string;
  gloss_es: string;
}

export type MarkdownSegmentStyle = 'plain' | 'bold' | 'italic';

export interface MarkdownSegment {
  text: string;
  style: MarkdownSegmentStyle;
}

/** Sentence-case a stored ALL-CAPS headword: first character upper, rest
 *  lower. Does not touch parenthetical qualifiers' internal casing beyond
 *  the same rule (e.g. "JOSUÉ (persona)" → "Josué (persona)"). */
export function titleCaseHeadword(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
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
 *  misread as italic-inside-italic. Unmatched/stray "*"/"**" (an odd count,
 *  or a lone "*" with no partner) are left as literal text rather than
 *  guessed at — never drop source content over a formatting ambiguity.
 *  Empty input returns an empty array. */
export function parseMarkdownSegments(text: string): MarkdownSegment[] {
  if (!text) return [];
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(part => part.length > 0)
    .map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return {text: part.slice(2, -2), style: 'bold' as const};
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return {text: part.slice(1, -1), style: 'italic' as const};
      }
      return {text: part, style: 'plain' as const};
    });
}
