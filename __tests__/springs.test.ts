import {
  PRESS_SCALE,
  PRESS_SPRING,
  pressTargetScale,
} from '../src/lib/animation/springs';

describe('pressTargetScale', () => {
  it('shrinks to the press scale while pressed (motion allowed)', () => {
    expect(pressTargetScale(true, false)).toBe(PRESS_SCALE);
    expect(pressTargetScale(true, false, 0.9)).toBe(0.9);
  });

  it('rests at 1 when not pressed', () => {
    expect(pressTargetScale(false, false)).toBe(1);
    expect(pressTargetScale(false, false, 0.9)).toBe(1);
  });

  it('never shrinks under reduced motion, pressed or not', () => {
    expect(pressTargetScale(true, true)).toBe(1);
    expect(pressTargetScale(false, true)).toBe(1);
    expect(pressTargetScale(true, true, 0.5)).toBe(1);
  });

  it('exposes a sane shared spring config', () => {
    expect(PRESS_SCALE).toBeGreaterThan(0);
    expect(PRESS_SCALE).toBeLessThan(1);
    expect(PRESS_SPRING.tension).toBeGreaterThan(0);
    expect(PRESS_SPRING.friction).toBeGreaterThan(0);
  });
});
