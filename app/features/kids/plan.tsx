/**
 * 🗓️ KIDS PLAN — "Plan de 10 días": one Bible-for-kids story per day (Item 4,
 * Tanda 2 of the kids/family mode).
 *
 * NOT new content — this is a pacing layer over the ten stories already
 * built in Tanda 1, reusing every scene/quiz/illustration as-is. The pace
 * clock starts the first time ANY story's quiz is completed
 * ([[markKidsStoryCompleted]]) and is read here via the pure [[kidsPlanPace]]
 * model (a thin wrapper over the adult [[planPace]], which has no
 * chapter-specific coupling). Days are never locked — a child or parent can
 * open any day's story at any time; the plan only ever offers grace-toned
 * pacing guidance, never a gate.
 *
 * Reached from the kids hub `/features/kids` and the deep link
 * eternalbible://features/kids/plan.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter, useFocusEffect} from 'expo-router';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {
  KIDS_STORIES,
  KIDS_STORY_ORDER,
  KIDS_STORY_ICON,
  KIDS_STORY_PALETTE,
  type KidsStoryId,
} from '@/features/kids/kidsStories';
import {kidsPlanPace, kidsPlanDayStory} from '@/features/kids/kidsPlan';
import {
  getKidsProgress,
  type KidsProfileProgress,
} from '@/features/kids/kidsProgress';
import type {PlanPace} from '@/lib/reading/planPace';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface KidsStoryText {
  title: string;
  subtitle: string;
}

export default function KidsPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tk = t.kids;
  const tp = tk.plan;
  const stories = tk.stories as Record<string, KidsStoryText>;
  const [progress, setProgress] = useState<KidsProfileProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getKidsProgress().then(p => {
        if (active) setProgress(p);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const storyById = new Map(KIDS_STORIES.map(s => [s.id, s]));
  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  const pace: PlanPace = kidsPlanPace(
    progress?.planStartedAt ?? null,
    progress?.storiesCompleted ?? [],
    new Date(),
  );

  const paceCaption = (() => {
    switch (pace.status) {
      case 'notStarted':
        return tp.paceNotStarted;
      case 'onTrack':
        return tp.paceOnTrack;
      case 'ahead':
        return pace.daysAhead === 1
          ? tp.paceAheadOne
          : tp.paceAhead.replace('{{n}}', String(pace.daysAhead));
      case 'behind':
        return pace.daysBehind === 1
          ? tp.paceBehindOne
          : tp.paceBehind.replace('{{n}}', String(pace.daysBehind));
      case 'complete':
        return tp.paceComplete;
    }
  })();

  const todayStoryId: KidsStoryId | null =
    pace.nextDay != null ? kidsPlanDayStory(pace.nextDay) : null;

  const openStory = (id: KidsStoryId) => {
    haptics.tap();
    router.push(`/features/kids/${id}` as never);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/features/kids' as never);
  };

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tp.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tp.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          <AppText style={[styles.intro, {color: colors.textSecondary}]}>
            {tp.intro}
          </AppText>

          <View style={[styles.paceCard, {backgroundColor: colors.card}]}>
            <AppText style={[styles.paceCaption, {color: colors.text}]}>
              {paceCaption}
            </AppText>
            <View style={styles.dotsRow}>
              {KIDS_STORY_ORDER.map((id, i) => {
                const day = i + 1;
                const done = progress?.storiesCompleted.includes(id) ?? false;
                return (
                  <View
                    key={id}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: done ? colors.primary : colors.border,
                      },
                    ]}
                    accessibilityLabel={tp.dayLabel.replace(
                      '{{n}}',
                      String(day),
                    )}
                  />
                );
              })}
            </View>
            <AppText
              scaleRole="compact"
              style={[styles.paceProgress, {color: colors.textTertiary}]}>
              {tp.progress
                .replace(
                  '{{done}}',
                  String(progress?.storiesCompleted.length ?? 0),
                )
                .replace('{{total}}', String(KIDS_STORY_ORDER.length))}
            </AppText>
            {todayStoryId && (
              <TouchableOpacity
                style={[styles.todayBtn, {backgroundColor: colors.primary}]}
                onPress={() => openStory(todayStoryId)}
                accessibilityRole="button"
                accessibilityLabel={tp.goToToday}>
                <AppText
                  style={[styles.todayBtnText, {color: colors.onPrimary}]}>
                  {tp.goToToday}
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {KIDS_STORY_ORDER.map((id, i) => {
            const day = i + 1;
            const story = storyById.get(id);
            if (!story) return null;
            const accent = KIDS_STORY_PALETTE[id].accent;
            const meta = stories[id];
            const completed = progress?.storiesCompleted.includes(id) ?? false;
            const isToday = id === todayStoryId;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.card,
                  isToday ? styles.cardToday : styles.cardBorder,
                  {
                    backgroundColor: colors.card,
                    borderColor: isToday ? accent : accent + '40',
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => openStory(id)}
                accessibilityRole="button"
                accessibilityLabel={`${tp.dayLabel.replace('{{n}}', String(day))}: ${meta?.title ?? id}`}>
                <View
                  style={[styles.dayBadge, {backgroundColor: accent + '18'}]}>
                  <AppText style={[styles.dayBadgeText, {color: accent}]}>
                    {day}
                  </AppText>
                </View>
                <View
                  style={[styles.cardIcon, {backgroundColor: accent + '18'}]}>
                  {id === 'jesus-birth' ? (
                    <MaterialCommunityIcons
                      name="star-shooting-outline"
                      size={22}
                      color={accent}
                    />
                  ) : (
                    <Ionicons
                      name={KIDS_STORY_ICON[id] as never}
                      size={22}
                      color={accent}
                    />
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <AppText style={[styles.cardTitle, {color: colors.text}]}>
                    {meta?.title ?? ''}
                  </AppText>
                  <View style={styles.cardMetaRow}>
                    {completed && (
                      <View style={styles.completedChip}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={colors.success}
                        />
                        <AppText
                          scaleRole="compact"
                          style={[
                            styles.completedText,
                            {color: colors.success},
                          ]}>
                          {tp.completed}
                        </AppText>
                      </View>
                    )}
                    {!completed && isToday && (
                      <View style={[styles.todayChip, {borderColor: accent}]}>
                        <AppText
                          scaleRole="compact"
                          style={[styles.todayChipText, {color: accent}]}>
                          {tp.today}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  backButton: {width: 40, height: 40, justifyContent: 'center'},
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  content: {padding: spacing.lg, gap: spacing.md},
  intro: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  paceCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  paceCaption: {fontSize: fontSizes.lg, fontWeight: '800', textAlign: 'center'},
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {width: 14, height: 14, borderRadius: 7},
  paceProgress: {fontSize: fontSizes.xs, fontWeight: '600'},
  todayBtn: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.base,
  },
  todayBtnText: {fontSize: fontSizes.md, fontWeight: '800'},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    minHeight: 68,
  },
  cardBorder: {borderWidth: 1},
  cardToday: {borderWidth: 2},
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeText: {fontSize: fontSizes.sm, fontWeight: '800'},
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {flex: 1, gap: 2},
  cardTitle: {fontSize: fontSizes.md, fontWeight: '800'},
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  completedChip: {flexDirection: 'row', alignItems: 'center', gap: 3},
  completedText: {fontSize: fontSizes.xs, fontWeight: '700'},
  todayChip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  todayChipText: {fontSize: fontSizes.xs, fontWeight: '700'},
});
