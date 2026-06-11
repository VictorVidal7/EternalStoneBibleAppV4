/**
 * 📅 weeklyRecap — PURE model for the shareable "My week in the Word" card
 * (Sprint 77).
 *
 * "Tu camino" (Wrapped, S57) tells the LIFETIME story; this is the honest
 * 7-day snapshot: verses + time read, time + verses listened, the days that
 * actually had activity, and the current streaks — all composed from data the
 * app already keeps (the per-day reading log + the S75 listening buckets).
 * Nothing is estimated; empty days stay empty and an inactive week simply
 * reports `hasActivity: false` so the share stays truthful.
 *
 * Date keys use the same LOCAL `YYYY-MM-DD` basis as [[listeningStats]]'s
 * listeningDateKey and the reading log / computeStreaks, so a verse read at
 * 23:50 counts on the day the reader experienced.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {listeningDateKey, type ListeningStats} from '@/features/audio';
import type {ReadingLogEntry} from './readingInsights';

const MS_PER_DAY = 86_400_000;

/** Days the recap window spans (today inclusive). */
export const RECAP_WINDOW_DAYS = 7;

export interface WeeklyRecapInput {
  readingLog: ReadingLogEntry[];
  /** Per-day listening buckets (S75); pass EMPTY_LISTENING_STATS when none. */
  listening: ListeningStats;
  /** Current reading streak in days (buildReadingInsights.currentStreak). */
  readingStreak: number;
  /** Current listening streak in days (listeningStreaks.current). */
  listeningStreak: number;
  now: number;
}

export interface WeeklyRecapDay {
  /** Local YYYY-MM-DD key. */
  date: string;
  read: boolean;
  listened: boolean;
}

export interface WeeklyRecap {
  /** False when the whole window has neither reading nor listening. */
  hasActivity: boolean;
  /** Oldest → today, always RECAP_WINDOW_DAYS entries (drives the day strip). */
  days: WeeklyRecapDay[];
  /** Distinct days with any activity (reading OR listening). */
  daysActive: number;
  versesRead: number;
  /** Reading time within the window, in SECONDS (log basis). */
  readingSeconds: number;
  /** Listening time within the window, in MILLISECONDS (bucket basis). */
  listeningMs: number;
  versesHeard: number;
  readingStreak: number;
  listeningStreak: number;
}

/**
 * Compose the last-7-days recap from the raw per-day logs. Entries outside
 * the window are ignored; multiple log rows on one day (defensive) aggregate.
 */
export function buildWeeklyRecap(input: WeeklyRecapInput): WeeklyRecap {
  const {readingLog, listening, readingStreak, listeningStreak, now} = input;

  const readByDay = new Map<string, {verses: number; seconds: number}>();
  for (const entry of readingLog) {
    if (!entry || typeof entry.date !== 'string') continue;
    const prev = readByDay.get(entry.date) ?? {verses: 0, seconds: 0};
    readByDay.set(entry.date, {
      verses: prev.verses + Math.max(0, entry.versesRead || 0),
      seconds: prev.seconds + Math.max(0, entry.timeSpent || 0),
    });
  }

  const days: WeeklyRecapDay[] = [];
  let versesRead = 0;
  let readingSeconds = 0;
  let listeningMs = 0;
  let versesHeard = 0;

  for (let i = RECAP_WINDOW_DAYS - 1; i >= 0; i--) {
    const key = listeningDateKey(now - i * MS_PER_DAY);
    const read = readByDay.get(key);
    const listened = listening.days[key];

    const readVerses = read?.verses ?? 0;
    const heard = Math.max(0, listened?.verses ?? 0);
    const ms = Math.max(0, listened?.ms ?? 0);

    versesRead += readVerses;
    readingSeconds += read?.seconds ?? 0;
    versesHeard += heard;
    listeningMs += ms;

    days.push({
      date: key,
      read: readVerses > 0,
      listened: ms > 0 || heard > 0,
    });
  }

  const daysActive = days.filter(d => d.read || d.listened).length;

  return {
    hasActivity: daysActive > 0,
    days,
    daysActive,
    versesRead,
    readingSeconds,
    listeningMs,
    versesHeard,
    readingStreak: Math.max(0, readingStreak),
    listeningStreak: Math.max(0, listeningStreak),
  };
}
