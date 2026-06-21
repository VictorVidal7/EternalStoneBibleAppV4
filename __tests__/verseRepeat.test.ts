import {shouldReplayVerse} from '../src/features/audio/lib/verseRepeat';

/**
 * verseRepeat — the memorization "repeat verse" decision the speech onDone
 * checks. Locks the guard so the loop replays only while actually narrating and
 * never resurrects a paused/stopped verse.
 */
describe('shouldReplayVerse', () => {
  it('replays while the toggle is on and playback is active', () => {
    expect(shouldReplayVerse(true, true, false)).toBe(true);
  });

  it('does not replay when the toggle is off', () => {
    expect(shouldReplayVerse(false, true, false)).toBe(false);
  });

  it('does not replay a paused or stopped verse (no resurrection)', () => {
    expect(shouldReplayVerse(true, false, false)).toBe(false); // stopped
    expect(shouldReplayVerse(true, true, true)).toBe(false); // paused
  });
});
