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
import type {SleepTimerState} from '../types/audio';

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
 */
export function shouldAdvanceChapter(params: {
  autoAdvance: boolean;
  sleepMode: SleepTimerState['mode'];
}): boolean {
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
  if (!next) return null;
  const book = getBookById(next.bookId);
  if (!book) return null;
  const name = language === 'es' ? book.name : book.nameEn;
  return `${name} ${next.chapter}`;
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
