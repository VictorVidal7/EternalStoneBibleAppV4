/**
 * Playback-speed cycling (Sprint 80; extended for premium 2.25x/2.5x in T24).
 *
 * ONE definition of "the next speed" for every tap-to-cycle control. The
 * collapsed bar's badge used to cycle a hardcoded 1 → 1.5 → 2 ternary, so any
 * speed outside that set (1.25x, 0.75x…) silently RESET to 1x — the expanded
 * player's compact selector already walked the full PLAYBACK_SPEEDS list, and
 * the two controls disagreed. Both now share this walk.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import {
  PLAYBACK_SPEEDS,
  FREE_MAX_PLAYBACK_SPEED,
} from '../constants/audioConstants';
import type {PlaybackSpeed} from '../types/audio';

/**
 * The speeds a listener may currently cycle through: the full list for
 * premium, or everything up to FREE_MAX_PLAYBACK_SPEED for free.
 */
function availableSpeeds(isPremium: boolean): PlaybackSpeed[] {
  return isPremium
    ? PLAYBACK_SPEEDS
    : PLAYBACK_SPEEDS.filter(speed => speed <= FREE_MAX_PLAYBACK_SPEED);
}

/**
 * The speed after `current` within the caller's available speeds, wrapping
 * past the end — free: 0.5 → … → 2 → 0.5; premium: 0.5 → … → 2 → 2.25 → 2.5
 * → 0.5. A `current` outside the available list (e.g. a premium speed that
 * just got revoked) wraps to that list's start rather than throwing.
 */
export function nextPlaybackSpeed(
  current: PlaybackSpeed,
  isPremium: boolean,
): PlaybackSpeed {
  const speeds = availableSpeeds(isPremium);
  const index = speeds.indexOf(current);
  return speeds[(index + 1) % speeds.length];
}

/**
 * Clamps a speed to what the listener's entitlement allows — used when
 * hydrating a persisted preference and when an entitlement is revoked, so a
 * premium-only speed never lingers as the active one for a free listener.
 */
export function clampPlaybackSpeed(
  speed: PlaybackSpeed,
  isPremium: boolean,
): PlaybackSpeed {
  return isPremium || speed <= FREE_MAX_PLAYBACK_SPEED
    ? speed
    : FREE_MAX_PLAYBACK_SPEED;
}
