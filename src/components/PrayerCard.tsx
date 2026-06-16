/**
 * 🙏 PrayerCard — the prayer-life nudge on Home (Sprint 93).
 *
 * Once the reader has begun to pray — kept a request in the journal OR completed
 * a guided prayer — Home shows a calm card: the constancy of their prayer
 * (current streak, gently inviting when lapsed — never a scold) plus what is
 * before God right now (N praying · M answered). Tapping it opens the prayer
 * journal.
 *
 * Pure derivation lives in [[prayerLog]] / [[prayer]]; this view only renders
 * what [[usePrayerStreak]] + [[usePrayerJournal]] return. Router-free like
 * [[DevotionStreakCard]] — the owner injects `onPress` — so it stays
 * unit-testable and reusable. Device-local throughout.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {usePrayerStreak} from '@hooks/usePrayerStreak';
import {usePrayerJournal} from '@hooks/usePrayerJournal';
import {prayerStats} from '@/features/prayer/prayer';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

interface PrayerCardProps {
  /** Open the prayer journal (Home injects the route push). */
  onPress: () => void;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({onPress}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tp = t.prayer;
  const {loaded: streakLoaded, summary} = usePrayerStreak();
  const {loaded: journalLoaded, requests} = usePrayerJournal();
  const stats = useMemo(() => prayerStats(requests), [requests]);

  // Honest gate: nothing to show until the reader has prayed or kept a request.
  const engaged = summary.totalDays > 0 || requests.length > 0;
  if (!streakLoaded || !journalLoaded || !engaged) return null;

  const lapsed = summary.current === 0;
  const headline =
    summary.current === 0
      ? summary.totalDays > 0
        ? tp.streakLapsed
        : tp.cardSubtitleEmpty
      : summary.current === 1
        ? tp.streakOneDay
        : tp.streakDays.replace('{{n}}', String(summary.current));

  // Sub-line: what's before God right now, else the streak's best run.
  const subtitle =
    stats.active > 0 || stats.answered > 0
      ? tp.cardSubtitlePraying
          .replace('{{n}}', String(stats.active))
          .replace('{{a}}', String(stats.answered))
      : tp.streakBest.replace('{{n}}', String(summary.longest));

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
      accessibilityLabel={`${tp.cardTitle}: ${headline}. ${subtitle}`}
      accessibilityHint={tp.streakHint}>
      <View style={styles.row}>
        <View
          style={[styles.iconCircle, {backgroundColor: colors.primary + '22'}]}>
          <Ionicons
            name={lapsed ? 'rose-outline' : 'rose'}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.text}>
          <AppText
            scaleRole="compact"
            style={[styles.title, {color: colors.primary}]}>
            {tp.cardTitle}
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

export default PrayerCard;

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
