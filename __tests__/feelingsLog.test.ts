import {
  FEELINGS_RETENTION_DAYS,
  emptyFeelingsLog,
  feelingsDateKey,
  hasAnyMood,
  parseFeelingsLog,
  recordFeeling,
  serializeFeelingsLog,
  weekMood,
  moodForDateKeys,
  monthMood,
  MOOD_MONTH_DAYS,
} from '../src/features/study/feelingsLog';
import {getAllFeelings} from '../src/features/study/feelings';

/** Local noon — far from midnight so day math can't straddle a boundary. */
function at(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day, 12, 0, 0).getTime();
}

describe('feelingsLog (Sprint 80 — emotional check-in history)', () => {
  describe('recordFeeling', () => {
    it('records under the local day key, last write wins', () => {
      const now = at(2026, 6, 12);
      let log = recordFeeling(emptyFeelingsLog(), 'anxious', now);
      log = recordFeeling(log, 'grateful', now);
      expect(log.days[feelingsDateKey(now)]).toBe('grateful');
      expect(Object.keys(log.days)).toHaveLength(1);
    });

    it('keeps distinct days separate', () => {
      let log = recordFeeling(emptyFeelingsLog(), 'sad', at(2026, 6, 10));
      log = recordFeeling(log, 'hopeful', at(2026, 6, 11));
      expect(log.days['2026-06-10']).toBe('sad');
      expect(log.days['2026-06-11']).toBe('hopeful');
    });

    it('prunes entries older than the retention window', () => {
      const old = at(2026, 1, 1);
      const now = at(2026, 6, 12);
      let log = recordFeeling(emptyFeelingsLog(), 'tired', old);
      log = recordFeeling(log, 'joyful', now);
      expect(log.days['2026-01-01']).toBeUndefined();
      expect(log.days['2026-06-12']).toBe('joyful');
    });

    it('keeps an entry exactly at the edge of the window', () => {
      const now = at(2026, 6, 12);
      const edge = new Date(now);
      edge.setDate(edge.getDate() - (FEELINGS_RETENTION_DAYS - 1));
      let log = recordFeeling(emptyFeelingsLog(), 'afraid', edge.getTime());
      log = recordFeeling(log, 'joyful', now);
      expect(log.days[feelingsDateKey(edge.getTime())]).toBe('afraid');
    });

    it('does not mutate its input', () => {
      const log = emptyFeelingsLog();
      recordFeeling(log, 'anxious', at(2026, 6, 12));
      expect(log.days).toEqual({});
    });
  });

  describe('parse / serialize', () => {
    it('round-trips', () => {
      const log = recordFeeling(emptyFeelingsLog(), 'lonely', at(2026, 6, 12));
      expect(parseFeelingsLog(serializeFeelingsLog(log))).toEqual(log);
    });

    it('survives corrupt blobs and junk shapes', () => {
      expect(parseFeelingsLog(null)).toEqual(emptyFeelingsLog());
      expect(parseFeelingsLog('not json {')).toEqual(emptyFeelingsLog());
      expect(parseFeelingsLog('42')).toEqual(emptyFeelingsLog());
      expect(parseFeelingsLog('{"days": 7}')).toEqual(emptyFeelingsLog());
      expect(
        parseFeelingsLog('{"days": {"2026-06-12": 3, "bad-key": "x"}}'),
      ).toEqual(emptyFeelingsLog());
    });
  });

  describe('weekMood', () => {
    it('walks the last 7 local days oldest → today', () => {
      const now = at(2026, 6, 12);
      const log = recordFeeling(emptyFeelingsLog(), 'grateful', now);
      const days = weekMood(log, now);
      expect(days).toHaveLength(7);
      expect(days[0].dateKey).toBe('2026-06-06');
      expect(days[6]).toMatchObject({
        dateKey: '2026-06-12',
        feelingId: 'grateful',
        isToday: true,
      });
      expect(days.slice(0, 6).every(d => d.feelingId === null)).toBe(true);
    });

    it('carries the local weekday for initials', () => {
      // 2026-06-12 is a Friday (5).
      const days = weekMood(emptyFeelingsLog(), at(2026, 6, 12));
      expect(days[6].weekday).toBe(5);
      expect(days[0].weekday).toBe(6); // the Saturday before
    });

    it('hasAnyMood gates an empty window honestly', () => {
      const now = at(2026, 6, 12);
      expect(hasAnyMood(weekMood(emptyFeelingsLog(), now))).toBe(false);
      const log = recordFeeling(emptyFeelingsLog(), 'sad', at(2026, 6, 9));
      expect(hasAnyMood(weekMood(log, now))).toBe(true);
    });

    it('a check-in older than the window does not light the mood line', () => {
      const now = at(2026, 6, 12);
      const log = recordFeeling(emptyFeelingsLog(), 'sad', at(2026, 6, 1));
      expect(hasAnyMood(weekMood(log, now))).toBe(false);
    });
  });

  it('every catalogued feeling id is storable and recoverable', () => {
    const now = at(2026, 6, 12);
    for (const feeling of getAllFeelings()) {
      const log = recordFeeling(emptyFeelingsLog(), feeling.id, now);
      const reparsed = parseFeelingsLog(serializeFeelingsLog(log));
      expect(reparsed.days[feelingsDateKey(now)]).toBe(feeling.id);
    }
  });
});

describe('moodForDateKeys (Sprint 81 — heatmap mood strip)', () => {
  it('returns the LAST recorded feeling among the keys (last-wins week)', () => {
    const log = {
      days: {
        '2026-06-08': 'anxious',
        '2026-06-10': 'grateful',
        '2026-06-09': 'tired',
      },
    };
    expect(
      moodForDateKeys(log, [
        '2026-06-07',
        '2026-06-08',
        '2026-06-09',
        '2026-06-10',
        '2026-06-11',
      ]),
    ).toBe('grateful');
  });

  it('returns null when none of the keys has a check-in', () => {
    const log = {days: {'2026-06-01': 'joyful'}};
    expect(moodForDateKeys(log, ['2026-06-10', '2026-06-11'])).toBeNull();
  });

  it('handles an empty key window', () => {
    expect(moodForDateKeys({days: {}}, [])).toBeNull();
  });

  it('ignores days outside the requested keys', () => {
    const log = {days: {'2026-06-12': 'sad', '2026-06-05': 'hopeful'}};
    expect(moodForDateKeys(log, ['2026-06-04', '2026-06-05'])).toBe('hopeful');
  });
});

describe('monthMood (Sprint 82 — Tu mes emocional)', () => {
  const now = at(2026, 6, 30); // "today"

  it('is empty for an empty log', () => {
    const s = monthMood(emptyFeelingsLog(), now);
    expect(s.daysLogged).toBe(0);
    expect(s.counts).toEqual([]);
    expect(s.dominant).toBeNull();
    expect(s.windowDays).toBe(MOOD_MONTH_DAYS);
  });

  it('tallies the window richest-first and names the dominant feeling', () => {
    const log = {
      days: {
        '2026-06-28': 'grateful',
        '2026-06-27': 'grateful',
        '2026-06-26': 'grateful',
        '2026-06-25': 'anxious',
        '2026-06-24': 'tired',
      },
    };
    const s = monthMood(log, now);
    expect(s.daysLogged).toBe(5);
    expect(s.dominant).toBe('grateful');
    expect(s.counts[0]).toEqual({feelingId: 'grateful', count: 3});
    expect(s.counts.map(c => c.count)).toEqual([3, 1, 1]);
  });

  it('breaks count ties toward the more recently felt', () => {
    const log = {days: {'2026-06-10': 'anxious', '2026-06-20': 'hopeful'}};
    const s = monthMood(log, now);
    expect(s.dominant).toBe('hopeful');
    expect(s.counts[0].feelingId).toBe('hopeful');
  });

  it('ignores days older than the window', () => {
    const log = {days: {'2026-06-29': 'joyful', '2026-05-01': 'sad'}};
    const s = monthMood(log, now);
    expect(s.daysLogged).toBe(1);
    expect(s.dominant).toBe('joyful');
  });

  it('honors a custom window length', () => {
    const log = {days: {'2026-06-29': 'joyful', '2026-06-20': 'sad'}};
    expect(monthMood(log, now, 7).daysLogged).toBe(1);
    expect(monthMood(log, now, 14).daysLogged).toBe(2);
  });
});
