/**
 * Sprint 93 — the prayer-habit model. The streak reuses the canonical
 * reading-streak engine (computeStreaks), mirroring the devotion log: current
 * is a run ending today OR yesterday; longest can exceed current; distinct
 * days are tallied. Also pins record/prune + defensive parsing.
 */
import {
  recordPrayer,
  prayerStreak,
  prayerDateKey,
  parsePrayerLog,
  serializePrayerLog,
  emptyPrayerLog,
  PRAYER_RETENTION_DAYS,
  type PrayerLog,
} from '../src/features/prayer/prayerLog';

const at = (y: number, m: number, d: number) =>
  new Date(y, m - 1, d, 12, 0, 0).getTime();
const key = (y: number, m: number, d: number) => prayerDateKey(at(y, m, d));
const logOf = (...keys: string[]): PrayerLog => ({
  days: Object.fromEntries(keys.map(k => [k, 1])),
});

const TODAY = at(2026, 6, 15);

describe('prayerStreak (Sprint 93)', () => {
  it('is all-zero for an empty log', () => {
    expect(prayerStreak(emptyPrayerLog(), TODAY)).toEqual({
      current: 0,
      longest: 0,
      totalDays: 0,
      todayDone: false,
    });
  });

  it('counts a run ending today and flags todayDone', () => {
    const log = logOf(key(2026, 6, 13), key(2026, 6, 14), key(2026, 6, 15));
    const s = prayerStreak(log, TODAY);
    expect(s.current).toBe(3);
    expect(s.todayDone).toBe(true);
    expect(s.totalDays).toBe(3);
  });

  it('keeps a run ending yesterday alive while today is still open', () => {
    const log = logOf(key(2026, 6, 13), key(2026, 6, 14));
    const s = prayerStreak(log, TODAY);
    expect(s.current).toBe(2);
    expect(s.todayDone).toBe(false);
  });

  it('longest can exceed current', () => {
    const log = logOf(
      key(2026, 5, 1),
      key(2026, 5, 2),
      key(2026, 5, 3),
      key(2026, 5, 4), // 4-day run last month
      key(2026, 6, 15), // lone today
    );
    const s = prayerStreak(log, TODAY);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(4);
  });
});

describe('recordPrayer', () => {
  it('stamps today and is distinct-day safe across two calls', () => {
    const once = recordPrayer(emptyPrayerLog(), TODAY);
    const twice = recordPrayer(once, TODAY);
    expect(twice.days[key(2026, 6, 15)]).toBe(2);
    expect(prayerStreak(twice, TODAY).totalDays).toBe(1);
  });

  it('prunes days older than the retention window', () => {
    const old = at(2026, 6, 15 - PRAYER_RETENTION_DAYS - 5); // out of window
    const log = logOf(prayerDateKey(old));
    const next = recordPrayer(log, TODAY);
    expect(Object.keys(next.days)).toEqual([key(2026, 6, 15)]);
  });
});

describe('parse/serialize defensively', () => {
  it('round-trips a valid log', () => {
    const log = logOf(key(2026, 6, 14));
    expect(parsePrayerLog(serializePrayerLog(log))).toEqual(log);
  });

  it('rejects malformed blobs and bad entries', () => {
    expect(parsePrayerLog(null)).toEqual(emptyPrayerLog());
    expect(parsePrayerLog('not json')).toEqual(emptyPrayerLog());
    expect(parsePrayerLog('{"days":42}')).toEqual(emptyPrayerLog());
    expect(
      parsePrayerLog(JSON.stringify({days: {bad: 1, '2026-06-15': 0}})),
    ).toEqual(emptyPrayerLog());
  });
});
