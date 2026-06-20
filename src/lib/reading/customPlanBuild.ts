/**
 * 🧮 Custom-plan builder — distribute passages into days (Sprint 108).
 *
 * Pure helpers behind the plan editor: take an ordered list of chapter-range
 * passages and a pace, and lay the chapters out across days. Two pace modes:
 *
 *  - **perDay** — fixed chapters per day (the plan runs as long as it needs).
 *  - **totalDays** — a target number of days; chapters are spread as evenly as
 *    possible (the same proportional `floor` split the "Biblia en un año" plan
 *    uses), so no day is left empty and none is overloaded.
 *
 * No React/Native imports — runs identically in Hermes and jest.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {
  makeCustomPlanBundle,
  type CustomPlanBundle,
  type CustomReading,
} from '@/lib/together';

/** A contiguous chapter range within one book (inclusive). */
export interface PlanPassage {
  bookId: number;
  fromChapter: number;
  toChapter: number;
}

/** How to spread the chapters across days. */
export type PlanPace =
  | {mode: 'perDay'; chaptersPerDay: number}
  | {mode: 'totalDays'; days: number};

/** Flatten ordered passages into a chapter list `[bookId, chapter]`. */
export function passagesToChapters(passages: PlanPassage[]): CustomReading[] {
  const out: CustomReading[] = [];
  for (const p of passages) {
    const lo = Math.min(p.fromChapter, p.toChapter);
    const hi = Math.max(p.fromChapter, p.toChapter);
    for (let c = lo; c <= hi; c++) out.push([p.bookId, c]);
  }
  return out;
}

/** Distribute a chapter list into days per the pace (no empty days). */
export function distributeChapters(
  chapters: CustomReading[],
  pace: PlanPace,
): CustomReading[][] {
  const total = chapters.length;
  if (total === 0) return [];

  if (pace.mode === 'perDay') {
    const per = Math.max(1, Math.floor(pace.chaptersPerDay));
    const days: CustomReading[][] = [];
    for (let i = 0; i < total; i += per) {
      days.push(chapters.slice(i, i + per));
    }
    return days;
  }

  // totalDays: even proportional split. Never more days than chapters, so every
  // day carries at least one chapter.
  const n = Math.min(Math.max(1, Math.floor(pace.days)), total);
  const days: CustomReading[][] = [];
  for (let i = 0; i < n; i++) {
    const start = Math.floor((i * total) / n);
    const end = Math.floor(((i + 1) * total) / n);
    days.push(chapters.slice(start, end));
  }
  return days;
}

/** Total chapters across all passages — for the editor's live preview. */
export function countChapters(passages: PlanPassage[]): number {
  return passages.reduce(
    (sum, p) => sum + Math.abs(p.toChapter - p.fromChapter) + 1,
    0,
  );
}

/**
 * End-to-end: ordered passages + pace + name → a shareable custom-plan bundle.
 * The bundle's own caps still apply, so an over-long plan is clamped, not
 * rejected.
 */
export function buildCustomPlan(
  name: string,
  passages: PlanPassage[],
  pace: PlanPace,
): CustomPlanBundle {
  return makeCustomPlanBundle(
    name,
    distributeChapters(passagesToChapters(passages), pace),
  );
}
