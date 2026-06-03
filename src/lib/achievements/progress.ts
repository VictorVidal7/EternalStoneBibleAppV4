/**
 * 🎯 achievementProgress — PURE category → current-progress mapping.
 *
 * Extracted from `AchievementService.getProgressForAchievement` so the
 * progress math is unit-testable in isolation (no SQLite, no React). The
 * service now delegates here; behaviour is byte-identical EXCEPT the TIME fix
 * below.
 *
 * ⚠️ Sprint 62 bug fix — the 60× TIME error: `total_reading_time` is stored in
 * **SECONDS** (the reader writes `(Date.now()-start)/1000`), but every TIME
 * achievement's `requirement` is expressed in **MINUTES** ("Read for 60
 * accumulated minutes" → requirement 60). The old code compared raw seconds
 * against a minutes target, so "One Hour of Reading" unlocked after 60 SECONDS
 * (~60× too early). We now convert seconds → whole minutes for the TIME
 * category, so the targets mean what they say. Already-unlocked achievements
 * stay unlocked (we never re-lock); only future progress is corrected.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {AchievementCategory} from './types';
import type {UserStats} from './types';

const SECONDS_PER_MINUTE = 60;

/**
 * Current progress value for an achievement category, in the SAME unit its
 * `requirement` is calibrated in (counts for most; whole MINUTES for TIME).
 * Categories without a backing stat (SHARING/SPECIAL) report 0, as before.
 */
export function getCategoryProgress(
  category: AchievementCategory,
  stats: UserStats,
): number {
  switch (category) {
    case AchievementCategory.READING:
      return stats.totalVersesRead;
    case AchievementCategory.STREAK:
      return Math.max(stats.currentStreak, stats.longestStreak);
    case AchievementCategory.CHAPTERS:
      return stats.totalChaptersRead;
    case AchievementCategory.BOOKS:
      return stats.totalBooksCompleted;
    case AchievementCategory.HIGHLIGHTS:
      return stats.totalHighlights;
    case AchievementCategory.NOTES:
      return stats.totalNotes;
    case AchievementCategory.SEARCH:
      return stats.totalSearches;
    case AchievementCategory.TIME:
      // Stored seconds → whole minutes (TIME requirements are in minutes).
      return Math.floor((stats.totalReadingTime ?? 0) / SECONDS_PER_MINUTE);
    default:
      return 0;
  }
}
