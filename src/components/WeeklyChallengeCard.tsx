/**
 * 🏆 WeeklyChallengeCard — "Reto de la semana" on the memory deck (Sprint 86).
 *
 * Shows this week's mastery target, how many verses have graduated to box 5,
 * the verses closest to mastery (with their box as stars), and the practice
 * streak. Pure derivation lives in [[weeklyChallenge]] / [[useWeeklyChallenge]];
 * this view only renders it and owns the share-image modal. Tapping the card
 * opens the practice flow (the owner injects `onPractice`).
 *
 * Honestly gated: nothing shows until the deck has at least one card.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {getBookByName} from '@/constants/bible';
import {useWeeklyChallenge} from '@hooks/useWeeklyChallenge';
import {ChallengeImageModal} from '@components/insights/ChallengeImageModal';
import type {FocusVerse} from '@lib/memory/weeklyChallenge';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

/** Amber star row — `box` of 5 filled (the card's mastery level). */
const MASTERY_STAR_COLOR = '#f59e0b';
const MAX_FOCUS_ROWS = 3;

interface WeeklyChallengeCardProps {
  /** Open the practice flow (the deck screen injects it). */
  onPractice: () => void;
}

export const WeeklyChallengeCard: React.FC<WeeklyChallengeCardProps> = ({
  onPractice,
}) => {
  const {colors, isDark} = useTheme();
  const {t, language} = useLanguage();
  const tw = t.weeklyChallenge;
  const {loaded, challenge} = useWeeklyChallenge();
  const [shareVisible, setShareVisible] = useState(false);

  // Honest gate: nothing until the reader has a memorization deck.
  if (!loaded || !challenge.hasDeck) return null;

  const headline = challenge.met
    ? tw.met
    : challenge.target === 1
      ? tw.masterOne
      : tw.masterN.replace('{{n}}', String(challenge.target));
  const progressLabel = tw.progress
    .replace('{{done}}', String(challenge.mastered))
    .replace('{{target}}', String(challenge.target));
  const practiceLabel =
    challenge.practiceStreak <= 0
      ? tw.practiceNone
      : challenge.practiceStreak === 1
        ? tw.practiceOne
        : tw.practice.replace('{{n}}', String(challenge.practiceStreak));

  const refLabel = (v: FocusVerse) => {
    const info = getBookByName(v.bookName);
    const name = info
      ? language === 'en'
        ? info.nameEn
        : info.name
      : v.bookName;
    return `${name} ${v.chapter}:${v.verse}`;
  };

  const barColor = challenge.met ? colors.success : colors.primary;
  const trackColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const focus = challenge.focusVerses.slice(0, MAX_FOCUS_ROWS);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          haptics.tap();
          onPractice();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${tw.title}: ${headline}. ${progressLabel}`}
        accessibilityHint={tw.hint}
        style={[
          styles.card,
          {backgroundColor: colors.surface, borderColor: colors.border},
        ]}>
        <View style={styles.header}>
          <AppText
            scaleRole="compact"
            style={[styles.title, {color: colors.primary}]}>
            {tw.title}
          </AppText>
          <TouchableOpacity
            onPress={() => {
              haptics.tap();
              setShareVisible(true);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={tw.share}>
            <Ionicons
              name="share-outline"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <AppText style={[styles.headline, {color: colors.text}]}>
          {headline}
        </AppText>

        {/* Progress bar — mastered / target. */}
        <View style={[styles.barTrack, {backgroundColor: trackColor}]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.round(challenge.fraction * 100)}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <AppText
          scaleRole="compact"
          style={[styles.progress, {color: colors.textSecondary}]}>
          {progressLabel}
        </AppText>

        {/* Focus list — verses closest to mastery, with their box as stars. */}
        {focus.length > 0 && (
          <View style={styles.focusList}>
            {focus.map(v => (
              <View key={v.verseKey} style={styles.focusRow}>
                <AppText
                  scaleRole="compact"
                  numberOfLines={1}
                  style={[styles.focusRef, {color: colors.text}]}>
                  {refLabel(v)}
                </AppText>
                <View style={styles.stars}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <Ionicons
                      key={i}
                      name={i < v.box ? 'star' : 'star-outline'}
                      size={11}
                      color={
                        i < v.box ? MASTERY_STAR_COLOR : colors.textTertiary
                      }
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Ionicons name="flame" size={13} color={MASTERY_STAR_COLOR} />
          <AppText
            scaleRole="compact"
            style={[styles.practice, {color: colors.textSecondary}]}>
            {practiceLabel}
          </AppText>
        </View>
      </TouchableOpacity>

      <ChallengeImageModal
        visible={shareVisible}
        challenge={challenge}
        onClose={() => setShareVisible(false)}
      />
    </>
  );
};

export default WeeklyChallengeCard;

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headline: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  barTrack: {height: 8, borderRadius: 4, overflow: 'hidden'},
  barFill: {height: 8, borderRadius: 4},
  progress: {fontSize: fontSizes.xs, fontWeight: '700', marginTop: spacing.xs},
  focusList: {marginTop: spacing.md, gap: spacing.xs},
  focusRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  focusRef: {flex: 1, fontSize: fontSizes.sm, fontWeight: '600'},
  stars: {flexDirection: 'row', gap: 1},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  practice: {fontSize: fontSizes.xs, fontWeight: '700'},
});
