/**
 * 🧠 SPACED REPETITION SYSTEM
 *
 * Leitner-style scheduler for the verse-memorization deck. Each card
 * lives in one of five boxes; reviewing it with a quality grade either
 * promotes, holds, or resets the box and recomputes the next-due date.
 *
 * Designed as **pure functions** so the algorithm is testable without
 * touching React state, AsyncStorage or the clock — callers pass `now`
 * explicitly so tests can advance time deterministically.
 *
 * The grade vocabulary maps to Anki-style buttons but the math is
 * simpler: no ease factor, no per-card adjustments, just five boxes.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Memorization mastery levels. Box 5 = "owned"; Box 1 = "fresh / hard". */
export type SrsBox = 1 | 2 | 3 | 4 | 5;

/** User grade after recalling a card. */
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

/**
 * Number of calendar days from the moment of review to the next review
 * for each box. Box 1 is "the same day, see again right after" so we
 * keep its value at 0 and the caller treats it as "immediate".
 */
export const SRS_BOX_INTERVALS_DAYS: Record<SrsBox, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 30,
};

export interface MemoryCard {
  /** Stable verse key, e.g. "Juan/3/16". */
  verseKey: string;
  /** Localized book name at add time, for offline display. */
  bookName: string;
  chapter: number;
  verse: number;
  /** Verse text snapshot — survives if the user resets the Bible data. */
  text: string;
  /** Bible version the verse was added from (RVR1960 / KJV). */
  version: string;
  /** Current Leitner box, 1-5. */
  box: SrsBox;
  /** ISO timestamp when this card is due for its next review. */
  dueAt: string;
  /** ISO timestamp the card was first added. */
  addedAt: string;
  /** ISO timestamp of the most recent review, or null if never reviewed. */
  lastReviewedAt: string | null;
  /** Total number of times this card has been reviewed. */
  reviewCount: number;
}

/** Build a fresh card seeded at box 1 due immediately. */
export function createCard(input: {
  verseKey: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  now: string;
}): MemoryCard {
  return {
    verseKey: input.verseKey,
    bookName: input.bookName,
    chapter: input.chapter,
    verse: input.verse,
    text: input.text,
    version: input.version,
    box: 1,
    dueAt: input.now,
    addedAt: input.now,
    lastReviewedAt: null,
    reviewCount: 0,
  };
}

/**
 * Apply a review grade to a card and return the next state.
 *
 * Grade → effect:
 * - `again`: reset to box 1, due immediately.
 * - `hard`:  box stays, due tomorrow (treat box-1 as "today again").
 * - `good`:  +1 box (capped at 5), due per the new box's interval.
 * - `easy`:  +2 boxes (capped at 5), due per the new box's interval.
 */
export function applyReview(
  card: MemoryCard,
  grade: ReviewGrade,
  now: Date,
): MemoryCard {
  let nextBox: SrsBox = card.box;

  switch (grade) {
    case 'again':
      nextBox = 1;
      break;
    case 'hard':
      // Box stays the same — same struggle level for next time.
      nextBox = card.box;
      break;
    case 'good':
      nextBox = clampBox(card.box + 1);
      break;
    case 'easy':
      nextBox = clampBox(card.box + 2);
      break;
  }

  return {
    ...card,
    box: nextBox,
    dueAt: computeDueDate(nextBox, grade, now).toISOString(),
    lastReviewedAt: now.toISOString(),
    reviewCount: card.reviewCount + 1,
  };
}

/**
 * Computes the next due date given a target box and the grade that got
 * us there. `again` always means "right now", `hard` means "+1 day"
 * regardless of the box, and `good`/`easy` use the interval table.
 */
function computeDueDate(box: SrsBox, grade: ReviewGrade, now: Date): Date {
  if (grade === 'again') return new Date(now.getTime());
  const days = grade === 'hard' ? 1 : SRS_BOX_INTERVALS_DAYS[box];
  const next = new Date(now.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function clampBox(n: number): SrsBox {
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as SrsBox;
}

/** Cards whose `dueAt` is at or before `now` — ready to be reviewed. */
export function selectDueCards(cards: MemoryCard[], now: Date): MemoryCard[] {
  const cutoff = now.getTime();
  return cards.filter(c => new Date(c.dueAt).getTime() <= cutoff);
}

/** True when a card has reached the mastery box. */
export function isMastered(card: MemoryCard): boolean {
  return card.box === 5;
}

/** Stable key from book/chapter/verse — used both as deck index and route. */
export function buildVerseKey(
  bookName: string,
  chapter: number,
  verse: number,
): string {
  return `${bookName}/${chapter}/${verse}`;
}
