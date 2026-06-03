import {getCategoryProgress} from '../src/lib/achievements/progress';
import {AchievementCategory, UserStats} from '../src/lib/achievements/types';

/** A zeroed UserStats with overrides applied. */
function stats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    totalVersesRead: 0,
    totalChaptersRead: 0,
    totalBooksCompleted: 0,
    totalReadingTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: '',
    totalHighlights: 0,
    totalNotes: 0,
    totalFavorites: 0,
    totalBookmarks: 0,
    totalSearches: 0,
    totalShares: 0,
    level: 1,
    totalPoints: 0,
    pointsToNextLevel: 0,
    achievementsUnlocked: 0,
    totalAchievements: 0,
    ...overrides,
  };
}

describe('getCategoryProgress', () => {
  it('maps the count-based categories straight through', () => {
    const s = stats({
      totalVersesRead: 1422,
      totalChaptersRead: 46,
      totalBooksCompleted: 2,
      totalHighlights: 12,
      totalNotes: 7,
      totalSearches: 30,
    });
    expect(getCategoryProgress(AchievementCategory.READING, s)).toBe(1422);
    expect(getCategoryProgress(AchievementCategory.CHAPTERS, s)).toBe(46);
    expect(getCategoryProgress(AchievementCategory.BOOKS, s)).toBe(2);
    expect(getCategoryProgress(AchievementCategory.HIGHLIGHTS, s)).toBe(12);
    expect(getCategoryProgress(AchievementCategory.NOTES, s)).toBe(7);
    expect(getCategoryProgress(AchievementCategory.SEARCH, s)).toBe(30);
  });

  it('uses the larger of current/longest streak', () => {
    expect(
      getCategoryProgress(
        AchievementCategory.STREAK,
        stats({currentStreak: 3, longestStreak: 10}),
      ),
    ).toBe(10);
  });

  it('reports 0 for categories without a backing stat (SHARING/SPECIAL)', () => {
    const s = stats({totalShares: 99});
    expect(getCategoryProgress(AchievementCategory.SHARING, s)).toBe(0);
    expect(getCategoryProgress(AchievementCategory.SPECIAL, s)).toBe(0);
  });

  describe('TIME — the 60× bug (Sprint 62)', () => {
    // total_reading_time is stored in SECONDS; TIME requirements are in MINUTES.
    it('converts stored seconds to whole minutes', () => {
      // 60 seconds is ONE minute of reading — not 60 (the old bug).
      expect(
        getCategoryProgress(
          AchievementCategory.TIME,
          stats({totalReadingTime: 60}),
        ),
      ).toBe(1);
      // The "One Hour of Reading" achievement (requirement 60 minutes) must
      // need a full hour = 3600 seconds, NOT 60 seconds.
      expect(
        getCategoryProgress(
          AchievementCategory.TIME,
          stats({totalReadingTime: 3600}),
        ),
      ).toBe(60);
      // 1000-minute "Dedicated Student" needs 60_000 seconds.
      expect(
        getCategoryProgress(
          AchievementCategory.TIME,
          stats({totalReadingTime: 60_000}),
        ),
      ).toBe(1000);
    });

    it('floors partial minutes and tolerates undefined', () => {
      expect(
        getCategoryProgress(
          AchievementCategory.TIME,
          stats({totalReadingTime: 119}),
        ),
      ).toBe(1); // 1m 59s → 1m
      expect(
        getCategoryProgress(
          AchievementCategory.TIME,
          stats({totalReadingTime: undefined as unknown as number}),
        ),
      ).toBe(0);
    });
  });
});
