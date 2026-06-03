import {
  specialAchievementsForHour,
  EARLY_BIRD_BEFORE_HOUR,
  NIGHT_OWL_FROM_HOUR,
  EARLY_BIRD_ID,
  NIGHT_OWL_ID,
} from '../src/lib/achievements/specialAchievements';
import {getCategoryProgress} from '../src/lib/achievements/progress';
import {AchievementCategory, UserStats} from '../src/lib/achievements/types';

function zeroStats(overrides: Partial<UserStats> = {}): UserStats {
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

describe('specialAchievements — time-of-day SPECIAL badges', () => {
  describe('the bug: SPECIAL has no backing progress', () => {
    it('getCategoryProgress(SPECIAL) is always 0 (so the generic loop can never unlock it)', () => {
      // This is WHY early_bird/night_owl need a dedicated event hook — the
      // generic checkAchievements loop compares 0 against requirement 1.
      expect(
        getCategoryProgress(AchievementCategory.SPECIAL, zeroStats()),
      ).toBe(0);
      expect(
        getCategoryProgress(AchievementCategory.SHARING, zeroStats()),
      ).toBe(0);
    });
  });

  describe('specialAchievementsForHour', () => {
    it('unlocks early_bird strictly before 6 AM', () => {
      expect(specialAchievementsForHour(0)).toContain(EARLY_BIRD_ID);
      expect(specialAchievementsForHour(5)).toContain(EARLY_BIRD_ID);
      expect(specialAchievementsForHour(EARLY_BIRD_BEFORE_HOUR - 1)).toContain(
        EARLY_BIRD_ID,
      );
    });

    it('does NOT unlock early_bird at 6 AM or later', () => {
      expect(specialAchievementsForHour(EARLY_BIRD_BEFORE_HOUR)).not.toContain(
        EARLY_BIRD_ID,
      );
      expect(specialAchievementsForHour(9)).not.toContain(EARLY_BIRD_ID);
    });

    it('unlocks night_owl at or after 11 PM', () => {
      expect(specialAchievementsForHour(NIGHT_OWL_FROM_HOUR)).toContain(
        NIGHT_OWL_ID,
      );
      expect(specialAchievementsForHour(23)).toContain(NIGHT_OWL_ID);
    });

    it('does NOT unlock night_owl before 11 PM', () => {
      expect(specialAchievementsForHour(NIGHT_OWL_FROM_HOUR - 1)).not.toContain(
        NIGHT_OWL_ID,
      );
      expect(specialAchievementsForHour(22)).not.toContain(NIGHT_OWL_ID);
    });

    it('unlocks neither during ordinary daytime hours', () => {
      for (let h = EARLY_BIRD_BEFORE_HOUR; h < NIGHT_OWL_FROM_HOUR; h++) {
        expect(specialAchievementsForHour(h)).toEqual([]);
      }
    });

    it('is defensive against a non-finite hour', () => {
      expect(specialAchievementsForHour(NaN)).toEqual([]);
      expect(specialAchievementsForHour(Infinity)).toEqual([]);
    });
  });
});
