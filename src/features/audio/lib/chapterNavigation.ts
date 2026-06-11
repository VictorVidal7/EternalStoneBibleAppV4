/**
 * 🎧 chapterNavigation — PURE next-chapter resolution for continuous audio
 * playback (Sprint 72).
 *
 * The TTS player historically loaded ONE chapter and stopped dead at its last
 * verse — there was no way to keep listening into the next chapter. This module
 * answers the two pure questions the new `AudioChapterAdvancer` orchestrator
 * needs:
 *
 *   1. `nextChapterLocation(bookId, chapter)` — given where playback just ended,
 *      what chapter comes next? Rolls over book boundaries (Génesis 50 → Éxodo
 *      1) using the canonical `BIBLE_BOOKS` order + per-book chapter counts, and
 *      returns `null` at the very end of the canon (Apocalipsis 22) so the
 *      player simply stops.
 *
 *   2. `shouldAdvanceChapter(...)` — should we auto-advance at all? Only when the
 *      user's "continuous playback" preference is on AND a sleep timer isn't set
 *      to stop at the end of the chapter (that mode is an explicit "stop here",
 *      so it wins over continuous playback).
 *
 * Kept free of React / storage / the DB so the boundary logic is unit-tested in
 * isolation, mirroring [[immersiveAudio]] / [[playbackPosition]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {BIBLE_BOOKS, getBookByName, getBookById} from '@/constants/bible';
import type {AudioQueueMode, SleepTimerState} from '../types/audio';

/** A concrete chapter to load next: a numeric book id + 1-based chapter. */
export interface ChapterLocation {
  bookId: number;
  chapter: number;
}

/** Minimal shape we read off a verse to resolve its chapter location. */
export interface VerseChapterRef {
  book?: string | null;
  chapter?: number | null;
}

/**
 * Resolve a verse (whose `book` is a localized name like "Salmos"/"Psalms") to a
 * canonical {@link ChapterLocation}. Returns `null` when the book is unknown or
 * the chapter is missing, so callers can treat "no location" uniformly. The
 * book-name lookup is language-agnostic (matches `name` or `nameEn`), so the
 * reading version's spelling never matters.
 */
export function chapterLocationFromVerse(
  verse: VerseChapterRef | undefined | null,
): ChapterLocation | null {
  if (!verse || !verse.book || !verse.chapter) return null;
  const info = getBookByName(verse.book);
  return info ? {bookId: info.id, chapter: verse.chapter} : null;
}

/**
 * The chapter that follows `chapter` of book `bookId`, rolling over to the first
 * chapter of the next book when `chapter` is the book's last. Returns `null`
 * when there is no next chapter (unknown book, a non-positive chapter, or the
 * end of the canon).
 */
export function nextChapterLocation(
  bookId: number,
  chapter: number,
): ChapterLocation | null {
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book || chapter < 1) return null;

  // More chapters left in this book.
  if (chapter < book.chapters) {
    return {bookId, chapter: chapter + 1};
  }

  // Last chapter of the book → first chapter of the next book (canonical id).
  const next = BIBLE_BOOKS.find(b => b.id === bookId + 1);
  if (!next) return null; // end of the Bible (Apocalipsis 22)
  return {bookId: next.id, chapter: 1};
}

/**
 * Whether the player should auto-advance into the next chapter when the current
 * one finishes. Continuous playback must be enabled, and a sleep timer set to
 * "end of chapter" overrides it (that mode is an explicit "stop here").
 * A verse PLAYLIST (Sprint 79 — favorites/collections) never advances either:
 * its last verse is the end of the list, not a chapter boundary to roll past.
 */
export function shouldAdvanceChapter(params: {
  autoAdvance: boolean;
  sleepMode: SleepTimerState['mode'];
  queueMode?: AudioQueueMode;
}): boolean {
  if (params.queueMode === 'playlist') return false;
  if (!params.autoAdvance) return false;
  if (params.sleepMode === 'end-of-chapter') return false;
  return true;
}

/**
 * Whether the immersive reader should FOLLOW the audio engine into a chapter it
 * just auto-advanced into (Sprint 73). The immersive renders its own
 * `BibleVerse[]`; when continuous playback (S72) crosses a chapter boundary the
 * engine swaps the loaded chapter underneath it, so the immersive must re-key to
 * the new chapter to keep following the narration instead of stranding on the
 * previous one.
 *
 * Returns `true` ONLY when the engine holds exactly the NEXT chapter of what the
 * immersive currently displays — a natural forward advance. This deliberately
 * rejects an unrelated chapter the floating player might hold (e.g. the user
 * opened the immersive on a different passage than what was already playing), so
 * the immersive never gets hijacked; it only ever rides a continuous-playback
 * boundary crossing.
 */
/**
 * The localized title of the chapter that continuous playback will roll into
 * next — "Salmos 119" / "Psalms 119" (Sprint 73). Returns `null` at the end of
 * the canon (nothing comes next) so the floating player can hide the "up next"
 * peek there. Composes {@link chapterLocationFromVerse} + {@link
 * nextChapterLocation}; localized off the canonical book table.
 */
export function nextChapterTitle(
  verse: VerseChapterRef | undefined | null,
  language: 'es' | 'en',
): string | null {
  const here = chapterLocationFromVerse(verse);
  const next = here ? nextChapterLocation(here.bookId, here.chapter) : null;
  return localizedChapterTitle(next, language);
}

/**
 * The localized display title for a chapter location — "Salmos 119" /
 * "Psalms 119" — or `null` when the location is missing/unknown (Sprint 75,
 * extracted from {@link nextChapterTitle} so the listening-queue sheet can
 * title every upcoming chapter, not just the immediate next one).
 */
export function localizedChapterTitle(
  location: ChapterLocation | null,
  language: 'es' | 'en',
): string | null {
  if (!location) return null;
  const book = getBookById(location.bookId);
  if (!book) return null;
  const name = language === 'es' ? book.name : book.nameEn;
  return `${name} ${location.chapter}`;
}

/**
 * The next `count` chapters continuous playback will roll through, starting
 * after the chapter the given verse belongs to (Sprint 75 — fuels the
 * listening-queue sheet). Walks {@link nextChapterLocation} so book boundaries
 * roll over naturally; returns fewer than `count` entries near the end of the
 * canon and `[]` when the verse is unknown or nothing follows.
 */
export function upcomingChapters(
  verse: VerseChapterRef | undefined | null,
  count: number,
): ChapterLocation[] {
  const here = chapterLocationFromVerse(verse);
  if (!here || count <= 0) return [];
  const out: ChapterLocation[] = [];
  let cursor = here;
  for (let i = 0; i < count; i++) {
    const next = nextChapterLocation(cursor.bookId, cursor.chapter);
    if (!next) break;
    out.push(next);
    cursor = next;
  }
  return out;
}

export function shouldFollowAudioChapter(
  displayed: ChapterLocation | null,
  engine: ChapterLocation | null,
): boolean {
  if (!displayed || !engine) return false;
  // Already on the same chapter — nothing to follow.
  if (
    displayed.bookId === engine.bookId &&
    displayed.chapter === engine.chapter
  ) {
    return false;
  }
  const next = nextChapterLocation(displayed.bookId, displayed.chapter);
  return (
    !!next && next.bookId === engine.bookId && next.chapter === engine.chapter
  );
}

/** Value equality for two (possibly null) chapter locations. */
export function sameChapterLocation(
  a: ChapterLocation | null,
  b: ChapterLocation | null,
): boolean {
  return !!a && !!b && a.bookId === b.bookId && a.chapter === b.chapter;
}

/**
 * Whether the NORMAL reader screen should navigate to the chapter the audio
 * engine just auto-advanced into (Sprint 74). Stricter than the immersive's
 * {@link shouldFollowAudioChapter} because the reader is a full route — a
 * follow runs `router.replace` (the same path as the manual prev/next arrows),
 * so it must never fire against the user's own navigation:
 *
 *   - `enabled`        — the opt-in "reader follows audio" preference is on.
 *   - `focused`        — the reader is the active screen (no background jumps).
 *   - `immersiveOpen`  — the immersive overlay follows on its own (S73); a
 *                        route replace would remount the screen and close it.
 *   - `syncedWith`     — the latch: the chapter the reader was last showing
 *                        WHILE the engine played that same chapter. Following
 *                        requires `displayed` to still be that chapter, so a
 *                        manual jump to an unrelated chapter (even one that
 *                        happens to precede the engine's) never gets hijacked.
 *   - displayed/engine — must be a natural forward advance (exactly the next
 *                        chapter), per {@link shouldFollowAudioChapter}.
 */
export function shouldReaderFollowAudio(params: {
  enabled: boolean;
  focused: boolean;
  immersiveOpen: boolean;
  displayed: ChapterLocation | null;
  engine: ChapterLocation | null;
  syncedWith: ChapterLocation | null;
}): boolean {
  if (!params.enabled || !params.focused || params.immersiveOpen) return false;
  if (!sameChapterLocation(params.displayed, params.syncedWith)) return false;
  return shouldFollowAudioChapter(params.displayed, params.engine);
}
