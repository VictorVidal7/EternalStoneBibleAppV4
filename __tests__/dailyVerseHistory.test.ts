/**
 * Sprint 78 — dailyVerseHistory: the daily verse "time machine" policy.
 *
 * The daily verse is deterministic from the calendar day, so previous days
 * recompute purely. These tests pin the offset clamp, the local-calendar
 * day shifting (incl. month boundaries), the caption policy, and the
 * navigation bounds — plus the determinism contract with getDailyVerseRef.
 */

import {
  DAILY_HISTORY_MAX_BACK,
  shiftDaysBack,
  clampDayOffset,
  dayCaptionKind,
  canGoBack,
  canGoForward,
} from '../src/lib/home/dailyVerseHistory';
import {getDailyVerseRef} from '../src/constants/daily-verses';

describe('shiftDaysBack', () => {
  it('moves whole local calendar days', () => {
    const d = shiftDaysBack(new Date(2026, 5, 10, 23, 30), 1);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 5, 9]);
  });

  it('crosses month boundaries', () => {
    const d = shiftDaysBack(new Date(2026, 5, 2), 4);
    expect([d.getMonth(), d.getDate()]).toEqual([4, 29]); // May 29
  });

  it('does not mutate the input date', () => {
    const input = new Date(2026, 5, 10);
    shiftDaysBack(input, 3);
    expect(input.getDate()).toBe(10);
  });
});

describe('clampDayOffset', () => {
  it('passes offsets inside the window through', () => {
    expect(clampDayOffset(0)).toBe(0);
    expect(clampDayOffset(3)).toBe(3);
    expect(clampDayOffset(DAILY_HISTORY_MAX_BACK)).toBe(DAILY_HISTORY_MAX_BACK);
  });

  it('clamps below zero, beyond the window, and non-finite junk', () => {
    expect(clampDayOffset(-2)).toBe(0);
    expect(clampDayOffset(99)).toBe(DAILY_HISTORY_MAX_BACK);
    expect(clampDayOffset(Number.NaN)).toBe(0);
    expect(clampDayOffset(2.9)).toBe(2);
  });
});

describe('caption + navigation policy', () => {
  it('captions today / yesterday / a date', () => {
    expect(dayCaptionKind(0)).toBe('today');
    expect(dayCaptionKind(1)).toBe('yesterday');
    expect(dayCaptionKind(2)).toBe('date');
    expect(dayCaptionKind(DAILY_HISTORY_MAX_BACK)).toBe('date');
  });

  it('bounds the chevrons at both ends', () => {
    expect(canGoBack(0)).toBe(true);
    expect(canGoBack(DAILY_HISTORY_MAX_BACK)).toBe(false);
    expect(canGoForward(0)).toBe(false);
    expect(canGoForward(1)).toBe(true);
  });
});

describe('determinism contract with getDailyVerseRef', () => {
  it('the same past day always yields the same verse ref', () => {
    const day = shiftDaysBack(new Date(2026, 5, 10), 3);
    const a = getDailyVerseRef(day);
    const b = getDailyVerseRef(new Date(2026, 5, 7, 18, 45));
    expect(a).toEqual(b);
  });

  it('adjacent days yield different refs (the list rotates daily)', () => {
    const today = getDailyVerseRef(new Date(2026, 5, 10));
    const yesterday = getDailyVerseRef(shiftDaysBack(new Date(2026, 5, 10), 1));
    expect(today).not.toEqual(yesterday);
  });
});
