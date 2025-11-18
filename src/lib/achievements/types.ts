/**
 * Achievement and Gamification System
 * Motivates users to read the Bible more with achievements, streaks and levels
 */

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

// User levels
export const USER_LEVELS: LevelInfo[] = [
  { level: 1, title: 'Apprentice', icon: '🌱', minPoints: 0, maxPoints: 100, benefits: ['Basic access'] },
  { level: 2, title: 'Reader', icon: '📖', minPoints: 100, maxPoints: 250, benefits: ['Highlights unlocked'] },
  { level: 3, title: 'Student', icon: '📚', minPoints: 250, maxPoints: 500, benefits: ['Advanced notes'] },
  { level: 4, title: 'Disciple', icon: '✝️', minPoints: 500, maxPoints: 1000, benefits: ['Custom themes'] },
  { level: 5, title: 'Teacher', icon: '👨‍🏫', minPoints: 1000, maxPoints: 2000, benefits: ['Detailed statistics'] },
  { level: 6, title: 'Scholar', icon: '🎓', minPoints: 2000, maxPoints: 4000, benefits: ['Export data'] },
  { level: 7, title: 'Sage', icon: '🧙', minPoints: 4000, maxPoints: 8000, benefits: ['Special badges'] },
  { level: 8, title: 'Prophet', icon: '🔮', minPoints: 8000, maxPoints: 15000, benefits: ['Everything unlocked'] },
  { level: 9, title: 'Apostle', icon: '⚡', minPoints: 15000, maxPoints: 30000, benefits: ['Elite rank'] },
  { level: 10, title: 'Legend', icon: '👑', minPoints: 30000, maxPoints: Infinity, benefits: ['Total mastery'] },
];

// Calculate level based on points
export function calculateLevel(points: number): LevelInfo {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (points >= USER_LEVELS[i].minPoints) {
      return USER_LEVELS[i];
    }
  }
  return USER_LEVELS[0];
}

// Calculate progress to next level
export function calculateLevelProgress(points: number): {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo | null;
  progress: number; // 0-100
  pointsNeeded: number;
} {
  const currentLevel = calculateLevel(points);
  const currentIndex = USER_LEVELS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = currentIndex < USER_LEVELS.length - 1 ? USER_LEVELS[currentIndex + 1] : null;

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
