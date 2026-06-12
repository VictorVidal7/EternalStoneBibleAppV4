/**
 * Playback-speed cycling (Sprint 80).
 *
 * ONE definition of "the next speed" for every tap-to-cycle control. The
 * collapsed bar's badge used to cycle a hardcoded 1 → 1.5 → 2 ternary, so any
 * speed outside that set (1.25x, 0.75x…) silently RESET to 1x — the expanded
 * player's compact selector already walked the full PLAYBACK_SPEEDS list, and
 * the two controls disagreed. Both now share this walk.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import {PLAYBACK_SPEEDS} from '../constants/audioConstants';
import type {PlaybackSpeed} from '../types/audio';

/**
 * The speed after `current` in PLAYBACK_SPEEDS, wrapping past the end
 * (0.5 → 0.75 → 1 → 1.25 → 1.5 → 1.75 → 2 → 0.5). A value not in the list
 * (impossible by typing, defensive at runtime) lands on the list's start.
 */
export function nextPlaybackSpeed(current: PlaybackSpeed): PlaybackSpeed {
  const index = PLAYBACK_SPEEDS.indexOf(current);
  return PLAYBACK_SPEEDS[(index + 1) % PLAYBACK_SPEEDS.length];
}
