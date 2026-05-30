/**
 * Cold-start player restore (Sprint 53).
 *
 * Decides whether — and where — the floating audio player should re-open when
 * the app launches, so a premium listener finds their last "Continue listening"
 * chapter waiting on the mini player (collapsed + paused) instead of nothing.
 * This finally closes the resume arc: Sprint 51 surfaced the saved position on
 * the Home card + the same-chapter reader resume, Sprint 52 brought it into the
 * ImmersiveReader — but the floating player itself never reappeared on a fresh
 * launch.
 *
 * The saved `PlaybackPosition` is a DISCRETE `{book, chapter, verseIndex}`
 * snapshot with NO verse text (the TTS engine has no continuous time — see
 * scrubMath.ts), so resolving a restore means loading the chapter's verses now.
 * The actual loading/index-resolution is injected as `getChapter`/`getLastPosition`
 * so this module stays pure (React-/storage-/DB-free) and unit-testable, mirror
 * of scrubMath.ts / playbackPosition.ts / immersiveAudio.ts.
 *
 * Restore is PREMIUM (Sprint 50 gate, consistent with the Sprint 51 resume):
 * free users never restore — they always start a chapter at verse 1.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import type {AudioVerse} from '../types/audio';
import {
  PlaybackPosition,
  isResumable,
  clampVerseIndex,
} from './playbackPosition';
import {toAudioVerses, VerseLike} from './immersiveAudio';

export interface ColdStartRestoreDeps {
  /** Premium gate — resume is premium since Sprint 51; free never restores. */
  isPremium: boolean;
  /** ms-epoch "now" for the freshness check (injected for deterministic tests). */
  now: number;
  /** Reads the persisted last audio position, or null. */
  getLastPosition: () => Promise<PlaybackPosition | null>;
  /**
   * Resolves a (possibly Spanish, RVR1960) book name to its numeric book id, or
   * null when unknown — language-agnostic matching, mirror of the reader's
   * `getBookByName(...).id` resume match.
   */
  resolveBookId: (book: string) => number | null;
  /**
   * Loads the chapter's verses for a book id + chapter (the active Bible version
   * is baked into the closure by the caller). Returns a BibleVerse-like list.
   */
  getChapter: (
    bookId: number,
    chapter: number,
  ) => Promise<readonly VerseLike[]>;
}

export interface ColdStartRestoreTarget {
  /** The chapter mapped to the player's `AudioVerse` shape. */
  verses: AudioVerse[];
  /** The 0-based verse index to resume at (always > 0). */
  index: number;
}

/**
 * Resolve the cold-start restore target, or `null` when nothing should be
 * restored. Returns null on every non-eligible path: not premium, no saved
 * position, a stale position (older than the 30-day resume window), a position
 * already at verse 1, an unknown book, a chapter that doesn't load (or is empty
 * in the current version), or a re-clamped index that collapses back to 0.
 */
export async function resolveColdStartRestore(
  deps: ColdStartRestoreDeps,
): Promise<ColdStartRestoreTarget | null> {
  const {isPremium, now, getLastPosition, resolveBookId, getChapter} = deps;

  // Resume is premium (Sprint 51). Free users never restore.
  if (!isPremium) return null;

  const pos = await getLastPosition();
  // Only a fresh position (≤30d) is worth resurrecting — mirror of the Home
  // card's `isResumable` guard so a months-old chapter never resurfaces.
  if (!pos || !isResumable(pos, now)) return null;
  // Nothing to resume to if the user was at the very first verse — restoring an
  // index-0 player is indistinguishable from a normal "start the chapter".
  if (pos.verseIndex <= 0) return null;

  // Match the saved book by language-agnostic id (RVR1960 stores Spanish names,
  // e.g. "Génesis"); a raw string compare against the current version would miss.
  const bookId = resolveBookId(pos.book);
  if (bookId == null) return null;

  // The saved position carries no verse text — load the chapter now. Loading
  // can throw (bad id / DB hiccup); a failed restore is a no-op, never a crash.
  let raw: readonly VerseLike[];
  try {
    raw = await getChapter(bookId, pos.chapter);
  } catch {
    return null;
  }

  const verses = toAudioVerses(raw);
  if (verses.length === 0) return null;

  // Re-clamp to the freshly loaded chapter — a different Bible version may have
  // a different verse count than when the position was saved.
  const index = clampVerseIndex(pos.verseIndex, verses.length);
  if (index <= 0) return null;

  return {verses, index};
}
