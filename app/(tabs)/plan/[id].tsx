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
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {ShareTogetherModal} from '@components/together/ShareTogetherModal';
import {ShareCustomPlanModal} from '@components/together/ShareCustomPlanModal';
import {useTogether} from '@context/TogetherContext';
import {useCustomPlans} from '@context/CustomPlansContext';
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
  getPlanDayContext,
  ReadingPlanDay,
} from '@/constants/reading-plans';
import {planPace, planCatchUp, formatDayReadings} from '@/lib/reading/planPace';
import type {PlanPace, PlanCatchUp} from '@/lib/reading/planPace';
import {
  isReflowable,
  maxReflowDays,
  effectivePlanDays,
} from '@/lib/reading/planReflow';
import {staticColors} from '@/styles/designTokens';
import {centeredMaxWidth} from '@/styles/responsive';
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
    getPlanDuration,
    setPlanDuration,
    restartPlan,
  } = useReadingPlanProgress();
  const {getMembership, leavePlan} = useTogether();
  const {getCustomPlanById, deleteCustomPlan} = useCustomPlans();

  // Resolve curated plans statically and custom plans from the context, so the
  // screen re-renders once the device-local custom plans have loaded (S108).
  const plan = getReadingPlanById(id ?? '') ?? getCustomPlanById(id ?? '');

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : ['#4f46e5', '#7c3aed', '#a855f7']
  ) as [string, string, ...string[]];

  const completedDays = plan ? getCompletedDays(plan.id) : [];
  const completed = completedDays.length;

  // A reader-chosen duration (Sprint 111): re-spreads the SAME curated
  // chapters across a different number of days. Only offered for curated,
  // whole-chapter plans, before the first day is marked — see the picker
  // below. `effectiveDays`/`effectiveDuration` replace `plan.days`/
  // `plan.duration` everywhere else on this screen.
  const customDuration = plan ? getPlanDuration(plan.id) : null;
  const effectiveDays = useMemo(
    () => (plan ? effectivePlanDays(plan, customDuration) : []),
    [plan, customDuration],
  );
  const effectiveDuration = effectiveDays.length;

  // The picker's own pending value — starts at whatever's already chosen
  // (or the curated default), and re-syncs if the route's plan id changes.
  const [pendingDuration, setPendingDuration] = useState(
    customDuration ?? plan?.duration ?? 0,
  );
  useEffect(() => {
    if (plan) setPendingDuration(customDuration ?? plan.duration);
  }, [plan, customDuration]);

  const pace: PlanPace = useMemo(
    () =>
      planPace({
        startedAt: plan ? getStartedAt(plan.id) : null,
        completedDays,
        duration: effectiveDuration,
        now: new Date(),
      }),
    // completedDays is a fresh array per render; its length + the plan are
    // the actual change signals (this eslint has no exhaustive-deps rule).
    [plan, completed, getStartedAt, effectiveDuration],
  );

  // "Ponte al día" (Sprint 84): the readings between the reader and today, and
  // the honest finish date if they keep one-a-day from here. Pure; only the
  // screen decides to SHOW it (when behind).
  const catchUp: PlanCatchUp = useMemo(
    () => planCatchUp(pace, effectiveDuration, completedDays, new Date()),
    // Same change signals as `pace` (completedDays is a fresh array per render).
    [pace, plan, completed, effectiveDuration],
  );

  // Book names follow the READING version's language (RVR1960 → "Juan").
  const bookLabel = useCallback(
    (book: string): string => {
      const info = getBookByName(book);
      if (!info) return book;
      return selectedVersion.language === 'es' ? info.name : info.nameEn;
    },
    [selectedVersion.language],
  );

  // Celebrate the moment the FINAL day flips done in this session.
  const [celebrate, setCelebrate] = useState(false);
  // Themed confirm for removing a custom plan (replaces the bare native alert).
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Confirm before wiping a finished plan's progress to walk it again.
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
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
    if (
      prev !== null &&
      prev < effectiveDuration &&
      completed === effectiveDuration
    ) {
      haptics.success();
      setCelebrate(true);
    }
  }, [plan, completed, effectiveDuration]);

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

  const percent = Math.round((completed / effectiveDuration) * 100);
  const localizedPlan = getLocalizedPlan(plan, t, effectiveDuration);
  // A custom plan carries no localized tagline (S108) — describe it by its
  // shape in the active language instead of an empty subtitle.
  const headerSubtitle = plan.custom
    ? t.together.customMeta
        .replace('{{days}}', String(plan.duration))
        .replace(
          '{{chapters}}',
          String(plan.days.reduce((s, d) => s + d.readings.length, 0)),
        )
    : localizedPlan.description;
  const membership = getMembership(plan.id);
  const onLeaveGroup = () => {
    haptics.tap();
    leavePlan(plan.id);
    toast.success(t.together.leaveGroup);
  };

  // The duration picker: curated (not custom-built), whole-chapter (not one
  // of the partial-verse themed plans), not joined via Together (everyone in
  // a shared plan reads the same day the same chapters), and no progress yet.
  const durationMax = maxReflowDays(plan);
  const showDurationPicker =
    !plan.custom && completed === 0 && !membership && isReflowable(plan);
  const adjustDuration = (delta: number) => {
    haptics.tap();
    const next = Math.max(1, Math.min(durationMax, pendingDuration + delta));
    setPendingDuration(next);
    void setPlanDuration(plan.id, next);
  };

  // Custom plans can be removed (curated ones cannot). Confirm first, since it
  // drops the plan from the device; the reading progress stays keyed by id, so
  // re-importing the same plan restores it.
  const onDeletePlan = () => {
    if (!plan?.custom) return;
    haptics.tap();
    setConfirmDelete(true);
  };

  // Edit a custom plan: reopen the builder pre-filled with this plan (S110,
  // completing S108). Curated plans aren't editable.
  const onEditPlan = () => {
    if (!plan?.custom) return;
    haptics.tap();
    router.push(`/features/plan-builder?editId=${plan.id}` as never);
  };

  const onConfirmDelete = async () => {
    if (!plan?.custom) return;
    setConfirmDelete(false);
    await deleteCustomPlan(plan.id);
    toast.success(t.together.planDeleted);
    router.back();
  };

  const onRestartPlan = () => {
    haptics.tap();
    setConfirmRestart(true);
  };

  const onConfirmRestart = async () => {
    if (!plan) return;
    setConfirmRestart(false);
    await restartPlan(plan.id);
    // Let the auto-scroll-to-next-day effect run again now that pace.nextDay
    // is back to day 1 (it only fires once per plan id otherwise).
    scrolledForRef.current = null;
    toast.success(t.readingPlan.planRestarted);
  };

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
      ? (effectiveDays.find(d => d.day === pace.nextDay) ?? null)
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
          <View style={styles.todayActions}>
            <TouchableOpacity
              style={[
                styles.todayAction,
                styles.todayActionGhost,
                {borderColor: colors.primary},
              ]}
              onPress={onRestartPlan}
              accessibilityRole="button"
              accessibilityLabel={t.readingPlan.restartPlan}>
              <Ionicons name="refresh" size={15} color={colors.primary} />
              <Text style={[styles.todayActionText, {color: colors.primary}]}>
                {t.readingPlan.restartPlan}
              </Text>
            </TouchableOpacity>
          </View>
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
    // Brief, faithful one-line context for topical plans (S99); undefined here
    // for plans that carry none.
    const dayContext = getPlanDayContext(plan!, item.day, t);
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
          {dayContext ? (
            <Text style={[styles.dayContext, {color: colors.textSecondary}]}>
              {dayContext}
            </Text>
          ) : null}
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
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {plan.custom ? (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={onEditPlan}
                accessibilityRole="button"
                accessibilityLabel={t.planBuilder.editTitle}>
                <Ionicons name="create-outline" size={21} color="#ffffff" />
              </TouchableOpacity>
            ) : null}
            {plan.custom ? (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={onDeletePlan}
                accessibilityRole="button"
                accessibilityLabel={t.together.deletePlan}>
                <Ionicons name="trash-outline" size={21} color="#ffffff" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => {
                haptics.tap();
                setShareOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                plan.custom
                  ? t.together.shareCustomTitle
                  : t.together.shareTitle
              }>
              <Ionicons
                name={plan.custom ? 'share-social-outline' : 'people-outline'}
                size={22}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {localizedPlan.name}
        </Text>
        <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>

        {/* Duration picker (Sprint 111): only before any progress, only for
            curated whole-chapter plans not joined via Together — changing it
            later would re-shuffle which chapters land on which already-ticked
            day number. */}
        {showDurationPicker && (
          <View style={styles.durationPicker}>
            <Text style={styles.durationPickerLabel}>
              {t.readingPlan.durationPickerLabel}
            </Text>
            <View style={styles.durationPickerRow}>
              <TouchableOpacity
                style={[
                  styles.durationStepBtn,
                  pendingDuration <= 1 && styles.disabled,
                ]}
                disabled={pendingDuration <= 1}
                onPress={() => adjustDuration(-1)}
                accessibilityRole="button"
                accessibilityLabel="-1">
                <Ionicons name="remove" size={18} color={staticColors.white} />
              </TouchableOpacity>
              <Text style={styles.durationPickerDays}>
                {t.readingPlan.durationPickerDays.replace(
                  '{{n}}',
                  String(pendingDuration),
                )}
              </Text>
              <TouchableOpacity
                style={[
                  styles.durationStepBtn,
                  pendingDuration >= durationMax && styles.disabled,
                ]}
                disabled={pendingDuration >= durationMax}
                onPress={() => adjustDuration(1)}
                accessibilityRole="button"
                accessibilityLabel="+1">
                <Ionicons name="add" size={18} color={staticColors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.durationPickerPace}>
              {t.readingPlan.durationPickerPace.replace(
                '{{n}}',
                (
                  Math.round((durationMax / pendingDuration) * 10) / 10
                ).toString(),
              )}
            </Text>
          </View>
        )}

        {/* Progress bar + honest pace line (Sprint 79) */}
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {completed}/{effectiveDuration} {t.readingPlan.daysCompleted} ·{' '}
            {percent}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${percent}%`}]} />
        </View>
        <Text style={styles.paceText}>{paceCaption}</Text>

        {membership ? (
          <View style={styles.groupChip}>
            <Ionicons name="people" size={14} color="#ffffff" />
            <Text style={styles.groupChipText} numberOfLines={1}>
              {membership.name
                ? t.together.readingWith.replace('{{group}}', membership.name)
                : t.together.readingTogether}
            </Text>
            <TouchableOpacity
              onPress={onLeaveGroup}
              accessibilityRole="button"
              accessibilityLabel={t.together.leaveGroup}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="close-circle" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : null}
      </LinearGradient>

      <FlatList
        ref={listRef}
        data={effectiveDays}
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

      {/* 🤝 Share invitation — curated plans align on a date+group (S107);
          a custom plan ships its whole content in the link (S108). */}
      {plan.custom ? (
        <ShareCustomPlanModal
          visible={shareOpen}
          plan={plan}
          onClose={() => setShareOpen(false)}
        />
      ) : (
        <ShareTogetherModal
          visible={shareOpen}
          planId={plan.id}
          planName={localizedPlan.name}
          onClose={() => setShareOpen(false)}
          initialStartDate={membership?.startDate}
          initialGroupName={membership?.name}
        />
      )}

      {/* 🗑️ Themed delete confirm for custom plans (S110 polish) */}
      <ConfirmDialog
        visible={confirmDelete}
        title={plan.name}
        message={t.together.deletePlanConfirm}
        confirmLabel={t.together.deletePlan}
        cancelLabel={t.cancel}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
        destructive
      />

      {/* 🔁 Confirm before wiping a finished plan's progress to walk it again. */}
      <ConfirmDialog
        visible={confirmRestart}
        title={plan.name}
        message={t.readingPlan.restartPlanConfirm}
        confirmLabel={t.readingPlan.restartPlan}
        cancelLabel={t.cancel}
        onConfirm={() => void onConfirmRestart()}
        onCancel={() => setConfirmRestart(false)}
        destructive
        icon="refresh"
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: staticColors.glassWhite20,
    maxWidth: '100%',
  },
  groupChipText: {
    flexShrink: 1,
    color: staticColors.white,
    fontSize: 13,
    fontWeight: '600',
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
  durationPicker: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: staticColors.glassWhite20,
  },
  durationPickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: staticColors.white,
  },
  durationPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  durationStepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationPickerDays: {
    fontSize: 17,
    fontWeight: '800',
    color: staticColors.white,
    minWidth: 90,
    textAlign: 'center',
  },
  durationPickerPace: {
    fontSize: 12,
    color: staticColors.glassWhite85,
    textAlign: 'center',
    marginTop: 6,
  },
  disabled: {opacity: 0.4},
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
  listContent: {padding: 16, paddingBottom: 110, ...centeredMaxWidth()},
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
  dayContext: {fontSize: 13, lineHeight: 18, fontStyle: 'italic'},
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
