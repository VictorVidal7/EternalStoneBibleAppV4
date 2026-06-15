/**
 * 🏆 WEEKLY MASTERY CHALLENGE — pure logic (Sprint 86).
 *
 * A weekly goal layered on the memorization deck: "master N verses this week".
 * It COMPOSES the data the deck already keeps — the cards (current Leitner box)
 * and the synced review-event log (every grade, with the box BEFORE and AFTER)
 * — into a fresh-each-week challenge with NO new persistence: a verse counts as
 * "mastered this week" when a review THIS WEEK graduated it to box 5
 * (`boxBefore < 5 && boxAfter === 5`), so the count auto-resets every Monday
 * straight from the event log. The only stored bit is the target N
 * (device-local, see the store added in T2).
 *
 * Pure and React-free (the caller passes `now` + the already-computed practice
 * streak so it stays consistent with the memory-streak shown elsewhere), like
 * [[goals]] / [[srs]], so it unit-tests deterministically.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {MemoryCard, SrsBox} from './srs';
import type {ReviewEvent} from './reviewEvents';

/** Verses-to-master target a reader starts the week with. */
export const DEFAULT_WEEKLY_TARGET = 3;
/** Smallest / largest weekly target the UI offers. */
export const MIN_WEEKLY_TARGET = 1;
export const MAX_WEEKLY_TARGET = 10;
/** The chip options shown in the picker, ascending. */
export const WEEKLY_TARGET_OPTIONS: readonly number[] = [1, 2, 3, 5, 7];

/** The mastered box — a card here is "owned". */
const MASTERY_BOX: SrsBox = 5;

/** A verse the reader is working toward mastery (box < 5), for the focus list. */
export interface FocusVerse {
  verseKey: string;
  bookName: string;
  chapter: number;
  verse: number;
  /** Current Leitner box (1-4) — rendered as `box`/5 stars. */
  box: SrsBox;
}

/** A verse that graduated to mastery this week. */
export interface MasteredVerse {
  verseKey: string;
  bookName: string;
  chapter: number;
  verse: number;
  /** When it graduated (ms) — newest first in the list. */
  masteredAt: number;
}

/** The whole challenge, computed in one pass. */
export interface WeeklyChallenge {
  /** The (clamped) target verses to master this week. */
  target: number;
  /** Distinct verses that graduated to box 5 this week. */
  mastered: number;
  /** max(0, target - mastered). */
  remaining: number;
  /** mastered >= target. */
  met: boolean;
  /** mastered / target, clamped to [0, 1]. */
  fraction: number;
  /** Reviews logged this week (any grade). */
  reviewsThisWeek: number;
  /** Consecutive review days ending today — passed through from history. */
  practiceStreak: number;
  /** The verses mastered this week, newest first. */
  masteredVerses: MasteredVerse[];
  /** Verses closest to mastery (box 4 → 3 …), the "to master" focus list. */
  focusVerses: FocusVerse[];
  /** False ⇒ the deck is empty (the card hides). */
  hasDeck: boolean;
}

/** Coerce any persisted/typed-in value into a valid target. */
export function clampWeeklyTarget(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_WEEKLY_TARGET;
  return Math.min(
    MAX_WEEKLY_TARGET,
    Math.max(MIN_WEEKLY_TARGET, Math.round(n)),
  );
}

/**
 * Local-midnight (ms) of the MONDAY that starts `now`'s week. ISO weeks start
 * Monday; getDay() is 0=Sun..6=Sat, so Sunday rolls back 6 days, Monday 0.
 */
export function startOfLocalWeek(now: Date): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = d.getDay();
  const backToMonday = (dow + 6) % 7;
  d.setDate(d.getDate() - backToMonday);
  return d.getTime();
}

/** Local `YYYY-MM-DD` for a ms timestamp (the practice-day key). */
function localDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Build the weekly challenge from the deck + review log. `practiceStreak` is
 * injected (the caller already computes it via the canonical history) so the
 * number matches the memory streak shown on the rings and the deck screen.
 */
export function buildWeeklyChallenge(params: {
  cards: readonly MemoryCard[];
  reviewEvents: readonly ReviewEvent[];
  target: number;
  practiceStreak: number;
  now: Date;
}): WeeklyChallenge {
  const {cards, reviewEvents, now} = params;
  const target = clampWeeklyTarget(params.target);
  const practiceStreak = Math.max(0, Math.floor(params.practiceStreak) || 0);
  const weekStart = startOfLocalWeek(now);
  const nowMs = now.getTime();

  // Lookup for display data (book/chapter/verse) by verseKey.
  const cardByKey = new Map<string, MemoryCard>();
  for (const c of cards) cardByKey.set(c.verseKey, c);

  // Verses that GRADUATED to mastery this week (latest such event per verse).
  const masteredAt = new Map<string, number>();
  let reviewsThisWeek = 0;
  for (const e of reviewEvents) {
    if (e.reviewedAt < weekStart || e.reviewedAt > nowMs) continue;
    reviewsThisWeek += 1;
    if (e.boxBefore < MASTERY_BOX && e.boxAfter === MASTERY_BOX) {
      const prev = masteredAt.get(e.verseKey);
      if (prev == null || e.reviewedAt > prev) {
        masteredAt.set(e.verseKey, e.reviewedAt);
      }
    }
  }

  const masteredVerses: MasteredVerse[] = [];
  for (const [verseKey, at] of masteredAt) {
    const card = cardByKey.get(verseKey);
    masteredVerses.push({
      verseKey,
      bookName: card?.bookName ?? verseKey,
      chapter: card?.chapter ?? 0,
      verse: card?.verse ?? 0,
      masteredAt: at,
    });
  }
  masteredVerses.sort((a, b) => b.masteredAt - a.masteredAt);

  const mastered = masteredVerses.length;
  const remaining = Math.max(0, target - mastered);
  const met = mastered >= target;
  const fraction = target > 0 ? Math.min(1, mastered / target) : 0;

  // Focus list — cards still working toward mastery, closest (highest box)
  // first, then soonest due, then a stable key tie-break.
  const focusVerses: FocusVerse[] = cards
    .filter(c => c.box < MASTERY_BOX)
    .slice()
    .sort(
      (a, b) =>
        b.box - a.box ||
        Date.parse(a.dueAt) - Date.parse(b.dueAt) ||
        a.verseKey.localeCompare(b.verseKey),
    )
    .map(c => ({
      verseKey: c.verseKey,
      bookName: c.bookName,
      chapter: c.chapter,
      verse: c.verse,
      box: c.box,
    }));

  return {
    target,
    mastered,
    remaining,
    met,
    fraction,
    reviewsThisWeek,
    practiceStreak,
    masteredVerses,
    focusVerses,
    hasDeck: cards.length > 0,
  };
}

/** Re-export for callers building practice-day keys consistently. */
export {localDayKey as weeklyChallengeDayKey};
