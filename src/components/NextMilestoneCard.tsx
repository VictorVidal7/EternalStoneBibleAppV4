/**
 * 🎯 NextMilestoneCard — the single achievement the reader is closest to
 * unlocking, surfaced on Home (Sprint 92).
 *
 * Bridges the two gamification surfaces from the Home screen: it reuses the
 * pure {@link nearestAchievements} picker (the same ranking the Achievements
 * tab's "Almost there" strip uses) to show ONE measurable next step with a
 * progress bar, and tapping it jumps straight to the Trophy tab. Router-free
 * like [[DevotionStreakCard]] / [[ConstancyRingsCard]] — Home injects
 * `onPress` — and honestly gated: nothing shows until the reader is measurably
 * walking toward a locked achievement (event-only badges sit at progress 0 and
 * are excluded by the picker).
 *
 * Read-only: useAchievements only reads on mount/focus (the unlock writers are
 * driven by the reader, not by this card).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {useAchievements} from '@hooks/useAchievements';
import {nearestAchievements} from '@lib/achievements/nearby';
import {getLocalizedAchievement} from '@lib/achievements/definitions';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

interface NextMilestoneCardProps {
  /** Open the Achievements tab (Home injects the route push). */
  onPress: () => void;
}

export const NextMilestoneCard: React.FC<NextMilestoneCardProps> = ({
  onPress,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {achievements, reload} = useAchievements();

  // Refresh when Home regains focus so the progress reflects fresh reading.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const nearest = useMemo(
    () => nearestAchievements(achievements, 1)[0] ?? null,
    [achievements],
  );

  // Honest gate: nothing until the reader is measurably approaching one.
  if (!nearest) return null;

  const localized = getLocalizedAchievement(nearest, t);
  const pct = Math.min(
    100,
    Math.round((nearest.currentProgress / nearest.requirement) * 100),
  );
  const countLine = `${nearest.currentProgress} / ${nearest.requirement}`;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.primary + '14',
          borderColor: colors.primary + '45',
        },
      ]}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={t.achievements.nextMilestoneA11y
        .replace('{{name}}', localized.name)
        .replace('{{current}}', String(nearest.currentProgress))
        .replace('{{requirement}}', String(nearest.requirement))}>
      <View style={styles.row}>
        <View
          style={[styles.iconCircle, {backgroundColor: colors.primary + '22'}]}>
          <AppText style={styles.icon} allowFontScaling={false}>
            {nearest.icon}
          </AppText>
        </View>
        <View style={styles.text}>
          <AppText
            scaleRole="compact"
            style={[styles.title, {color: colors.primary}]}>
            {t.achievements.nextMilestone}
          </AppText>
          <AppText style={[styles.headline, {color: colors.text}]}>
            {localized.name}
          </AppText>
          <View
            style={[styles.track, {backgroundColor: colors.surfaceVariant}]}>
            <View
              style={[
                styles.fill,
                {backgroundColor: colors.primary, width: `${pct}%`},
              ]}
            />
          </View>
        </View>
        <AppText
          scaleRole="compact"
          style={[styles.count, {color: colors.textTertiary}]}>
          {countLine}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

export default NextMilestoneCard;

const styles = StyleSheet.create({
  card: {
    // Owns the top gap to the previous Home card (24px, matching the other
    // Home cards) so it collapses with the card when the gate returns null —
    // its Home wrapper is opacity-only, leaving no phantom space on empty Home.
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {fontSize: 22},
  text: {flex: 1, gap: 4},
  title: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headline: {fontSize: fontSizes.md, fontWeight: '800'},
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {height: '100%', borderRadius: 3},
  count: {fontSize: fontSizes.xs, fontWeight: '700'},
});
