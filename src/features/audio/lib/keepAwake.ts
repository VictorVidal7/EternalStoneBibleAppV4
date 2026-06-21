/**
 * 🔆 keepAwake — PURE decision for the audio screen wake-lock.
 *
 * expo-speech only narrates in the FOREGROUND with the screen on: once the OS
 * screen-timeout fires, the device sleeps and TTS stops dead mid-chapter. That
 * silently breaks continuous listening (a chapter/book read aloud while the
 * phone rests on a table). So the audio engine holds a wake-lock WHILE it is
 * actively narrating and releases it the instant playback pauses/stops.
 *
 * This isolates the single boolean decision so it is unit-tested without
 * touching the native module — the provider just maps the player state through
 * it and activates/deactivates {@link AUDIO_KEEP_AWAKE_TAG} on the transition.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Minimal slice of the player state the wake-lock decision reads. */
export interface KeepAwakeState {
  isPlaying: boolean;
  isLoading: boolean;
}

/**
 * Whether the screen should be held awake right now. True while narration is
 * active — either speaking (`isPlaying`) or in the brief load between verses
 * (`isLoading`) so the lock never flickers off during a verse-to-verse or
 * chapter-to-chapter hand-off. False when paused/stopped, releasing the lock so
 * the device can sleep normally.
 */
export function shouldKeepScreenAwake(state: KeepAwakeState): boolean {
  return state.isPlaying || state.isLoading;
}
