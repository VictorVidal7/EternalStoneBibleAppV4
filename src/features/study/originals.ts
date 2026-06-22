/**
 * 📜 originals — original-language (Hebrew/Greek) study facade + pure helpers.
 *
 * ORIGINAL LANGUAGES (flagship #1): the verse panel and the Strong's lexicon
 * read the downloaded originals pack through these thin async wrappers, while
 * the language-aware glossing, lexicon-link validity, and reference formatting
 * stay PURE (no DB / no React) so they unit-test deterministically.
 *
 * The pack is OPTIONAL (a ~30 MB download); every facade is defensive — when
 * the pack isn't installed the calls resolve to empty/null, never throw.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import bibleDB, {
  type OriginalWord,
  type StrongsEntry,
  type StrongsOccurrence,
} from '@lib/database';
import {getBookByName, getBookById} from '@/constants/bible';

export type {OriginalWord, StrongsEntry, StrongsOccurrence};

/** UI language. */
export type Lang = 'es' | 'en';

/**
 * The best gloss for the UI language: Spanish prefers the Spanish gloss and
 * falls back to English (Hebrew rows carry English only); English prefers the
 * English gloss. Empty/whitespace glosses are treated as absent.
 */
export function pickGloss(
  word: Pick<OriginalWord, 'gloss_es' | 'gloss_en'>,
  language: Lang,
): string | null {
  const es = word.gloss_es?.trim() || null;
  const en = word.gloss_en?.trim() || null;
  return language === 'es' ? es || en : en || es;
}

/** Whether a Strong's number is a real lexicon key (links to a definition). */
export function hasLexicon(
  strongs: string | null | undefined,
): strongs is string {
  return !!strongs && /^[HG]\d+$/.test(strongs);
}

/** Human "Hebrew (H7225)" / "Griego (G25)" style label for a Strong's number. */
export function strongsLabel(strongs: string): string {
  return strongs.trim().toUpperCase();
}

/** Format a concordance occurrence as "Book chap:verse" in the UI language. */
export function occurrenceRef(
  occ: Pick<StrongsOccurrence, 'book_id' | 'chapter' | 'verse'>,
  language: Lang,
): string {
  const book = getBookById(occ.book_id);
  const name = book
    ? language === 'en'
      ? book.nameEn
      : book.name
    : `#${occ.book_id}`;
  return `${name} ${occ.chapter}:${occ.verse}`;
}

// ── Async facades (defensive: empty/null when the pack isn't installed) ──

/** Is the originals pack installed? */
export function isOriginalsInstalled(): Promise<boolean> {
  return bibleDB.originalsInstalled().catch(() => false);
}

/** The original-language words of a verse (empty when unavailable). */
export async function getVerseOriginal(
  book: string,
  chapter: number,
  verse: number,
): Promise<OriginalWord[]> {
  const resolved = getBookByName(book);
  if (!resolved) return [];
  try {
    return await bibleDB.getOriginalWords(resolved.id, chapter, verse);
  } catch {
    return [];
  }
}

/** The lexicon entry for a Strong's number (null when unavailable). */
export async function getStrongsDetail(
  strongs: string,
): Promise<StrongsEntry | null> {
  if (!hasLexicon(strongs)) return null;
  try {
    return await bibleDB.getStrongsEntry(strongs);
  } catch {
    return null;
  }
}

/** Concordance for a Strong's number: total count + bounded occurrence list. */
export async function getStrongsConcordance(
  strongs: string,
  limit = 200,
): Promise<{count: number; occurrences: StrongsOccurrence[]}> {
  if (!hasLexicon(strongs)) return {count: 0, occurrences: []};
  try {
    const [count, occurrences] = await Promise.all([
      bibleDB.getStrongsOccurrenceCount(strongs),
      bibleDB.getStrongsOccurrences(strongs, limit),
    ]);
    return {count, occurrences};
  } catch {
    return {count: 0, occurrences: []};
  }
}
