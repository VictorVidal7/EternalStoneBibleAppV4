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
