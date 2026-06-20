/**
 * Sprint 108 — custom reading plans: bundle⇄plan conversion + registry.
 */

import {
  bundleFromCustomPlan,
  customPlanFromBundle,
  customPlanId,
  getRegisteredCustomPlanById,
  getRegisteredCustomPlans,
  setRegisteredCustomPlans,
} from '@/lib/reading/customPlans';
import {getReadingPlanById} from '@/constants/reading-plans';
import {makeCustomPlanBundle} from '@/lib/together';

// Genesis = book 1 (50 ch), Psalms = 19 (150 ch), John = 43 (21 ch).
const sample = makeCustomPlanBundle('Juan en 3 días', [
  [
    [43, 1],
    [43, 2],
  ],
  [[43, 3]],
  [
    [43, 4],
    [43, 5],
  ],
]);

describe('customPlanFromBundle', () => {
  it('resolves a bundle into a ReadingPlan with canonical book names', () => {
    const plan = customPlanFromBundle(sample);
    expect(plan).not.toBeNull();
    expect(plan!.custom).toBe(true);
    expect(plan!.i18nKey).toBeUndefined();
    expect(plan!.duration).toBe(3);
    expect(plan!.days[0].readings).toEqual([
      {book: 'Juan', chapter: 1},
      {book: 'Juan', chapter: 2},
    ]);
    expect(plan!.id).toBe(customPlanId(sample));
  });

  it('drops out-of-range chapters and unknown books, then renumbers days', () => {
    const plan = customPlanFromBundle(
      makeCustomPlanBundle('Mixto', [
        [
          [43, 22], // John has only 21 chapters -> dropped
          [43, 1], // kept
        ],
        [
          [99, 1], // no such book (cap is 66 in the codec, but guard anyway)
        ],
        [[1, 1]], // Genesis 1 -> kept, becomes day 2
      ]),
    );
    expect(plan).not.toBeNull();
    expect(plan!.duration).toBe(2);
    expect(plan!.days[0]).toEqual({
      day: 1,
      readings: [{book: 'Juan', chapter: 1}],
    });
    expect(plan!.days[1]).toEqual({
      day: 2,
      readings: [{book: 'Génesis', chapter: 1}],
    });
  });

  it('gives the same id for identical content and a different id on edit', () => {
    const same = makeCustomPlanBundle('Juan en 3 días', sample.d);
    expect(customPlanId(same)).toBe(customPlanId(sample));
    const edited = makeCustomPlanBundle('Juan en 3 días', [[[43, 9]]]);
    expect(customPlanId(edited)).not.toBe(customPlanId(sample));
  });
});

describe('bundleFromCustomPlan (round-trip)', () => {
  it('rebuilds an equivalent bundle from a resolved plan', () => {
    const plan = customPlanFromBundle(sample)!;
    expect(bundleFromCustomPlan(plan)).toEqual(sample);
  });
});

describe('registry', () => {
  afterEach(() => setRegisteredCustomPlans([]));

  it('exposes registered plans and resolves by id', () => {
    const plan = customPlanFromBundle(sample)!;
    setRegisteredCustomPlans([plan]);
    expect(getRegisteredCustomPlans()).toHaveLength(1);
    expect(getRegisteredCustomPlanById(plan.id)).toBe(plan);
    expect(getRegisteredCustomPlanById('nope')).toBeUndefined();
  });

  it('getReadingPlanById falls back to the registry for custom plans', () => {
    const plan = customPlanFromBundle(sample)!;
    expect(getReadingPlanById(plan.id)).toBeUndefined();
    setRegisteredCustomPlans([plan]);
    expect(getReadingPlanById(plan.id)).toBe(plan);
    // A curated id still resolves to the curated plan, not the registry.
    expect(getReadingPlanById('nt-30')?.id).toBe('nt-30');
  });
});
