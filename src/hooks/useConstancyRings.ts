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
import {getReadingGoal} from '@lib/reading/readingGoalStore';
import {computeReadingGoalProgress} from '@lib/reading/readingGoal';
import {logger} from '@lib/utils/logger';
import {localDayKey} from '@lib/utils/dateKey';
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
          // Every habit shares ONE local-day key (batch6 reader-feedback item
          // 14) — reading used to derive its own UTC day here, which could
          // disagree with the other three habits for hours around a negative
          // UTC-offset user's evening, making an active streak's ring read as
          // untouched. The ring fills by today's verses against the
          // device-local daily reading goal, so it grades rather than just
          // snapping closed (Sprint 85 T3).
          const todayKey = localDayKey(Date.now());
          let next = EMPTY_READING;
          if (achievementService) {
            const [stats, readingLog, goal] = await Promise.all([
              achievementService.getUserStats(),
              achievementService.getReadingLog(),
              getReadingGoal(),
            ]);
            const todayRow = readingLog.find(d => d.date === todayKey);
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

          // Mood — the device-only feelings log (same local day key).
          const feelingsLog = await getFeelingsLog();
          const keys = Object.keys(feelingsLog.days ?? {});
          const moodDone = Boolean(feelingsLog.days?.[todayKey]);
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
        everDone: reading.everRead,
      },
      {
        key: 'memory',
        done: memory.goal.met,
        fraction: memory.goal.fraction,
        streak: memory.history.summary.currentStreak,
        everDone: memory.history.summary.totalReviews > 0,
      },
      {
        key: 'devotion',
        done: devotion.summary.todayDone,
        fraction: devotion.summary.todayDone ? 1 : 0,
        streak: devotion.summary.current,
        everDone: devotion.summary.totalDays > 0,
      },
      {
        key: 'mood',
        done: mood.done,
        fraction: mood.done ? 1 : 0,
        streak: mood.streak,
        everDone: mood.everLogged,
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
