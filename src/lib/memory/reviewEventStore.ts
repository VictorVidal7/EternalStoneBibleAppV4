/**
 * 🗄️ REVIEW EVENT STORE — SQLite persistence (Sprint 45 / Ola F.2)
 *
 * The append-only review log lives in the `review_events` SQLite table
 * (created in `bibleDB` init alongside notes/favorites). A growing,
 * date-queryable log is a far better fit for SQLite than the AsyncStorage
 * blob the deck itself uses — we never re-serialize the whole history on
 * each review, and the heatmap can range-scan by `reviewed_at`.
 *
 * All writes are `INSERT OR REPLACE` keyed on the deterministic event id,
 * so re-applying a remote event (inbound sync) or re-recording the same
 * review is idempotent — never a duplicate row.
 *
 * This module touches the native DB binding, so it is deliberately kept
 * separate from the pure `reviewEvents.ts` model and `history.ts`
 * analytics (which must stay testable without SQLite).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import bibleDB from '../database';
import {logger} from '../utils/logger';
import type {ReviewGrade, SrsBox} from './srs';
import type {ReviewEvent} from './reviewEvents';

interface ReviewEventRow {
  id: string;
  verse_key: string;
  book_name: string;
  grade: string;
  box_before: number;
  box_after: number;
  interval_days: number | null;
  reviewed_at: number;
}

function rowToEvent(r: ReviewEventRow): ReviewEvent {
  return {
    id: r.id,
    verseKey: r.verse_key,
    bookName: r.book_name,
    grade: r.grade as ReviewGrade,
    boxBefore: clampBox(r.box_before),
    boxAfter: clampBox(r.box_after),
    intervalDays: r.interval_days === null ? null : r.interval_days,
    reviewedAt: r.reviewed_at,
  };
}

/** Append (or idempotently replace) one review event. */
export async function addReviewEvent(event: ReviewEvent): Promise<void> {
  try {
    await bibleDB.initialize();
    const db = await bibleDB.getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO review_events
       (id, verse_key, book_name, grade, box_before, box_after, interval_days, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.verseKey,
        event.bookName,
        event.grade,
        event.boxBefore,
        event.boxAfter,
        event.intervalDays,
        event.reviewedAt,
      ],
    );
  } catch (err) {
    logger.warn('reviewEventStore: addReviewEvent failed', {
      component: 'memory/reviewEventStore',
      id: event.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Every event, oldest first (the order the analytics expect). */
export async function getAllReviewEvents(): Promise<ReviewEvent[]> {
  try {
    await bibleDB.initialize();
    const db = await bibleDB.getDatabase();
    const rows = await db.getAllAsync<ReviewEventRow>(
      `SELECT id, verse_key, book_name, grade, box_before, box_after, interval_days, reviewed_at
       FROM review_events
       ORDER BY reviewed_at ASC`,
    );
    return rows.map(rowToEvent);
  } catch (err) {
    logger.warn('reviewEventStore: getAllReviewEvents failed', {
      component: 'memory/reviewEventStore',
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/** Look up a single event by id (used by the sync adapter's getLocal). */
export async function getReviewEventById(
  id: string,
): Promise<ReviewEvent | null> {
  try {
    await bibleDB.initialize();
    const db = await bibleDB.getDatabase();
    const row = await db.getFirstAsync<ReviewEventRow>(
      `SELECT id, verse_key, book_name, grade, box_before, box_after, interval_days, reviewed_at
       FROM review_events
       WHERE id = ?`,
      [id],
    );
    return row ? rowToEvent(row) : null;
  } catch (err) {
    logger.warn('reviewEventStore: getReviewEventById failed', {
      component: 'memory/reviewEventStore',
      id,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Hard-delete an event. We never tombstone events ourselves (deleting a
 * card keeps its history so the heatmap doesn't grow holes), but the
 * sync adapter still honors an inbound remote delete defensively.
 */
export async function removeReviewEvent(id: string): Promise<void> {
  try {
    await bibleDB.initialize();
    const db = await bibleDB.getDatabase();
    await db.runAsync('DELETE FROM review_events WHERE id = ?', [id]);
  } catch (err) {
    logger.warn('reviewEventStore: removeReviewEvent failed', {
      component: 'memory/reviewEventStore',
      id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function clampBox(n: number): SrsBox {
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as SrsBox;
}
