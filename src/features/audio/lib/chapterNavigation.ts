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

import {BIBLE_BOOKS} from '@/constants/bible';
import type {SleepTimerState} from '../types/audio';

/** A concrete chapter to load next: a numeric book id + 1-based chapter. */
export interface ChapterLocation {
  bookId: number;
  chapter: number;
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
