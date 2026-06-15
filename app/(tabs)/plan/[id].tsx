/**
 * 📅 READING PLAN DETAIL — Reading Plans 2.0 (Sprint 79)
 *
 * Shows every day of a reading plan with its chapters. Each day can be marked
 * complete; progress persists via ReadingPlanProgressContext (which also
 * AUTO-completes a day the moment all its chapters are read) and is reflected
 * on the home screen.
 *
 * Sprint 79 turns the static checklist into a guided companion:
 *   - a pinned "Hoy te toca" card with the next day's readings as tappable
 *     per-chapter chips (✓ = chapter already read), a Read CTA into the first
 *     unread chapter, and "Escuchar este día" queueing the day's chapters as a
 *     labeled verse playlist (the ∞ advancer never rolls past the day);
 *   - an honest, grace-toned pace line from the pure [[planPace]] model
 *     ("Vas al día" / "Llevas 2 días de ventaja" / "Te esperan 3 días — a tu
 *     ritmo");
 *   - per-chapter read ticks on every day row (the context already knew);
 *   - a one-shot auto-scroll to the next day (reset per plan id — expo-router
 *     reuses route instances, the S74 lesson);
 *   - a completion celebration when the final day flips done.
 */

import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppText as Text} from '@components/ui/AppText';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {useAudioPlayer, toAudioVerses} from '@/features/audio';
import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {
  getReadingPlanById,
  getLocalizedPlan,
  ReadingPlanDay,
} from '@/constants/reading-plans';
import {planPace, planCatchUp, formatDayReadings} from '@/lib/reading/planPace';
import type {PlanPace, PlanCatchUp} from '@/lib/reading/planPace';
import {staticColors} from '@/styles/designTokens';
import {getBookByName} from '@/constants/bible';
import {haptics} from '@lib/haptics';

export default function ReadingPlanDetailScreen() {
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {selectedVersion} = useBibleVersion();
  const {loadChapter, play} = useAudioPlayer();
  const {
    getCompletedDays,
    isDayComplete,
    toggleDay,
    isChapterRead,
    getStartedAt,
  } = useReadingPlanProgress();

  const plan = getReadingPlanById(id ?? '');

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : ['#4f46e5', '#7c3aed', '#a855f7']
  ) as [string, string, ...string[]];

  const completedDays = plan ? getCompletedDays(plan.id) : [];
  const completed = completedDays.length;
  const pace: PlanPace = useMemo(
    () =>
      planPace({
        startedAt: plan ? getStartedAt(plan.id) : null,
        completedDays,
        duration: plan?.duration ?? 0,
        now: new Date(),
      }),
    // completedDays is a fresh array per render; its length + the plan are
    // the actual change signals (this eslint has no exhaustive-deps rule).
    [plan, completed, getStartedAt],
  );

  // "Ponte al día" (Sprint 84): the readings between the reader and today, and
  // the honest finish date if they keep one-a-day from here. Pure; only the
  // screen decides to SHOW it (when behind).
  const catchUp: PlanCatchUp = useMemo(
    () => planCatchUp(pace, plan?.duration ?? 0, completedDays, new Date()),
    // Same change signals as `pace` (completedDays is a fresh array per render).
    [pace, plan, completed],
  );

  const bookLabel = useCallback(
    (book: string): string => {
      const info = getBookByName(book);
      if (!info) return book;
      return language === 'en' ? info.nameEn : info.name;
    },
    [language],
  );

  // Celebrate the moment the FINAL day flips done in this session.
  const [celebrate, setCelebrate] = useState(false);
  const prevCompletedRef = useRef<number | null>(null);

  // Route instances are REUSED across plan ids (S74/S76) — reset the one-shot
  // celebration tracking when the plan changes, or a still-open `celebrate`
  // from the previous plan replays over the new one with the new plan's name
  // (live-caught in S79). Declared BEFORE the detection effect so the reset
  // wins the same render.
  const planIdRef = useRef<string | null>(null);
  useEffect(() => {
    const id = plan?.id ?? null;
    if (planIdRef.current === id) return;
    planIdRef.current = id;
    prevCompletedRef.current = null;
    setCelebrate(false);
  }, [plan]);

  useEffect(() => {
    if (!plan) return;
    const prev = prevCompletedRef.current;
    prevCompletedRef.current = completed;
    if (prev !== null && prev < plan.duration && completed === plan.duration) {
      haptics.success();
      setCelebrate(true);
    }
  }, [plan, completed]);

  // One-shot auto-scroll to the next day, reset when the plan changes
  // (expo-router reuses the route instance — S74). A plan whose pointer is at
  // day 1 (or already complete) scrolls back to the TOP, so the offset left
  // behind by the previously viewed plan doesn't linger.
  const listRef = useRef<FlatList<ReadingPlanDay>>(null);
  const scrolledForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!plan) return;
    if (scrolledForRef.current === plan.id) return;
    scrolledForRef.current = plan.id;
    const target = pace.nextDay;
    const timer = setTimeout(() => {
      if (target == null || target <= 1) {
        listRef.current?.scrollToOffset({offset: 0, animated: false});
      } else {
        listRef.current?.scrollToIndex({
          index: target - 1,
          viewPosition: 0.15,
          animated: false,
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [plan, pace.nextDay]);

  // 🎧 Queue one plan day's chapters as a labeled verse playlist — the ∞
  // advancer never rolls past the end of the day (Sprint 79 queue contract).
  const handleListenDay = useCallback(
    async (day: ReadingPlanDay, planName: string) => {
      if (!plan) return;
      haptics.press();
      try {
        await bibleDB.initialize();
        const chapters = await Promise.all(
          day.readings.map(async reading => {
            const info = getBookByName(reading.book);
            if (!info) return [];
            const raw = await bibleDB
              .getChapter(info.id, reading.chapter, selectedVersion.id)
              .catch(() => []);
            return toAudioVerses(raw);
          }),
        );
        const playlist = chapters.flat();
        if (playlist.length === 0) return;
        const label = t.readingPlan.playlistDayLabel
          .replace('{{day}}', String(day.day))
          .replace('{{plan}}', planName);
        logger.info('Plan day playlist queued', {
          planId: plan.id,
          day: day.day,
          verses: playlist.length,
        });
        loadChapter(playlist, {mode: 'playlist', label});
        setTimeout(() => play(), 150);
        toast.success(
          t.audio.queue.playlistQueued
            .replace('{{label}}', label)
            .replace('{{n}}', String(playlist.length)),
        );
      } catch (error) {
        logger.error('Plan day playlist failed', error as Error, {
          component: 'ReadingPlanDetailScreen',
          action: 'handleListenDay',
        });
      }
    },
    [plan, selectedVersion.id, loadChapter, play, toast, t],
  );

  if (!plan) {
    return (
      <View
        style={[
          styles.container,
          styles.centerBox,
          {backgroundColor: colors.background},
        ]}>
        <Text style={{color: colors.textSecondary}}>
          {t.bible.bookNotFound}
        </Text>
      </View>
    );
  }

  const percent = Math.round((completed / plan.duration) * 100);
  const localizedPlan = getLocalizedPlan(plan, t);

  const paceCaption = (() => {
    switch (pace.status) {
      case 'notStarted':
        return t.readingPlan.paceNotStarted;
      case 'onTrack':
        return t.readingPlan.paceOnTrack;
      case 'ahead':
        return pace.daysAhead === 1
          ? t.readingPlan.paceAheadOne
          : t.readingPlan.paceAhead.replace('{{n}}', String(pace.daysAhead));
      case 'behind':
        return pace.daysBehind === 1
          ? t.readingPlan.paceBehindOne
          : t.readingPlan.paceBehind.replace('{{n}}', String(pace.daysBehind));
      case 'complete':
        return t.readingPlan.planCompletedShort;
    }
  })();

  const todayDay =
    pace.nextDay != null
      ? (plan.days.find(d => d.day === pace.nextDay) ?? null)
      : null;

  function openChapter(book: string, chapter: number) {
    haptics.tap();
    router.push(`/verse/${book}/${chapter}` as never);
  }

  /** Per-chapter chips with read ticks — shared by the Today card and rows. */
  function renderReadingChips(day: ReadingPlanDay, accentRead: string) {
    return (
      <View style={styles.chipsRow}>
        {day.readings.map(reading => {
          const read = isChapterRead(reading.book, reading.chapter);
          return (
            <TouchableOpacity
              key={`${reading.book}-${reading.chapter}`}
              style={[
                styles.chapterChip,
                {
                  backgroundColor: read ? accentRead + '22' : colors.background,
                  borderColor: read ? accentRead : colors.border,
                },
              ]}
              onPress={() => openChapter(reading.book, reading.chapter)}
              accessibilityRole="button"
              accessibilityLabel={`${bookLabel(reading.book)} ${reading.chapter}`}
              accessibilityState={{selected: read}}
              accessibilityHint={
                read ? t.readingPlan.chapterReadHint : undefined
              }>
              {read && (
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color={accentRead}
                />
              )}
              <Text
                style={[
                  styles.chapterChipText,
                  {color: read ? accentRead : colors.text},
                ]}>
                {bookLabel(reading.book)} {reading.chapter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  /**
   * "Ponte al día" (Sprint 84): only when behind. Shows the readings standing
   * between the reader and today (collapsed into ranges) and the honest finish
   * date if they keep one-a-day from here — an invitation, never a scold.
   */
  function renderCatchUpCard() {
    if (pace.status !== 'behind' || catchUp.catchUpDays.length === 0) {
      return null;
    }
    const readings = catchUp.catchUpDays.flatMap(
      dayNum => plan!.days.find(d => d.day === dayNum)?.readings ?? [],
    );
    const readingsLabel = formatDayReadings(readings, bookLabel);
    const finishLabel = catchUp.projectedFinish
      ? catchUp.projectedFinish.toLocaleDateString(
          language === 'en' ? 'en-US' : 'es-ES',
          {month: 'long', day: 'numeric'},
        )
      : null;
    return (
      <View
        style={[
          styles.catchUpCard,
          {backgroundColor: colors.surface, borderColor: colors.warning},
        ]}>
        <View style={styles.todayHeader}>
          <Ionicons name="rocket" size={18} color={colors.warning} />
          <Text style={[styles.todayTitle, {color: colors.warning}]}>
            {t.readingPlan.catchUpTitle}
          </Text>
        </View>
        <Text style={[styles.catchUpReadings, {color: colors.text}]}>
          {t.readingPlan.catchUpToday.replace('{{readings}}', readingsLabel)}
        </Text>
        {finishLabel ? (
          <Text style={[styles.catchUpFinish, {color: colors.textSecondary}]}>
            {t.readingPlan.catchUpFinish.replace('{{date}}', finishLabel)}
          </Text>
        ) : null}
      </View>
    );
  }

  function renderTodayCard() {
    if (!todayDay) {
      return (
        <View
          style={[
            styles.todayCard,
            {backgroundColor: colors.surface, borderColor: colors.primary},
          ]}>
          <View style={styles.todayHeader}>
            <Ionicons name="trophy" size={18} color={colors.primary} />
            <Text style={[styles.todayTitle, {color: colors.primary}]}>
              {t.readingPlan.planCompleted}
            </Text>
          </View>
          <Text style={[styles.todayReadings, {color: colors.textSecondary}]}>
            {t.readingPlan.planCompletedMessage.replace(
              '{{plan}}',
              localizedPlan.name,
            )}
          </Text>
        </View>
      );
    }
    const firstUnread =
      todayDay.readings.find(
        reading => !isChapterRead(reading.book, reading.chapter),
      ) ?? todayDay.readings[0];
    return (
      <View
        style={[
          styles.todayCard,
          {backgroundColor: colors.surface, borderColor: colors.primary},
        ]}>
        <View style={styles.todayHeader}>
          <Ionicons name="today" size={18} color={colors.primary} />
          <Text style={[styles.todayTitle, {color: colors.primary}]}>
            {t.readingPlan.todaySection} · {t.readingPlan.dayLabel}{' '}
            {todayDay.day}
          </Text>
        </View>
        <Text style={[styles.todayReadings, {color: colors.textSecondary}]}>
          {formatDayReadings(todayDay.readings, bookLabel)}
        </Text>
        {renderReadingChips(todayDay, colors.primary)}
        <View style={styles.todayActions}>
          {firstUnread && (
            <TouchableOpacity
              style={[styles.todayAction, {backgroundColor: colors.primary}]}
              onPress={() => openChapter(firstUnread.book, firstUnread.chapter)}
              accessibilityRole="button"
              accessibilityLabel={t.readingPlan.readDay}>
              <Ionicons name="book" size={15} color={staticColors.white} />
              <Text style={styles.todayActionText}>
                {t.readingPlan.readDay}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.todayAction,
              styles.todayActionGhost,
              {borderColor: colors.primary},
            ]}
            onPress={() => void handleListenDay(todayDay, localizedPlan.name)}
            accessibilityRole="button"
            accessibilityLabel={t.readingPlan.listenDay}>
            <Ionicons name="headset" size={15} color={colors.primary} />
            <Text style={[styles.todayActionText, {color: colors.primary}]}>
              {t.readingPlan.listenDay}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderDay({item}: {item: ReadingPlanDay}) {
    const done = isDayComplete(plan!.id, item.day);
    return (
      <View style={[styles.dayRow, {backgroundColor: colors.surface}]}>
        <TouchableOpacity
          style={styles.dayCheck}
          onPress={() => {
            haptics.tap();
            toggleDay(plan!.id, item.day);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{checked: done}}
          accessibilityLabel={`${t.readingPlan.dayLabel} ${item.day}`}>
          <View
            style={[
              styles.checkCircle,
              {
                borderColor: done ? colors.primary : colors.border,
                backgroundColor: done
                  ? colors.primary
                  : staticColors.transparent,
              },
            ]}>
            {done && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
        </TouchableOpacity>
        <View style={styles.dayContent}>
          <Text
            style={[
              styles.dayTitle,
              {color: done ? colors.textSecondary : colors.text},
            ]}>
            {t.readingPlan.dayLabel} {item.day}
          </Text>
          {renderReadingChips(item, colors.primary)}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {localizedPlan.name}
        </Text>
        <Text style={styles.headerSubtitle}>{localizedPlan.description}</Text>

        {/* Progress bar + honest pace line (Sprint 79) */}
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {completed}/{plan.duration} {t.readingPlan.daysCompleted} ·{' '}
            {percent}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${percent}%`}]} />
        </View>
        <Text style={styles.paceText}>{paceCaption}</Text>
      </LinearGradient>

      <FlatList
        ref={listRef}
        data={plan.days}
        keyExtractor={item => String(item.day)}
        renderItem={renderDay}
        ListHeaderComponent={
          <>
            {renderCatchUpCard()}
            {renderTodayCard()}
          </>
        }
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={info => {
          // Rows have variable height (chips wrap): jump near the target by
          // estimate, then retry the precise scroll once rows are measured.
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              viewPosition: 0.15,
              animated: false,
            });
          }, 120);
        }}
      />

      {/* 🎉 Completion celebration (RM-safe: no bespoke animation) */}
      <Modal
        visible={celebrate}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebrate(false)}>
        <View style={styles.celebrateOverlay}>
          <View
            style={[styles.celebrateCard, {backgroundColor: colors.card}]}
            {...focusTrapProps()}>
            <Ionicons name="trophy" size={48} color={colors.primary} />
            <Text style={[styles.celebrateTitle, {color: colors.text}]}>
              {t.readingPlan.planCompleted}
            </Text>
            <Text
              style={[styles.celebrateMessage, {color: colors.textSecondary}]}>
              {t.readingPlan.planCompletedMessage.replace(
                '{{plan}}',
                localizedPlan.name,
              )}
            </Text>
            <TouchableOpacity
              style={[styles.celebrateCta, {backgroundColor: colors.primary}]}
              onPress={() => setCelebrate(false)}
              accessibilityRole="button"
              accessibilityLabel={t.readingPlan.planCompletedCta}>
              <Text style={styles.celebrateCtaText}>
                {t.readingPlan.planCompletedCta}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  centerBox: {alignItems: 'center', justifyContent: 'center'},
  header: {
    paddingTop: 60,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: staticColors.white,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: staticColors.glassWhite85,
    marginTop: 4,
  },
  progressInfo: {marginTop: 16},
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: staticColors.white,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: staticColors.glassWhite25,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: staticColors.white,
  },
  paceText: {
    fontSize: 13,
    fontWeight: '600',
    color: staticColors.glassWhite90,
    marginTop: 10,
  },
  listContent: {padding: 16, paddingBottom: 110},
  todayCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  catchUpCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  catchUpReadings: {fontSize: 14, lineHeight: 20, fontWeight: '600'},
  catchUpFinish: {fontSize: 13, lineHeight: 18},
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  todayReadings: {fontSize: 14, lineHeight: 20},
  todayActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  todayAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  todayActionGhost: {
    backgroundColor: staticColors.transparent,
    borderWidth: 1.5,
  },
  todayActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: staticColors.white,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chapterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chapterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  dayCheck: {paddingRight: 14, paddingTop: 2},
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContent: {flex: 1, gap: 7},
  dayTitle: {fontSize: 15, fontWeight: '700'},
  celebrateOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  celebrateCard: {
    width: '100%',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    gap: 12,
  },
  celebrateTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  celebrateMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  celebrateCta: {
    marginTop: 6,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  celebrateCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: staticColors.white,
  },
});
