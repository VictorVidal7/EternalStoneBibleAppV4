/**
 * 🧠 MEMORY DECK SCREEN
 *
 * Landing screen for the verse-memorization feature. Shows three
 * stat counters (total / due / mastered), a primary "Practice"
 * call-to-action when there are cards due today, and the list of
 * every card in the deck with its current box and next-review date.
 *
 * Cards are sorted "soonest-due first" so the user immediately sees
 * what needs attention.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {useToast} from '@context/ToastContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useMemoryGoal} from '@hooks/useMemoryGoal';
import type {GoalProgress, MemoryMilestone} from '@lib/memory/goals';
import {getBookByName} from '@/constants/bible';
import type {MemoryCard} from '@lib/memory/srs';
import {isMastered} from '@lib/memory/srs';
import {WeeklyChallengeCard} from '@components/WeeklyChallengeCard';
import {MemoryGuideModal} from '@components/MemoryGuideModal';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function MemoryDeckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {cards, dueCards, stats, removeCard} = useMemoryDeck();
  const {history, goal, milestone, dismissMilestone} = useMemoryGoal();
  const [guideVisible, setGuideVisible] = useState(false);

  const headerGradient = useMemo(
    () =>
      gradient?.headerColors
        ? ([...gradient.headerColors] as [string, string, string])
        : (['#4f46e5', '#7c3aed', '#a855f7'] as [string, string, string]),
    [gradient?.headerColors],
  );

  // Soonest-due first; stable secondary sort by added time.
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      const dueDiff = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (dueDiff !== 0) return dueDiff;
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
  }, [cards]);

  const handlePractice = () => {
    haptics.press();
    router.push('/features/memory/practice' as never);
  };

  const confirmRemove = (card: MemoryCard) => {
    Alert.alert(
      t.memory.remove.title,
      t.memory.remove.message,
      [
        {text: t.memory.remove.cancel, style: 'cancel'},
        {
          text: t.memory.remove.confirm,
          style: 'destructive',
          onPress: () => {
            removeCard(card.verseKey);
            toast.success(t.memory.removedToast);
          },
        },
      ],
      {cancelable: true},
    );
  };

  const isEmpty = cards.length === 0;
  const dueCount = dueCards.length;

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.insightsButton}
                onPress={() => {
                  haptics.tap();
                  setGuideVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={t.memory.guide.openLabel}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              {!isEmpty && (
                <TouchableOpacity
                  style={styles.insightsButton}
                  onPress={() =>
                    router.push('/features/memory/insights' as never)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={t.memory.insights.openLabel}>
                  <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="school" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>{t.memory.homeHint}</Text>
              <Text style={styles.headerTitle}>{t.memory.title}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatBubble value={stats.total} label={t.memory.stats.total} />
            <StatBubble value={stats.due} label={t.memory.stats.due} />
            <StatBubble
              value={stats.mastered}
              label={t.memory.stats.mastered}
            />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            {paddingBottom: insets.bottom + spacing['4xl']},
            centeredMaxWidth(),
          ]}>
          {/* Streak + daily-goal chip (Sprint 47) */}
          {!isEmpty && (
            <StreakGoalChip
              currentStreak={history.summary.currentStreak}
              goal={goal}
              t={t}
              colors={colors}
              onPress={() => router.push('/features/memory/insights' as never)}
            />
          )}

          {/* Weekly mastery challenge (Sprint 86) — hides itself when the
              deck is empty; tapping it starts a practice session. */}
          <WeeklyChallengeCard onPractice={handlePractice} />

          {/* Practice CTA */}
          {dueCount > 0 ? (
            <PulsingPracticeCta
              onPress={handlePractice}
              backgroundColor={colors.primary}
              label={
                dueCount === 1
                  ? t.memory.practiceCtaSingular
                  : t.memory.practiceCta.replace('{{count}}', String(dueCount))
              }
            />
          ) : !isEmpty ? (
            <View
              style={[
                styles.noDueCard,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color={colors.success}
              />
              <Text style={[styles.noDueTitle, {color: colors.text}]}>
                {t.memory.noDueToday}
              </Text>
              <Text style={[styles.noDueHint, {color: colors.textSecondary}]}>
                {t.memory.noDueHint}
              </Text>
            </View>
          ) : null}

          {/* Empty state */}
          {isEmpty && (
            <View style={[styles.emptyCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={[styles.emptyTitle, {color: colors.text}]}>
                {t.memory.empty}
              </Text>
              <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
                {t.memory.emptyHint}
              </Text>
            </View>
          )}

          {/* Cards list */}
          {sortedCards.map(card => (
            <DeckRow
              key={card.verseKey}
              card={card}
              language={language}
              t={t}
              colors={colors}
              onRemove={() => confirmRemove(card)}
            />
          ))}
        </ScrollView>
      </View>

      {/* In-app milestone celebration (Sprint 47) */}
      <MilestoneCelebration
        milestone={milestone}
        t={t}
        colors={colors}
        onClose={dismissMilestone}
      />

      {/* "How memorization works" explainer (Sprint 98) */}
      <MemoryGuideModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
      />
    </>
  );
}

/**
 * Compact streak + daily-goal chip shown atop the deck. Left: a flame with
 * the current streak; right: today's progress toward the review goal with a
 * thin progress bar. Tapping opens the full Insights breakdown.
 */
const StreakGoalChip: React.FC<{
  currentStreak: number;
  goal: GoalProgress;
  t: ReturnType<typeof useLanguage>['t'];
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}> = ({currentStreak, goal, t, colors, onPress}) => {
  const g = t.memory.goal;
  const streakLabel =
    currentStreak <= 0
      ? g.streakNone
      : currentStreak === 1
        ? g.streakDaysSingular
        : g.streakDays.replace('{{count}}', String(currentStreak));
  const progressLabel = goal.met
    ? g.goalMet
    : g.todayCount
        .replace('{{done}}', String(goal.todayCount))
        .replace('{{goal}}', String(goal.goal));
  const flameColor = currentStreak > 0 ? colors.warning : colors.textTertiary;
  const barColor = goal.met ? colors.success : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {backgroundColor: colors.surface, borderColor: colors.border},
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${streakLabel} · ${progressLabel}`}>
      <View style={styles.chipStreak}>
        <Ionicons name="flame" size={22} color={flameColor} />
        <Text
          style={[styles.chipStreakText, {color: colors.text}]}
          numberOfLines={1}>
          {streakLabel}
        </Text>
      </View>
      <View style={styles.chipGoal}>
        <Text
          style={[
            styles.chipGoalText,
            {color: goal.met ? colors.success : colors.textSecondary},
          ]}
          numberOfLines={1}>
          {progressLabel}
        </Text>
        <View style={[styles.chipBarTrack, {backgroundColor: colors.border}]}>
          <View
            style={[
              styles.chipBarFill,
              {
                backgroundColor: barColor,
                width: `${Math.round(goal.fraction * 100)}%`,
              },
            ]}
          />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

/**
 * Celebration modal for a freshly-earned milestone (streak threshold or daily
 * goal). In-app only — never a push (you're already here). Springs in, then
 * an "Amen!" button dismisses it and marks the milestone celebrated.
 */
const MilestoneCelebration: React.FC<{
  milestone: MemoryMilestone | null;
  t: ReturnType<typeof useLanguage>['t'];
  colors: ReturnType<typeof useTheme>['colors'];
  onClose: () => void;
}> = ({milestone, t, colors, onClose}) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const visible = milestone !== null;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.8);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 9,
      }).start();
      haptics.success();
    }
  }, [visible, scale]);

  if (!milestone) return null;

  const g = t.memory.goal;
  const isStreak = milestone.type === 'streak';
  const emoji = isStreak ? '🔥' : '🎯';
  const title = (
    isStreak ? g.celebrateStreakTitle : g.celebrateGoalTitle
  ).replace('{{count}}', String(milestone.value));
  const body = (isStreak ? g.celebrateStreakBody : g.celebrateGoalBody).replace(
    '{{count}}',
    String(milestone.value),
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.celebrateOverlay}>
        <Animated.View
          style={[
            styles.celebrateCard,
            {backgroundColor: colors.surface, transform: [{scale}]},
          ]}
          {...focusTrapProps()}>
          <Text style={styles.celebrateEmoji}>{emoji}</Text>
          <Text style={[styles.celebrateTitle, {color: colors.text}]}>
            {title}
          </Text>
          <Text style={[styles.celebrateBody, {color: colors.textSecondary}]}>
            {body}
          </Text>
          <TouchableOpacity
            style={[styles.celebrateCta, {backgroundColor: colors.primary}]}
            onPress={onClose}
            accessibilityRole="button">
            <Text style={styles.celebrateCtaText}>{g.celebrateCta}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

interface DeckRowProps {
  card: MemoryCard;
  language: 'es' | 'en';
  t: ReturnType<typeof useLanguage>['t'];
  colors: ReturnType<typeof useTheme>['colors'];
  onRemove: () => void;
}
const DeckRow: React.FC<DeckRowProps> = ({
  card,
  language,
  t,
  colors,
  onRemove,
}) => {
  const mastered = isMastered(card);
  const bookInfo = getBookByName(card.bookName);
  const displayBook = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : card.bookName;
  const reference = `${displayBook} ${card.chapter}:${card.verse}`;
  const nextReview = formatRelativeDate(card.dueAt, language);

  return (
    <View
      style={[
        styles.row,
        mastered ? styles.rowBorderMastered : styles.rowBorderThin,
        {
          backgroundColor: colors.surface,
          borderColor: mastered ? colors.success : colors.border,
        },
      ]}>
      <View style={styles.rowMain}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowReference, {color: colors.primary}]}>
            {reference}
          </Text>
          <View
            style={[
              styles.boxBadge,
              {
                backgroundColor: mastered
                  ? colors.success + '20'
                  : colors.primary + '15',
              },
            ]}>
            <Text
              style={[
                styles.boxBadgeText,
                {color: mastered ? colors.success : colors.primary},
              ]}>
              {mastered
                ? t.memory.mastered
                : t.memory.box.replace('{{n}}', String(card.box))}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.rowText, {color: colors.textSecondary}]}
          numberOfLines={2}>
          {card.text}
        </Text>
        <Text style={[styles.rowMeta, {color: colors.textTertiary}]}>
          {t.memory.nextReview}: {nextReview}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.rowAction}
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t.memory.removeFromDeck}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
};

/** "today" / "tomorrow" / "in 3d" / "2d ago" — localized + concise. */
function formatRelativeDate(iso: string, language: 'es' | 'en'): string {
  const due = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(diffMs / dayMs);

  if (language === 'es') {
    if (diffDays <= 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    return `en ${diffDays} días`;
  }
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return `in ${diffDays} days`;
}

const StatBubble: React.FC<{value: number; label: string}> = ({
  value,
  label,
}) => {
  // Soft spring-up entrance on mount so the stats feel like they
  // settle into place rather than appearing instantly.
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);
  return (
    <Animated.View style={[styles.statBubble, {opacity, transform: [{scale}]}]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

/**
 * Practice call-to-action with a slow breathing pulse — draws the eye
 * while cards are due. Pulse stops the moment the user taps so the
 * scale-up isn't competing with the route transition.
 */
const PulsingPracticeCta: React.FC<{
  onPress: () => void;
  backgroundColor: string;
  label: string;
}> = ({onPress, backgroundColor, label}) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const stoppedRef = useRef(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.035,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      stoppedRef.current = true;
      loop.stop();
    };
  }, [pulse]);

  const handlePress = () => {
    if (!stoppedRef.current) {
      pulse.stopAnimation();
      stoppedRef.current = true;
    }
    onPress();
  };

  return (
    <Animated.View style={{transform: [{scale: pulse}]}}>
      <TouchableOpacity
        style={[styles.practiceCta, {backgroundColor}]}
        onPress={handlePress}
        accessibilityRole="button">
        <Ionicons name="play" size={22} color="#FFFFFF" />
        <Text style={styles.practiceCtaText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: staticColors.glassWhite15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: staticColors.glassWhite15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    color: staticColors.glassWhite80,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statBubble: {
    flex: 1,
    backgroundColor: staticColors.glassWhite18,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  statLabel: {
    color: staticColors.glassWhite85,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  chipStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  chipStreakText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
  chipGoal: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  chipGoalText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  chipBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  celebrateOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack55,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  celebrateCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  celebrateEmoji: {
    fontSize: 56,
    marginBottom: spacing.xs,
  },
  celebrateTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  celebrateBody: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  celebrateCta: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: borderRadius.full,
  },
  celebrateCtaText: {
    color: staticColors.white,
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  practiceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  practiceCtaText: {
    color: staticColors.white,
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  noDueCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  noDueTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  noDueHint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowBorderThin: {borderWidth: StyleSheet.hairlineWidth},
  rowBorderMastered: {borderWidth: 1.5},
  rowMain: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowReference: {
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  boxBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  boxBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  rowAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
