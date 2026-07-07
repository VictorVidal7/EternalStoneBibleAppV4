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

import {getBookByName} from '@/constants/bible';
import type {BibleVerse} from '@/types/bible';
import type {AudioVerse} from '../types/audio';
import {clampVerseIndex} from './playbackPosition';

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

/**
 * Inverse of {@link toAudioVerses} — reconstruct reader `BibleVerse[]` from the
 * audio engine's own `AudioVerse[]` (Sprint 73). When continuous playback
 * auto-advances into the next chapter, the immersive reader re-keys to the
 * chapter the engine is ALREADY narrating; deriving the verses straight from the
 * engine (rather than re-querying the DB) keeps a single source of truth — the
 * immersive shows exactly what is being read aloud, with no risk of a verse-count
 * mismatch from a different version row.
 *
 * `id` is synthetic (these rows aren't a DB read) and `bookNumber` is resolved
 * from the canonical book table; the immersive only consumes `text` + the
 * reference fields, so the synthetic id is never surfaced. Empty `book` →
 * `bookNumber` 0 (defensive, mirrors `toAudioVerses`).
 */
export function bibleVersesFromAudio(
  audio: readonly AudioVerse[],
  versionAbbr: string,
): BibleVerse[] {
  return audio.map(v => ({
    id: 0,
    book: v.book,
    bookNumber: getBookByName(v.book)?.id ?? 0,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text,
    version: versionAbbr,
  }));
}

/**
 * The verse index the ImmersiveReader should open on (#7 fix). The reader
 * screen mounts a fresh `ImmersiveReader` each time the modal opens (RN's
 * `Modal` unmounts its children while `visible={false}`), so `startIndex` is
 * only ever read once, at that mount — it used to be hardcoded to 0, so
 * immersive always opened on verse 1 even while the audio engine was already
 * narrating deep into the same chapter.
 *
 * Seeds from the engine's current verse ONLY when it is already bound to the
 * chapter about to be shown (`audioBoundToReader` — same book/chapter as the
 * reader's `displayedLocation`, checked by the caller); otherwise falls back
 * to the chapter's first verse, same as before. Clamped defensively in case
 * the engine holds a different Bible version with a different verse count.
 */
export function immersiveStartIndex(
  audioBoundToReader: boolean,
  engineVerseIndex: number,
  versesLength: number,
): number {
  if (!audioBoundToReader) return 0;
  return clampVerseIndex(engineVerseIndex, versesLength);
}

/** What `ImmersiveReader` should open with: which chapter's verses, and where. */
export interface ImmersiveOpenState {
  verses: BibleVerse[];
  startIndex: number;
}

/**
 * Resolve the chapter + verse ImmersiveReader opens on (#7 fix, part 2). Handles
 * the case `immersiveStartIndex` alone cannot: continuous playback (Sprint 72)
 * can silently carry the audio engine into a DIFFERENT chapter than the one on
 * screen (auto-advance while "reader follows audio" is off or the reader isn't
 * focused) — seeding an index into the READER's chapter can't fix that, since
 * the audio isn't even IN that chapter anymore. When the engine is actively
 * narrating elsewhere, immersive opens on the engine's own chapter instead of
 * stranding on the reader's stale one (previously: "1/58 con su propio Auto",
 * a read-only immersive on the wrong chapter with no connection to what's
 * playing). Otherwise (same chapter, or no active narration elsewhere) it opens
 * on the reader's own chapter, matching the on-screen text/version.
 */
export function resolveImmersiveOpen(params: {
  readerVerses: BibleVerse[];
  audioEngineVerses: readonly AudioVerse[];
  audioBoundToReader: boolean;
  audioIsPlaying: boolean;
  isAudioVisible: boolean;
  engineVerseIndex: number;
  versionAbbr: string;
}): ImmersiveOpenState {
  const engineActiveElsewhere =
    params.isAudioVisible &&
    params.audioIsPlaying &&
    !params.audioBoundToReader &&
    params.audioEngineVerses.length > 0;

  if (engineActiveElsewhere) {
    const verses = bibleVersesFromAudio(
      params.audioEngineVerses,
      params.versionAbbr,
    );
    return {
      verses,
      startIndex: clampVerseIndex(params.engineVerseIndex, verses.length),
    };
  }

  return {
    verses: params.readerVerses,
    startIndex: immersiveStartIndex(
      params.audioBoundToReader,
      params.engineVerseIndex,
      params.readerVerses.length,
    ),
  };
}
