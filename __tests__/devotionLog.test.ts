/**
 * Sprint 84 — the devotion-habit model. The streak reuses the canonical
 * reading-streak engine (computeStreaks), so this pins the wiring (current is
 * a run ending today OR yesterday; longest can exceed current; distinct days
 * are tallied) plus the store-side record/prune and defensive parsing.
 */
import {
  recordDevotion,
  devotionStreak,
  devotionDateKey,
  parseDevotionLog,
  serializeDevotionLog,
  emptyDevotionLog,
  DEVOTION_RETENTION_DAYS,
  type DevotionLog,
} from '../src/features/study/devotionLog';

const at = (y: number, m: number, d: number) =>
  new Date(y, m - 1, d, 12, 0, 0).getTime();
const key = (y: number, m: number, d: number) => devotionDateKey(at(y, m, d));
const logOf = (...keys: string[]): DevotionLog => ({
  days: Object.fromEntries(keys.map(k => [k, 1])),
});

const TODAY = at(2026, 6, 14);

describe('devotionStreak (Sprint 84)', () => {
  it('is all-zero for an empty log', () => {
    const s = devotionStreak(emptyDevotionLog(), TODAY);
    expect(s).toEqual({current: 0, longest: 0, totalDays: 0, todayDone: false});
  });

  it('counts a run ending today as the current streak', () => {
    const log = logOf(key(2026, 6, 12), key(2026, 6, 13), key(2026, 6, 14));
    const s = devotionStreak(log, TODAY);
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
    expect(s.totalDays).toBe(3);
    expect(s.todayDone).toBe(true);
  });

  it('keeps the streak alive when it ends yesterday (today still open)', () => {
    const log = logOf(key(2026, 6, 12), key(2026, 6, 13));
    const s = devotionStreak(log, TODAY);
    expect(s.current).toBe(2);
    expect(s.todayDone).toBe(false);
  });

  it('drops the current streak to 0 once the run lapses', () => {
    const log = logOf(key(2026, 6, 10), key(2026, 6, 11));
    const s = devotionStreak(log, TODAY);
    expect(s.current).toBe(0);
    expect(s.longest).toBe(2);
    expect(s.totalDays).toBe(2);
  });

  it('reports longest independently of the (shorter) current run', () => {
    const log = logOf(
      key(2026, 6, 1),
      key(2026, 6, 2),
      key(2026, 6, 3),
      key(2026, 6, 4),
      key(2026, 6, 5),
      key(2026, 6, 13),
      key(2026, 6, 14),
    );
    const s = devotionStreak(log, TODAY);
    expect(s.current).toBe(2);
    expect(s.longest).toBe(5);
    expect(s.totalDays).toBe(7);
  });
});

describe('recordDevotion (Sprint 84)', () => {
  it('stamps today and counts it once toward the streak', () => {
    const log = recordDevotion(emptyDevotionLog(), TODAY);
    const s = devotionStreak(log, TODAY);
    expect(s.current).toBe(1);
    expect(s.todayDone).toBe(true);
    expect(s.totalDays).toBe(1);
  });

  it('recording twice in a day is one distinct day (count increments)', () => {
    const once = recordDevotion(emptyDevotionLog(), TODAY);
    const twice = recordDevotion(once, TODAY);
    expect(twice.days[key(2026, 6, 14)]).toBe(2);
    expect(devotionStreak(twice, TODAY).totalDays).toBe(1);
  });

  it('prunes days older than the retention window', () => {
    const ancient = new Date(TODAY);
    ancient.setDate(ancient.getDate() - DEVOTION_RETENTION_DAYS - 5);
    const oldKey = devotionDateKey(ancient.getTime());
    const log = recordDevotion(logOf(oldKey), TODAY);
    expect(log.days[oldKey]).toBeUndefined();
    expect(log.days[key(2026, 6, 14)]).toBe(1);
  });
});

describe('parseDevotionLog (Sprint 84)', () => {
  it('round-trips a valid log', () => {
    const log = logOf(key(2026, 6, 14));
    expect(parseDevotionLog(serializeDevotionLog(log))).toEqual(log);
  });

  it('rejects malformed blobs and bad entries', () => {
    expect(parseDevotionLog(null)).toEqual(emptyDevotionLog());
    expect(parseDevotionLog('not json')).toEqual(emptyDevotionLog());
    expect(parseDevotionLog('{"days":42}')).toEqual(emptyDevotionLog());
    // Bad keys / non-positive counts are dropped, good ones survive.
    const mixed = parseDevotionLog(
      '{"days":{"2026-06-14":2,"nope":1,"2026-06-13":0,"2026-06-12":-3}}',
    );
    expect(mixed.days).toEqual({'2026-06-14': 2});
  });
});
