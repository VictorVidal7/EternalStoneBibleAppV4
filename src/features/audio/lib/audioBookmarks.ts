/**
 * 🔖 audioBookmarks — PURE model for saved listening positions (Sprint 77).
 *
 * "Retomar en este verso": the listener pins the verse being heard and later
 * jumps straight back to it from the queue sheet — multiple pins, unlike the
 * single rolling [[playbackPosition]]. Bookmarks store the CANONICAL (English)
 * book name plus the bookId, so they survive language/version switches and
 * can be replayed in whatever version is selected at jump time.
 *
 * Device-local (like the playback position / listening stats) — persistence
 * lives in [[audioBookmarksStore]]; this module owns parsing, dedupe, cap and
 * lookup so it stays unit-testable with no React/storage.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {canonicalBookName, getBookByName} from '../../../constants/bible';

export interface AudioBookmark {
  id: string;
  /** SQLite book id — the jump loads the chapter directly by id. */
  bookId: number;
  /** Canonical (English) book name, e.g. "Psalms". */
  book: string;
  chapter: number;
  verse: number;
  createdAt: number;
}

/** Newest-first list cap — a pin board, not an archive. */
export const MAX_AUDIO_BOOKMARKS = 12;

/** Parse a persisted JSON payload defensively (null/corrupt → empty). */
export function parseAudioBookmarks(raw: string | null): AudioBookmark[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is AudioBookmark =>
        !!b &&
        typeof (b as AudioBookmark).id === 'string' &&
        typeof (b as AudioBookmark).bookId === 'number' &&
        typeof (b as AudioBookmark).book === 'string' &&
        typeof (b as AudioBookmark).chapter === 'number' &&
        typeof (b as AudioBookmark).verse === 'number' &&
        typeof (b as AudioBookmark).createdAt === 'number',
    );
  } catch {
    return [];
  }
}

export function serializeAudioBookmarks(bookmarks: AudioBookmark[]): string {
  return JSON.stringify(bookmarks);
}

/**
 * Build a bookmark for a playing verse, canonicalizing the book name and
 * resolving its bookId. Null when the book is unknown (defensive — an engine
 * verse always comes from the book table).
 */
export function createAudioBookmark(
  verse: {book: string; chapter: number; verse: number},
  now: number,
): AudioBookmark | null {
  const info = getBookByName(verse.book);
  if (!info) return null;
  return {
    id: `abm_${now}_${info.id}_${verse.chapter}_${verse.verse}`,
    bookId: info.id,
    book: canonicalBookName(verse.book),
    chapter: verse.chapter,
    verse: verse.verse,
    createdAt: now,
  };
}

/**
 * Add (newest first), replacing any existing pin on the same verse and
 * dropping the oldest beyond {@link MAX_AUDIO_BOOKMARKS}.
 */
export function addAudioBookmark(
  bookmarks: AudioBookmark[],
  bookmark: AudioBookmark,
): AudioBookmark[] {
  const rest = bookmarks.filter(
    b =>
      !(
        b.bookId === bookmark.bookId &&
        b.chapter === bookmark.chapter &&
        b.verse === bookmark.verse
      ),
  );
  return [bookmark, ...rest].slice(0, MAX_AUDIO_BOOKMARKS);
}

export function removeAudioBookmark(
  bookmarks: AudioBookmark[],
  id: string,
): AudioBookmark[] {
  return bookmarks.filter(b => b.id !== id);
}

/**
 * The pin sitting on `verse`, or undefined. Canonicalizes the incoming book
 * name (the audio engine carries version-language names).
 */
export function bookmarkAtVerse(
  bookmarks: AudioBookmark[],
  verse: {book: string; chapter: number; verse: number},
): AudioBookmark | undefined {
  const canonical = canonicalBookName(verse.book);
  return bookmarks.find(
    b =>
      b.book === canonical &&
      b.chapter === verse.chapter &&
      b.verse === verse.verse,
  );
}
