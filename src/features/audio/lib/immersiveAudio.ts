/**
 * Immersive ↔ audio bridge helpers (Sprint 52 — premium audio in the
 * ImmersiveReader).
 *
 * Pure glue between the ImmersiveReader (which owns a `BibleVerse[]` + its own
 * `currentIndex`) and the AudioPlayerContext (which owns an `AudioVerse[]` +
 * `currentVerseIndex`). The premium "listen in immersive" feature loads the
 * SAME chapter into the audio engine so the two index spaces stay 1:1; these
 * helpers do the verse mapping and the already-loaded detection that lets us
 * BIND to an in-flight chapter instead of forcing a disruptive reload.
 *
 * React-/RN-free so it unit-tests without rendering (mirror of scrubMath.ts /
 * playbackPosition.ts).
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import type {AudioVerse} from '../types/audio';

/**
 * Minimal shape we read off a reader verse. `BibleVerse` is a superset, but the
 * fields are typed loosely here so defensive coercion (below) is meaningful.
 */
export interface VerseLike {
  book?: string | null;
  chapter?: number | null;
  verse?: number | null;
  text?: string | null;
}

/**
 * Map reader verses (BibleVerse-like) to the `AudioVerse` shape the player
 * loads. Defensive in exactly the way the reader's `startAudioPlayback` was
 * inline before this sprint (book → '', chapter/verse → 0, text → String()),
 * so the two entry points stay byte-identical.
 */
export function toAudioVerses(verses: readonly VerseLike[]): AudioVerse[] {
  return verses.map(v => ({
    book: v.book || '',
    chapter: v.chapter || 0,
    verse: v.verse || 0,
    text: String(v.text || ''),
  }));
}

/**
 * True when the audio engine already holds THIS exact chapter, so the immersive
 * reader can bind to it (sync indices, drive play/pause) instead of reloading —
 * a reload resets the player to verse 0 and interrupts any in-flight playback.
 *
 * The reader always passes a single contiguous chapter, so the head verse's
 * book + chapter identifies it; we also require equal length so a different
 * Bible version (different verse count) is treated as a distinct chapter and
 * triggers a reload + re-clamp. Empty lists never match.
 */
export function isSameAudioChapter(
  loaded: readonly AudioVerse[],
  candidate: readonly AudioVerse[],
): boolean {
  if (loaded.length === 0 || loaded.length !== candidate.length) return false;
  const a = loaded[0];
  const b = candidate[0];
  return !!a && !!b && a.book === b.book && a.chapter === b.chapter;
}
