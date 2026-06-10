/**
 * 🎧 resumeCard — PURE policy for the Home "Continue listening" card
 * (Sprint 75).
 *
 * The card shipped in Sprint 51 as the premium resume surface, but Sprint 53's
 * cold-start restore made it effectively DEAD UI: the restorer re-opens the
 * floating player on launch using the SAME `isResumable` freshness window, and
 * the card required `!playerVisible` — so by the time Home rendered, the player
 * had already won the race (the card only survived a mount race, a failed
 * chapter load, or a position saved at verse 1, which the restorer skips).
 *
 * Sprint 75 revives it as a RICHER resume surface that COMPOSES with the
 * restored player instead of competing with it:
 *
 *   - `navigate` — the player is NOT up (no restore happened): the card keeps
 *     its original behavior, deep-linking into the reader with `?audioResume=1`.
 *   - `resume`   — the player IS up but sits PAUSED on the very chapter the
 *     saved position points at (the restored cold-start state): the card
 *     becomes a one-tap "pick up where you left off" — tapping it just plays.
 *   - `hidden`   — everything else: not premium, no fresh position, audio
 *     actively playing (the player is the surface then), or the player holds a
 *     DIFFERENT chapter (the user moved on; never hijack their session).
 *
 * Kept free of React / storage so the mode table is unit-tested in isolation,
 * mirroring [[playbackPosition]] / [[chapterNavigation]] / [[coldStartRestore]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {PlaybackPosition} from './playbackPosition';
import {isResumable} from './playbackPosition';
import type {ChapterLocation} from './chapterNavigation';
import {
  chapterLocationFromVerse,
  sameChapterLocation,
} from './chapterNavigation';

/** What the Home "Continue listening" card should do (or whether it shows). */
export type ResumeCardMode = 'hidden' | 'navigate' | 'resume';

export interface ResumeCardParams {
  /** Resume is premium since Sprint 51; free users never see the card. */
  isPremium: boolean;
  /** The saved last-listened position, or null when none. */
  position: PlaybackPosition | null;
  /** ms-epoch "now" for the freshness check (injected for deterministic tests). */
  now: number;
  /** Whether the floating player is currently visible. */
  playerVisible: boolean;
  /** Whether audio is actively playing right now. */
  playerPlaying: boolean;
  /** The chapter the floating player currently holds, or null when none. */
  playerLocation: ChapterLocation | null;
}

/**
 * Resolve the card's mode. `resume` requires the player to be visible, paused,
 * and holding the SAME chapter as the saved position — exactly the state the
 * Sprint 53 cold-start restore leaves behind — so the card never offers to
 * "resume" over an unrelated chapter the user navigated to on their own.
 */
export function resumeCardMode(params: ResumeCardParams): ResumeCardMode {
  const {isPremium, position, now, playerVisible, playerPlaying} = params;

  if (!isPremium || !position || !isResumable(position, now)) return 'hidden';

  // No player up — the card is the only resume surface (original S51 path).
  if (!playerVisible) return 'navigate';

  // Audio is playing: the player IS the session surface; a duplicate "resume"
  // card would only compete with it.
  if (playerPlaying) return 'hidden';

  // Player visible but paused — a one-tap resume, but ONLY when it still holds
  // the saved position's chapter (a paused player on another chapter means the
  // user moved on deliberately).
  const saved = chapterLocationFromVerse(position);
  return sameChapterLocation(saved, params.playerLocation)
    ? 'resume'
    : 'hidden';
}
