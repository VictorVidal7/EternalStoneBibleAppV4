import {timeOfDay, homeNudge} from '../src/lib/home/homeGreeting';

describe('timeOfDay', () => {
  it('buckets the morning window (5–11)', () => {
    expect(timeOfDay(5)).toBe('morning');
    expect(timeOfDay(11)).toBe('morning');
  });

  it('buckets the afternoon window (12–17)', () => {
    expect(timeOfDay(12)).toBe('afternoon');
    expect(timeOfDay(17)).toBe('afternoon');
  });

  it('buckets the evening window (18–21)', () => {
    expect(timeOfDay(18)).toBe('evening');
    expect(timeOfDay(21)).toBe('evening');
  });

  it('buckets the night window (22–4, wrapping midnight)', () => {
    expect(timeOfDay(22)).toBe('night');
    expect(timeOfDay(0)).toBe('night');
    expect(timeOfDay(4)).toBe('night');
  });

  it('falls back to night for an out-of-range / NaN hour', () => {
    expect(timeOfDay(-1)).toBe('night');
    expect(timeOfDay(99)).toBe('night');
    expect(timeOfDay(NaN)).toBe('night');
  });
});

describe('homeNudge', () => {
  it('celebrates an active streak first (with the day count)', () => {
    expect(homeNudge({streak: 5, hasLastRead: true})).toEqual({
      kind: 'streak',
      days: 5,
    });
    // Even a 1-day streak wins over "continue".
    expect(homeNudge({streak: 1, hasLastRead: true})).toEqual({
      kind: 'streak',
      days: 1,
    });
  });

  it('points to continue reading when there is no streak but a last read', () => {
    expect(homeNudge({streak: 0, hasLastRead: true})).toEqual({
      kind: 'continue',
    });
  });

  it('falls back to the daily verse for a fresh user', () => {
    expect(homeNudge({streak: 0, hasLastRead: false})).toEqual({
      kind: 'daily',
    });
  });
});
