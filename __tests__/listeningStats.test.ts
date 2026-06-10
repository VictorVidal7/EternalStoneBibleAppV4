/**
 * listeningStats — pure listening-time model (Sprint 75). Locks the local
 * date keying, defensive parsing, bucket accumulation + retention pruning,
 * and the today/week/total summary.
 */

import {
  listeningDateKey,
  parseListeningStats,
  serializeListeningStats,
  recordListening,
  summarizeListening,
  EMPTY_LISTENING_STATS,
  LISTENING_RETENTION_DAYS,
  type ListeningStats,
} from '../src/features/audio/lib/listeningStats';

// Noon LOCAL time avoids any UTC-vs-local day skew in derived keys.
const NOON = new Date(2026, 5, 9, 12, 0, 0).getTime(); // 2026-06-09 local
const DAY = 24 * 60 * 60 * 1000;

describe('listeningDateKey', () => {
  it('keys the LOCAL calendar day, zero-padded', () => {
    expect(listeningDateKey(NOON)).toBe('2026-06-09');
    expect(listeningDateKey(new Date(2026, 0, 3, 8).getTime())).toBe(
      '2026-01-03',
    );
  });
});

describe('parseListeningStats', () => {
  it('round-trips through serialize', () => {
    const stats = recordListening(
      EMPTY_LISTENING_STATS,
      '2026-06-09',
      60_000,
      12,
    );
    expect(parseListeningStats(serializeListeningStats(stats))).toEqual(stats);
  });

  it('degrades malformed blobs to empty stats', () => {
    expect(parseListeningStats(null)).toEqual(EMPTY_LISTENING_STATS);
    expect(parseListeningStats('')).toEqual(EMPTY_LISTENING_STATS);
    expect(parseListeningStats('not json')).toEqual(EMPTY_LISTENING_STATS);
    expect(parseListeningStats('{"nope":1}')).toEqual(EMPTY_LISTENING_STATS);
  });

  it('drops ill-typed buckets and bad keys, keeping valid ones', () => {
    const raw = JSON.stringify({
      days: {
        '2026-06-09': {ms: 1000, verses: 2},
        'not-a-date': {ms: 1000, verses: 2},
        '2026-06-08': {ms: -5, verses: 2},
        '2026-06-07': {ms: 'x', verses: 2},
        '2026-06-06': null,
      },
    });
    expect(parseListeningStats(raw)).toEqual({
      days: {'2026-06-09': {ms: 1000, verses: 2}},
    });
  });
});

describe('recordListening', () => {
  it('accumulates into an existing day bucket', () => {
    let stats = recordListening(EMPTY_LISTENING_STATS, '2026-06-09', 1000, 1);
    stats = recordListening(stats, '2026-06-09', 500, 2);
    expect(stats.days['2026-06-09']).toEqual({ms: 1500, verses: 3});
  });

  it('clamps negative/invalid deltas and ignores pure no-ops', () => {
    const base = recordListening(EMPTY_LISTENING_STATS, '2026-06-09', 1000, 1);
    expect(recordListening(base, '2026-06-09', -50, Number.NaN)).toBe(base);
    expect(recordListening(base, 'bad-key', 1000, 1)).toBe(base);
  });

  it('prunes the oldest buckets past the retention window', () => {
    let stats: ListeningStats = EMPTY_LISTENING_STATS;
    for (let i = 0; i < LISTENING_RETENTION_DAYS + 5; i++) {
      stats = recordListening(stats, listeningDateKey(NOON + i * DAY), 100, 1);
    }
    const keys = Object.keys(stats.days);
    expect(keys).toHaveLength(LISTENING_RETENTION_DAYS);
    // The 5 oldest days fell off; the newest survives.
    expect(stats.days[listeningDateKey(NOON)]).toBeUndefined();
    expect(
      stats.days[listeningDateKey(NOON + (LISTENING_RETENTION_DAYS + 4) * DAY)],
    ).toBeDefined();
  });
});

describe('summarizeListening', () => {
  it('aggregates today, the rolling 7-day window and lifetime totals', () => {
    let stats: ListeningStats = EMPTY_LISTENING_STATS;
    stats = recordListening(stats, listeningDateKey(NOON), 10_000, 5); // today
    stats = recordListening(stats, listeningDateKey(NOON - 3 * DAY), 20_000, 8);
    stats = recordListening(stats, listeningDateKey(NOON - 6 * DAY), 5_000, 2);
    stats = recordListening(stats, listeningDateKey(NOON - 9 * DAY), 40_000, 9);

    expect(summarizeListening(stats, NOON)).toEqual({
      todayMs: 10_000,
      weekMs: 35_000, // today + the 6 prior days (the -9d bucket is outside)
      totalMs: 75_000,
      totalVerses: 24,
      daysListened: 4,
    });
  });

  it('returns zeros for empty stats', () => {
    expect(summarizeListening(EMPTY_LISTENING_STATS, NOON)).toEqual({
      todayMs: 0,
      weekMs: 0,
      totalMs: 0,
      totalVerses: 0,
      daysListened: 0,
    });
  });
});
