/**
 * 🏆 useWeeklyChallenge — the weekly mastery challenge state (Sprint 86).
 *
 * COMPOSES the deck (cards, via MemoryDeckContext), the review-event log and
 * the device-local weekly target into the pure {@link buildWeeklyChallenge}.
 * The practice streak is taken from the SAME history [[useMemoryGoal]] already
 * computes, so the number matches the memory ring + deck screen everywhere.
 *
 * Reloads the events + target on focus (like [[useMemoryGoal]]) so returning
 * from a practice session reflects a freshly mastered verse immediately.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useMemoryGoal} from '@hooks/useMemoryGoal';
import {getAllReviewEvents} from '@lib/memory/reviewEventStore';
import {getWeeklyTarget} from '@lib/memory/weeklyTargetStore';
import type {ReviewEvent} from '@lib/memory/reviewEvents';
import {
  buildWeeklyChallenge,
  DEFAULT_WEEKLY_TARGET,
  type WeeklyChallenge,
} from '@lib/memory/weeklyChallenge';
import {logger} from '@lib/utils/logger';

export interface WeeklyChallengeState {
  loaded: boolean;
  challenge: WeeklyChallenge;
  /** Re-read the target after the settings picker changes it. */
  reloadTarget: () => void;
}

export function useWeeklyChallenge(): WeeklyChallengeState {
  const {cards} = useMemoryDeck();
  const {history, loaded: goalLoaded} = useMemoryGoal();

  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [target, setTarget] = useState(DEFAULT_WEEKLY_TARGET);
  const [sideLoaded, setSideLoaded] = useState(false);
  // Re-captured on every (re)load so "this week" stays current across weeks.
  const [now, setNow] = useState<Date>(() => new Date());

  const load = useCallback(async () => {
    try {
      const [allEvents, savedTarget] = await Promise.all([
        getAllReviewEvents(),
        getWeeklyTarget(),
      ]);
      setEvents(allEvents);
      setTarget(savedTarget);
      setNow(new Date());
    } catch (error) {
      logger.warn('Weekly challenge load failed', {
        component: 'useWeeklyChallenge',
        error: String(error),
      });
    } finally {
      setSideLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const challenge = useMemo<WeeklyChallenge>(
    () =>
      buildWeeklyChallenge({
        cards,
        reviewEvents: events,
        target,
        practiceStreak: history.summary.currentStreak,
        now,
      }),
    [cards, events, target, history.summary.currentStreak, now],
  );

  return {
    loaded: sideLoaded && goalLoaded,
    challenge,
    reloadTarget: () => {
      void load();
    },
  };
}
