/**
 * 🧭 DiscoverTile — a compact 2-column entry tile for Home's "Explorar" grid
 * (Sprint 94).
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
}

export const DiscoverTile: React.FC<DiscoverTileProps> = ({
  icon,
  title,
  subtitle,
  onPress,
}) => {
  const {isDark, colors} = useTheme();
  const celestialTheme = createCelestialTheme(isDark, {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    secondary: colors.secondary,
    accent: colors.accent,
    info: colors.info,
  });

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
          <View
            style={[
              styles.iconChip,
              {
                backgroundColor: withOpacity(
                  colors.primary,
                  isDark ? 0.2 : 0.12,
                ),
              },
            ]}>
            <Ionicons name={icon} size={20} color={colors.primary} />
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
});
