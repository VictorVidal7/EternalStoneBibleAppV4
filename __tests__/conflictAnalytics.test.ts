/**
 * Sprint 49 — conflict-analytics pure-module tests.
 *
 * Covers the aggregation contract the dashboard depends on:
 *  - empty input → zeroed/stable shape (3 choice slices, weekly length)
 *  - choice counts + fractions
 *  - dominant-choice verdict gating (MIN_VERDICT_SAMPLE + tie → null)
 *  - per-collection / per-field tallies + sort order
 *  - weekly bucketing relative to `now` (oldest-first, beyond-horizon drop)
 *  - defensive skipping of malformed records
 *
 * Pure module — no Firestore / React, deterministic with an injected `now`.
 */

import {
  computeConflictAnalytics,
  MIN_VERDICT_SAMPLE,
  ACTIVITY_WEEKS,
} from '../src/lib/sync/conflictAnalytics';
import type {ResolvedConflictRecord} from '../src/lib/sync/types';

const DAY = 24 * 60 * 60 * 1000;
// Fixed local noon so startOfLocalDay() bucketing is deterministic per-TZ.
const NOW = new Date(2026, 4, 29, 12, 0, 0);
const daysAgo = (n: number): number => NOW.getTime() - n * DAY;

function rec(over: Partial<ResolvedConflictRecord>): ResolvedConflictRecord {
  return {
    id: 'favorites__d',
    collection: 'favorites',
    docId: 'd',
    localVersion: {updatedAt: 1},
    remoteVersion: {updatedAt: 1},
    resolvedValue: {updatedAt: 1},
    differingFields: ['note'],
    detectedAt: 1,
    resolvedAt: daysAgo(0),
    choice: 'keepMine',
    ...over,
  } as ResolvedConflictRecord;
}

describe('computeConflictAnalytics — empty', () => {
  it('returns a stable zeroed shape', () => {
    const a = computeConflictAnalytics([], NOW);
    expect(a.total).toBe(0);
    expect(a.byChoice.map(c => c.choice)).toEqual([
      'keepMine',
      'keepTheirs',
      'merge',
    ]);
    expect(a.byChoice.every(c => c.count === 0 && c.fraction === 0)).toBe(true);
    expect(a.byCollection).toEqual([]);
    expect(a.byField).toEqual([]);
    expect(a.weekly).toHaveLength(ACTIVITY_WEEKS);
    expect(a.weekly.every(w => w.count === 0)).toBe(true);
    expect(a.dominantChoice).toBeNull();
    expect(a.lastResolvedAt).toBeNull();
  });
});

describe('computeConflictAnalytics — choices', () => {
  it('counts choices and computes fractions', () => {
    const a = computeConflictAnalytics(
      [
        rec({choice: 'keepTheirs'}),
        rec({choice: 'keepTheirs'}),
        rec({choice: 'keepTheirs'}),
        rec({choice: 'keepMine'}),
      ],
      NOW,
    );
    expect(a.total).toBe(4);
    const theirs = a.byChoice.find(c => c.choice === 'keepTheirs')!;
    expect(theirs.count).toBe(3);
    expect(theirs.fraction).toBeCloseTo(0.75);
    expect(a.dominantChoice).toBe('keepTheirs');
  });

  it('does not claim a tendency below MIN_VERDICT_SAMPLE', () => {
    const recs = Array.from({length: MIN_VERDICT_SAMPLE - 1}, () =>
      rec({choice: 'merge'}),
    );
    const a = computeConflictAnalytics(recs, NOW);
    expect(a.total).toBe(MIN_VERDICT_SAMPLE - 1);
    expect(a.dominantChoice).toBeNull();
  });

  it('returns null on a top tie even with enough samples', () => {
    const a = computeConflictAnalytics(
      [
        rec({choice: 'keepMine'}),
        rec({choice: 'keepMine'}),
        rec({choice: 'keepTheirs'}),
        rec({choice: 'keepTheirs'}),
      ],
      NOW,
    );
    expect(a.total).toBe(4);
    expect(a.dominantChoice).toBeNull();
  });
});

describe('computeConflictAnalytics — collection + field tallies', () => {
  it('tallies and sorts collections by count desc, then name', () => {
    const a = computeConflictAnalytics(
      [
        rec({collection: 'notes'}),
        rec({collection: 'favorites'}),
        rec({collection: 'favorites'}),
        rec({collection: 'bookmarks'}),
      ],
      NOW,
    );
    expect(a.byCollection).toEqual([
      {collection: 'favorites', count: 2},
      {collection: 'bookmarks', count: 1},
      {collection: 'notes', count: 1},
    ]);
  });

  it('flattens differingFields into per-field tallies', () => {
    const a = computeConflictAnalytics(
      [
        rec({differingFields: ['note', 'rating']}),
        rec({differingFields: ['note']}),
        rec({differingFields: ['color']}),
      ],
      NOW,
    );
    expect(a.byField).toEqual([
      {field: 'note', count: 2},
      {field: 'color', count: 1},
      {field: 'rating', count: 1},
    ]);
  });
});

describe('computeConflictAnalytics — weekly activity', () => {
  it('buckets by week relative to now, oldest first, dropping beyond horizon', () => {
    const a = computeConflictAnalytics(
      [
        rec({resolvedAt: daysAgo(0)}), // week 0
        rec({resolvedAt: daysAgo(3)}), // week 0
        rec({resolvedAt: daysAgo(10)}), // week 1
        rec({resolvedAt: daysAgo(20)}), // week 2
        rec({resolvedAt: daysAgo(100)}), // beyond 8 weeks — not charted
      ],
      NOW,
      ACTIVITY_WEEKS,
    );
    expect(a.total).toBe(5);
    // Oldest-first: index 0 = (weeks-1) weeks ago, last index = current week.
    expect(a.weekly[ACTIVITY_WEEKS - 1]).toEqual({weeksAgo: 0, count: 2});
    expect(a.weekly[ACTIVITY_WEEKS - 2]).toEqual({weeksAgo: 1, count: 1});
    expect(a.weekly[ACTIVITY_WEEKS - 3]).toEqual({weeksAgo: 2, count: 1});
    // The 100-days-ago record is counted in the total but not in any bucket.
    const charted = a.weekly.reduce((s, w) => s + w.count, 0);
    expect(charted).toBe(4);
    expect(a.lastResolvedAt).toBe(daysAgo(0));
  });
});

describe('computeConflictAnalytics — defensive', () => {
  it('skips records with an invalid choice and malformed fields', () => {
    const a = computeConflictAnalytics(
      [
        rec({choice: 'keepMine'}),
        rec({choice: 'bogus' as ResolvedConflictRecord['choice']}),
        rec({
          choice: 'merge',
          differingFields: undefined as unknown as string[],
          resolvedAt: NaN,
        }),
      ],
      NOW,
    );
    // Two valid choices counted (keepMine + merge); 'bogus' dropped entirely.
    expect(a.total).toBe(2);
    // The merge record had no differingFields → only 'note' (from keepMine).
    expect(a.byField).toEqual([{field: 'note', count: 1}]);
    // NaN resolvedAt excluded from weekly + lastResolvedAt.
    const charted = a.weekly.reduce((s, w) => s + w.count, 0);
    expect(charted).toBe(1);
  });
});
