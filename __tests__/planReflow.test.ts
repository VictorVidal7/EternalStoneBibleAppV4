/**
 * Plan reflow — user-selectable duration for curated reading plans.
 */
import {
  isReflowable,
  maxReflowDays,
  reflowPlanDays,
  effectivePlanDays,
} from '@/lib/reading/planReflow';
import {READING_PLANS, getReadingPlanById} from '@/constants/reading-plans';
import type {ReadingPlan, ReadingPlanDay} from '@/constants/reading-plans';

const nt30 = getReadingPlanById('nt-30') as ReadingPlan;
const iam7 = getReadingPlanById('iam-7') as ReadingPlan;

describe('isReflowable', () => {
  it('is true for a whole-chapter plan (nt-30)', () => {
    expect(isReflowable(nt30)).toBe(true);
  });

  it('is false for a plan with partial-verse readings (iam-7)', () => {
    expect(isReflowable(iam7)).toBe(false);
  });

  it('classifies every curated plan without throwing', () => {
    for (const plan of READING_PLANS) {
      expect(typeof isReflowable(plan)).toBe('boolean');
    }
  });
});

describe('maxReflowDays', () => {
  it('equals the total chapter count across all days', () => {
    const total = nt30.days.reduce((sum, d) => sum + d.readings.length, 0);
    expect(maxReflowDays(nt30)).toBe(total);
    expect(total).toBe(260); // Mateo..Apocalipsis
  });
});

describe('reflowPlanDays', () => {
  it('preserves every chapter, in order, across a different day count', () => {
    const before = nt30.days.flatMap(d =>
      d.readings.map(r => `${r.book} ${r.chapter}`),
    );
    const reflowed = reflowPlanDays(nt30.days, 60);
    const after = reflowed.flatMap((d: ReadingPlanDay) =>
      d.readings.map(r => `${r.book} ${r.chapter}`),
    );
    expect(after).toEqual(before);
    expect(reflowed).toHaveLength(60);
  });

  it('day numbers are 1..N contiguous', () => {
    const reflowed = reflowPlanDays(nt30.days, 45);
    expect(reflowed.map(d => d.day)).toEqual(
      Array.from({length: 45}, (_, i) => i + 1),
    );
  });

  it('never produces an empty day', () => {
    for (const totalDays of [1, 10, 30, 90, 260]) {
      const reflowed = reflowPlanDays(nt30.days, totalDays);
      expect(reflowed.every(d => d.readings.length > 0)).toBe(true);
    }
  });

  it('clamps a duration above the chapter count to one day per chapter', () => {
    const reflowed = reflowPlanDays(nt30.days, 9999);
    expect(reflowed).toHaveLength(260);
  });
});

describe('effectivePlanDays', () => {
  it('returns the curated days unchanged with no custom duration', () => {
    expect(effectivePlanDays(nt30, null)).toBe(nt30.days);
    expect(effectivePlanDays(nt30, undefined)).toBe(nt30.days);
  });

  it('returns the curated days unchanged when the duration matches the default', () => {
    expect(effectivePlanDays(nt30, 30)).toBe(nt30.days);
  });

  it('reflows when a different duration is given for a reflowable plan', () => {
    const days = effectivePlanDays(nt30, 60);
    expect(days).toHaveLength(60);
    expect(days).not.toBe(nt30.days);
  });

  it('ignores a custom duration for a non-reflowable plan (iam-7)', () => {
    expect(effectivePlanDays(iam7, 14)).toBe(iam7.days);
  });
});
