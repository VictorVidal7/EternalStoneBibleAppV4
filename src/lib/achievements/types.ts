/**
 * Sistema de Logros y Gamificación
 * Motiva a los usuarios a leer más la Biblia con logros, rachas y niveles
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
  // Lectura
  totalVersesRead: number;
  totalChaptersRead: number;
  totalBooksCompleted: number;
  totalReadingTime: number; // en minutos

  // Rachas
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string; // ISO date

  // Interacción
  totalHighlights: number;
  totalNotes: number;
  totalBookmarks: number;
  totalSearches: number;
  totalShares: number;

  // Nivel
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;

  // Logros
  achievementsUnlocked: number;
  totalAchievements: number;
}

export interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;
  streakDates: string[]; // Array de fechas ISO
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

// Niveles de usuario
export const USER_LEVELS: LevelInfo[] = [
  { level: 1, title: 'Aprendiz', icon: '🌱', minPoints: 0, maxPoints: 100, benefits: ['Acceso básico'] },
  { level: 2, title: 'Lector', icon: '📖', minPoints: 100, maxPoints: 250, benefits: ['Destacados desbloqueados'] },
  { level: 3, title: 'Estudiante', icon: '📚', minPoints: 250, maxPoints: 500, benefits: ['Notas avanzadas'] },
  { level: 4, title: 'Discípulo', icon: '✝️', minPoints: 500, maxPoints: 1000, benefits: ['Temas personalizados'] },
  { level: 5, title: 'Maestro', icon: '👨‍🏫', minPoints: 1000, maxPoints: 2000, benefits: ['Estadísticas detalladas'] },
  { level: 6, title: 'Erudito', icon: '🎓', minPoints: 2000, maxPoints: 4000, benefits: ['Exportar datos'] },
  { level: 7, title: 'Sabio', icon: '🧙', minPoints: 4000, maxPoints: 8000, benefits: ['Insignias especiales'] },
  { level: 8, title: 'Profeta', icon: '🔮', minPoints: 8000, maxPoints: 15000, benefits: ['Todo desbloqueado'] },
  { level: 9, title: 'Apóstol', icon: '⚡', minPoints: 15000, maxPoints: 30000, benefits: ['Rango élite'] },
  { level: 10, title: 'Leyenda', icon: '👑', minPoints: 30000, maxPoints: Infinity, benefits: ['Maestría total'] },
];

// Calcular nivel basado en puntos
export function calculateLevel(points: number): LevelInfo {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (points >= USER_LEVELS[i].minPoints) {
      return USER_LEVELS[i];
    }
  }
  return USER_LEVELS[0];
}

// Calcular progreso al siguiente nivel
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
