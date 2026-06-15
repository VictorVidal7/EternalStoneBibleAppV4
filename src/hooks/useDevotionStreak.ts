/**
 * useDevotionStreak (Sprint 84) — the daily "Momento con Dios" habit streak.
 *
 * Loads the device-local devotion log and derives the streak summary, mirroring
 * useMemoryGoal: it reloads on screen focus (via `useFocusEffect`) so finishing
 * a devotion and returning Home reflects the new day immediately, and it
 * re-captures `now` on each load so "today" stays current across midnight.
 *
 * Pure derivation lives in [[devotionLog]]; this hook only wires storage →
 * React. Device-local throughout — the log never syncs.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {getDevotionLog} from '@/features/study/devotionLogStore';
import {
  devotionStreak,
  emptyDevotionLog,
  type DevotionLog,
  type DevotionStreakSummary,
} from '@/features/study/devotionLog';

export interface DevotionStreakState {
  /** False until the first load resolves (cards stay hidden meanwhile). */
  loaded: boolean;
  /** Current/longest streak + lifetime-in-window + whether today is done. */
  summary: DevotionStreakSummary;
}

export function useDevotionStreak(): DevotionStreakState {
  const [log, setLog] = useState<DevotionLog>(emptyDevotionLog);
  const [loaded, setLoaded] = useState(false);
  // Re-captured on every (re)load so "today" stays current across days.
  const [now, setNow] = useState<number>(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const next = await getDevotionLog();
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

  return {loaded, summary: devotionStreak(log, now)};
}
