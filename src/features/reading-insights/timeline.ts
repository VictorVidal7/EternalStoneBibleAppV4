/**
 * Tu línea de tiempo (Sprint 80) — the pure milestone feed.
 *
 * Composes a chronological feed of milestones from stores the app ALREADY
 * keeps — nothing new is recorded, the past simply becomes visible:
 *
 *   · completed_books.completed_at      → "Terminaste Génesis"
 *   · user_achievements.unlocked_at     → "Logro: Lector fiel"
 *   · favorites/notes/highlights MIN createdAt → the three "firsts"
 *   · reading_streak_log runs           → "Nueva racha récord: N días"
 *   · @reading_plan_progress startedAt  → "Comenzaste el plan …"
 *
 * Plan COMPLETION carries no date in its store, so the feed honestly omits
 * it rather than inventing one. Streak records walk the per-day log: a run's
 * final length becomes an event only when it beats every previous run and is
 * at least {@link STREAK_RECORD_MIN} days (a 1-day "record" is noise).
 *
 * Day DIFFS go through localDaysBetween (midnight-normalized, DST-safe);
 * log dates pin to LOCAL NOON so a timezone's midnight wobble can't move an
 * event across days. Storage-free like [[weekComparison]] / [[planPace]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {localDaysBetween} from '@/lib/reading/planPace';

export type TimelineEventType =
  | 'book-completed'
  | 'achievement'
  | 'first-favorite'
  | 'first-note'
  | 'first-highlight'
  | 'streak-record'
  | 'plan-started';

export interface TimelineEvent {
  /** Stable key for lists ("book:Genesis", "achievement:first_verse"…). */
  id: string;
  type: TimelineEventType;
  timestamp: number;
  /**
   * What the event is about: the canonical book name, the achievement's
   * name, a "Book C:V" reference, the plan id, or the streak length — the
   * screen localizes around it.
   */
  subject: string;
  /** Ionicons glyph for achievement events (the catalog already has one). */
  icon?: string;
  /** The structured verse behind a "first" event, for localized refs. */
  verse?: {book: string; chapter: number; verse: number};
}

/** A streak only reads as a record from this length on. */
export const STREAK_RECORD_MIN = 3;

interface VerseStamp {
  book: string;
  chapter: number;
  verse: number;
  /** ms epoch (favorites/highlights) or an ISO string (bible.db notes). */
  createdAt?: number | string;
}

export interface TimelineInputs {
  completedBooks: {bookName: string; completedAt: number}[];
  achievements: {
    id: string;
    name: string;
    icon: string;
    isUnlocked: boolean;
    unlockedAt?: number;
  }[];
  favorites: VerseStamp[];
  notes: VerseStamp[];
  highlights: VerseStamp[];
  /** Plans with their first-interaction ISO stamp (null = never started). */
  plans: {planId: string; startedAt: string | null}[];
  /** reading_streak_log dates ascending, local 'YYYY-MM-DD'. */
  readingLog: {date: string}[];
}

function isValidStamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Normalize a store's creation stamp (ms number or ISO string) or null. */
function stampOf(value: number | string | undefined): number | null {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return isValidStamp(parsed) ? parsed : null;
  }
  return isValidStamp(value) ? value : null;
}

/** Local noon of a 'YYYY-MM-DD' key (null when malformed). */
function localNoon(dateKey: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const [, y, m, d] = match;
  const stamp = new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    12,
    0,
    0,
  ).getTime();
  return Number.isFinite(stamp) ? stamp : null;
}

function firstOf(stamps: VerseStamp[]): {stamp: VerseStamp; at: number} | null {
  let first: {stamp: VerseStamp; at: number} | null = null;
  for (const stamp of stamps) {
    const at = stampOf(stamp.createdAt);
    if (at === null) continue;
    if (!first || at < first.at) first = {stamp, at};
  }
  return first;
}

function verseRef(stamp: VerseStamp): string {
  return `${stamp.book} ${stamp.chapter}:${stamp.verse}`;
}

/**
 * Walk the ascending per-day log and emit one event per RECORD run: the day
 * a consecutive run ends longer than every run before it (and at least
 * {@link STREAK_RECORD_MIN} days). The event's subject is the new length.
 */
function streakRecordEvents(readingLog: {date: string}[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let best = 0;
  let runLength = 0;
  let prev: Date | null = null;
  let runEndKey = '';

  const closeRun = () => {
    if (runLength >= STREAK_RECORD_MIN && runLength > best) {
      const stamp = localNoon(runEndKey);
      if (stamp !== null) {
        events.push({
          id: `streak:${runEndKey}`,
          type: 'streak-record',
          timestamp: stamp,
          subject: String(runLength),
        });
      }
    }
    best = Math.max(best, runLength);
  };

  for (const entry of readingLog) {
    const noon = localNoon(entry.date);
    if (noon === null) continue;
    const day = new Date(noon);
    if (prev && localDaysBetween(prev, day) === 1) {
      runLength += 1;
    } else if (prev && localDaysBetween(prev, day) === 0) {
      // Duplicate day rows collapse silently.
      prev = day;
      continue;
    } else {
      closeRun();
      runLength = 1;
    }
    prev = day;
    runEndKey = entry.date;
  }
  closeRun();
  return events;
}

/** The full milestone feed, NEWEST first. Ties keep a stable type order. */
export function buildTimeline(inputs: TimelineInputs): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const book of inputs.completedBooks) {
    if (!isValidStamp(book.completedAt) || !book.bookName) continue;
    events.push({
      id: `book:${book.bookName}`,
      type: 'book-completed',
      timestamp: book.completedAt,
      subject: book.bookName,
    });
  }

  for (const achievement of inputs.achievements) {
    if (!achievement.isUnlocked || !isValidStamp(achievement.unlockedAt)) {
      continue;
    }
    events.push({
      id: `achievement:${achievement.id}`,
      type: 'achievement',
      timestamp: achievement.unlockedAt!,
      subject: achievement.name,
      icon: achievement.icon,
    });
  }

  const firsts: [TimelineEventType, {stamp: VerseStamp; at: number} | null][] =
    [
      ['first-favorite', firstOf(inputs.favorites)],
      ['first-note', firstOf(inputs.notes)],
      ['first-highlight', firstOf(inputs.highlights)],
    ];
  for (const [type, first] of firsts) {
    if (!first) continue;
    events.push({
      id: type,
      type,
      timestamp: first.at,
      subject: verseRef(first.stamp),
      verse: {
        book: first.stamp.book,
        chapter: first.stamp.chapter,
        verse: first.stamp.verse,
      },
    });
  }

  for (const plan of inputs.plans) {
    if (!plan.startedAt) continue;
    const stamp = Date.parse(plan.startedAt);
    if (!isValidStamp(stamp)) continue;
    events.push({
      id: `plan:${plan.planId}`,
      type: 'plan-started',
      timestamp: stamp,
      subject: plan.planId,
    });
  }

  events.push(...streakRecordEvents(inputs.readingLog));

  return events.sort(
    (a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id),
  );
}

/** Local 'YYYY-MM' month key — the screen groups the feed by it. */
export function timelineMonthKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
