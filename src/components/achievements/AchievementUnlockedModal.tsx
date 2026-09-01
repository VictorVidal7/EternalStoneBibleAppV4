/**
 * Celebratory modal when an achievement is unlocked
 *
 * Motion redesign (2026-07-23): migrated off the legacy `Animated` API to
 * Reanimated, dropped the 360° spin for a calm scale+fade entrance, replaced
 * the 20-particle confetti burst with a tier-coloured halo/bloom, added a
 * single haptic pulse at unlock, and scaled the halo's presence by the
 * achievement's tier. Deliberately does NOT reuse the rotation-wiggle half of
 * `celebrationAnimation` (reanimatedAnimations.ts) — only its scale-bounce
 * feel — per the 2026-07-15 research's explicit avoid-list (a rotating card
 * read as too playful for this app's devotional tone).
 */

import React, {useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import {staticColors} from '@/styles/designTokens';
import {
  SPRING_CONFIGS,
  DURATIONS,
  EASING_CURVES,
} from '@/styles/reanimatedAnimations';
import {focusTrapProps, a11yHiddenProps} from '@lib/a11y/focusTrap';
import {haptics} from '@lib/haptics';

import {
  Achievement,
  AchievementTier,
  ACHIEVEMENT_TIER_COLORS,
} from '../../lib/achievements/types';
import {getLocalizedAchievement} from '../../lib/achievements/definitions';
import {useLanguage} from '../../hooks/useLanguage';
import {useReducedMotion} from '../../hooks/useReducedMotion';
import {useTheme} from '../../hooks/useTheme';

interface AchievementUnlockedModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

// ==================== TIER-SCALED CELEBRATION ====================
// Direction 4 (2026-07-15 research): every tier used to look identical. A
// tier "rank" (0=bronze … 4=diamond) scales the halo's size/brightness so
// higher tiers read as more luminous — a couple of interpolated values, not
// a different animation per tier.
const TIER_RANK_ORDER: AchievementTier[] = Object.values(AchievementTier);
const getTierRank = (tier: AchievementTier): number => {
  const rank = TIER_RANK_ORDER.indexOf(tier);
  return rank === -1 ? 0 : rank;
};
// Gold and above get one extra, subtle glint accent during the bloom-in.
const GLINT_MIN_TIER_RANK = getTierRank(AchievementTier.GOLD);

const HALO_MAX_SIZE = 160; // diamond's footprint; also the centering box size
const HALO_BASE_SIZE = 120; // bronze
const HALO_SIZE_STEP = 10; // +10px per tier rank
const getHaloSize = (tierRank: number) =>
  HALO_BASE_SIZE + tierRank * HALO_SIZE_STEP;

const HALO_PEAK_OPACITY_BASE = 0.35;
const HALO_PEAK_OPACITY_STEP = 0.08;
const getHaloPeakOpacity = (tierRank: number) =>
  HALO_PEAK_OPACITY_BASE + tierRank * HALO_PEAK_OPACITY_STEP;

const HALO_REST_OPACITY_BASE = 0.14;
const HALO_REST_OPACITY_STEP = 0.04;
const getHaloRestOpacity = (tierRank: number) =>
  HALO_REST_OPACITY_BASE + tierRank * HALO_REST_OPACITY_STEP;

const GLINT_SIZE = 108;

export const AchievementUnlockedModal: React.FC<
  AchievementUnlockedModalProps
> = ({visible, achievement, onClose}) => {
  const {t} = useLanguage();
  const {colors} = useTheme();
  // Hybrid theming (Sprint 83): the big celebratory accents (border ring, icon
  // halo, points, button) follow the SELECTED theme's primary so the modal
  // reads as part of the app, while a small tier badge keeps its own hue as the
  // rarity signal. Sprint 82 had tinted everything with the tier colour, which
  // the user read as "not my theme" on the daily build.
  const reduced = useReducedMotion();

  // Card entrance: calm scale + fade only, no rotation.
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  // Halo/bloom replacing the old 20-particle confetti burst — blooms in once
  // then settles to a subtle steady glow (no continuous/infinite loop).
  const haloOpacity = useSharedValue(0);
  const haloScale = useSharedValue(0.7);
  // One-time glint accent, gold tier and above only.
  const glintOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievement) {
      const tierRank = getTierRank(achievement.tier);
      const haloPeakOpacity = getHaloPeakOpacity(tierRank);
      const haloRestOpacity = getHaloRestOpacity(tierRank);

      // A haptic pulse marks the unlock moment itself. This is not a
      // visual-motion accessibility concern (useReducedMotion exists to
      // suppress *motion*, not tactile feedback), so it fires regardless of
      // the reduced-motion state below.
      haptics.success();

      if (reduced) {
        // Reduced motion: present the card at its resting state — including
        // the tier-appropriate resting glow — just with zero animated motion
        // getting there.
        scale.value = 1;
        opacity.value = 1;
        haloScale.value = 1;
        haloOpacity.value = haloRestOpacity;
        glintOpacity.value = 0;
        return;
      }

      // Reset to start-of-entrance values.
      scale.value = 0;
      opacity.value = 0;
      haloScale.value = 0.7;
      haloOpacity.value = 0;
      glintOpacity.value = 0;

      // Entry animation — fade + a single calm scale bounce. This borrows the
      // FEEL of `celebrationAnimation`'s scale sequence (bouncy → default
      // spring) but deliberately omits its rotation-wiggle half: no rotate
      // transform anywhere on this card.
      opacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING_CURVES.emphasizedDecelerate,
      });
      scale.value = withSequence(
        withSpring(1.2, SPRING_CONFIGS.bouncy),
        withSpring(1, SPRING_CONFIGS.default),
      );

      // Halo bloom: grows/brightens in, then settles to a steady, subtle glow.
      haloScale.value = withSequence(
        withTiming(1.15, {
          duration: DURATIONS.smooth,
          easing: EASING_CURVES.emphasizedDecelerate,
        }),
        withTiming(1, {
          duration: DURATIONS.slow,
          easing: EASING_CURVES.standard,
        }),
      );
      haloOpacity.value = withSequence(
        withTiming(haloPeakOpacity, {
          duration: DURATIONS.smooth,
          easing: EASING_CURVES.emphasizedDecelerate,
        }),
        withTiming(haloRestOpacity, {
          duration: DURATIONS.slow,
          easing: EASING_CURVES.standard,
        }),
      );

      // Tier-scaled extra accent: a brief, single glint for gold+ only.
      if (tierRank >= GLINT_MIN_TIER_RANK) {
        glintOpacity.value = withDelay(
          150,
          withSequence(
            withTiming(1, {
              duration: 180,
              easing: EASING_CURVES.standardDecelerate,
            }),
            withTiming(0, {
              duration: 420,
              easing: EASING_CURVES.standardAccelerate,
            }),
          ),
        );
      }
    }
  }, [visible, achievement, reduced]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));
  const haloAnimatedStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{scale: haloScale.value}],
  }));
  const glintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glintOpacity.value,
  }));

  if (!achievement) return null;

  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];
  const tierRank = getTierRank(achievement.tier);
  const haloSize = getHaloSize(tierRank);
  const haloOffset = (HALO_MAX_SIZE - haloSize) / 2;
  const glintOffset = (HALO_MAX_SIZE - GLINT_SIZE) / 2;
  const localized = getLocalizedAchievement(achievement, t);
  const tierLabel = (t.achievements.tiers as Record<string, string>)[
    achievement.tier
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          {...a11yHiddenProps()}
        />

        {/* Content */}
        <Animated.View style={[styles.container, cardAnimatedStyle]}>
          <View
            style={[
              styles.card,
              {
                // Opaque theme surface + theme-primary accent ring (Sprint 83
                // hybrid); cardSolid keeps the celebration readable over the
                // screen behind it.
                backgroundColor: colors.cardSolid,
                borderColor: colors.primary,
              },
            ]}
            {...focusTrapProps()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, {color: colors.text}]}>
                {t.achievements.unlockTitle}
              </Text>
              {/* The tier badge keeps its own hue — the one rarity signal. */}
              <View style={[styles.tierBadge, {backgroundColor: tierColor}]}>
                <Text style={styles.tierText}>{tierLabel.toUpperCase()}</Text>
              </View>
            </View>

            {/* Icon + tier-scaled halo/bloom (replaces the old confetti burst) */}
            <View style={styles.iconWrapper}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.halo,
                  haloAnimatedStyle,
                  {
                    width: haloSize,
                    height: haloSize,
                    borderRadius: haloSize / 2,
                    top: haloOffset,
                    left: haloOffset,
                    backgroundColor: tierColor,
                    shadowColor: tierColor,
                  },
                ]}
              />
              {tierRank >= GLINT_MIN_TIER_RANK && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.glint,
                    glintAnimatedStyle,
                    {
                      top: glintOffset,
                      left: glintOffset,
                      borderColor: tierColor,
                    },
                  ]}
                />
              )}
              <View
                style={[
                  styles.iconContainer,
                  {backgroundColor: colors.primary + '20'},
                ]}>
                <Text style={styles.icon}>{achievement.icon}</Text>
              </View>
            </View>

            {/* Name and description */}
            <Text style={[styles.name, {color: colors.text}]}>
              {localized.name}
            </Text>
            <Text style={[styles.description, {color: colors.textSecondary}]}>
              {localized.description}
            </Text>

            {/* Points */}
            <View style={styles.pointsContainer}>
              <Text style={[styles.pointsLabel, {color: colors.textTertiary}]}>
                {t.achievements.pointsEarned}
              </Text>
              <Text style={[styles.points, {color: colors.primary}]}>
                +{achievement.points} {t.achievements.points}
              </Text>
            </View>

            {/* Button */}
            <Pressable
              style={[styles.button, {backgroundColor: colors.primary}]}
              onPress={onClose}>
              <Text style={[styles.buttonText, {color: colors.onPrimary}]}>
                {t.achievements.awesome}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.overlayBlack70,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
  },
  card: {
    backgroundColor: staticColors.white,
    borderRadius: 24,
    padding: 24,
    // Tier-hued accent ring; the colour is themed inline at render (Sprint 82).
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: staticColors.grayNeutral,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: staticColors.white,
  },
  iconWrapper: {
    width: HALO_MAX_SIZE,
    height: HALO_MAX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  halo: {
    position: 'absolute',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 24,
    // No `elevation` here on purpose: on Android elevation reorders sibling
    // paint order independently of JSX order, which would draw this glow ON
    // TOP of the icon/glint instead of behind them. The colored bloom itself
    // comes from `backgroundColor` (elevation would only add a neutral-gray
    // Android drop shadow, nothing colored); the iOS glow is entirely
    // shadowColor/shadowOpacity/shadowRadius. Without elevation, both
    // platforms stack by JSX order — halo behind glint behind icon.
  },
  glint: {
    position: 'absolute',
    width: GLINT_SIZE,
    height: GLINT_SIZE,
    borderRadius: GLINT_SIZE / 2,
    borderWidth: 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 56,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: staticColors.grayNeutral,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: staticColors.graySecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsLabel: {
    fontSize: 14,
    color: staticColors.gray400,
    marginBottom: 4,
  },
  points: {
    fontSize: 32,
    fontWeight: '800',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: staticColors.white,
  },
});
