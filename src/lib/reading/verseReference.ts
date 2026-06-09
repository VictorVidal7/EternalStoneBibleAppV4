/**
 * Pure, UI-language-aware verse reference formatting.
 *
 * The verse rows store `book` in the *reading version's* language — RVR1960
 * keeps Spanish names ("Génesis", "Juan"). The normal reader's header is
 * localized to the UI language ("John 3"), but the immersive reader used to
 * render the raw DB name ("Juan 3:1"), an inconsistency from the same
 * cross-language family fixed in S58. This helper resolves any stored spelling
 * to the UI language so both surfaces agree.
 *
 * React/RN-free and dependency-light so it can be unit tested directly.
 */

import {getBookByName} from '../../constants/bible';

type ReferenceVerse = {
  book: string;
  chapter: number;
  verse: number;
};

/**
 * Returns a localized verse reference like "Genesis 1:8" / "Génesis 1:8".
 * Falls back to the stored book string when the book is unknown, and to an
 * empty string when the verse is missing (so callers can render it directly).
 */
export function localizedVerseReference(
  v: ReferenceVerse | undefined | null,
  language: 'es' | 'en',
): string {
  if (!v) return '';
  const info = getBookByName(v.book);
  const name = info ? (language === 'es' ? info.name : info.nameEn) : v.book;
  return `${name} ${v.chapter}:${v.verse}`;
}

/**
 * Like {@link localizedVerseReference} but chapter-level — "Genesis 1" /
 * "Génesis 1" (no verse). Used by the immersive reader's chapter-transition
 * banner when continuous audio crosses into a new chapter (Sprint 73).
 */
export function localizedChapterReference(
  v: {book: string; chapter: number} | undefined | null,
  language: 'es' | 'en',
): string {
  if (!v) return '';
  const info = getBookByName(v.book);
  const name = info ? (language === 'es' ? info.name : info.nameEn) : v.book;
  return `${name} ${v.chapter}`;
}
