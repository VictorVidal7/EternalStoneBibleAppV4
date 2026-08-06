/**
 * 🧭 DiscoverTile — a compact entry tile for Home's "Explorar" grid (Sprint
 * 94) and Explorar-todo's dense list (`app/features/explore-all/index.tsx`).
 *
 * Home used to stack four near-identical full-width navigation cards (Tu
 * camino, Mi lectura, Luz diaria, Temas) one under another, which made the
 * screen long and monotonous. They now share this glass tile in a tidy 2×2
 * grid — same visual language as the "Guardados" cards — so the discover
 * surfaces read as ONE organized block.
 *
 * Router-free like the other Home cards (PrayerCard / DevotionStreakCard): the
 * owner injects `onPress` (Home wraps it with haptics + router.push), so the
 * tile stays unit-testable and reusable.
 *
 * `accentColor` + `variant="dense"` were added for Explorar-todo's redesign:
 * a per-category hex (see `src/features/explore/exploreCategories.ts`, same
 * precedent as `themes.ts`'s `BibleTheme.accent`) and a compact full-width
 * row layout for its single-column list, since the original ~124px tile
 * doesn't fit a dense list. Home never passes `accentColor`, so its tiles
 * keep tinting the icon chip with `colors.primary` exactly as before — the
 * SAME icon now renders primary-colored on Home and category-accent-colored
 * on Explorar-todo, an intentionally accepted inconsistency (Victor signed
 * off on it) rather than something to "fix" by touching Home.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {BlurView} from 'expo-blur';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {PressableScale} from '@components/ui/PressableScale';
import {useTheme} from '@hooks/useTheme';
import {createCelestialTheme} from '@/styles/celestialTheme';
import {withOpacity} from '@/styles/modernTheme';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

interface DiscoverTileProps {
  /** Ionicons glyph for the tile's accent chip. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Tile title (e.g. "Tu camino"). */
  title: string;
  /** One-line supporting subtitle. */
  subtitle: string;
  /** Navigate to the surface (Home injects haptics + router.push). */
  onPress: () => void;
  /**
   * Optional per-category accent hex for the icon chip (Explorar-todo only
   * — see the component doc above). Omitted entirely by Home.
   */
  accentColor?: string;
  /**
   * `'card'` (default) is the original ~124px 2-column glass tile Home
   * uses. `'dense'` is a compact full-width row for Explorar-todo's
   * single-column list — same props/tap target, just a shorter, horizontal
   * layout.
   */
  variant?: 'card' | 'dense';
}

export const DiscoverTile: React.FC<DiscoverTileProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  accentColor,
  variant = 'card',
}) => {
  const {isDark, colors, highContrast} = useTheme();
  const celestialTheme = createCelestialTheme(isDark, {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    secondary: colors.secondary,
    accent: colors.accent,
    info: colors.info,
  });

  // High-contrast fallback for the accent system, mirroring the exact
  // pattern `app/features/themes/[theme].tsx` already applies to its own
  // hardcoded per-item accent hex: under high contrast, an arbitrary
  // category color never overrides the theme's own AAA-checked primary —
  // `colors.primary` itself already resolves to the HC palette's amber
  // (`HIGH_CONTRAST_COLORS.primary`) when `highContrast` is on.
  const iconColor = accentColor && !highContrast ? accentColor : colors.primary;
  const chipBackground = withOpacity(iconColor, isDark ? 0.2 : 0.12);

  if (variant === 'dense') {
    return (
      <PressableScale
        pressedOpacity={0.9}
        style={styles.denseWrapper}
        onPress={onPress}
        accessibilityRole="button"
        accessible
        accessibilityLabel={title}
        accessibilityHint={subtitle}>
        <BlurView
          intensity={isDark ? 28 : 48}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.denseRow,
            {
              backgroundColor: celestialTheme.colors.surfaceGlass,
              borderColor: celestialTheme.colors.glassBorder,
            },
          ]}>
          <View style={[styles.iconChip, {backgroundColor: chipBackground}]}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          <View style={styles.denseBody}>
            <AppText
              style={[styles.denseTitle, {color: colors.text}]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {title}
            </AppText>
            <AppText
              scaleRole="compact"
              style={[styles.denseSubtitle, {color: colors.textSecondary}]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {subtitle}
            </AppText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        </BlurView>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      pressedOpacity={0.9}
      style={styles.wrapper}
      onPress={onPress}
      accessibilityRole="button"
      accessible
      accessibilityLabel={title}
      accessibilityHint={subtitle}>
      <BlurView
        intensity={isDark ? 28 : 48}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tile,
          {
            backgroundColor: celestialTheme.colors.surfaceGlass,
            borderColor: celestialTheme.colors.glassBorder,
          },
          celestialTheme.shadows.md,
        ]}>
        <View style={styles.header}>
          <View style={[styles.iconChip, {backgroundColor: chipBackground}]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
          />
        </View>
        <View style={styles.body}>
          <AppText
            style={[styles.title, {color: colors.text}]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {title}
          </AppText>
          <AppText
            scaleRole="compact"
            style={[styles.subtitle, {color: colors.textSecondary}]}
            numberOfLines={2}
            ellipsizeMode="tail">
            {subtitle}
          </AppText>
        </View>
      </BlurView>
    </PressableScale>
  );
};

export default DiscoverTile;

const styles = StyleSheet.create({
  wrapper: {
    // Width is owned by Home's grid wrapper; the tile fills it.
    width: '100%',
  },
  tile: {
    minHeight: 124,
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    marginTop: spacing.sm,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
    // Reserves space for a full 2 lines (the numberOfLines cap above) so
    // every tile in the 2×2 grid is the same height regardless of whether
    // its subtitle actually wraps — a short one-liner like "Tu devocional
    // de hoy" would otherwise leave its tile shorter than a neighbor whose
    // subtitle wraps (e.g. "Hoy · El pico más alto de la Biblia").
    minHeight: 32,
  },
  // ---- 'dense' variant (Explorar-todo's single-column list) ----
  denseWrapper: {width: '100%'},
  denseRow: {
    width: '100%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  denseBody: {flex: 1},
  denseTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  denseSubtitle: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    marginTop: 1,
  },
});
