/**
 * 🔀 CONFLICT ANALYTICS — pure aggregation of the resolved-conflict log (Sprint 49)
 *
 * Sprint 43 made the SyncEngine write a `ResolvedConflictRecord` to
 * `users/{uid}/conflicts/{id}` every time the user resolves a sync conflict
 * (keep mine / keep theirs / merge). That collection is an append-only audit
 * log — NOT one of the synced datasets — so this sprint reads it on demand
 * and turns it into the patterns behind a small dashboard: how you tend to
 * resolve, which datasets and fields clash most, and how often over time.
 *
 * This module is pure and React-/Firestore-free (it takes the already-fetched
 * records + a `now`, exactly like `insights.ts` / `history.ts` / `goals.ts`),
 * so it unit-tests deterministically. The one-shot read lives on the engine
 * (`SyncEngine.fetchResolvedConflicts`), which owns the uid + firestore handle.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ConflictChoice, ResolvedConflictRecord} from './types';

/** Below this many resolved conflicts we don't claim a directional tendency. */
export const MIN_VERDICT_SAMPLE = 3;

/** Weeks of history the activity-over-time chart spans by default. */
export const ACTIVITY_WEEKS = 8;

/** Fixed display order so the choice chart shape stays stable. */
export const CHOICE_ORDER: readonly ConflictChoice[] = [
  'keepMine',
  'keepTheirs',
  'merge',
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** One resolution-choice slice (count + share of the total). */
export interface ChoiceBreakdown {
  choice: ConflictChoice;
  count: number;
  /** count / total, in [0, 1]. 0 when there are no records. */
  fraction: number;
}

/** Conflicts attributed to one synced dataset. */
export interface CollectionTally {
  collection: string;
  count: number;
}

/** Conflicts that touched one field. */
export interface FieldTally {
  field: string;
  count: number;
}

/** Resolved conflicts in one calendar week, relative to `now`. */
export interface WeeklyBucket {
  /** 0 = the current week, 1 = last week, … (weeks-1) = oldest shown. */
  weeksAgo: number;
  count: number;
}

/** The bundle the dashboard renders. */
export interface ConflictAnalytics {
  /** Total resolved conflicts in the log. */
  total: number;
  /** Always 3 entries in CHOICE_ORDER (keepMine / keepTheirs / merge). */
  byChoice: ChoiceBreakdown[];
  /** Datasets sorted by conflict count desc, then name asc. */
  byCollection: CollectionTally[];
  /** Fields sorted by conflict count desc, then name asc. */
  byField: FieldTally[];
  /** Per-week counts, oldest first (index 0) → current week (last). */
  weekly: WeeklyBucket[];
  /**
   * The single most-used choice, when total >= MIN_VERDICT_SAMPLE AND one
   * choice strictly leads. Null below the sample floor or on a top tie
   * (no clear tendency to report).
   */
  dominantChoice: ConflictChoice | null;
  /** Epoch ms of the most recent resolution, or null when empty. */
  lastResolvedAt: number | null;
}

/** Midnight (local) for the day containing `ms`. */
function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** A resolved-conflict record is countable only if it names a valid choice. */
function isValidChoice(value: unknown): value is ConflictChoice {
  return value === 'keepMine' || value === 'keepTheirs' || value === 'merge';
}

/**
 * Aggregate a batch of resolved-conflict records into dashboard metrics.
 *
 * Defensive by design — the records come straight from Firestore, so a
 * malformed doc (missing choice, non-array differingFields, non-number
 * resolvedAt) is skipped for the dimension it can't contribute to rather
 * than throwing.
 */
export function computeConflictAnalytics(
  records: readonly ResolvedConflictRecord[],
  now: Date = new Date(),
  weeks: number = ACTIVITY_WEEKS,
): ConflictAnalytics {
  const choiceCounts: Record<ConflictChoice, number> = {
    keepMine: 0,
    keepTheirs: 0,
    merge: 0,
  };
  const collectionCounts = new Map<string, number>();
  const fieldCounts = new Map<string, number>();
  const weekCount = Math.max(1, Math.floor(weeks));
  const weekly: number[] = new Array(weekCount).fill(0);
  const todayStart = startOfLocalDay(now.getTime());

  let total = 0;
  let lastResolvedAt: number | null = null;

  for (const rec of records) {
    if (!rec || !isValidChoice(rec.choice)) continue;
    total += 1;
    choiceCounts[rec.choice] += 1;

    if (typeof rec.collection === 'string' && rec.collection.length > 0) {
      collectionCounts.set(
        rec.collection,
        (collectionCounts.get(rec.collection) ?? 0) + 1,
      );
    }

    if (Array.isArray(rec.differingFields)) {
      for (const field of rec.differingFields) {
        if (typeof field === 'string' && field.length > 0) {
          fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
        }
      }
    }

    if (typeof rec.resolvedAt === 'number' && Number.isFinite(rec.resolvedAt)) {
      if (lastResolvedAt === null || rec.resolvedAt > lastResolvedAt) {
        lastResolvedAt = rec.resolvedAt;
      }
      // Day-aligned diff so a DST hour shift can't bump a record a week over.
      const dayDiff = Math.round(
        (todayStart - startOfLocalDay(rec.resolvedAt)) / DAY_MS,
      );
      const weeksAgo = Math.floor(Math.max(0, dayDiff) / 7);
      if (weeksAgo < weekCount) {
        // weekly[] is oldest-first: index 0 = (weekCount-1) weeks ago.
        weekly[weekCount - 1 - weeksAgo] += 1;
      }
    }
  }

  const byChoice: ChoiceBreakdown[] = CHOICE_ORDER.map(choice => ({
    choice,
    count: choiceCounts[choice],
    fraction: total > 0 ? choiceCounts[choice] / total : 0,
  }));

  const byCollection: CollectionTally[] = [...collectionCounts.entries()]
    .map(([collection, count]) => ({collection, count}))
    .sort(
      (a, b) => b.count - a.count || a.collection.localeCompare(b.collection),
    );

  const byField: FieldTally[] = [...fieldCounts.entries()]
    .map(([field, count]) => ({field, count}))
    .sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));

  const weeklyBuckets: WeeklyBucket[] = weekly.map((count, idx) => ({
    weeksAgo: weekCount - 1 - idx,
    count,
  }));

  return {
    total,
    byChoice,
    byCollection,
    byField,
    weekly: weeklyBuckets,
    dominantChoice: pickDominantChoice(byChoice, total),
    lastResolvedAt,
  };
}

/**
 * The choice to surface as the user's tendency, or null when there isn't a
 * clear one: below MIN_VERDICT_SAMPLE total, or a tie for the top count.
 */
function pickDominantChoice(
  byChoice: readonly ChoiceBreakdown[],
  total: number,
): ConflictChoice | null {
  if (total < MIN_VERDICT_SAMPLE) return null;
  let top: ChoiceBreakdown | null = null;
  let tied = false;
  for (const c of byChoice) {
    if (!top || c.count > top.count) {
      top = c;
      tied = false;
    } else if (c.count === top.count) {
      tied = true;
    }
  }
  if (!top || top.count === 0 || tied) return null;
  return top.choice;
}
