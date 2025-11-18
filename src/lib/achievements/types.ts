/**
 * Achievement and Gamification System
 * Motivates users to read the Bible more with achievements, streaks and levels
 */

import { translations, Language } from '../../i18n/translations';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  points: number;
  tier: AchievementTier;
}

export enum AchievementCategory {
  READING = 'reading',
  STREAK = 'streak',
  CHAPTERS = 'chapters',
  BOOKS = 'books',
  HIGHLIGHTS = 'highlights',
  NOTES = 'notes',
  SEARCH = 'search',
  SHARING = 'sharing',
  TIME = 'time',
  SPECIAL = 'special',
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export interface UserStats {
  // Reading
  totalVersesRead: number;
  totalChaptersRead: number;
  totalBooksCompleted: number;
  totalReadingTime: number; // in minutes

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string; // ISO date

  // Interaction
  totalHighlights: number;
  totalNotes: number;
  totalBookmarks: number;
  totalSearches: number;
  totalShares: number;

  // Level
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;

  // Achievements
  achievementsUnlocked: number;
  totalAchievements: number;
}

export interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;
  streakDates: string[]; // Array of ISO dates
}

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
}

export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  [AchievementTier.BRONZE]: '#CD7F32',
  [AchievementTier.SILVER]: '#C0C0C0',
  [AchievementTier.GOLD]: '#FFD700',
  [AchievementTier.PLATINUM]: '#E5E4E2',
  [AchievementTier.DIAMOND]: '#B9F2FF',
};

export const ACHIEVEMENT_TIER_POINTS: Record<AchievementTier, number> = {
  [AchievementTier.BRONZE]: 10,
  [AchievementTier.SILVER]: 25,
  [AchievementTier.GOLD]: 50,
  [AchievementTier.PLATINUM]: 100,
  [AchievementTier.DIAMOND]: 200,
};

// User levels with static data (icons and points)
const USER_LEVELS_DATA = [
  { level: 1, icon: '🌱', minPoints: 0, maxPoints: 100 },
  { level: 2, icon: '📖', minPoints: 100, maxPoints: 250 },
  { level: 3, icon: '📚', minPoints: 250, maxPoints: 500 },
  { level: 4, icon: '✝️', minPoints: 500, maxPoints: 1000 },
  { level: 5, icon: '👨‍🏫', minPoints: 1000, maxPoints: 2000 },
  { level: 6, icon: '🎓', minPoints: 2000, maxPoints: 4000 },
  { level: 7, icon: '🧙', minPoints: 4000, maxPoints: 8000 },
  { level: 8, icon: '🔮', minPoints: 8000, maxPoints: 15000 },
  { level: 9, icon: '⚡', minPoints: 15000, maxPoints: 30000 },
  { level: 10, icon: '👑', minPoints: 30000, maxPoints: Infinity },
];

// Get user levels with translations
export function getUserLevels(language: Language = 'en'): LevelInfo[] {
  const t = translations[language];
  return USER_LEVELS_DATA.map(level => ({
    ...level,
    title: t.achievements.levels[level.level as keyof typeof t.achievements.levels].title,
    benefits: [t.achievements.levels[level.level as keyof typeof t.achievements.levels].benefits],
  }));
}

// Legacy export for backward compatibility (defaults to English)
export const USER_LEVELS: LevelInfo[] = getUserLevels('en');

// Calculate level based on points
export function calculateLevel(points: number, language: Language = 'en'): LevelInfo {
  const levels = getUserLevels(language);
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].minPoints) {
      return levels[i];
    }
  }
  return levels[0];
}

// Calculate progress to next level
export function calculateLevelProgress(points: number, language: Language = 'en'): {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo | null;
  progress: number; // 0-100
  pointsNeeded: number;
} {
  const levels = getUserLevels(language);
  const currentLevel = calculateLevel(points, language);
  const currentIndex = levels.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      pointsNeeded: 0,
    };
  }

  const pointsInLevel = points - currentLevel.minPoints;
  const pointsForLevel = nextLevel.minPoints - currentLevel.minPoints;
  const progress = Math.min(100, (pointsInLevel / pointsForLevel) * 100);
  const pointsNeeded = nextLevel.minPoints - points;

  return {
    currentLevel,
    nextLevel,
    progress,
    pointsNeeded,
  };
}
