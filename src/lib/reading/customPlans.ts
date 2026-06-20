/**
 * 🧩 Custom reading plans — registry + bundle⇄plan conversion (Sprint 108).
 *
 * A custom plan is a user-built {@link ReadingPlan} that lives only on the
 * device (and travels peer-to-peer inside a together `cplan` link). The curated
 * catalogue (`READING_PLANS`) is a static constant, so to let the rest of the
 * app resolve custom plans WITHOUT threading a React context through every pure
 * helper, we keep a tiny module-level registry that {@link CustomPlansContext}
 * keeps in sync with its state. `getReadingPlanById` and the progress context
 * consult it, so a custom plan behaves like any curated one (progress,
 * auto-complete, pace, sharing).
 *
 * The conversion is the bridge to the codec: an incoming `cplan` bundle carries
 * numeric `[bookId, chapter]` readings (language-neutral); we resolve them to
 * the canonical (Spanish) book names the plan data model uses, dropping any
 * reading whose book/chapter doesn't exist — untrusted input never trusted.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookById, getBookByName} from '@/constants/bible';
import type {ReadingPlan, ReadingPlanDay} from '@/constants/reading-plans';
import {
  makeCustomPlanBundle,
  type CustomPlanBundle,
  type CustomReading,
} from '@/lib/together';

/** Palette a custom plan's accent is picked from (deterministically, by id). */
const CUSTOM_PLAN_COLORS = [
  '#2563EB',
  '#9333EA',
  '#0EA5A4',
  '#D97706',
  '#16A34A',
  '#E11D48',
];

/** Stable, unsigned 32-bit djb2 hash → base36 (used for the plan id + color). */
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

/**
 * Content-derived id, so importing the SAME shared plan twice resolves to the
 * same entry (no duplicates) and a tiny edit makes a new one.
 */
export function customPlanId(bundle: CustomPlanBundle): string {
  return `custom-${hashString(JSON.stringify([bundle.n, bundle.d]))}`;
}

function customPlanColor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return CUSTOM_PLAN_COLORS[sum % CUSTOM_PLAN_COLORS.length];
}

/**
 * Resolve a decoded `cplan` bundle into a {@link ReadingPlan}, or null if it
 * carries nothing usable. Readings whose book id is unknown or whose chapter is
 * out of range are dropped; days that end up empty are dropped and the rest are
 * renumbered 1..N so the day sequence is always contiguous.
 */
export function customPlanFromBundle(
  bundle: CustomPlanBundle,
): ReadingPlan | null {
  const days: ReadingPlanDay[] = [];
  for (const rawDay of bundle.d) {
    const readings: ReadingPlanDay['readings'] = [];
    for (const [bookId, chapter] of rawDay) {
      const book = getBookById(bookId);
      if (!book || chapter < 1 || chapter > book.chapters) continue;
      readings.push({book: book.name, chapter});
    }
    if (readings.length > 0) days.push({day: days.length + 1, readings});
  }
  if (days.length === 0) return null;
  const id = customPlanId(bundle);
  return {
    id,
    name: bundle.n,
    // No baked description: a custom plan carries no language, so screens
    // render a localized "N days · M chapters" line themselves (Sprint 108).
    description: '',
    duration: days.length,
    icon: 'create-outline',
    color: customPlanColor(id),
    days,
    custom: true,
  };
}

/**
 * Reverse direction: a custom {@link ReadingPlan} → a shareable `cplan` bundle,
 * mapping each reading's (Spanish) book name back to its numeric id. Readings
 * whose book can't be resolved are dropped.
 */
export function bundleFromCustomPlan(plan: ReadingPlan): CustomPlanBundle {
  const days: CustomReading[][] = plan.days
    .map(d =>
      d.readings
        .map(r => {
          const book = getBookByName(r.book);
          return book ? ([book.id, r.chapter] as CustomReading) : null;
        })
        .filter((r): r is CustomReading => r !== null),
    )
    .filter(day => day.length > 0);
  return makeCustomPlanBundle(plan.name, days);
}

// ───────────────────────── module-level registry ────────────────────────────

let registered: readonly ReadingPlan[] = [];

/** Replace the registered custom plans (called by CustomPlansContext). */
export function setRegisteredCustomPlans(plans: readonly ReadingPlan[]): void {
  registered = plans;
}

/** The custom plans currently known to pure resolvers (may be empty). */
export function getRegisteredCustomPlans(): readonly ReadingPlan[] {
  return registered;
}

/** Resolve a custom plan by id from the registry, or undefined. */
export function getRegisteredCustomPlanById(
  id: string,
): ReadingPlan | undefined {
  return registered.find(p => p.id === id);
}
