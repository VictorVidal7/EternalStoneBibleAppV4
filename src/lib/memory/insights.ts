/**
 * 📊 MEMORY DECK INSIGHTS
 *
 * Pure, React-free analytics over the verse-memorization deck. Every
 * function takes the card array (and, where time matters, an explicit
 * `now: Date`) so the math is deterministic and unit-testable without
 * touching React state, AsyncStorage or the system clock — the same
 * design contract as `srs.ts`.
 *
 * Sprint 44 ships **current-state** analytics only: everything here is
 * derived from the snapshot a `MemoryCard` already carries (box,
 * reviewCount, lastReviewedAt, dueAt). A historical review-event log
 * (daily heatmap / retention curve) is a future sprint — it needs a new
 * persisted store, so it is deliberately out of scope here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {MemoryCard, SrsBox, isMastered} from './srs';

/** Number of forward days the review forecast spans (today + next 6). */
export const FORECAST_HORIZON_DAYS = 7;

/**
 * A card counts as "struggling" once it has been reviewed at least this
 * many times but is still sitting in a low box — i.e. the user keeps
 * having to come back to it.
 */
export const STRUGGLE_MIN_REVIEWS = 2;

/**
 * Highest box still considered "struggling". Cards above this have
 * graduated out of the danger zone, however many reviews it took.
 */
export const STRUGGLE_MAX_BOX = 2;

const DAY_MS = 24 * 60 * 60 * 1000;
const ALL_BOXES: readonly SrsBox[] = [1, 2, 3, 4, 5];

/** Count of cards in a single Leitner box. */
export interface BoxCount {
  box: SrsBox;
  count: number;
}

/** A struggling card paired with its computed struggle score. */
export interface StrugglingCard {
  card: MemoryCard;
  /** Higher = reviewed more while stuck in a lower box. */
  score: number;
}

/** Cards due on one forward day of the forecast. */
export interface ForecastDay {
  /** Days from `now`: 0 = today (overdue folds in here), 1 = tomorrow, … */
  offset: number;
  /** Cards whose next review rounds to this day. */
  count: number;
}

/** Headline numbers describing overall deck mastery. */
export interface MasterySummary {
  total: number;
  mastered: number;
  due: number;
  /** Percent of the deck in box 5, 0-100 integer (0 when empty). */
  masteredPercent: number;
  /** Mean Leitner box across the deck, 1 decimal (0 when empty). */
  averageBox: number;
  /** Sum of every card's lifetime review count. */
  totalReviews: number;
}

/** Everything the insights screen renders, computed in one pass. */
export interface DeckInsights {
  distribution: BoxCount[];
  struggling: StrugglingCard[];
  forecast: ForecastDay[];
  summary: MasterySummary;
}

/**
 * How many cards sit in each Leitner box. Always returns five entries
 * (boxes 1-5, zero-filled) so a bar chart has a stable, predictable
 * shape regardless of which boxes are populated.
 */
export function boxDistribution(cards: MemoryCard[]): BoxCount[] {
  const counts = new Map<SrsBox, number>();
  for (const box of ALL_BOXES) counts.set(box, 0);
  for (const card of cards) {
    const box = clampToBox(card.box);
    counts.set(box, (counts.get(box) ?? 0) + 1);
  }
  return ALL_BOXES.map(box => ({box, count: counts.get(box) ?? 0}));
}

/**
 * Cards the user keeps getting wrong: reviewed at least
 * `STRUGGLE_MIN_REVIEWS` times yet still in box ≤ `STRUGGLE_MAX_BOX`.
 * Sorted hardest-first (highest score), with deterministic tie-breaks
 * so the list order is stable across renders.
 */
export function strugglingCards(cards: MemoryCard[]): StrugglingCard[] {
  return cards
    .filter(
      c =>
        c.reviewCount >= STRUGGLE_MIN_REVIEWS &&
        clampToBox(c.box) <= STRUGGLE_MAX_BOX,
    )
    .map(card => ({card, score: struggleScore(card)}))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.card.reviewCount !== a.card.reviewCount) {
        return b.card.reviewCount - a.card.reviewCount;
      }
      // Final, fully deterministic tie-break.
      return a.card.verseKey.localeCompare(b.card.verseKey);
    });
}

/** reviewCount weighted by how low the box is (box 1 weighs heaviest). */
function struggleScore(card: MemoryCard): number {
  return card.reviewCount * (6 - clampToBox(card.box));
}

/**
 * Cards due per day across the next `horizonDays`. Overdue cards fold
 * into today (offset 0); cards due beyond the horizon are dropped. The
 * day bucketing uses the same rounding the deck screen uses for its
 * "today / tomorrow / in N days" labels, so a card the list calls
 * "tomorrow" lands in the matching forecast bar.
 */
export function reviewForecast(
  cards: MemoryCard[],
  now: Date,
  horizonDays: number = FORECAST_HORIZON_DAYS,
): ForecastDay[] {
  const horizon = Math.max(1, Math.floor(horizonDays));
  const nowMs = now.getTime();
  const buckets = new Array<number>(horizon).fill(0);
  for (const card of cards) {
    const dueMs = new Date(card.dueAt).getTime();
    if (Number.isNaN(dueMs)) continue;
    let offset = Math.round((dueMs - nowMs) / DAY_MS);
    if (offset < 0) offset = 0;
    if (offset < horizon) buckets[offset] += 1;
  }
  return buckets.map((count, offset) => ({offset, count}));
}

/** Headline mastery numbers for the insights hero card. */
export function masterySummary(cards: MemoryCard[], now: Date): MasterySummary {
  const total = cards.length;
  if (total === 0) {
    return {
      total: 0,
      mastered: 0,
      due: 0,
      masteredPercent: 0,
      averageBox: 0,
      totalReviews: 0,
    };
  }
  const nowMs = now.getTime();
  let mastered = 0;
  let due = 0;
  let boxSum = 0;
  let totalReviews = 0;
  for (const card of cards) {
    if (isMastered(card)) mastered += 1;
    if (new Date(card.dueAt).getTime() <= nowMs) due += 1;
    boxSum += clampToBox(card.box);
    totalReviews += card.reviewCount;
  }
  return {
    total,
    mastered,
    due,
    masteredPercent: Math.round((mastered / total) * 100),
    averageBox: Math.round((boxSum / total) * 10) / 10,
    totalReviews,
  };
}

/** One call that bundles every insight the screen needs. */
export function computeDeckInsights(
  cards: MemoryCard[],
  now: Date,
  horizonDays: number = FORECAST_HORIZON_DAYS,
): DeckInsights {
  return {
    distribution: boxDistribution(cards),
    struggling: strugglingCards(cards),
    forecast: reviewForecast(cards, now, horizonDays),
    summary: masterySummary(cards, now),
  };
}

/** Defensive: a persisted/synced card could carry an out-of-range box. */
function clampToBox(box: number): SrsBox {
  if (box <= 1) return 1;
  if (box >= 5) return 5;
  return box as SrsBox;
}
