/**
 * 🏆 ACHIEVEMENT RARITY PALETTE
 *
 * The visual rarity scale used by the achievement cards. This is the LIVE
 * subset extracted from the retired `expandedDefinitions.ts` catalog (Sprint
 * 83): the 21-entry EXPANDED_ACHIEVEMENTS array and the duplicate LEVEL_SYSTEM
 * were dead code (zero references, a category-space and a level system that
 * conflicted with the real `definitions.ts` / `AchievementService`). The only
 * thing any live screen consumed was this rarity colour map, so it lives here
 * on its own — `AchievementCard` maps the real tier (types.ts) onto a rarity
 * to pick the badge/glow hue.
 *
 * Para la gloria de Dios y del Rey Jesús
 */

export type AchievementRarity =
  'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Colours per rarity (gray → green → blue → purple → gold), with a two-stop
 * gradient (used for the locked-progress fill) and a soft glow (used behind
 * unlocked epic/legendary cards).
 */
export const RARITY_COLORS = {
  common: {
    light: '#9CA3AF', // Gray
    dark: '#6B7280',
    gradient: ['#D1D5DB', '#9CA3AF'] as const,
    glow: 'rgba(156, 163, 175, 0.3)',
  },
  uncommon: {
    light: '#10B981', // Green
    dark: '#059669',
    gradient: ['#34D399', '#10B981'] as const,
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  rare: {
    light: '#3B82F6', // Blue
    dark: '#2563EB',
    gradient: ['#60A5FA', '#3B82F6'] as const,
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  epic: {
    light: '#A855F7', // Purple
    dark: '#9333EA',
    gradient: ['#C084FC', '#A855F7'] as const,
    glow: 'rgba(168, 85, 247, 0.3)',
  },
  legendary: {
    light: '#F59E0B', // Gold
    dark: '#D97706',
    gradient: ['#FBBF24', '#F59E0B'] as const,
    glow: 'rgba(245, 158, 11, 0.4)',
  },
} as const;

/**
 * Display info for a rarity at the current colour scheme.
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
