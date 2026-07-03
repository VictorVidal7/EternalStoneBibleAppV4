/**
 * 📜 prepOriginalWords — PURE grouping/dedup of original-language keywords
 * across a passage's verse range, for the "Mesa de preparación" premium
 * section "Palabras clave en el idioma original" (T8.4.2).
 *
 * The screen fetches each verse's original words through the existing async
 * facade (`getVerseOriginal` in src/features/study/originals.ts, itself the
 * T6.4/T8.3 pipeline — this module reimplements NONE of that lookup) and
 * hands the raw per-verse rows here. What needs to be deterministic and
 * unit-tested is the one thing a passage-wide view adds on top of a
 * per-verse one: walk the range in verse order, keep only words that carry a
 * REAL lexicon-linked Strong's number (`hasLexicon` — untagged particles
 * don't make a "keyword"), and collapse every repeat of the SAME headword
 * (same Strong's number) into a single entry with an occurrence count — a
 * word used 5 times across the passage is one keyword, not five duplicate
 * cards.
 *
 * Ordering: most-frequent-first, ties broken by first appearance (a stable
 * sort keeps the walk's natural order for equal counts). The preparer opens
 * this list wanting to know what dominates the passage — the same instinct
 * as a word cloud — before drilling into the rarer terms.
 *
 * Morphology: each group carries the FIRST occurrence's raw `grammar` code.
 * The same headword can inflect differently across a passage (case, tense,
 * number…), so a single "representative" parse is kept here rather than one
 * per occurrence, which would clutter a passage-wide overview; the exact
 * parse of any individual occurrence is still one tap away in the existing
 * per-verse Original Languages sheet.
 *
 * PURE (no React / RN, no SQLite) — exactly the [[prepTable]] discipline.
 * `hasLexicon` is a plain string-pattern check (no I/O), so importing it here
 * does not pull SQLite/RN into this module's test surface.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {hasLexicon, type OriginalWord} from './originals';

/** The original words of one verse in a passage, as fetched by the screen. */
export interface PrepOriginalVerseWords {
  verse: number;
  words: OriginalWord[];
}

/** One deduplicated original-language keyword gathered across a passage. */
export interface PrepOriginalWordGroup {
  /** Always a real lexicon-linked Strong's number — see `hasLexicon`. */
  strongs: string;
  lang: string;
  word: string;
  translit: string | null;
  /** The first occurrence's raw grammar code — see the module doc. */
  grammar: string | null;
  gloss_es: string | null;
  gloss_en: string | null;
  /** How many times this Strong's number occurs across the passage range. */
  count: number;
  /** The verse of its first occurrence (ascending walk order). */
  firstVerse: number;
}

/**
 * Group + dedupe original-language words across a passage's verses by
 * Strong's number, most-frequent-first (ties keep first-appearance order).
 * Words without a real lexicon-linked Strong's number are dropped. Never
 * throws: an empty range, or verses with no original-language data, just
 * yield an empty array.
 */
export function groupOriginalWordsByStrongs(
  verses: PrepOriginalVerseWords[],
): PrepOriginalWordGroup[] {
  const appearanceOrder: string[] = [];
  const groups = new Map<string, PrepOriginalWordGroup>();

  for (const {verse, words} of verses ?? []) {
    for (const word of words ?? []) {
      if (!hasLexicon(word.strongs)) continue;
      const key = word.strongs;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      groups.set(key, {
        strongs: key,
        lang: word.lang,
        word: word.word,
        translit: word.translit,
        grammar: word.grammar,
        gloss_es: word.gloss_es,
        gloss_en: word.gloss_en,
        count: 1,
        firstVerse: verse,
      });
      appearanceOrder.push(key);
    }
  }

  // Array.prototype.sort is stable (guaranteed since ES2019 / every engine
  // this app targets), so mapping from `appearanceOrder` before sorting by
  // count keeps ties in first-appearance order.
  return appearanceOrder
    .map(key => groups.get(key)!)
    .sort((a, b) => b.count - a.count);
}
