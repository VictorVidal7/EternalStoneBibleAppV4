/**
 * 📊 useQuizStats — the extended "Quiz bíblico" stats (T18b), wired to React.
 *
 * Bridges the device-local [[quizStatsStore]] to a screen: loads the persisted
 * snapshot on focus (so returning to a stats screen reflects rounds finished
 * elsewhere), exposes `recordRoundResult` to fold in one finished round through
 * the store's serialized write, and derives the display-ready `summary` (all
 * accuracy %s) via a memoized {@link summarizeQuizStats}. Mirrors
 * [[usePrayerJournal]] / [[useMemoryGoal]] (raw persisted data + derived view);
 * the store stays React-free.
 *
 * Device-local throughout — extended quiz stats never sync (shared Firestore
 * quota; standing no-new-writes rule).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {
  emptyQuizStats,
  getQuizStats,
  recordRoundResult as persistRoundResult,
  summarizeQuizStats,
  type QuizRoundResult,
  type QuizStats,
  type QuizStatsSummary,
} from '@/features/quiz/quizStatsStore';

export interface QuizStatsState {
  /** False until the first async load resolves (show a spinner meanwhile). */
  loaded: boolean;
  /** Raw persisted counters. */
  stats: QuizStats;
  /** Display-ready view with derived accuracy %s — render THIS. */
  summary: QuizStatsSummary;
  /** Fold one finished round into the snapshot (persist + refresh state). */
  recordRoundResult: (result: QuizRoundResult) => Promise<void>;
}

export function useQuizStats(): QuizStatsState {
  const [stats, setStats] = useState<QuizStats>(emptyQuizStats);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const next = await getQuizStats();
        if (!active) return;
        setStats(next);
        setLoaded(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const recordRoundResult = useCallback(async (result: QuizRoundResult) => {
    setStats(await persistRoundResult(result));
  }, []);

  const summary = useMemo(() => summarizeQuizStats(stats), [stats]);

  return {loaded, stats, summary, recordRoundResult};
}
