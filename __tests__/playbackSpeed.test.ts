import {nextPlaybackSpeed} from '../src/features/audio/lib/playbackSpeed';
import {PLAYBACK_SPEEDS} from '../src/features/audio/constants/audioConstants';
import type {PlaybackSpeed} from '../src/features/audio/types/audio';

/**
 * Sprint 80 regression — the collapsed bar's speed badge cycled a hardcoded
 * 1 → 1.5 → 2 ternary, so listening at 1.25x and tapping the badge RESET the
 * speed to 1x (and the cycle never offered 1.25x at all). Every tap-to-cycle
 * control now walks the one PLAYBACK_SPEEDS list through this helper.
 */
describe('nextPlaybackSpeed', () => {
  it('advances every speed to its successor in PLAYBACK_SPEEDS', () => {
    for (let i = 0; i < PLAYBACK_SPEEDS.length - 1; i++) {
      expect(nextPlaybackSpeed(PLAYBACK_SPEEDS[i])).toBe(
        PLAYBACK_SPEEDS[i + 1],
      );
    }
  });

  it('wraps from the last speed back to the first', () => {
    expect(nextPlaybackSpeed(2)).toBe(0.5);
  });

  it('moves 1.25x forward to 1.5x — never resets it to 1x (the reported bug)', () => {
    expect(nextPlaybackSpeed(1.25)).toBe(1.5);
  });

  it('reaches every speed exactly once over a full cycle', () => {
    const seen: PlaybackSpeed[] = [];
    let speed: PlaybackSpeed = 1;
    for (let i = 0; i < PLAYBACK_SPEEDS.length; i++) {
      speed = nextPlaybackSpeed(speed);
      seen.push(speed);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([...PLAYBACK_SPEEDS]);
    expect(speed).toBe(1);
  });
});
