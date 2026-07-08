import {
  nextPlaybackSpeed,
  clampPlaybackSpeed,
} from '../src/features/audio/lib/playbackSpeed';
import {
  PLAYBACK_SPEEDS,
  FREE_MAX_PLAYBACK_SPEED,
} from '../src/features/audio/constants/audioConstants';
import type {PlaybackSpeed} from '../src/features/audio/types/audio';

/**
 * Sprint 80 regression — the collapsed bar's speed badge cycled a hardcoded
 * 1 → 1.5 → 2 ternary, so listening at 1.25x and tapping the badge RESET the
 * speed to 1x (and the cycle never offered 1.25x at all). Every tap-to-cycle
 * control now walks the one PLAYBACK_SPEEDS list through this helper.
 *
 * T24 extended the list with premium-only 2.25x/2.5x — free listeners cycle
 * only up to FREE_MAX_PLAYBACK_SPEED (2x), premium cycles the full list.
 */
describe('nextPlaybackSpeed', () => {
  const freeSpeeds = PLAYBACK_SPEEDS.filter(
    speed => speed <= FREE_MAX_PLAYBACK_SPEED,
  );

  it('free: advances every speed up to FREE_MAX_PLAYBACK_SPEED to its successor', () => {
    for (let i = 0; i < freeSpeeds.length - 1; i++) {
      expect(nextPlaybackSpeed(freeSpeeds[i], false)).toBe(freeSpeeds[i + 1]);
    }
  });

  it('free: wraps from FREE_MAX_PLAYBACK_SPEED back to the first speed, never reaching 2.25x/2.5x', () => {
    expect(nextPlaybackSpeed(FREE_MAX_PLAYBACK_SPEED, false)).toBe(
      freeSpeeds[0],
    );
  });

  it('free: moves 1.25x forward to 1.5x — never resets it to 1x (the reported bug)', () => {
    expect(nextPlaybackSpeed(1.25, false)).toBe(1.5);
  });

  it('premium: advances every speed to its successor in the full PLAYBACK_SPEEDS list', () => {
    for (let i = 0; i < PLAYBACK_SPEEDS.length - 1; i++) {
      expect(nextPlaybackSpeed(PLAYBACK_SPEEDS[i], true)).toBe(
        PLAYBACK_SPEEDS[i + 1],
      );
    }
  });

  it('premium: cycles past 2x into 2.25x and 2.5x, wrapping back to the first speed', () => {
    expect(nextPlaybackSpeed(2, true)).toBe(2.25);
    expect(nextPlaybackSpeed(2.25, true)).toBe(2.5);
    expect(nextPlaybackSpeed(2.5, true)).toBe(PLAYBACK_SPEEDS[0]);
  });

  it('free: reaches every free speed exactly once over a full cycle', () => {
    const seen: PlaybackSpeed[] = [];
    let speed: PlaybackSpeed = 1;
    for (let i = 0; i < freeSpeeds.length; i++) {
      speed = nextPlaybackSpeed(speed, false);
      seen.push(speed);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([...freeSpeeds]);
    expect(speed).toBe(1);
  });

  it('a premium-only current speed passed while free wraps to the free list start rather than throwing', () => {
    expect(nextPlaybackSpeed(2.5, false)).toBe(freeSpeeds[0]);
  });
});

describe('clampPlaybackSpeed', () => {
  it('leaves any speed untouched for premium listeners', () => {
    for (const speed of PLAYBACK_SPEEDS) {
      expect(clampPlaybackSpeed(speed, true)).toBe(speed);
    }
  });

  it('leaves speeds at or below FREE_MAX_PLAYBACK_SPEED untouched for free listeners', () => {
    for (const speed of PLAYBACK_SPEEDS.filter(
      s => s <= FREE_MAX_PLAYBACK_SPEED,
    )) {
      expect(clampPlaybackSpeed(speed, false)).toBe(speed);
    }
  });

  it('pulls a premium-only speed down to FREE_MAX_PLAYBACK_SPEED for free listeners', () => {
    expect(clampPlaybackSpeed(2.25, false)).toBe(FREE_MAX_PLAYBACK_SPEED);
    expect(clampPlaybackSpeed(2.5, false)).toBe(FREE_MAX_PLAYBACK_SPEED);
  });
});
