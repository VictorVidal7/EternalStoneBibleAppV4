/**
 * 🔁 verseRepeat — PURE decision for the memorization "repeat verse" loop.
 *
 * A memorization aid: when "repeat verse" is on, the engine re-speaks the CURRENT
 * verse when it finishes instead of advancing — so a single verse loops over and
 * over while the user commits it to memory (pairs with the app's SRS). Toggling
 * it off lets the next verse-end advance normally.
 *
 * This isolates the one boolean the speech `onDone` callback checks, so it is
 * unit-tested in isolation: replay only while actually narrating (never loop a
 * paused/stopped verse, which would resurrect playback).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/**
 * Whether the verse that just finished should be replayed (memorization loop).
 * Only when the toggle is on AND playback is genuinely active — a paused/stopped
 * engine must stay stopped, never re-trigger speech from a stale onDone.
 */
export function shouldReplayVerse(
  repeatVerse: boolean,
  isPlaying: boolean,
  isPaused: boolean,
): boolean {
  return repeatVerse && isPlaying && !isPaused;
}
