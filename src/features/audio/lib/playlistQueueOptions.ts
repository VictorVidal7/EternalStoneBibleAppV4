/**
 * Playlist queue options (Sprint 80) — devotional shuffle + repeat-the-list.
 *
 * Both toggles only ever permute the verses AFTER the one currently playing
 * (`currentIndex` and everything before it stay untouched). That single rule
 * keeps every index the engine has already captured in in-flight speech
 * callbacks valid — no restart of the playing verse, no stale-index advance —
 * and the "played history" reads honestly in the queue sheet.
 *
 * Pure and storage-free like [[versePlaylist]] / [[chapterNavigation]]; the
 * random source is injectable so shuffles are deterministic under test.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import type {AudioQueueOptions} from '../types/audio';

export const DEFAULT_QUEUE_OPTIONS: AudioQueueOptions = {
  shuffle: false,
  repeat: false,
};

/**
 * Shuffle the UPCOMING items (after `currentIndex`) with Fisher–Yates.
 * Items up to and including the current one keep their positions. A
 * `currentIndex` outside the list shuffles nothing (defensive).
 */
export function shuffleUpcoming<T>(
  items: readonly T[],
  currentIndex: number,
  random: () => number = Math.random,
): T[] {
  const result = [...items];
  if (currentIndex < 0 || currentIndex >= items.length - 1) return result;
  for (let i = result.length - 1; i > currentIndex + 1; i--) {
    const j = currentIndex + 1 + Math.floor(random() * (i - currentIndex));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Put the UPCOMING items back in their canonical order — the order they had
 * in `originalOrder` (matched by reference, the engine reuses the loaded
 * verse objects). Items missing from `originalOrder` sink to the end keeping
 * their relative order.
 */
export function restoreUpcomingOrder<T>(
  items: readonly T[],
  currentIndex: number,
  originalOrder: readonly T[],
): T[] {
  const result = [...items];
  if (currentIndex < 0 || currentIndex >= items.length - 1) return result;
  const position = new Map<T, number>();
  originalOrder.forEach((item, i) => position.set(item, i));
  const upcoming = result.slice(currentIndex + 1);
  const stable = upcoming.map((item, i) => ({item, i}));
  stable.sort((a, b) => {
    const pa = position.get(a.item) ?? originalOrder.length + a.i;
    const pb = position.get(b.item) ?? originalOrder.length + b.i;
    return pa - pb;
  });
  return [
    ...result.slice(0, currentIndex + 1),
    ...stable.map(entry => entry.item),
  ];
}

/**
 * Where playback goes after the verse at `currentIndex` ends: the next index,
 * 0 when a repeating playlist runs past its end, or null to stop.
 */
export function nextPlaylistIndex(params: {
  currentIndex: number;
  total: number;
  repeat: boolean;
}): number | null {
  const {currentIndex, total, repeat} = params;
  if (total <= 0) return null;
  if (currentIndex + 1 < total) return currentIndex + 1;
  return repeat ? 0 : null;
}
