/**
 * Sprint 85 — the pure constancy-rings derivation. Pins the summary math
 * (order, closed count, all-closed, any-activity, fraction clamping) and the
 * ring geometry (radii decreasing inward, circumference, dash-offset).
 */
import {
  HABIT_ORDER,
  HABIT_RING_COLORS,
  buildConstancySummary,
  clampFraction,
  ringRadius,
  ringCircumference,
  ringDashoffset,
  type HabitProgress,
} from '../src/lib/home/constancyRings';

const full = (over: Partial<HabitProgress> & {key: HabitProgress['key']}) => ({
  done: false,
  fraction: 0,
  streak: 0,
  ...over,
});

describe('clampFraction', () => {
  it('clamps out-of-range and non-finite values into [0,1]', () => {
    expect(clampFraction(-1)).toBe(0);
    expect(clampFraction(0)).toBe(0);
    expect(clampFraction(0.42)).toBeCloseTo(0.42);
    expect(clampFraction(1)).toBe(1);
    expect(clampFraction(5)).toBe(1);
    // Non-finite input is garbage → treated as "no progress" (0), like NaN.
    expect(clampFraction(NaN)).toBe(0);
    expect(clampFraction(Infinity)).toBe(0);
  });
});

describe('buildConstancySummary', () => {
  it('always returns the four habits in canonical order, even with gaps', () => {
    const summary = buildConstancySummary([full({key: 'mood', done: true})]);
    expect(summary.rings.map(r => r.key)).toEqual([...HABIT_ORDER]);
    expect(summary.total).toBe(4);
    // The missing habits degrade to open rings.
    expect(summary.rings.find(r => r.key === 'reading')!.fraction).toBe(0);
    expect(summary.rings.find(r => r.key === 'mood')!.done).toBe(true);
  });

  it('counts closed rings and flags all-closed only when every habit is done', () => {
    const partial = buildConstancySummary(
      HABIT_ORDER.map((key, i) => full({key, done: i < 2})),
    );
    expect(partial.closedCount).toBe(2);
    expect(partial.allClosed).toBe(false);

    const all = buildConstancySummary(
      HABIT_ORDER.map(key => full({key, done: true, fraction: 1})),
    );
    expect(all.closedCount).toBe(4);
    expect(all.allClosed).toBe(true);
  });

  it('reports anyActivity only when there is progress, a streak, or a done', () => {
    const empty = buildConstancySummary(HABIT_ORDER.map(key => full({key})));
    expect(empty.anyActivity).toBe(false);

    expect(
      buildConstancySummary([full({key: 'reading', streak: 3})]).anyActivity,
    ).toBe(true);
    expect(
      buildConstancySummary([full({key: 'memory', fraction: 0.5})]).anyActivity,
    ).toBe(true);
  });

  it('clamps each ring fraction into [0,1]', () => {
    const summary = buildConstancySummary([
      full({key: 'reading', fraction: 2}),
      full({key: 'memory', fraction: -1}),
    ]);
    expect(summary.rings.find(r => r.key === 'reading')!.fraction).toBe(1);
    expect(summary.rings.find(r => r.key === 'memory')!.fraction).toBe(0);
  });

  it('exposes a distinct color for every habit', () => {
    const colors = HABIT_ORDER.map(k => HABIT_RING_COLORS[k]);
    expect(new Set(colors).size).toBe(HABIT_ORDER.length);
  });
});

describe('ring geometry', () => {
  it('places the outermost ring (index 0) at the largest radius and shrinks inward', () => {
    const size = 150;
    const stroke = 12;
    const gap = 5;
    const radii = [0, 1, 2, 3].map(i => ringRadius(i, size, stroke, gap));
    expect(radii[0]).toBe((size - stroke) / 2);
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeLessThan(radii[i - 1]);
      expect(radii[i - 1] - radii[i]).toBeCloseTo(stroke + gap);
    }
    // Innermost ring still has a positive radius for the center hole.
    expect(radii[3]).toBeGreaterThan(0);
  });

  it('computes circumference as 2πr', () => {
    expect(ringCircumference(10)).toBeCloseTo(2 * Math.PI * 10);
  });

  it('maps fraction to a dash-offset (empty = full circumference, closed = 0)', () => {
    const c = ringCircumference(20);
    expect(ringDashoffset(c, 0)).toBeCloseTo(c);
    expect(ringDashoffset(c, 1)).toBeCloseTo(0);
    expect(ringDashoffset(c, 0.25)).toBeCloseTo(c * 0.75);
    // Clamps a bad fraction.
    expect(ringDashoffset(c, 5)).toBeCloseTo(0);
  });
});
