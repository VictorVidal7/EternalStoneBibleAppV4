/**
 * Definitions of all available achievements
 */

import { Achievement, AchievementCategory, AchievementTier } from './types';
import { translations, Language } from '../../i18n/translations';

// Static achievement data (IDs, icons, requirements, points, etc.)
const ACHIEVEMENT_DATA = [
  // READING ACHIEVEMENTS
  {
    id: 'first_verse',
    icon: '👶',
    category: AchievementCategory.READING,
    requirement: 1,
    points: 10,
    tier: AchievementTier.BRONZE,
  },
  {
    id: 'verses_10',
    icon: '📖',
    category: AchievementCategory.READING,
    requirement: 10,
    points: 10,
    tier: AchievementTier.BRONZE,
  },
  {
    id: 'verses_100',
    icon: '📚',
    category: AchievementCategory.READING,
    requirement: 100,
    points: 25,
    tier: AchievementTier.SILVER,
  },
  {
    id: 'verses_500',
    icon: '✨',
    category: AchievementCategory.READING,
    requirement: 500,
    points: 50,
    tier: AchievementTier.GOLD,
  },
  {
    id: 'verses_1000',
    icon: '⭐',
    category: AchievementCategory.READING,
    requirement: 1000,
    points: 100,
    tier: AchievementTier.PLATINUM,
  },
  {
    id: 'verses_5000',
    icon: '💎',
    category: AchievementCategory.READING,
    requirement: 5000,
    points: 200,
    tier: AchievementTier.DIAMOND,
  },

  // STREAK ACHIEVEMENTS
  {
    id: 'streak_3',
    icon: '🔥',
    category: AchievementCategory.STREAK,
    requirement: 3,
    points: 10,
    tier: AchievementTier.BRONZE,
  },
  {
    id: 'streak_7',
    icon: '📅',
    category: AchievementCategory.STREAK,
    requirement: 7,
    points: 25,
    tier: AchievementTier.SILVER,
  },
  {
    id: 'streak_30',
    icon: '🏆',
    category: AchievementCategory.STREAK,
    requirement: 30,
    points: 50,
    tier: AchievementTier.GOLD,
  },
  {
    id: 'streak_100',
    icon: '💪',
    category: AchievementCategory.STREAK,
    requirement: 100,
    points: 100,
    tier: AchievementTier.PLATINUM,
  },
  {
    id: 'streak_365',
    icon: '👑',
    category: AchievementCategory.STREAK,
    requirement: 365,
    points: 200,
    tier: AchievementTier.DIAMOND,
  },

  // CHAPTER ACHIEVEMENTS
  {
    id: 'first_chapter',
    icon: '📄',
    category: AchievementCategory.CHAPTERS,
    requirement: 1,
    points: 10,
    tier: AchievementTier.BRONZE,
  },
  {
    id: 'chapters_10',
    icon: '🗺️',
    category: AchievementCategory.CHAPTERS,
    requirement: 10,
    points: 25,
    tier: AchievementTier.SILVER,
  },
  {
    id: 'chapters_50',
    icon: '🚶',
    category: AchievementCategory.CHAPTERS,
    requirement: 50,
    points: 50,
    tier: AchievementTier.GOLD,
  },
  {
    id: 'chapters_150',
    icon: '⚔️',
    category: AchievementCategory.CHAPTERS,
    requirement: 150,
    points: 100,
    tier: AchievementTier.PLATINUM,
  },

  // BOOK ACHIEVEMENTS
  {
    id: 'first_book',
    icon: '📕',
    category: AchievementCategory.BOOKS,
    requirement: 1,
    points: 25,
    tier: AchievementTier.SILVER,
  },
  {
    id: 'books_5',
    icon: '📗',
    category: AchievementCategory.BOOKS,
    requirement: 5,
    points: 50,
    tier: AchievementTier.GOLD,
  },
  {
    id: 'books_27',
    icon: '✝️',
    category: AchievementCategory.BOOKS,
    requirement: 27,
    points: 100,
    tier: AchievementTier.PLATINUM,
  },
  {
    id: 'books_39',
    icon: '📜',
    category: AchievementCategory.BOOKS,
    requirement: 39,
    points: 100,
    tier: AchievementTier.PLATINUM,
  },
  {
    id: 'books_66',
    icon: '🎉',
    category: AchievementCategory.BOOKS,
    requirement: 66,
    points: 200,
    tier: AchievementTier.DIAMOND,
  },

  // HIGHLIGHT ACHIEVEMENTS
  {
    id: 'first_highlight',
    icon: '🖍️',
    category: AchievementCategory.HIGHLIGHTS,
    requirement: 1,
    points: 10,
    tier: AchievementTier.BRONZE,
  },
  {
    id: 'highlights_25',
    icon: '💛',
    category: AchievementCategory.HIGHLIGHTS,
    requirement: 25,
    points: 25,
    tier: AchievementTier.SILVER,
  },
  {
    id: 'highlights_100',
    icon: '🌟',
    category: AchievementCategory.HIGHLIGHTS,
    requirement: 100,
    points: 50,
    tier: AchievementTier.GOLD,
  },

  // NOTE ACHIEVEMENTS
  {
    id: 'first_note',
    icon: '📝',
    category: AchievementCategory.NOTES,
    requirement: 1,
    points: 10,
    tier: AchievementTier.BRONZE,
  },
  {
    id: 'notes_50',
    icon: '📔',
    category: AchievementCategory.NOTES,
    requirement: 50,
    points: 50,
    tier: AchievementTier.GOLD,
  },

  // SEARCH ACHIEVEMENTS
  {
    id: 'first_search',
    icon: '🔍',
    category: AchievementCategory.SEARCH,
    requirement: 1,
    points: 10,
    tier: AchievementTier.BRONZE,
  },
  {
    id: 'searches_50',
    icon: '🔎',
    category: AchievementCategory.SEARCH,
    requirement: 50,
    points: 25,
    tier: AchievementTier.SILVER,
  },

  // TIME ACHIEVEMENTS
  {
    id: 'time_60',
    icon: '⏰',
    category: AchievementCategory.TIME,
    requirement: 60,
    points: 25,
    tier: AchievementTier.SILVER,
  },
  {
    id: 'time_300',
    icon: '⏳',
    category: AchievementCategory.TIME,
    requirement: 300,
    points: 50,
    tier: AchievementTier.GOLD,
  },
  {
    id: 'time_1000',
    icon: '📚',
    category: AchievementCategory.TIME,
    requirement: 1000,
    points: 100,
    tier: AchievementTier.PLATINUM,
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'psalms_complete',
    icon: '🎵',
    category: AchievementCategory.SPECIAL,
    requirement: 1,
    points: 50,
    tier: AchievementTier.GOLD,
  },
  {
    id: 'proverbs_complete',
    icon: '💡',
    category: AchievementCategory.SPECIAL,
    requirement: 1,
    points: 50,
    tier: AchievementTier.GOLD,
  },
  {
    id: 'gospels_complete',
    icon: '📯',
    category: AchievementCategory.SPECIAL,
    requirement: 4,
    points: 100,
    tier: AchievementTier.PLATINUM,
  },
  {
    id: 'early_bird',
    icon: '🌅',
    category: AchievementCategory.SPECIAL,
    requirement: 1,
    points: 25,
    tier: AchievementTier.SILVER,
  },
  {
    id: 'night_owl',
    icon: '🦉',
    category: AchievementCategory.SPECIAL,
    requirement: 1,
    points: 25,
    tier: AchievementTier.SILVER,
  },
];

// Get achievement definitions with translations
export function getAchievementDefinitions(language: Language = 'en'): Omit<Achievement, 'currentProgress' | 'isUnlocked' | 'unlockedAt'>[] {
  const t = translations[language];
  return ACHIEVEMENT_DATA.map(achievement => ({
    ...achievement,
    name: t.achievements.achievementsList[achievement.id as keyof typeof t.achievements.achievementsList].name,
    description: t.achievements.achievementsList[achievement.id as keyof typeof t.achievements.achievementsList].description,
  }));
}

// Legacy export for backward compatibility (defaults to English)
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'currentProgress' | 'isUnlocked' | 'unlockedAt'>[] = getAchievementDefinitions('en');
