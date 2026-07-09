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
 * The grade vocabulary maps to Anki-style buttons. On top of the five
 * boxes, Sprint 46 adds a per-card **ease factor** (history-aware
 * scheduler): the box still sets the *base* interval, but ease scales it
 * so a verse you keep recalling stretches its interval (less nagging)
 * while one you keep lapsing shortens it (more practice). Ease starts at
 * a neutral default, so a card's *first* review behaves exactly like the
 * old pure-Leitner scheduler; the adaptation kicks in from review #2.
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

/**
 * Per-card ease factor (Sprint 46). Multiplies the box's base interval to
 * produce the actual next-review gap, so scheduling responds to how the
 * card has actually performed over time:
 *   nextIntervalDays = round(SRS_BOX_INTERVALS_DAYS[box] × ease)
 *
 * Starts at `DEFAULT_EASE` (1.0 = "behave exactly like plain Leitner"),
 * grows on `easy`, holds on `good`, and shrinks on `hard`/`again`. Clamped
 * to [MIN_EASE, MAX_EASE] so a single bad streak can't collapse a card to
 * "always due" nor an easy streak push it months out.
 */
export const DEFAULT_EASE = 1.0;
export const MIN_EASE = 0.6;
export const MAX_EASE = 1.6;

/** How much each grade nudges a card's ease for *future* reviews. */
export const EASE_DELTA: Record<ReviewGrade, number> = {
  again: -0.2,
  hard: -0.05,
  good: 0,
  easy: 0.15,
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
  /** Times this card has been graded "again" (a recall lapse). Rides the
   *  existing per-review memoryCards write (adds no Firestore write of its
   *  own); seeded to 0 and backfilled to 0 for cards persisted earlier. Lets
   *  the fully-synced deck act as a leech floor when the local review log is
   *  empty (see history.ts findLeeches). */
  lapseCount: number;
  /** Sprint 46: per-card ease factor scaling the box interval. Seeded to
   *  DEFAULT_EASE; backfilled on hydration for cards persisted earlier. */
  ease: number;
  /** Sprint 42: millis since epoch of the most recent mutation. Used
   *  by the sync engine for last-write-wins reconciliation. Backfilled
   *  to addedAt when hydrating cards persisted before this sprint. */
  updatedAt: number;
}

/**
 * Build a fresh card seeded at box 1 due immediately.
 *
 * `ease` is optional and defaults to `DEFAULT_EASE` (plain Leitner) — so a
 * card created without it keeps the Sprint 46 invariant that a brand-new
 * card's first review is byte-identical to pure Leitner. Sprint 48 lets the
 * deck context pass a *calibrated population prior* here (derived from the
 * user's retention history) so a new verse starts at a smarter ease than the
 * neutral default; the value is normalized/clamped so a bad input can't
 * corrupt the card.
 */
export function createCard(input: {
  verseKey: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  now: string;
  ease?: number;
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
    lapseCount: 0,
    ease: normalizeEase(input.ease),
    updatedAt: Date.parse(input.now) || Date.now(),
  };
}

/** Clamp an ease value into the allowed band. */
export function clampEase(n: number): number {
  if (n < MIN_EASE) return MIN_EASE;
  if (n > MAX_EASE) return MAX_EASE;
  return n;
}

/** Coerce a possibly-missing/corrupt ease into a valid number. */
export function normalizeEase(ease: number | undefined | null): number {
  return typeof ease === 'number' && Number.isFinite(ease)
    ? clampEase(ease)
    : DEFAULT_EASE;
}

/**
 * The card's ease *after* a review of the given grade — what scales the
 * NEXT interval. Pure; clamped to [MIN_EASE, MAX_EASE].
 */
export function nextEase(currentEase: number, grade: ReviewGrade): number {
  return clampEase(normalizeEase(currentEase) + EASE_DELTA[grade]);
}

/**
 * Apply a review grade to a card and return the next state.
 *
 * Grade → effect:
 * - `again`: reset to box 1, due immediately.
 * - `hard`:  box stays, due tomorrow (treat box-1 as "today again").
 * - `good`:  +1 box (capped at 5), due per the new box's interval.
 * - `easy`:  +2 boxes (capped at 5), due per the new box's interval.
 *
 * The interval is scaled by the card's CURRENT (pre-review) ease, then the
 * grade updates ease for next time — so a card's first review (ease = 1.0)
 * matches plain Leitner exactly, and the adaptation compounds from there.
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

  const currentEase = normalizeEase(card.ease);

  return {
    ...card,
    box: nextBox,
    ease: nextEase(currentEase, grade),
    dueAt: computeDueDate(nextBox, grade, currentEase, now).toISOString(),
    lastReviewedAt: now.toISOString(),
    reviewCount: card.reviewCount + 1,
    lapseCount: (card.lapseCount ?? 0) + (grade === 'again' ? 1 : 0),
    updatedAt: now.getTime(),
  };
}

/**
 * Computes the next due date given a target box, the grade that got us
 * there, and the card's pre-review ease. `again` always means "right
 * now", `hard` means "+1 day" regardless of box/ease (see it again soon),
 * and `good`/`easy` scale the box's base interval by ease (floored at 1
 * day so an ease < 1 can never make a graduated card due immediately).
 */
function computeDueDate(
  box: SrsBox,
  grade: ReviewGrade,
  ease: number,
  now: Date,
): Date {
  if (grade === 'again') return new Date(now.getTime());
  let days: number;
  if (grade === 'hard') {
    days = 1;
  } else {
    const base = SRS_BOX_INTERVALS_DAYS[box];
    days = Math.max(1, Math.round(base * normalizeEase(ease)));
  }
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

/**
 * Progressive-mask level used by the practice screen to hide a growing
 * portion of the verse text as the user masters it. Each Leitner box maps
 * to its own level — newer cards reveal more, mastered cards reveal less.
 *
 * Level 0 = nothing hidden (box 1, just added — read it).
 * Level 1 = every 4th word hidden (~25%).
 * Level 2 = every other word hidden (~50%).
 * Level 3 = three of every four words hidden (~75%).
 * Level 4 = every word hidden, first letter kept as an anchor (box 5).
 */
export type MaskLevel = 0 | 1 | 2 | 3 | 4;

export function maskLevelForBox(box: SrsBox): MaskLevel {
  return (box - 1) as MaskLevel;
}

/** Approximate fraction of words obscured at each level (UI label cue). */
export const MASK_LEVEL_PERCENT: Record<MaskLevel, number> = {
  0: 0,
  1: 25,
  2: 50,
  3: 75,
  4: 100,
};

// Unicode-aware: matches any letter or digit across scripts so the mask
// works for accented Spanish words ("Señor" → "_____") and English alike.
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/gu;
const ONE_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

function shouldHideWordAt(index: number, level: MaskLevel): boolean {
  switch (level) {
    case 0:
      return false;
    case 1:
      return index % 4 === 3;
    case 2:
      return index % 2 === 1;
    case 3:
      return index % 4 !== 0;
    case 4:
      return true;
    default:
      return false;
  }
}

function maskWord(word: string, mode: 'full' | 'firstLetter'): string {
  if (mode === 'firstLetter') {
    let firstIdx = -1;
    for (let i = 0; i < word.length; i++) {
      if (ONE_LETTER_OR_DIGIT.test(word[i])) {
        firstIdx = i;
        break;
      }
    }
    if (firstIdx === -1) return word;
    return (
      word.slice(0, firstIdx + 1) +
      word.slice(firstIdx + 1).replace(LETTER_OR_DIGIT, '_')
    );
  }
  return word.replace(LETTER_OR_DIGIT, '_');
}

/**
 * Obscure a verse string according to a mask level. Whitespace and
 * punctuation are preserved verbatim so the visual rhythm of the verse is
 * intact and the user can still see word lengths as anchors.
 */
export function applyMask(text: string, level: MaskLevel): string {
  if (level === 0) return text;
  // split keeping whitespace runs as their own tokens.
  const tokens = text.split(/(\s+)/);
  let wordIndex = 0;
  return tokens
    .map(tok => {
      if (tok === '' || /^\s+$/.test(tok)) return tok;
      const idx = wordIndex;
      wordIndex += 1;
      if (!shouldHideWordAt(idx, level)) return tok;
      return maskWord(tok, level === 4 ? 'firstLetter' : 'full');
    })
    .join('');
}
