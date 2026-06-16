/**
 * usePrayerStreak (Sprint 93) — the daily prayer-habit streak.
 *
 * Loads the device-local prayer log and derives the streak summary, mirroring
 * [[useDevotionStreak]]: it reloads on screen focus (via `useFocusEffect`) so
 * finishing a guided prayer and returning Home reflects the new day
 * immediately, and it re-captures `now` on each load so "today" stays current
 * across midnight.
 *
 * Pure derivation lives in [[prayerLog]]; this hook only wires storage →
 * React. Device-local throughout — the log never syncs.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {getPrayerLog} from '@/features/prayer/prayerLogStore';
import {
  prayerStreak,
  emptyPrayerLog,
  type PrayerLog,
  type PrayerStreakSummary,
} from '@/features/prayer/prayerLog';

export interface PrayerStreakState {
  /** False until the first load resolves (cards stay hidden meanwhile). */
  loaded: boolean;
  summary: PrayerStreakSummary;
}

export function usePrayerStreak(): PrayerStreakState {
  const [log, setLog] = useState<PrayerLog>(emptyPrayerLog);
  const [loaded, setLoaded] = useState(false);
  // Re-captured on every (re)load so "today" stays current across days.
  const [now, setNow] = useState<number>(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const next = await getPrayerLog();
        if (!active) return;
        setLog(next);
        setNow(Date.now());
        setLoaded(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  return {loaded, summary: prayerStreak(log, now)};
}
