/**
 * Reading Plan Progress
 *
 * Persists, per reading plan, which days the user has marked as completed.
 * Backed by AsyncStorage and shared across the app so the home cards and the
 * plan detail screen always agree.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

const STORAGE_KEY = '@reading_plan_progress';

export interface PlanProgress {
  completedDays: number[];
  startedAt: string;
}

type ProgressMap = Record<string, PlanProgress>;

interface ReadingPlanProgressContextType {
  getCompletedDays: (planId: string) => number[];
  isDayComplete: (planId: string, day: number) => boolean;
  toggleDay: (planId: string, day: number) => Promise<void>;
}

const ReadingPlanProgressContext = createContext<
  ReadingPlanProgressContextType | undefined
>(undefined);

export function ReadingPlanProgressProvider({children}: {children: ReactNode}) {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setProgress(JSON.parse(raw));
        }
      } catch {
        logger.warn('Could not load reading plan progress', {
          component: 'ReadingPlanProgress',
        });
      }
    })();
  }, []);

  const persist = useCallback(async (next: ProgressMap) => {
    setProgress(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      logger.error('Could not save reading plan progress', err as Error, {
        component: 'ReadingPlanProgress',
      });
    }
  }, []);

  const getCompletedDays = useCallback(
    (planId: string) => progress[planId]?.completedDays ?? [],
    [progress],
  );

  const isDayComplete = useCallback(
    (planId: string, day: number) =>
      (progress[planId]?.completedDays ?? []).includes(day),
    [progress],
  );

  const toggleDay = useCallback(
    async (planId: string, day: number) => {
      const current = progress[planId] ?? {
        completedDays: [],
        startedAt: new Date().toISOString(),
      };
      const has = current.completedDays.includes(day);
      const completedDays = has
        ? current.completedDays.filter(d => d !== day)
        : [...current.completedDays, day].sort((a, b) => a - b);
      await persist({
        ...progress,
        [planId]: {...current, completedDays},
      });
    },
    [progress, persist],
  );

  return (
    <ReadingPlanProgressContext.Provider
      value={{getCompletedDays, isDayComplete, toggleDay}}>
      {children}
    </ReadingPlanProgressContext.Provider>
  );
}

export function useReadingPlanProgress() {
  const context = useContext(ReadingPlanProgressContext);
  if (!context) {
    throw new Error(
      'useReadingPlanProgress must be used within ReadingPlanProgressProvider',
    );
  }
  return context;
}
