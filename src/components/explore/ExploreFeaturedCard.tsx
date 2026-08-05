/**
 * 🌟 ExploreFeaturedCard — the recency-based hero card atop "Explorar todo"
 * (`app/features/explore-all/index.tsx`).
 *
 * Home already has its own personalized hero (a greeting + a single
 * contextual nudge, `app/(tabs)/index.tsx`'s "HERO SECTION"), but that JSX
 * is inline and specific to Home's own greeting/streak logic — there's no
 * reusable component to lean on, so this is new component code written for
 * THIS screen's own featured-category concept, not a fork of Home's hero.
 *
 * The gradient takes the featured category's own `accentColor` (from
 * [[exploreCategories]]) so the hero visibly carries that category's
 * identity — mirroring the exact pattern `app/features/themes/[theme].tsx`
 * (ThemeDetailScreen) already established for a per-item hardcoded accent
 * hex: `highContrast ? gradient.headerColors : [accent, colors.primaryDark]`.
 * Under high contrast, the arbitrary category hex NEVER survives — the
 * theme's own AAA-checked flat surface takes over instead, same as that
 * screen's header. The icon chip stays a fixed translucent white (like this
 * screen's own header icon, ThemeDetailScreen's header icon, and Home's
 * hero) rather than re-deriving its own HC branch, since the accent already
 * lives in the gradient alone.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {PressableScale} from '@components/ui/PressableScale';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface ExploreFeaturedCardProps {
  /** Ionicons glyph for the featured category. */
  icon: keyof typeof Ionicons.glyphMap;
  /** Small label above the title (e.g. "Recomendado para ti"). */
  eyebrow: string;
  /** The category's own title (same string its list row would show). */
  title: string;
  /** The category's own subtitle (same string its list row would show). */
  subtitle: string;
  /** The category's accent hex — see file header for the HC-fallback rule. */
  accentColor: string;
  /** Navigate into the featured category (owner injects haptics + router). */
  onPress: () => void;
}

export const ExploreFeaturedCard: React.FC<ExploreFeaturedCardProps> = ({
  icon,
  eyebrow,
  title,
  subtitle,
  accentColor,
  onPress,
}) => {
  const {colors, gradient, highContrast} = useTheme();

  const cardGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [accentColor, colors.primaryDark];

  return (
    <PressableScale
      pressedOpacity={0.94}
      style={styles.wrapper}
      onPress={onPress}
      accessibilityRole="button"
      accessible
      accessibilityLabel={title}
      accessibilityHint={subtitle}>
      <LinearGradient
        colors={cardGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.card, styles.cardShadow, {shadowColor: accentColor}]}>
        <AppText scaleRole="compact" style={styles.eyebrow}>
          {eyebrow}
        </AppText>
        <View style={styles.row}>
          <View style={styles.iconChip}>
            <Ionicons name={icon} size={26} color={staticColors.white} />
          </View>
          <View style={styles.textContainer}>
            <AppText
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail">
              {title}
            </AppText>
            <AppText
              scaleRole="compact"
              style={styles.subtitle}
              numberOfLines={2}
              ellipsizeMode="tail">
              {subtitle}
            </AppText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={staticColors.glassWhite85}
          />
        </View>
      </LinearGradient>
    </PressableScale>
  );
};

export default ExploreFeaturedCard;

const styles = StyleSheet.create({
  wrapper: {width: '100%'},
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  eyebrow: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {flex: 1},
  title: {
    color: staticColors.white,
    fontSize: fontSizes.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: staticColors.glassWhite85,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginTop: 2,
  },
});
