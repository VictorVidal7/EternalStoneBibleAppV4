/**
 * 🔵 useConstancyRings — the Home "Tu constancia hoy" state (Sprint 85).
 *
 * COMPOSES the four daily-habit signals the app already tracks into one
 * {@link ConstancySummary}: reading (the streak service), memorization (the
 * daily-review goal), devotion (the device-only devotion log) and the emotional
 * check-in (the feelings log). Each habit answers two questions — "done today?"
 * and "how long is the streak?" — and the graded habits (reading, memory) also
 * report how far along today is, so the rings fill rather than just snap closed.
 *
 * Like [[useDevotionStreak]] / [[useMemoryGoal]] it reloads on focus and
 * re-captures `now` each time, so coming back to Home after reading / a review /
 * a devotion / a check-in closes the matching ring immediately. The pure math
 * lives in [[constancyRings]]; this hook only gathers the inputs.
 *
 * `hasHistory` gates the card honestly: a brand-new user with no footprint in
 * any habit sees nothing; anyone who has ever read / reviewed / had a moment /
 * named a feeling sees their rings (even all-open) as a gentle nudge.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {useServices} from '@context/ServicesContext';
import {useMemoryGoal} from '@hooks/useMemoryGoal';
import {useDevotionStreak} from '@hooks/useDevotionStreak';
import {computeStreaks} from '@lib/achievements/streak';
import {getFeelingsLog} from '@/features/study/feelingsLogStore';
import {feelingsDateKey} from '@/features/study/feelingsLog';
import {getReadingGoal} from '@lib/reading/readingGoalStore';
import {computeReadingGoalProgress} from '@lib/reading/readingGoal';
import {logger} from '@lib/utils/logger';
import {
  buildConstancySummary,
  type ConstancySummary,
  type HabitProgress,
} from '@lib/home/constancyRings';

/** Reading today, derived from the streak service. */
interface ReadingState {
  done: boolean;
  /** Progress toward today's reading goal, 0..1 (binary until S85 T3). */
  fraction: number;
  streak: number;
  everRead: boolean;
}

/** Mood today, derived from the device-only feelings log. */
interface MoodState {
  done: boolean;
  streak: number;
  everLogged: boolean;
}

const EMPTY_READING: ReadingState = {
  done: false,
  fraction: 0,
  streak: 0,
  everRead: false,
};
const EMPTY_MOOD: MoodState = {done: false, streak: 0, everLogged: false};

export interface ConstancyRingsState {
  loaded: boolean;
  summary: ConstancySummary;
  /** Any lifetime footprint in any habit — the honest "show the card" gate. */
  hasHistory: boolean;
}

export function useConstancyRings(): ConstancyRingsState {
  const {achievementService} = useServices();
  const memory = useMemoryGoal();
  const devotion = useDevotionStreak();

  const [reading, setReading] = useState<ReadingState>(EMPTY_READING);
  const [mood, setMood] = useState<MoodState>(EMPTY_MOOD);
  const [sideLoaded, setSideLoaded] = useState(false);

  // Reading + mood live outside the two composed hooks, so load them here on
  // focus. Memory + devotion self-reload via their own useFocusEffect.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          // Reading — the streak service owns "today" (UTC day key, matching
          // the reading_streak_log the streak is built from). The ring fills by
          // today's verses against the device-local daily reading goal, so it
          // grades rather than just snapping closed (Sprint 85 T3).
          const todayUtc = new Date().toISOString().split('T')[0];
          let next = EMPTY_READING;
          if (achievementService) {
            const [stats, log, goal] = await Promise.all([
              achievementService.getUserStats(),
              achievementService.getReadingLog(),
              getReadingGoal(),
            ]);
            const todayRow = log.find(d => d.date === todayUtc);
            const progress = computeReadingGoalProgress(
              todayRow?.versesRead ?? 0,
              goal,
            );
            next = {
              done: progress.met,
              fraction: progress.fraction,
              streak: Math.max(0, stats.currentStreak ?? 0),
              everRead: (stats.totalVersesRead ?? 0) > 0,
            };
          }

          // Mood — the device-only feelings log (local day key).
          const log = await getFeelingsLog();
          const keys = Object.keys(log.days ?? {});
          const todayKey = feelingsDateKey(Date.now());
          const moodDone = Boolean(log.days?.[todayKey]);
          const moodStreak = computeStreaks(keys, todayKey).currentStreak;

          if (cancelled) return;
          setReading(next);
          setMood({
            done: moodDone,
            streak: moodStreak,
            everLogged: keys.length > 0,
          });
          setSideLoaded(true);
        } catch (error) {
          logger.warn('Constancy rings load failed', {
            component: 'useConstancyRings',
            error: String(error),
          });
          if (!cancelled) setSideLoaded(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [achievementService]),
  );

  const summary = useMemo<ConstancySummary>(() => {
    const inputs: HabitProgress[] = [
      {
        key: 'reading',
        done: reading.done,
        fraction: reading.fraction,
        streak: reading.streak,
      },
      {
        key: 'memory',
        done: memory.goal.met,
        fraction: memory.goal.fraction,
        streak: memory.history.summary.currentStreak,
      },
      {
        key: 'devotion',
        done: devotion.summary.todayDone,
        fraction: devotion.summary.todayDone ? 1 : 0,
        streak: devotion.summary.current,
      },
      {
        key: 'mood',
        done: mood.done,
        fraction: mood.done ? 1 : 0,
        streak: mood.streak,
      },
    ];
    return buildConstancySummary(inputs);
  }, [
    reading,
    memory.goal,
    memory.history.summary.currentStreak,
    devotion.summary,
    mood,
  ]);

  const hasHistory =
    reading.everRead ||
    memory.history.summary.totalReviews > 0 ||
    devotion.summary.totalDays > 0 ||
    mood.everLogged;

  const loaded = sideLoaded && memory.loaded && devotion.loaded;

  return {loaded, summary, hasHistory};
}
