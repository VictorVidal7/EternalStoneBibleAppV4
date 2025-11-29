/**
 * 🏆 EXPANDED ACHIEVEMENTS SYSTEM
 *
 * Sistema completo de logros con raridades y recompensas
 * Para la gloria de Dios y del Rey Jesús
 */

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface AchievementReward {
  type: 'theme' | 'badge' | 'title' | 'feature';
  id: string;
  name: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  rarity: AchievementRarity;
  category: 'reading' | 'consistency' | 'social' | 'exploration' | 'devotion';
  reward?: AchievementReward;
  requirement: {
    type: string;
    target: number;
  };
}

/**
 * Colores por raridad
 */
export const RARITY_COLORS = {
  common: {
    light: '#9CA3AF', // Gray
    dark: '#6B7280',
    gradient: ['#D1D5DB', '#9CA3AF'],
    glow: 'rgba(156, 163, 175, 0.3)',
  },
  uncommon: {
    light: '#10B981', // Green
    dark: '#059669',
    gradient: ['#34D399', '#10B981'],
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  rare: {
    light: '#3B82F6', // Blue
    dark: '#2563EB',
    gradient: ['#60A5FA', '#3B82F6'],
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  epic: {
    light: '#A855F7', // Purple
    dark: '#9333EA',
    gradient: ['#C084FC', '#A855F7'],
    glow: 'rgba(168, 85, 247, 0.3)',
  },
  legendary: {
    light: '#F59E0B', // Gold
    dark: '#D97706',
    gradient: ['#FBBF24', '#F59E0B'],
    glow: 'rgba(245, 158, 11, 0.4)',
  },
};

/**
 * Sistema de logros expandido
 */
export const EXPANDED_ACHIEVEMENTS: Achievement[] = [
  // ========== READING ACHIEVEMENTS ==========
  {
    id: 'first-chapter',
    title: 'Primer Paso',
    description: 'Lee tu primer capítulo de la Biblia',
    icon: 'book-outline',
    points: 50,
    rarity: 'common',
    category: 'reading',
    requirement: {
      type: 'chapters_read',
      target: 1,
    },
  },
  {
    id: 'chapter-milestone-10',
    title: 'Lector Dedicado',
    description: 'Lee 10 capítulos',
    icon: 'bookmark',
    points: 100,
    rarity: 'common',
    category: 'reading',
    requirement: {
      type: 'chapters_read',
      target: 10,
    },
  },
  {
    id: 'chapter-milestone-50',
    title: 'Estudiante de la Palabra',
    description: 'Lee 50 capítulos',
    icon: 'library',
    points: 300,
    rarity: 'uncommon',
    category: 'reading',
    requirement: {
      type: 'chapters_read',
      target: 50,
    },
  },
  {
    id: 'chapter-milestone-100',
    title: 'Explorador Bíblico',
    description: 'Lee 100 capítulos',
    icon: 'compass',
    points: 750,
    rarity: 'rare',
    category: 'reading',
    requirement: {
      type: 'chapters_read',
      target: 100,
    },
  },
  {
    id: 'chapter-milestone-500',
    title: 'Maestro de las Escrituras',
    description: 'Lee 500 capítulos',
    icon: 'school',
    points: 2500,
    rarity: 'epic',
    category: 'reading',
    requirement: {
      type: 'chapters_read',
      target: 500,
    },
    reward: {
      type: 'title',
      id: 'scripture-master',
      name: 'Maestro de las Escrituras',
    },
  },
  {
    id: 'full-bible',
    title: 'La Biblia Completa',
    description: 'Lee todos los 1189 capítulos de la Biblia',
    icon: 'trophy',
    points: 10000,
    rarity: 'legendary',
    category: 'reading',
    requirement: {
      type: 'chapters_read',
      target: 1189,
    },
    reward: {
      type: 'badge',
      id: 'bible-complete',
      name: 'Completista Bíblico',
    },
  },

  // Old Testament
  {
    id: 'old-testament-complete',
    title: 'Maestro del Antiguo Testamento',
    description: 'Completa todos los 39 libros del AT',
    icon: 'shield',
    points: 5000,
    rarity: 'legendary',
    category: 'reading',
    requirement: {
      type: 'old_testament_complete',
      target: 39,
    },
    reward: {
      type: 'theme',
      id: 'ancient-scrolls',
      name: 'Pergaminos Antiguos',
    },
  },

  // New Testament
  {
    id: 'new-testament-complete',
    title: 'Discípulo del Nuevo Testamento',
    description: 'Completa todos los 27 libros del NT',
    icon: 'heart',
    points: 3000,
    rarity: 'epic',
    category: 'reading',
    requirement: {
      type: 'new_testament_complete',
      target: 27,
    },
    reward: {
      type: 'theme',
      id: 'grace-light',
      name: 'Luz de la Gracia',
    },
  },

  // Speed Reading
  {
    id: 'speed-reader',
    title: 'Lector Veloz',
    description: 'Lee 10 capítulos en un día',
    icon: 'flash',
    points: 500,
    rarity: 'rare',
    category: 'reading',
    requirement: {
      type: 'chapters_in_day',
      target: 10,
    },
  },

  // ========== CONSISTENCY ACHIEVEMENTS ==========
  {
    id: 'streak-3',
    title: 'Hábito Emergente',
    description: 'Lee 3 días consecutivos',
    icon: 'flame',
    points: 100,
    rarity: 'common',
    category: 'consistency',
    requirement: {
      type: 'reading_streak',
      target: 3,
    },
  },
  {
    id: 'streak-7',
    title: 'Semana Dedicada',
    description: 'Lee 7 días consecutivos',
    icon: 'calendar',
    points: 250,
    rarity: 'uncommon',
    category: 'consistency',
    requirement: {
      type: 'reading_streak',
      target: 7,
    },
  },
  {
    id: 'streak-30',
    title: 'Mes Fiel',
    description: 'Lee 30 días consecutivos',
    icon: 'calendar-sharp',
    points: 1000,
    rarity: 'rare',
    category: 'consistency',
    requirement: {
      type: 'reading_streak',
      target: 30,
    },
  },
  {
    id: 'streak-100',
    title: 'Perseverancia Ejemplar',
    description: 'Lee 100 días consecutivos',
    icon: 'medal',
    points: 5000,
    rarity: 'epic',
    category: 'consistency',
    requirement: {
      type: 'reading_streak',
      target: 100,
    },
    reward: {
      type: 'feature',
      id: 'streak-protection',
      name: 'Protección de Racha',
    },
  },
  {
    id: 'streak-365',
    title: 'Dedicación Anual',
    description: 'Lee la Biblia 365 días consecutivos',
    icon: 'star',
    points: 10000,
    rarity: 'legendary',
    category: 'consistency',
    requirement: {
      type: 'reading_streak',
      target: 365,
    },
    reward: {
      type: 'badge',
      id: '365-champion',
      name: 'Campeón Anual',
    },
  },

  // ========== SOCIAL ACHIEVEMENTS ==========
  {
    id: 'first-share',
    title: 'Comparte la Palabra',
    description: 'Comparte tu primer versículo',
    icon: 'share-social',
    points: 50,
    rarity: 'common',
    category: 'social',
    requirement: {
      type: 'verses_shared',
      target: 1,
    },
  },
  {
    id: 'social-evangelist',
    title: 'Evangelista Social',
    description: 'Comparte 50 versículos',
    icon: 'megaphone',
    points: 1000,
    rarity: 'rare',
    category: 'social',
    requirement: {
      type: 'verses_shared',
      target: 50,
    },
  },

  // ========== EXPLORATION ACHIEVEMENTS ==========
  {
    id: 'book-explorer',
    title: 'Explorador de Libros',
    description: 'Lee capítulos de 10 libros diferentes',
    icon: 'map',
    points: 300,
    rarity: 'uncommon',
    category: 'exploration',
    requirement: {
      type: 'unique_books_read',
      target: 10,
    },
  },
  {
    id: 'testament-traveler',
    title: 'Viajero de Testamentos',
    description: 'Lee capítulos de ambos testamentos',
    icon: 'earth',
    points: 200,
    rarity: 'common',
    category: 'exploration',
    requirement: {
      type: 'both_testaments',
      target: 1,
    },
  },

  // ========== DEVOTION ACHIEVEMENTS ==========
  {
    id: 'psalm-lover',
    title: 'Amante de los Salmos',
    description: 'Lee todos los 150 Salmos',
    icon: 'musical-notes',
    points: 1500,
    rarity: 'epic',
    category: 'devotion',
    requirement: {
      type: 'book_complete_psalms',
      target: 150,
    },
    reward: {
      type: 'theme',
      id: 'worship-music',
      name: 'Música de Adoración',
    },
  },
  {
    id: 'gospel-reader',
    title: 'Lector de los Evangelios',
    description: 'Lee los 4 Evangelios completos',
    icon: 'cross',
    points: 1000,
    rarity: 'rare',
    category: 'devotion',
    requirement: {
      type: 'four_gospels',
      target: 4,
    },
  },
  {
    id: 'wisdom-seeker',
    title: 'Buscador de Sabiduría',
    description: 'Lee Proverbios, Eclesiastés y Job',
    icon: 'bulb',
    points: 800,
    rarity: 'uncommon',
    category: 'devotion',
    requirement: {
      type: 'wisdom_books',
      target: 3,
    },
  },
];

/**
 * Sistema de niveles
 */
export interface LevelDefinition {
  level: number;
  title: string;
  pointsRequired: number;
  icon: string;
  color: string;
}

export const LEVEL_SYSTEM: LevelDefinition[] = [
  {
    level: 1,
    title: 'Aprendiz',
    pointsRequired: 0,
    icon: 'seedling',
    color: '#9CA3AF',
  },
  {
    level: 2,
    title: 'Estudiante',
    pointsRequired: 100,
    icon: 'book',
    color: '#10B981',
  },
  {
    level: 3,
    title: 'Lector',
    pointsRequired: 300,
    icon: 'reader',
    color: '#3B82F6',
  },
  {
    level: 4,
    title: 'Explorador',
    pointsRequired: 750,
    icon: 'map',
    color: '#8B5CF6',
  },
  {
    level: 5,
    title: 'Discípulo',
    pointsRequired: 1500,
    icon: 'person',
    color: '#EC4899',
  },
  {
    level: 6,
    title: 'Devoto',
    pointsRequired: 3000,
    icon: 'heart',
    color: '#EF4444',
  },
  {
    level: 7,
    title: 'Erudito',
    pointsRequired: 5000,
    icon: 'school',
    color: '#F59E0B',
  },
  {
    level: 8,
    title: 'Maestro',
    pointsRequired: 8000,
    icon: 'ribbon',
    color: '#D97706',
  },
  {
    level: 9,
    title: 'Sabio',
    pointsRequired: 12000,
    icon: 'star-half',
    color: '#B45309',
  },
  {
    level: 10,
    title: 'Leyenda',
    pointsRequired: 20000,
    icon: 'trophy',
    color: '#FBBF24',
  },
];

/**
 * Get rarity display info
 */
export function getRarityInfo(
  rarity: AchievementRarity,
  isDark: boolean = false,
) {
  const colors = RARITY_COLORS[rarity];
  return {
    color: isDark ? colors.dark : colors.light,
    gradient: colors.gradient,
    glow: colors.glow,
    label: rarity.charAt(0).toUpperCase() + rarity.slice(1),
  };
}

/**
 * Get level from points
 */
export function getLevelFromPoints(points: number): LevelDefinition {
  for (let i = LEVEL_SYSTEM.length - 1; i >= 0; i--) {
    if (points >= LEVEL_SYSTEM[i].pointsRequired) {
      return LEVEL_SYSTEM[i];
    }
  }
  return LEVEL_SYSTEM[0];
}

/**
 * Get progress to next level
 */
export function getProgressToNextLevel(points: number): {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  progress: number;
  pointsToNext: number;
} {
  const currentLevel = getLevelFromPoints(points);
  const currentIndex = LEVEL_SYSTEM.findIndex(
    l => l.level === currentLevel.level,
  );
  const nextLevel =
    currentIndex < LEVEL_SYSTEM.length - 1
      ? LEVEL_SYSTEM[currentIndex + 1]
      : null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      pointsToNext: 0,
    };
  }

  const pointsInCurrentLevel = points - currentLevel.pointsRequired;
  const pointsNeededForNextLevel =
    nextLevel.pointsRequired - currentLevel.pointsRequired;
  const progress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;

  return {
    currentLevel,
    nextLevel,
    progress: Math.min(progress, 100),
    pointsToNext: nextLevel.pointsRequired - points,
  };
}
