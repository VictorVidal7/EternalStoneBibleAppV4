/**
 * Reading Plan Progress
 *
 * Persists, per reading plan, which days the user has marked as completed.
 * Backed by AsyncStorage and shared across the app so the home cards and the
 * plan detail screen always agree.
 *
 * It also tracks which Bible chapters the user has actually read, so a plan
 * day can be **auto-completed** the moment every chapter it lists has been
 * opened — no manual check-off required.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';
import {READING_PLANS} from '../constants/reading-plans';
import {getBookByName} from '../constants/bible';
import {withCompletionStamp} from '../lib/reading/planCompletion';

const STORAGE_KEY = '@reading_plan_progress';
const READ_CHAPTERS_KEY = '@reading_plan_read_chapters';

export interface PlanProgress {
  completedDays: number[];
  startedAt: string;
  /**
   * ISO stamp of the FIRST time the plan reached full completion (Sprint 81).
   * Conserve-once-earned: never cleared by un-toggling, never moved by
   * re-completing. Plans finished before this sprint have no stamp.
   */
  completedAt?: string;
}

type ProgressMap = Record<string, PlanProgress>;
/** Set of read chapters, keyed by `${bookId}:${chapter}`. */
type ReadChaptersMap = Record<string, true>;

/** A plan day that just became complete because of the latest chapter read. */
export interface AutoCompletedDay {
  planId: string;
  day: number;
}

interface ReadingPlanProgressContextType {
  getCompletedDays: (planId: string) => number[];
  isDayComplete: (planId: string, day: number) => boolean;
  toggleDay: (planId: string, day: number) => Promise<void>;
  /**
   * Records that a chapter was read and auto-completes any plan day whose
   * chapters are now all read. Returns the days that just became complete so
   * the caller can surface feedback (e.g. a toast).
   */
  markChapterRead: (
    book: string | number,
    chapter: number,
  ) => Promise<AutoCompletedDay[]>;
  /** Whether a chapter has been read (powers per-chapter ticks, Sprint 79). */
  isChapterRead: (book: string | number, chapter: number) => boolean;
  /** ISO timestamp of the plan's first interaction; null = never started. */
  getStartedAt: (planId: string) => string | null;
  /** ISO timestamp of the plan's FIRST full completion; null = none yet. */
  getCompletedAt: (planId: string) => string | null;
}

const ReadingPlanProgressContext = createContext<
  ReadingPlanProgressContextType | undefined
>(undefined);

/** Canonical read-chapter key. Returns null if the book can't be resolved. */
function chapterKey(book: string | number, chapter: number): string | null {
  const bookId =
    typeof book === 'number' ? book : (getBookByName(book)?.id ?? null);
  return bookId == null ? null : `${bookId}:${chapter}`;
}

export function ReadingPlanProgressProvider({children}: {children: ReactNode}) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [readChapters, setReadChapters] = useState<ReadChaptersMap>({});

  // Refs mirror the latest state so `markChapterRead` can stay referentially
  // stable (it's called from a timer in the reader and must not retrigger it).
  const progressRef = useRef(progress);
  const readChaptersRef = useRef(readChapters);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    readChaptersRef.current = readChapters;
  }, [readChapters]);

  useEffect(() => {
    (async () => {
      try {
        const [rawProgress, rawRead] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(READ_CHAPTERS_KEY),
        ]);
        if (rawProgress) {
          const parsed = JSON.parse(rawProgress);
          setProgress(parsed);
          progressRef.current = parsed;
        }
        if (rawRead) {
          const parsed = JSON.parse(rawRead);
          setReadChapters(parsed);
          readChaptersRef.current = parsed;
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
    progressRef.current = next;
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
      // Stamp completedAt the first time the plan covers all its days
      // (conserve-once-earned — see planCompletion).
      const duration =
        READING_PLANS.find(p => p.id === planId)?.days.length ?? 0;
      await persist({
        ...progress,
        [planId]: withCompletionStamp(
          {...current, completedDays},
          duration,
          new Date().toISOString(),
        ),
      });
    },
    [progress, persist],
  );

  const markChapterRead = useCallback(
    async (
      book: string | number,
      chapter: number,
    ): Promise<AutoCompletedDay[]> => {
      const key = chapterKey(book, chapter);
      if (!key) return [];

      const currentRead = readChaptersRef.current;
      const nextRead: ReadChaptersMap = currentRead[key]
        ? currentRead
        : {...currentRead, [key]: true};

      // Persist the read chapter if it's new.
      if (!currentRead[key]) {
        readChaptersRef.current = nextRead;
        setReadChapters(nextRead);
        AsyncStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(nextRead)).catch(
          err =>
            logger.error('Could not save read chapters', err as Error, {
              component: 'ReadingPlanProgress',
            }),
        );
      }

      // Find every plan day not yet completed whose chapters are all read.
      const currentProgress = progressRef.current;
      const newlyCompleted: AutoCompletedDay[] = [];
      for (const plan of READING_PLANS) {
        const completedDays = currentProgress[plan.id]?.completedDays ?? [];
        for (const planDay of plan.days) {
          if (completedDays.includes(planDay.day)) continue;
          const allRead = planDay.readings.every(r => {
            const k = chapterKey(r.book, r.chapter);
            return k != null && nextRead[k];
          });
          if (allRead) {
            newlyCompleted.push({planId: plan.id, day: planDay.day});
          }
        }
      }

      if (newlyCompleted.length > 0) {
        const nextProgress: ProgressMap = {...currentProgress};
        for (const {planId, day} of newlyCompleted) {
          const cur = nextProgress[planId] ?? {
            completedDays: [],
            startedAt: new Date().toISOString(),
          };
          if (!cur.completedDays.includes(day)) {
            // The auto-complete path can also finish a plan (reading the
            // last listed chapter) — stamp it here too (Sprint 81).
            const duration =
              READING_PLANS.find(p => p.id === planId)?.days.length ?? 0;
            nextProgress[planId] = withCompletionStamp(
              {
                ...cur,
                completedDays: [...cur.completedDays, day].sort(
                  (a, b) => a - b,
                ),
              },
              duration,
              new Date().toISOString(),
            );
          }
        }
        await persist(nextProgress);
      }

      return newlyCompleted;
    },
    [persist],
  );

  const isChapterRead = useCallback(
    (book: string | number, chapter: number) => {
      const key = chapterKey(book, chapter);
      return key != null && !!readChapters[key];
    },
    [readChapters],
  );

  const getStartedAt = useCallback(
    (planId: string) => progress[planId]?.startedAt ?? null,
    [progress],
  );

  const getCompletedAt = useCallback(
    (planId: string) => progress[planId]?.completedAt ?? null,
    [progress],
  );

  return (
    <ReadingPlanProgressContext.Provider
      value={{
        getCompletedDays,
        isDayComplete,
        toggleDay,
        markChapterRead,
        isChapterRead,
        getStartedAt,
        getCompletedAt,
      }}>
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
