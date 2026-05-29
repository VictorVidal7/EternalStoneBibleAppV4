/**
 * 🧾 REVIEW EVENT — model + pure builders (Sprint 45 / Ola F.2)
 *
 * A `ReviewEvent` is the immutable, append-only record of a single SRS
 * review. Unlike a `MemoryCard` (which only carries current state — box,
 * reviewCount, lastReviewedAt), each review writes one event, so we can
 * reconstruct the *history*: a daily-activity heatmap and a retention
 * curve (see `history.ts`).
 *
 * Events are never edited or deleted — they're historical facts. That
 * makes them trivial to sync (last-write-wins is a no-op because each id
 * is written exactly once) and means the sync adapter opts out of
 * conflict detection entirely.
 *
 * This module is **pure** (no AsyncStorage, no SQLite, no React) so the
 * analytics in `history.ts` can import its types/predicates without
 * dragging in the native DB binding — the same contract as `srs.ts`.
 * The persistence layer lives in `reviewEventStore.ts`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {MemoryCard, ReviewGrade, SrsBox} from './srs';
import type {SyncEntity} from '../sync/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One immutable review. `id` is deterministic
 * (`${verseKey}__${reviewedAt}`) so the same review re-synced from
 * another device dedupes to the same Firestore doc / SQLite row.
 */
export interface ReviewEvent {
  /** `${verseKey}__${reviewedAt}` — stable, idempotent across devices. */
  id: string;
  /** The card this review belongs to ("Book/Chapter/Verse"). */
  verseKey: string;
  /** Localized book name at review time, for offline display. */
  bookName: string;
  /** The grade the user gave. */
  grade: ReviewGrade;
  /** Leitner box before this review. */
  boxBefore: SrsBox;
  /** Leitner box after this review (post-`applyReview`). */
  boxAfter: SrsBox;
  /**
   * Whole days since this card's previous review, or null if this was
   * the card's first review (no prior review to measure against). Drives
   * the retention-by-interval curve — "after waiting N days, did you
   * still recall it?".
   */
  intervalDays: number | null;
  /** Millis since epoch when the review happened. */
  reviewedAt: number;
}

/** Sync transport shape: the event fields, sans id, plus SyncMetadata. */
export interface RemoteReviewEvent {
  verseKey: string;
  bookName: string;
  grade: ReviewGrade;
  boxBefore: number;
  boxAfter: number;
  intervalDays: number | null;
  reviewedAt: number;
  // updatedAt (= reviewedAt) + optional deleted live on SyncMetadata.
}

/**
 * A review counts as a successful recall unless the user pressed
 * "again" (a lapse — couldn't recall it at all). "hard" still means the
 * verse was recalled, just with effort, so it counts as retained — this
 * matches the SRS scheduler, where only "again" resets the box to 1.
 */
export function isRecallSuccess(grade: ReviewGrade): boolean {
  return grade !== 'again';
}

/**
 * Build the event for a review that just happened. Pure: the caller
 * passes the card snapshot before the review, the card after
 * `applyReview`, the grade, and the clock.
 */
export function buildReviewEvent(input: {
  cardBefore: MemoryCard;
  cardAfter: MemoryCard;
  grade: ReviewGrade;
  now: Date;
}): ReviewEvent {
  const reviewedAt = input.now.getTime();
  const prev = input.cardBefore.lastReviewedAt;
  const prevMs = prev ? Date.parse(prev) : NaN;
  const intervalDays = Number.isNaN(prevMs)
    ? null
    : Math.max(0, Math.round((reviewedAt - prevMs) / DAY_MS));

  return {
    id: `${input.cardBefore.verseKey}__${reviewedAt}`,
    verseKey: input.cardBefore.verseKey,
    bookName: input.cardBefore.bookName,
    grade: input.grade,
    boxBefore: input.cardBefore.box,
    boxAfter: input.cardAfter.box,
    intervalDays,
    reviewedAt,
  };
}

/** Reshape a local event into the sync transport payload. */
export function reviewEventToRemote(
  event: ReviewEvent,
): SyncEntity<RemoteReviewEvent> {
  return {
    verseKey: event.verseKey,
    bookName: event.bookName,
    grade: event.grade,
    boxBefore: event.boxBefore,
    boxAfter: event.boxAfter,
    intervalDays: event.intervalDays,
    reviewedAt: event.reviewedAt,
    updatedAt: event.reviewedAt,
  };
}

/** Rebuild a local event from a remote doc id + payload (inbound sync). */
export function remoteToReviewEvent(
  id: string,
  data: SyncEntity<RemoteReviewEvent>,
): ReviewEvent {
  return {
    id,
    verseKey: data.verseKey,
    bookName: data.bookName,
    grade: data.grade,
    boxBefore: clampBox(data.boxBefore),
    boxAfter: clampBox(data.boxAfter),
    intervalDays:
      typeof data.intervalDays === 'number' ? data.intervalDays : null,
    reviewedAt:
      typeof data.reviewedAt === 'number' ? data.reviewedAt : data.updatedAt,
  };
}

function clampBox(n: number): SrsBox {
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as SrsBox;
}
