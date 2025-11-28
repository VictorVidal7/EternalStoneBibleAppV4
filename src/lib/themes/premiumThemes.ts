/**
 * 🎨 PREMIUM THEMES SYSTEM
 *
 * Sistema de temas premium personalizables con:
 * - 10+ temas únicos y hermosos
 * - Gradientes animados
 * - Efectos de partículas
 * - Sonidos ambientales (opcional)
 * - Sistema de desbloqueo por logros/nivel/compra
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export enum ThemeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

export enum UnlockMethod {
  DEFAULT = 'default',
  ACHIEVEMENT = 'achievement',
  LEVEL = 'level',
  STREAK = 'streak',
  PURCHASE = 'purchase',
  EVENT = 'event',
}

export interface PremiumThemeColors {
  // Base colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Gradients (arrays of colors)
  primaryGradient: string[];
  secondaryGradient: string[];
  backgroundGradient: string[];
  headerGradient: string[];

  // Special effects
  glow: string;
  shimmer: string;
  particle: string;
  shadow: string;

  // UI Elements
  border: string;
  divider: string;
  highlight: string;
  overlay: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export interface PremiumTheme {
  id: string;
  name: string;
  description: string;
  preview: string; // Preview image URL or emoji
  rarity: ThemeRarity;
  unlockMethod: UnlockMethod;
  unlockRequirement?: number; // Level, streak days, achievement count, etc.

  // Theme configuration
  isDark: boolean;
  colors: PremiumThemeColors;

  // Visual effects
  hasParticles: boolean;
  particleConfig?: {
    type: 'stars' | 'sparkles' | 'leaves' | 'light';
    count: number;
    color: string;
  };

  hasAnimation: boolean;
  animationType?: 'gradient' | 'pulse' | 'shimmer' | 'wave';

  // Sound
  hasAmbientSound: boolean;
  ambientSoundUrl?: string;
}

// ==================== PREMIUM THEMES DEFINITIONS ====================

export const PREMIUM_THEMES: Record<string, PremiumTheme> = {
  // DEFAULT THEMES (Always unlocked)
  default_light: {
    id: 'default_light',
    name: 'Luz Celestial',
    description: 'Tema claro por defecto con colores suaves y profesionales',
    preview: '☀️',
    rarity: ThemeRarity.COMMON,
    unlockMethod: UnlockMethod.DEFAULT,
    isDark: false,
    colors: {
      primary: '#4A90E2',
      primaryLight: '#E8F4FD',
      primaryDark: '#2471C7',
      secondary: '#9B59B6',
      accent: '#27AE60',

      background: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceVariant: '#F8F9FA',

      text: '#2C3E50',
      textSecondary: '#7F8C8D',
      textTertiary: '#95A5A6',

      primaryGradient: ['#4A90E2', '#5DA3F5', '#7DB8FF'],
      secondaryGradient: ['#9B59B6', '#B380CC', '#CDA7E0'],
      backgroundGradient: ['#F8F9FA', '#FFFFFF', '#F8F9FA'],
      headerGradient: ['#4A90E2', '#3B7EC7'],

      glow: 'rgba(74, 144, 226, 0.3)',
      shimmer: 'rgba(255, 255, 255, 0.5)',
      particle: 'rgba(74, 144, 226, 0.4)',
      shadow: 'rgba(0, 0, 0, 0.1)',

      border: '#ECF0F1',
      divider: '#E0E0E0',
      highlight: '#FFF9C4',
      overlay: 'rgba(0, 0, 0, 0.5)',
      success: '#27AE60',
      error: '#E74C3C',
      warning: '#F39C12',
      info: '#4A90E2',
    },
    hasParticles: false,
    hasAnimation: false,
    hasAmbientSound: false,
  },

  default_dark: {
    id: 'default_dark',
    name: 'Noche Serena',
    description: 'Tema oscuro por defecto, suave para los ojos',
    preview: '🌙',
    rarity: ThemeRarity.COMMON,
    unlockMethod: UnlockMethod.DEFAULT,
    isDark: true,
    colors: {
      primary: '#5DA3F5',
      primaryLight: '#1A3A52',
      primaryDark: '#7DB8FF',
      secondary: '#B380CC',
      accent: '#81C995',

      background: '#121212',
      surface: '#1E1E1E',
      surfaceVariant: '#2C2C2C',

      text: '#E8EAED',
      textSecondary: '#9AA0A6',
      textTertiary: '#6E7681',

      primaryGradient: ['#5DA3F5', '#4A90E2', '#3B7EC7'],
      secondaryGradient: ['#B380CC', '#9B59B6', '#8B4AB8'],
      backgroundGradient: ['#121212', '#1A1A1A', '#0A0A0A'],
      headerGradient: ['#1E1E1E', '#2C2C2C'],

      glow: 'rgba(93, 163, 245, 0.4)',
      shimmer: 'rgba(255, 255, 255, 0.1)',
      particle: 'rgba(93, 163, 245, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.5)',

      border: '#3C3C3C',
      divider: '#2C2C2C',
      highlight: '#3E3A2F',
      overlay: 'rgba(0, 0, 0, 0.7)',
      success: '#81C995',
      error: '#F28B82',
      warning: '#FDD663',
      info: '#5DA3F5',
    },
    hasParticles: false,
    hasAnimation: false,
    hasAmbientSound: false,
  },

  // LEGENDARY THEMES
  galaxy: {
    id: 'galaxy',
    name: 'Galaxia Celestial',
    description:
      'Explora el cosmos mientras lees la Palabra. Estrellas flotantes y colores profundos del espacio.',
    preview: '🌌',
    rarity: ThemeRarity.LEGENDARY,
    unlockMethod: UnlockMethod.LEVEL,
    unlockRequirement: 8, // Nivel 8
    isDark: true,
    colors: {
      primary: '#A78BFA',
      primaryLight: '#C4B5FD',
      primaryDark: '#8B5CF6',
      secondary: '#F472B6',
      accent: '#60A5FA',

      background: '#0A0E27',
      surface: '#1A1F3A',
      surfaceVariant: '#252B4F',

      text: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textTertiary: '#94A3B8',

      primaryGradient: ['#312e81', '#4c1d95', '#5b21b6', '#6d28d9'],
      secondaryGradient: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff'],
      backgroundGradient: ['#0A0E27', '#1A1F3A', '#252B4F', '#312E81'],
      headerGradient: ['#4c1d95', '#6d28d9'],

      glow: 'rgba(167, 139, 250, 0.5)',
      shimmer: 'rgba(196, 181, 253, 0.3)',
      particle: 'rgba(168, 162, 251, 0.6)',
      shadow: 'rgba(109, 40, 217, 0.4)',

      border: '#374151',
      divider: '#1F2937',
      highlight: '#4C1D95',
      overlay: 'rgba(10, 14, 39, 0.9)',
      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
      info: '#60A5FA',
    },
    hasParticles: true,
    particleConfig: {
      type: 'stars',
      count: 50,
      color: '#E9D5FF',
    },
    hasAnimation: true,
    animationType: 'shimmer',
    hasAmbientSound: false,
  },

  sunrise: {
    id: 'sunrise',
    name: 'Amanecer Divino',
    description:
      'Los colores cálidos del amanecer te acompañan. Transición suave de noche a día.',
    preview: '🌅',
    rarity: ThemeRarity.EPIC,
    unlockMethod: UnlockMethod.ACHIEVEMENT,
    unlockRequirement: 20, // 20 logros desbloqueados
    isDark: false,
    colors: {
      primary: '#F59E0B',
      primaryLight: '#FDE68A',
      primaryDark: '#D97706',
      secondary: '#EC4899',
      accent: '#8B5CF6',

      background: '#FFF7ED',
      surface: '#FFFFFF',
      surfaceVariant: '#FEF3C7',

      text: '#78350F',
      textSecondary: '#92400E',
      textTertiary: '#B45309',

      primaryGradient: ['#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B'],
      secondaryGradient: ['#FECACA', '#FCA5A5', '#F87171', '#EF4444'],
      backgroundGradient: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#FDBA74'],
      headerGradient: ['#F59E0B', '#D97706'],

      glow: 'rgba(245, 158, 11, 0.4)',
      shimmer: 'rgba(254, 243, 199, 0.6)',
      particle: 'rgba(252, 211, 77, 0.5)',
      shadow: 'rgba(217, 119, 6, 0.2)',

      border: '#FED7AA',
      divider: '#FDBA74',
      highlight: '#FEF3C7',
      overlay: 'rgba(120, 53, 15, 0.4)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    hasParticles: true,
    particleConfig: {
      type: 'light',
      count: 30,
      color: '#FCD34D',
    },
    hasAnimation: true,
    animationType: 'gradient',
    hasAmbientSound: false,
  },

  garden: {
    id: 'garden',
    name: 'Jardín del Edén',
    description:
      'Naturaleza exuberante y paz. Tonos verdes vibrantes que renuevan el alma.',
    preview: '🌿',
    rarity: ThemeRarity.EPIC,
    unlockMethod: UnlockMethod.STREAK,
    unlockRequirement: 30, // 30 días de racha
    isDark: false,
    colors: {
      primary: '#10B981',
      primaryLight: '#6EE7B7',
      primaryDark: '#059669',
      secondary: '#14B8A6',
      accent: '#84CC16',

      background: '#F0FDF4',
      surface: '#FFFFFF',
      surfaceVariant: '#DCFCE7',

      text: '#064E3B',
      textSecondary: '#065F46',
      textTertiary: '#047857',

      primaryGradient: ['#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981'],
      secondaryGradient: ['#CCFBF1', '#99F6E4', '#5EEAD4', '#2DD4BF'],
      backgroundGradient: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'],
      headerGradient: ['#10B981', '#059669'],

      glow: 'rgba(16, 185, 129, 0.4)',
      shimmer: 'rgba(167, 243, 208, 0.5)',
      particle: 'rgba(110, 231, 183, 0.6)',
      shadow: 'rgba(5, 150, 105, 0.2)',

      border: '#BBF7D0',
      divider: '#86EFAC',
      highlight: '#D1FAE5',
      overlay: 'rgba(6, 78, 59, 0.4)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    hasParticles: true,
    particleConfig: {
      type: 'leaves',
      count: 25,
      color: '#6EE7B7',
    },
    hasAnimation: true,
    animationType: 'wave',
    hasAmbientSound: false,
  },

  cathedral: {
    id: 'cathedral',
    name: 'Catedral Gótica',
    description:
      'Majestuosidad y reverencia. Vitrales coloridos filtran la luz divina.',
    preview: '⛪',
    rarity: ThemeRarity.LEGENDARY,
    unlockMethod: UnlockMethod.LEVEL,
    unlockRequirement: 10, // Nivel 10 (Leyenda)
    isDark: true,
    colors: {
      primary: '#9333EA',
      primaryLight: '#C084FC',
      primaryDark: '#7E22CE',
      secondary: '#DC2626',
      accent: '#FBBF24',

      background: '#18181B',
      surface: '#27272A',
      surfaceVariant: '#3F3F46',

      text: '#FAFAF9',
      textSecondary: '#D4D4D8',
      textTertiary: '#A1A1AA',

      primaryGradient: ['#581C87', '#6B21A8', '#7C3AED', '#8B5CF6', '#A78BFA'],
      secondaryGradient: ['#991B1B', '#B91C1C', '#DC2626', '#EF4444'],
      backgroundGradient: ['#09090B', '#18181B', '#27272A', '#3F3F46'],
      headerGradient: ['#6B21A8', '#7C3AED'],

      glow: 'rgba(147, 51, 234, 0.6)',
      shimmer: 'rgba(192, 132, 252, 0.4)',
      particle: 'rgba(167, 139, 250, 0.5)',
      shadow: 'rgba(126, 34, 206, 0.5)',

      border: '#52525B',
      divider: '#3F3F46',
      highlight: '#581C87',
      overlay: 'rgba(24, 24, 27, 0.9)',
      success: '#22C55E',
      error: '#DC2626',
      warning: '#FBBF24',
      info: '#3B82F6',
    },
    hasParticles: true,
    particleConfig: {
      type: 'sparkles',
      count: 40,
      color: '#C084FC',
    },
    hasAnimation: true,
    animationType: 'shimmer',
    hasAmbientSound: false,
  },

  parchment: {
    id: 'parchment',
    name: 'Pergamino Antiguo',
    description:
      'Como leer un manuscrito histórico. Textura vintage y tipografía clásica.',
    preview: '📜',
    rarity: ThemeRarity.RARE,
    unlockMethod: UnlockMethod.ACHIEVEMENT,
    unlockRequirement: 10, // 10 logros
    isDark: false,
    colors: {
      primary: '#92400E',
      primaryLight: '#D97706',
      primaryDark: '#78350F',
      secondary: '#7C2D12',
      accent: '#854D0E',

      background: '#FEF3C7',
      surface: '#FDE68A',
      surfaceVariant: '#FCD34D',

      text: '#451A03',
      textSecondary: '#78350F',
      textTertiary: '#92400E',

      primaryGradient: ['#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24'],
      secondaryGradient: ['#FED7AA', '#FDBA74', '#FB923C', '#F97316'],
      backgroundGradient: ['#FFFBEB', '#FEF3C7', '#FDE68A'],
      headerGradient: ['#92400E', '#78350F'],

      glow: 'rgba(146, 64, 14, 0.3)',
      shimmer: 'rgba(254, 243, 199, 0.6)',
      particle: 'rgba(252, 211, 77, 0.4)',
      shadow: 'rgba(120, 53, 15, 0.3)',

      border: '#FCD34D',
      divider: '#FBBF24',
      highlight: '#FEF3C7',
      overlay: 'rgba(69, 26, 3, 0.3)',
      success: '#16A34A',
      error: '#DC2626',
      warning: '#D97706',
      info: '#2563EB',
    },
    hasParticles: false,
    hasAnimation: false,
    hasAmbientSound: false,
  },

  ocean: {
    id: 'ocean',
    name: 'Océano Profundo',
    description:
      'Calma y profundidad. Azules del mar que traen paz al corazón.',
    preview: '🌊',
    rarity: ThemeRarity.RARE,
    unlockMethod: UnlockMethod.LEVEL,
    unlockRequirement: 5, // Nivel 5
    isDark: true,
    colors: {
      primary: '#0EA5E9',
      primaryLight: '#38BDF8',
      primaryDark: '#0284C7',
      secondary: '#06B6D4',
      accent: '#22D3EE',

      background: '#0C1E2E',
      surface: '#1A3447',
      surfaceVariant: '#2A4A60',

      text: '#F0F9FF',
      textSecondary: '#BAE6FD',
      textTertiary: '#7DD3FC',

      primaryGradient: ['#0C4A6E', '#075985', '#0369A1', '#0284C7', '#0EA5E9'],
      secondaryGradient: [
        '#164E63',
        '#155E75',
        '#0E7490',
        '#0891B2',
        '#06B6D4',
      ],
      backgroundGradient: ['#0C1E2E', '#1A3447', '#2A4A60', '#3A5A77'],
      headerGradient: ['#0284C7', '#0369A1'],

      glow: 'rgba(14, 165, 233, 0.5)',
      shimmer: 'rgba(56, 189, 248, 0.3)',
      particle: 'rgba(125, 211, 252, 0.6)',
      shadow: 'rgba(2, 132, 199, 0.4)',

      border: '#3A5A77',
      divider: '#2A4A60',
      highlight: '#0C4A6E',
      overlay: 'rgba(12, 30, 46, 0.8)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#0EA5E9',
    },
    hasParticles: true,
    particleConfig: {
      type: 'sparkles',
      count: 35,
      color: '#38BDF8',
    },
    hasAnimation: true,
    animationType: 'wave',
    hasAmbientSound: false,
  },

  fire: {
    id: 'fire',
    name: 'Fuego del Espíritu',
    description: 'Pasión y fervor. Llamas ardientes que inspiran devoción.',
    preview: '🔥',
    rarity: ThemeRarity.EPIC,
    unlockMethod: UnlockMethod.STREAK,
    unlockRequirement: 100, // 100 días de racha
    isDark: true,
    colors: {
      primary: '#EF4444',
      primaryLight: '#F87171',
      primaryDark: '#DC2626',
      secondary: '#F97316',
      accent: '#FBBF24',

      background: '#1A0B0B',
      surface: '#2D1515',
      surfaceVariant: '#3F1F1F',

      text: '#FFF1F2',
      textSecondary: '#FECACA',
      textTertiary: '#FCA5A5',

      primaryGradient: ['#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444'],
      secondaryGradient: [
        '#7C2D12',
        '#9A3412',
        '#C2410C',
        '#EA580C',
        '#F97316',
      ],
      backgroundGradient: ['#1A0B0B', '#2D1515', '#3F1F1F', '#511F1F'],
      headerGradient: ['#DC2626', '#B91C1C'],

      glow: 'rgba(239, 68, 68, 0.6)',
      shimmer: 'rgba(248, 113, 113, 0.4)',
      particle: 'rgba(252, 165, 165, 0.7)',
      shadow: 'rgba(220, 38, 38, 0.5)',

      border: '#511F1F',
      divider: '#3F1F1F',
      highlight: '#7F1D1D',
      overlay: 'rgba(26, 11, 11, 0.9)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    hasParticles: true,
    particleConfig: {
      type: 'sparkles',
      count: 45,
      color: '#F87171',
    },
    hasAnimation: true,
    animationType: 'pulse',
    hasAmbientSound: false,
  },

  snow: {
    id: 'snow',
    name: 'Nieve Pura',
    description:
      'Pureza y limpieza. Blancos cristalinos que refrescan el espíritu.',
    preview: '❄️',
    rarity: ThemeRarity.RARE,
    unlockMethod: UnlockMethod.ACHIEVEMENT,
    unlockRequirement: 15, // 15 logros
    isDark: false,
    colors: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#2563EB',
      secondary: '#8B5CF6',
      accent: '#06B6D4',

      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceVariant: '#F1F5F9',

      text: '#0F172A',
      textSecondary: '#475569',
      textTertiary: '#64748B',

      primaryGradient: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA'],
      secondaryGradient: [
        '#F5F3FF',
        '#EDE9FE',
        '#DDD6FE',
        '#C4B5FD',
        '#A78BFA',
      ],
      backgroundGradient: ['#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0'],
      headerGradient: ['#3B82F6', '#2563EB'],

      glow: 'rgba(59, 130, 246, 0.3)',
      shimmer: 'rgba(219, 234, 254, 0.6)',
      particle: 'rgba(191, 219, 254, 0.7)',
      shadow: 'rgba(37, 99, 235, 0.15)',

      border: '#E2E8F0',
      divider: '#CBD5E1',
      highlight: '#DBEAFE',
      overlay: 'rgba(15, 23, 42, 0.3)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    hasParticles: true,
    particleConfig: {
      type: 'stars',
      count: 40,
      color: '#BFDBFE',
    },
    hasAnimation: true,
    animationType: 'shimmer',
    hasAmbientSound: false,
  },

  rose: {
    id: 'rose',
    name: 'Rosa de Sarón',
    description: 'Elegancia y belleza. Rosa suave que habla del amor divino.',
    preview: '🌹',
    rarity: ThemeRarity.EPIC,
    unlockMethod: UnlockMethod.PURCHASE,
    isDark: false,
    colors: {
      primary: '#EC4899',
      primaryLight: '#F472B6',
      primaryDark: '#DB2777',
      secondary: '#A855F7',
      accent: '#F59E0B',

      background: '#FFF1F2',
      surface: '#FFFFFF',
      surfaceVariant: '#FCE7F3',

      text: '#4C0519',
      textSecondary: '#831843',
      textTertiary: '#9F1239',

      primaryGradient: ['#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899'],
      secondaryGradient: [
        '#FAE8FF',
        '#F3E8FF',
        '#E9D5FF',
        '#D8B4FE',
        '#C084FC',
      ],
      backgroundGradient: ['#FFF1F2', '#FFE4E6', '#FECDD3', '#FDA4AF'],
      headerGradient: ['#EC4899', '#DB2777'],

      glow: 'rgba(236, 72, 153, 0.4)',
      shimmer: 'rgba(251, 207, 232, 0.5)',
      particle: 'rgba(249, 168, 212, 0.6)',
      shadow: 'rgba(219, 39, 119, 0.2)',

      border: '#FECDD3',
      divider: '#FDA4AF',
      highlight: '#FCE7F3',
      overlay: 'rgba(76, 5, 25, 0.3)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    hasParticles: true,
    particleConfig: {
      type: 'sparkles',
      count: 30,
      color: '#F9A8D4',
    },
    hasAnimation: true,
    animationType: 'shimmer',
    hasAmbientSound: false,
  },
};

// Helper function to get unlocked themes
export const getUnlockedThemes = (
  userLevel: number,
  userStreak: number,
  achievementCount: number,
): PremiumTheme[] => {
  return Object.values(PREMIUM_THEMES).filter(theme => {
    if (theme.unlockMethod === UnlockMethod.DEFAULT) return true;

    if (theme.unlockMethod === UnlockMethod.LEVEL) {
      return userLevel >= (theme.unlockRequirement || 0);
    }

    if (theme.unlockMethod === UnlockMethod.STREAK) {
      return userStreak >= (theme.unlockRequirement || 0);
    }

    if (theme.unlockMethod === UnlockMethod.ACHIEVEMENT) {
      return achievementCount >= (theme.unlockRequirement || 0);
    }

    // PURCHASE and EVENT themes need special handling
    return false;
  });
};

// Helper to get theme rarity color
export const getRarityColor = (rarity: ThemeRarity): string => {
  switch (rarity) {
    case ThemeRarity.COMMON:
      return '#94A3B8'; // Slate
    case ThemeRarity.RARE:
      return '#3B82F6'; // Blue
    case ThemeRarity.EPIC:
      return '#A855F7'; // Purple
    case ThemeRarity.LEGENDARY:
      return '#F59E0B'; // Amber
    case ThemeRarity.MYTHIC:
      return '#EF4444'; // Red
    default:
      return '#94A3B8';
  }
};
