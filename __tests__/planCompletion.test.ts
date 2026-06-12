/**
 * Sprint 81 — planCompletion: the pure conserve-once-earned completion stamp
 * behind @reading_plan_progress.completedAt.
 */

import {
  withCompletionStamp,
  type CompletablePlanProgress,
} from '../src/lib/reading/planCompletion';

const NOW = '2026-06-12T18:00:00.000Z';
const LATER = '2026-07-01T09:00:00.000Z';

const make = (
  over: Partial<CompletablePlanProgress>,
): CompletablePlanProgress => ({
  completedDays: [],
  startedAt: '2026-06-01',
  ...over,
});

describe('withCompletionStamp', () => {
  it('stamps the entry the moment completedDays covers the whole plan', () => {
    const entry = make({completedDays: [1, 2, 3]});
    expect(withCompletionStamp(entry, 3, NOW).completedAt).toBe(NOW);
  });

  it('does not stamp while days are missing', () => {
    const entry = make({completedDays: [1, 3]});
    expect(withCompletionStamp(entry, 3, NOW).completedAt).toBeUndefined();
  });

  it('conserves the FIRST stamp: re-completing never moves it', () => {
    const completed = make({completedDays: [1, 2, 3], completedAt: NOW});
    expect(withCompletionStamp(completed, 3, LATER).completedAt).toBe(NOW);
  });

  it('un-toggling a day keeps the stamp on the entry it returns unchanged', () => {
    // The context passes the post-toggle entry through; an earned stamp on a
    // now-incomplete plan must survive (historical milestone).
    const unToggled = make({completedDays: [1, 2], completedAt: NOW});
    const result = withCompletionStamp(unToggled, 3, LATER);
    expect(result.completedAt).toBe(NOW);
    expect(result).toBe(unToggled); // untouched, not re-created
  });

  it('counts DISTINCT days (defensive against duplicates)', () => {
    const entry = make({completedDays: [1, 1, 2]});
    expect(withCompletionStamp(entry, 3, NOW).completedAt).toBeUndefined();
  });

  it('never stamps a malformed duration', () => {
    const entry = make({completedDays: [1, 2, 3]});
    expect(withCompletionStamp(entry, 0, NOW).completedAt).toBeUndefined();
    expect(withCompletionStamp(entry, NaN, NOW).completedAt).toBeUndefined();
  });

  it('returns the same reference when nothing changes', () => {
    const entry = make({completedDays: [1]});
    expect(withCompletionStamp(entry, 3, NOW)).toBe(entry);
  });
});
