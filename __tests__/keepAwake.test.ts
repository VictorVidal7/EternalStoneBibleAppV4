import {shouldKeepScreenAwake} from '../src/features/audio/lib/keepAwake';

/**
 * keepAwake — the screen wake-lock decision for the audio engine. expo-speech
 * only narrates in the foreground with the screen on, so the engine holds a
 * wake-lock while it is actively playing and releases it the moment it
 * pauses/stops. This locks the boolean so a regression can't strand the lock on
 * (battery drain) or release it mid-chapter (silent stop when the screen dims).
 */
describe('shouldKeepScreenAwake', () => {
  it('holds the lock while speaking', () => {
    expect(shouldKeepScreenAwake({isPlaying: true, isLoading: false})).toBe(
      true,
    );
  });

  it('holds the lock through the brief load between verses/chapters', () => {
    // isLoading covers the verse-to-verse and chapter-to-chapter hand-off so
    // the lock never flickers off (and lets the device sleep) for an instant.
    expect(shouldKeepScreenAwake({isPlaying: false, isLoading: true})).toBe(
      true,
    );
  });

  it('releases the lock when paused/stopped (idle)', () => {
    expect(shouldKeepScreenAwake({isPlaying: false, isLoading: false})).toBe(
      false,
    );
  });
});
