/**
 * 🔀 Plan reflow — let the reader choose a curated plan's duration.
 *
 * Every curated plan (`src/constants/reading-plans.ts`) ships with a fixed
 * default pace ("Nuevo Testamento en 30 Días"). This lets the reader pick a
 * DIFFERENT total-day count and re-spreads the SAME chapters across it —
 * reusing the exact even proportional split already proven by the custom-plan
 * editor's `distributeChapters` (`mode: 'totalDays'`).
 *
 * Only plans whose readings are WHOLE chapters are reflowable: a plan that
 * curates a partial-verse range within a chapter (`readings[].verses`, e.g.
 * "Juan 6:25-40" in the "Yo soy" plan) would lose that specific range and
 * silently widen to the full chapter if flattened+redistributed — those stay
 * fixed to their curated day count.
 *
 * No React/Native imports — pure, runs identically in Hermes and jest.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import type {ReadingPlan, ReadingPlanDay} from '@/constants/reading-plans';
import {BIBLE_BOOKS, getBookByName} from '@/constants/bible';
import {distributeChapters} from './customPlanBuild';
import type {CustomReading} from '@/lib/together';

/** True when every reading is a whole chapter — safe to reflow. */
export function isReflowable(plan: ReadingPlan): boolean {
  return plan.days.every(day => day.readings.every(r => !r.verses));
}

/** Flatten a plan's days into its ordered `[bookId, chapter]` chapter list. */
function flattenDays(days: ReadingPlanDay[]): CustomReading[] {
  const out: CustomReading[] = [];
  for (const day of days) {
    for (const r of day.readings) {
      const book = getBookByName(r.book);
      if (book) out.push([book.id, r.chapter]);
    }
  }
  return out;
}

/** The largest duration a reflow can offer — one day per chapter. */
export function maxReflowDays(plan: ReadingPlan): number {
  return flattenDays(plan.days).length;
}

/**
 * Re-spread a reflowable plan's chapters evenly across `totalDays`, in the
 * same canonical order. `totalDays` is clamped to [1, total chapters] by
 * `distributeChapters` itself, so it never produces an empty day.
 */
export function reflowPlanDays(
  days: ReadingPlanDay[],
  totalDays: number,
): ReadingPlanDay[] {
  const chapters = flattenDays(days);
  const distributed = distributeChapters(chapters, {
    mode: 'totalDays',
    days: totalDays,
  });
  return distributed.map((readings, i) => ({
    day: i + 1,
    readings: readings.map(([bookId, chapter]) => ({
      book: BIBLE_BOOKS.find(b => b.id === bookId)?.name ?? String(bookId),
      chapter,
    })),
  }));
}

/**
 * The days a screen/context should actually use: the plan's curated default,
 * or a reflow to `customDuration` when set and the plan supports it (and the
 * chosen duration actually differs from the curated one — no-op otherwise).
 */
export function effectivePlanDays(
  plan: ReadingPlan,
  customDuration?: number | null,
): ReadingPlanDay[] {
  if (
    !customDuration ||
    customDuration === plan.days.length ||
    !isReflowable(plan)
  ) {
    return plan.days;
  }
  return reflowPlanDays(plan.days, customDuration);
}
