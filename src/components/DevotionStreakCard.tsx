/**
 * 🕯️ DevotionStreakCard — the constancy of your daily "Momento con Dios"
 * (Sprint 84).
 *
 * Once the reader has completed at least one devotion, Home shows a calm
 * streak card: how many days in a row they have come to God, their best run,
 * and whether today is already done. It encourages the habit without nagging —
 * a lapsed streak reads as a gentle invitation ("retoma tu constancia"), never
 * a scold. Tapping it opens the guided devotion to continue today.
 *
 * Pure derivation lives in [[devotionLog]] / [[useDevotionStreak]]; this view
 * only renders it. Router-free like [[MoodVerseCard]] — the owner injects
 * `onPress` — so it stays unit-testable and reusable. Device-local throughout.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {useDevotionStreak} from '@hooks/useDevotionStreak';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

interface DevotionStreakCardProps {
  /** Open the guided devotion (Home injects the route push). */
  onPress: () => void;
}

export const DevotionStreakCard: React.FC<DevotionStreakCardProps> = ({
  onPress,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const td = t.devotion;
  const {loaded, summary} = useDevotionStreak();

  // Honest gate: nothing to show until the reader has completed a devotion.
  if (!loaded || summary.totalDays === 0) return null;

  const lapsed = summary.current === 0;
  const headline = lapsed
    ? td.streakLapsed
    : summary.current === 1
      ? td.streakOneDay
      : td.streakDays.replace('{{n}}', String(summary.current));
  // Sub-line: best run, plus today's status while the streak is alive.
  const best = td.streakBest.replace('{{n}}', String(summary.longest));
  const todayLine = lapsed
    ? null
    : summary.todayDone
      ? td.streakTodayDone
      : td.streakTodayPending;
  const subtitle = todayLine ? `${best} · ${todayLine}` : best;

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
      accessibilityLabel={`${td.streakTitle}: ${headline}. ${subtitle}`}
      accessibilityHint={td.streakHint}>
      <View style={styles.row}>
        <View
          style={[styles.iconCircle, {backgroundColor: colors.primary + '22'}]}>
          <Ionicons name="flame" size={20} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <AppText
            scaleRole="compact"
            style={[styles.title, {color: colors.primary}]}>
            {td.streakTitle}
          </AppText>
          <AppText style={[styles.headline, {color: colors.text}]}>
            {headline}
          </AppText>
          <AppText
            scaleRole="compact"
            style={[styles.subtitle, {color: colors.textSecondary}]}>
            {subtitle}
          </AppText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );
};

export default DevotionStreakCard;

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
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
  text: {flex: 1, gap: 2},
  title: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headline: {fontSize: fontSizes.lg, fontWeight: '800'},
  subtitle: {fontSize: fontSizes.xs, fontWeight: '600'},
});
