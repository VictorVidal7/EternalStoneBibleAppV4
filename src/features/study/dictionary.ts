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
 * Para la gloria de Dios Todopoderoso ✨
 */

import {matchesNoteQuery} from '@lib/notes/noteFilter';

export interface DictionaryListEntry {
  slug: string;
  headword_es: string;
  gloss_es: string;
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
