/**
 * Reading-plan auto-complete gating (batch 6 feedback fix).
 *
 * Ordinary Bible reading used to silently auto-start AND auto-complete any
 * plan whose chapters happened to already be read, with no "did the reader
 * ever open this plan" check — surprising behavior Victor flagged from a
 * real device screenshot (a plan showing 15/21 he never started). The fix:
 * `markChapterRead`'s auto-complete loop now only touches a plan that
 * already has a real `startedAt`. An unstarted plan's overlap instead
 * surfaces via `getSilentDayCount`, and `startPlanFromSilentProgress` lets
 * the reader accept the invitation without losing the progress already made.
 */
import React from 'react';
import {renderHook, act} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReadingPlanProgressProvider,
  useReadingPlanProgress,
} from '../src/context/ReadingPlanProgressContext';

// "Los 'Yo soy' de Jesús" (iam-7) — a small curated plan, day 1 is a single
// chapter (Juan 6), which keeps the fixture simple and stable.
const PLAN_ID = 'iam-7';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ReadingPlanProgressProvider>{children}</ReadingPlanProgressProvider>
);

describe('reading plan auto-complete gating', () => {
  it('does not auto-complete or auto-start an unstarted plan from ordinary reading', async () => {
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});

    await act(async () => {
      await result.current.markChapterRead('Juan', 6);
    });

    expect(result.current.isDayComplete(PLAN_ID, 1)).toBe(false);
    expect(result.current.getStartedAt(PLAN_ID)).toBeNull();
  });

  it('surfaces the overlap via getSilentDayCount instead', async () => {
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});

    await act(async () => {
      await result.current.markChapterRead('Juan', 6);
    });

    expect(result.current.getSilentDayCount(PLAN_ID)).toBe(1);
  });

  it('startPlanFromSilentProgress starts the plan and credits already-read days', async () => {
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});

    await act(async () => {
      await result.current.markChapterRead('Juan', 6);
    });
    await act(async () => {
      await result.current.startPlanFromSilentProgress(PLAN_ID);
    });

    expect(result.current.getStartedAt(PLAN_ID)).not.toBeNull();
    expect(result.current.isDayComplete(PLAN_ID, 1)).toBe(true);
    expect(result.current.getSilentDayCount(PLAN_ID)).toBe(0);
  });

  it('auto-completes normally once a plan has been explicitly started', async () => {
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});

    await act(async () => {
      await result.current.toggleDay(PLAN_ID, 1);
    });
    expect(result.current.getStartedAt(PLAN_ID)).not.toBeNull();
    await act(async () => {
      await result.current.toggleDay(PLAN_ID, 1);
    });
    expect(result.current.isDayComplete(PLAN_ID, 1)).toBe(false);

    await act(async () => {
      await result.current.markChapterRead('Juan', 8);
    });

    expect(result.current.isDayComplete(PLAN_ID, 2)).toBe(true);
  });
});

// R9-54 — un-ticking a day must hold. The scan in `markChapterRead` used to
// re-complete ANY day whose chapters were all read, on the next chapter read
// ANYWHERE (the reader calls it after 5 s on any chapter), with a toast.
describe('R9-54 — an un-ticked day stays un-ticked', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  async function startedWithDay1ReadThenUnticked() {
    const hook = renderHook(() => useReadingPlanProgress(), {wrapper});
    const {result} = hook;
    await act(async () => {
      await result.current.setPlanStart(PLAN_ID, new Date().toISOString());
    });
    let done: unknown;
    await act(async () => {
      done = await result.current.markChapterRead('Juan', 6);
    });
    expect(done).toEqual([{planId: PLAN_ID, day: 1}]);
    await act(async () => {
      await result.current.toggleDay(PLAN_ID, 1);
    });
    expect(result.current.isDayComplete(PLAN_ID, 1)).toBe(false);
    return hook;
  }

  it('reading an unrelated chapter does not re-complete it (no false toast)', async () => {
    const {result} = await startedWithDay1ReadThenUnticked();
    let done: unknown;
    await act(async () => {
      done = await result.current.markChapterRead('Génesis', 1);
    });
    expect(done).toEqual([]);
    expect(result.current.isDayComplete(PLAN_ID, 1)).toBe(false);
  });

  it('reading another day of the same plan completes only that day', async () => {
    const {result} = await startedWithDay1ReadThenUnticked();
    let done: unknown;
    await act(async () => {
      done = await result.current.markChapterRead('Juan', 8);
    });
    expect(done).toEqual([{planId: PLAN_ID, day: 2}]);
    expect(result.current.getCompletedDays(PLAN_ID)).toEqual([2]);
  });

  it('CONTROL: reading that day again completes it again', async () => {
    const {result} = await startedWithDay1ReadThenUnticked();
    let done: unknown;
    await act(async () => {
      done = await result.current.markChapterRead('Juan', 6);
    });
    expect(done).toEqual([{planId: PLAN_ID, day: 1}]);
  });

  it('CONTROL: the chapter stays read for its chip (history is not erased)', async () => {
    const {result} = await startedWithDay1ReadThenUnticked();
    expect(result.current.isChapterRead('Juan', 6)).toBe(true);
  });

  it('CONTROL: one chapter shared by two days completes both', async () => {
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await act(async () => {
      await result.current.setPlanStart(PLAN_ID, new Date().toISOString());
    });
    let done: unknown;
    await act(async () => {
      done = await result.current.markChapterRead('Juan', 10);
    });
    expect(done).toEqual([
      {planId: PLAN_ID, day: 3},
      {planId: PLAN_ID, day: 4},
    ]);
  });
  it('a day read BEFORE the plan was started is not completed by an unrelated read', async () => {
    // The behaviour this fix changes on purpose: joining a plan (together,
    // the plan builder) after reading one of its chapters used to tick that
    // day — with a toast — on the next chapter read anywhere. Now the reader
    // ticks it, or reads it again; its chip already shows the chapter read.
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await act(async () => {
      await result.current.markChapterRead('Juan', 8);
    });
    await act(async () => {
      await result.current.setPlanStart(PLAN_ID, new Date().toISOString());
    });
    let done: unknown;
    await act(async () => {
      done = await result.current.markChapterRead('Génesis', 1);
    });
    expect(done).toEqual([]);
    expect(result.current.isChapterRead('Juan', 8)).toBe(true);
    await act(async () => {
      done = await result.current.markChapterRead('Juan', 8);
    });
    expect(done).toEqual([{planId: PLAN_ID, day: 2}]);
  });
});

// R9-55 / R9-64 — editing a custom plan moves its progress to the new
// content-derived id. The day numbers past the new length do not exist any
// more (they showed «5/2 · 250%»), and a target that already had progress
// must not swallow the source's (it used to be dropped outright).
describe('R9-55 / R9-64 — migratePlanProgress', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  async function withProgress(seed: Record<string, unknown>) {
    await AsyncStorage.setItem('@reading_plan_progress', JSON.stringify(seed));
    const hook = renderHook(() => useReadingPlanProgress(), {wrapper});
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }
    return hook;
  }

  const START_A = '2026-11-01T00:00:00.000Z';
  const START_B = '2026-10-01T00:00:00.000Z';

  it('R9-55: a plan edited from 5 days to 2 keeps only days 1 and 2', async () => {
    const {result} = await withProgress({
      old: {completedDays: [1, 2, 3, 4, 5], startedAt: START_A},
    });
    await act(async () => {
      await result.current.migratePlanProgress('old', 'new', 2);
    });
    expect(result.current.getCompletedDays('new')).toEqual([1, 2]);
    expect(result.current.getStartedAt('new')).toBe(START_A);
    expect(result.current.getCompletedDays('old')).toEqual([]);
    const stored = JSON.parse(
      (await AsyncStorage.getItem('@reading_plan_progress')) as string,
    );
    expect(stored.new.completedDays).toEqual([1, 2]);
    expect(stored.old).toBeUndefined();
  });

  it('CONTROL: a plan edited to MORE days keeps every day it had', async () => {
    const {result} = await withProgress({
      old: {completedDays: [1, 3], startedAt: START_A},
    });
    await act(async () => {
      await result.current.migratePlanProgress('old', 'new', 6);
    });
    expect(result.current.getCompletedDays('new')).toEqual([1, 3]);
  });

  it('R9-64: a target with progress merges with the source instead of dropping it', async () => {
    const {result} = await withProgress({
      old: {completedDays: [1, 2], startedAt: START_A},
      new: {
        completedDays: [3],
        startedAt: START_B,
        completedAt: '2026-10-05T00:00:00.000Z',
      },
    });
    await act(async () => {
      await result.current.migratePlanProgress('old', 'new', 4);
    });
    expect(result.current.getCompletedDays('new')).toEqual([1, 2, 3]);
    // The plan being edited keeps its own start; a once-earned stamp stays,
    // even though it is older than that start (R9-622, decided below).
    expect(result.current.getStartedAt('new')).toBe(START_A);
    expect(result.current.getCompletedAt('new')).toBe(
      '2026-10-05T00:00:00.000Z',
    );
    const stored = JSON.parse(
      (await AsyncStorage.getItem('@reading_plan_progress')) as string,
    );
    expect(stored.old).toBeUndefined();
    expect(stored.new.completedDays).toEqual([1, 2, 3]);
  });

  it('R9-64: the merge is trimmed to the new length too', async () => {
    const {result} = await withProgress({
      old: {completedDays: [1, 2, 5], startedAt: START_A},
      new: {completedDays: [4], startedAt: START_B},
    });
    await act(async () => {
      await result.current.migratePlanProgress('old', 'new', 3);
    });
    expect(result.current.getCompletedDays('new')).toEqual([1, 2]);
  });

  it('CONTROL: a source with an empty start keeps the target start', async () => {
    const {result} = await withProgress({
      old: {completedDays: [], startedAt: ''},
      new: {completedDays: [2], startedAt: START_B},
    });
    await act(async () => {
      await result.current.migratePlanProgress('old', 'new', 3);
    });
    expect(result.current.getStartedAt('new')).toBe(START_B);
    expect(result.current.getCompletedDays('new')).toEqual([2]);
  });

  it('CONTROL: same id or no source progress is a no-op', async () => {
    const {result} = await withProgress({
      keep: {completedDays: [1, 2, 3], startedAt: START_A},
    });
    await act(async () => {
      await result.current.migratePlanProgress('keep', 'keep', 1);
      await result.current.migratePlanProgress('missing', 'keep', 1);
    });
    expect(result.current.getCompletedDays('keep')).toEqual([1, 2, 3]);
  });

  // R9-622 (decided in session 173): the merge keeps the OLDEST stamp even
  // when it predates the edited plan's start. A custom plan's id is the hash
  // of its name and days (customPlans.ts), so a target with that id is the
  // SAME plan, finished before; `completedAt` is the first time the plan was
  // ever finished (conserve-once-earned, planCompletion.ts), not a field of
  // the current run — restartPlan already leaves a stamp older than the new
  // start (the CONTROL below). Dropping it would erase a real «plan
  // completed» event from the timeline and the «you finished it» restart
  // text.
  it('R9-622: an edit onto a deleted, finished twin keeps its older stamp', async () => {
    const {result} = await withProgress({
      y: {completedDays: [1], startedAt: '2026-11-01T00:00:00.000Z'},
      x: {
        completedDays: [1, 2, 3],
        startedAt: '2026-09-01T00:00:00.000Z',
        completedAt: '2026-09-20T00:00:00.000Z',
      },
    });
    await act(async () => {
      await result.current.migratePlanProgress('y', 'x', 3);
    });
    expect(result.current.getCompletedDays('x')).toEqual([1, 2, 3]);
    expect(result.current.getStartedAt('x')).toBe('2026-11-01T00:00:00.000Z');
    expect(result.current.getCompletedAt('x')).toBe('2026-09-20T00:00:00.000Z');
  });

  it('CONTROL: restartPlan already leaves a stamp older than the new start', async () => {
    const {result} = await withProgress({
      'iam-7': {
        completedDays: [1, 2, 3, 4, 5, 6, 7],
        startedAt: '2026-09-01T00:00:00.000Z',
        completedAt: '2026-09-20T00:00:00.000Z',
      },
    });
    await act(async () => {
      await result.current.restartPlan('iam-7');
    });
    expect(result.current.getCompletedDays('iam-7')).toEqual([]);
    expect(result.current.getCompletedAt('iam-7')).toBe(
      '2026-09-20T00:00:00.000Z',
    );
    expect(
      (result.current.getStartedAt('iam-7') as string) >
        '2026-09-20T00:00:00.000Z',
    ).toBe(true);
  });
});
