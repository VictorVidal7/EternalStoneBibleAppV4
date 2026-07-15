/**
 * 🧒 BIBLIA PARA NIÑOS — hub listing the app's curated kids stories (Item 4,
 * Tanda 1 of the kids/family mode).
 *
 * A separate section reached from Home's "Explorar" tile, built for dual
 * use per the user's call: a child (8+) can read a story alone, or an adult
 * can read it aloud to a younger one. Each card opens
 * `/features/kids/[storyId]`: scenes → a 3-question quiz → a "Para enseñar"
 * panel for the adult (context + open discussion questions, no prescribed
 * wording — same theological care as [[scripturePrayers]]).
 *
 * Reached from the Home "Explorar" tile + the deep link
 * eternalbible://features/kids.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
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
import {
  getKidsProgress,
  type KidsProfileProgress,
} from '@/features/kids/kidsProgress';
import {kidsPlanPace} from '@/features/kids/kidsPlan';
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

export default function KidsHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tk = t.kids;
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

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];
  const storyById = new Map(KIDS_STORIES.map(s => [s.id, s]));

  const pace: PlanPace = kidsPlanPace(
    progress?.planStartedAt ?? null,
    progress?.storiesCompleted ?? [],
    new Date(),
  );
  const tp = tk.plan;
  const planCaption = (() => {
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

  const openStory = (id: KidsStoryId) => {
    haptics.tap();
    router.push(`/features/kids/${id}` as never);
  };

  const openPlan = () => {
    haptics.tap();
    router.push('/features/kids/plan' as never);
  };

  // A deep link straight into this screen leaves no back-stack entry, so
  // router.back() would throw a "GO_BACK not handled" navigation error.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/' as never);
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
              <Ionicons name="happy" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tk.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tk.title}
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
            {tk.intro}
          </AppText>

          <TouchableOpacity
            style={[styles.planCard, {backgroundColor: colors.primary}]}
            activeOpacity={0.85}
            onPress={openPlan}
            accessibilityRole="button"
            accessibilityLabel={tp.cardTitle}>
            <View style={styles.planCardIcon}>
              <Ionicons name="calendar" size={24} color={staticColors.white} />
            </View>
            <View style={styles.planCardInfo}>
              <AppText style={styles.planCardTitle}>{tp.cardTitle}</AppText>
              <AppText
                scaleRole="compact"
                style={styles.planCardSubtitle}
                numberOfLines={1}>
                {planCaption}
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={staticColors.white}
            />
          </TouchableOpacity>

          {KIDS_STORY_ORDER.map(id => {
            const story = storyById.get(id);
            if (!story) return null;
            const accent = KIDS_STORY_PALETTE[id].accent;
            const meta = stories[id];
            const completed = progress?.storiesCompleted.includes(id) ?? false;
            const best = progress?.quizBest[id] ?? 0;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.card,
                  {backgroundColor: colors.card, borderColor: accent + '40'},
                ]}
                activeOpacity={0.85}
                onPress={() => openStory(id)}
                accessibilityRole="button"
                accessibilityLabel={meta?.title ?? id}>
                <View
                  style={[styles.cardIcon, {backgroundColor: accent + '18'}]}>
                  <Ionicons
                    name={KIDS_STORY_ICON[id] as never}
                    size={26}
                    color={accent}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <AppText style={[styles.cardTitle, {color: colors.text}]}>
                    {meta?.title ?? ''}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    style={[styles.cardSubtitle, {color: accent}]}
                    numberOfLines={1}>
                    {meta?.subtitle ?? ''}
                  </AppText>
                  <View style={styles.cardMetaRow}>
                    <AppText
                      scaleRole="compact"
                      style={[styles.cardMeta, {color: colors.textTertiary}]}>
                      {tk.scenesCount.replace(
                        '{{n}}',
                        String(story.scenes.length),
                      )}
                    </AppText>
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
                          {tk.completed}
                        </AppText>
                      </View>
                    )}
                    {best > 0 && (
                      <AppText
                        scaleRole="compact"
                        style={[styles.cardMeta, {color: colors.textTertiary}]}>
                        {'⭐'.repeat(best)}
                      </AppText>
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
  content: {padding: spacing.lg, gap: spacing.lg},
  intro: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    textAlign: 'center',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    minHeight: 68,
  },
  planCardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCardInfo: {flex: 1, gap: 2},
  planCardTitle: {
    color: staticColors.white,
    fontSize: fontSizes.md,
    fontWeight: '800',
  },
  planCardSubtitle: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    minHeight: 72,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {flex: 1, gap: 2},
  cardTitle: {fontSize: fontSizes.lg, fontWeight: '800'},
  cardSubtitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  cardMeta: {fontSize: fontSizes.xs, fontWeight: '600'},
  completedChip: {flexDirection: 'row', alignItems: 'center', gap: 3},
  completedText: {fontSize: fontSizes.xs, fontWeight: '700'},
});
