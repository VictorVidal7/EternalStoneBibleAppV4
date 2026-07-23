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
