import {
  formatReadingTime,
  readingTimeParts,
} from '../src/lib/utils/formatReadingTime';

describe('readingTimeParts', () => {
  it('splits seconds into whole hours + minutes', () => {
    expect(readingTimeParts(0)).toEqual({
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    });
    expect(readingTimeParts(59)).toEqual({
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    });
    expect(readingTimeParts(60)).toEqual({
      hours: 0,
      minutes: 1,
      totalMinutes: 1,
    });
    expect(readingTimeParts(3599)).toEqual({
      hours: 0,
      minutes: 59,
      totalMinutes: 59,
    });
    expect(readingTimeParts(3600)).toEqual({
      hours: 1,
      minutes: 0,
      totalMinutes: 60,
    });
    // 2h 32m 11s = 9131s → 2h 32m
    expect(readingTimeParts(9131)).toEqual({
      hours: 2,
      minutes: 32,
      totalMinutes: 152,
    });
  });

  it('clamps non-finite / negative input to zero', () => {
    expect(readingTimeParts(-100)).toEqual({
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    });
    expect(readingTimeParts(NaN)).toEqual({
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    });
    expect(readingTimeParts(Infinity)).toEqual({
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    });
  });
});

describe('formatReadingTime', () => {
  it('uses the less-than-minute label below 60s', () => {
    expect(formatReadingTime(0)).toBe('<1m');
    expect(formatReadingTime(45)).toBe('<1m');
    expect(formatReadingTime(-10)).toBe('<1m');
  });

  it('drops a zero component', () => {
    expect(formatReadingTime(60)).toBe('1m');
    expect(formatReadingTime(45 * 60)).toBe('45m');
    expect(formatReadingTime(3600)).toBe('1h');
    expect(formatReadingTime(2 * 3600)).toBe('2h');
  });

  it('renders both components when present', () => {
    expect(formatReadingTime(9131)).toBe('2h 32m'); // 2h 32m 11s
    expect(formatReadingTime(3660)).toBe('1h 1m');
  });

  it('honors injected (localized) unit labels', () => {
    expect(
      formatReadingTime(9131, {
        hour: ' h ',
        minute: ' min',
        lessThanMinute: '',
      }),
    ).toBe('2 h  32 min');
    expect(formatReadingTime(30, {lessThanMinute: 'menos de 1 min'})).toBe(
      'menos de 1 min',
    );
  });
});
