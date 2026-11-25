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

import {
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
import {subscribeBackupRestored} from '../lib/backup/restoreSignal';
import {READING_PLANS} from '../constants/reading-plans';
import {getBookByName} from '../constants/bible';
import {getRegisteredCustomPlans} from '../lib/reading/customPlans';
import {withCompletionStamp} from '../lib/reading/planCompletion';
import {effectivePlanDays} from '../lib/reading/planReflow';

/** Curated + user-created plans, so progress treats custom plans alike (S108). */
function allPlans() {
  return [...READING_PLANS, ...getRegisteredCustomPlans()];
}

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
  /**
   * The reader's chosen total-day count for a reflowable curated plan, when
   * different from its curated default (`planReflow.effectivePlanDays`
   * re-spreads the same chapters across it). Only ever set before the first
   * day is marked — see `setPlanDuration`.
   */
  customDuration?: number;
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
   * Seeds (or re-aligns) a plan's `startedAt` to an explicit ISO timestamp.
   * Used when JOINING a shared "together" plan so everyone's "Day N" lines up
   * on the agreed calendar date (Sprint 107). Existing `completedDays` and the
   * once-earned `completedAt` stamp are preserved.
   */
  setPlanStart: (planId: string, startedAtISO: string) => Promise<void>;
  /**
   * Move a plan's progress to a NEW id (Sprint 110). Editing a custom plan
   * rebuilds it under a fresh content-derived id, so its completedDays /
   * startedAt / completedAt are carried over to `toId` and `fromId` is
   * dropped. Days past `toDuration` (the edited plan's length) are dropped
   * (R9-55); a `toId` that already has progress is merged with it, not
   * overwritten nor discarded (R9-64). No-op when the ids match or `fromId`
   * has no progress — so a rename keeps your streak while a structural edit
   * keeps whatever days you'd already ticked that still exist.
   */
  migratePlanProgress: (
    fromId: string,
    toId: string,
    toDuration: number,
  ) => Promise<void>;
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
  /** The reader's chosen duration for this plan; null = using the curated default. */
  getPlanDuration: (planId: string) => number | null;
  /**
   * Set the reader's chosen duration for a reflowable curated plan. A no-op
   * once any day has been marked complete — reflowing would re-shuffle which
   * chapters land on which day number, orphaning already-ticked progress.
   */
  setPlanDuration: (planId: string, totalDays: number) => Promise<void>;
  /**
   * Restarts a FINISHED plan so it can be walked through again: clears
   * `completedDays` and re-stamps `startedAt` to now, but preserves the
   * once-earned `completedAt` (conserve-once-earned, same as `withCompletionStamp`)
   * and any chosen `customDuration`. Also clears the global read-chapter flags
   * for exactly this plan's chapters — otherwise the very next chapter read
   * anywhere in the app would re-trigger auto-complete and instantly finish
   * the "restarted" plan again, since those chapters were already marked read
   * from the first run. Other plans that happen to share a chapter just lose
   * that chapter's auto-tick, not any of their own completed days.
   */
  restartPlan: (planId: string) => Promise<void>;
  /**
   * How many of an UNSTARTED plan's days are already fully covered by
   * ordinary Bible reading (Sprint 111 fix) — powers the "you're already 15
   * of 21 days in, start officially?" invitation. Returns 0 for a plan that's
   * already started (its real completedDays is the honest number instead).
   */
  getSilentDayCount: (planId: string) => number;
  /**
   * Officially starts a plan the reader has been silently covering via
   * ordinary Bible reading: stamps `startedAt` to now AND immediately credits
   * every day already fully read, so accepting the invitation doesn't drop
   * the reader back to 0 (Sprint 111 fix).
   */
  startPlanFromSilentProgress: (planId: string) => Promise<void>;
}

const ReadingPlanProgressContext = createContext<
  ReadingPlanProgressContextType | undefined
>(undefined);

/** A stored map, or `{}` when it doesn't parse or isn't a plain object. */
function parseMap<T>(raw: string): T {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    logger.warn('Could not parse reading plan progress', {
      component: 'ReadingPlanProgress',
    });
  }
  return {} as T;
}

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

  // R9-414 — every writer persists a WHOLE map, so after a read that
  // REJECTED the in-memory `{}` must not reach the disk: the next writer
  // re-reads first (`ensureRead`, one re-read shared by every writer) and
  // builds on what it read. If the re-read fails too, it writes from memory
  // as before (the way out of R9-212: a read can fail forever), and the disk
  // stays unread: the next writer tries again.
  const unreadRef = useRef(false);
  const rereadRef = useRef<Promise<void> | null>(null);

  const hydrateFromStorage = useCallback(async (): Promise<boolean> => {
    let rawProgress: string | null;
    let rawRead: string | null;
    try {
      [rawProgress, rawRead] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(READ_CHAPTERS_KEY),
      ]);
    } catch {
      unreadRef.current = true;
      logger.warn('Could not load reading plan progress', {
        component: 'ReadingPlanProgress',
      });
      return false;
    }
    // The disk answered: a map that doesn't parse is already lost, and
    // re-reading it would not bring it back.
    unreadRef.current = false;
    // R9-411 — only a plain object is a map: a `null` (a hand-edited or
    // foreign backup) made every reader of the map throw, Home first, on
    // every launch. What doesn't parse, or isn't a map, reads as empty.
    if (rawProgress) {
      const parsed = parseMap<ProgressMap>(rawProgress);
      setProgress(parsed);
      progressRef.current = parsed;
    }
    if (rawRead) {
      const parsed = parseMap<ReadChaptersMap>(rawRead);
      setReadChapters(parsed);
      readChaptersRef.current = parsed;
    }
    return true;
  }, []);

  const ensureRead = useCallback(
    () =>
      (rereadRef.current ??= hydrateFromStorage()
        .then(() => undefined)
        .finally(() => {
          rereadRef.current = null;
        })),
    [hydrateFromStorage],
  );

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  // R9-28 — every writer here persists the WHOLE map derived from the
  // in-memory copy, so after an import the first `markChapterRead` would
  // write the pre-import map straight back over the restored one.
  useEffect(
    () => subscribeBackupRestored(() => void hydrateFromStorage()),
    [hydrateFromStorage],
  );

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
      if (unreadRef.current) await ensureRead();
      const base = progressRef.current;
      const existing = base[planId];
      // A `setPlanDuration`-only entry has an empty startedAt (the plan's
      // pace clock hasn't started yet) — the first real toggle starts it now.
      const current: PlanProgress =
        existing && existing.startedAt
          ? existing
          : {
              ...existing,
              completedDays: existing?.completedDays ?? [],
              startedAt: new Date().toISOString(),
            };
      const has = current.completedDays.includes(day);
      const completedDays = has
        ? current.completedDays.filter(d => d !== day)
        : [...current.completedDays, day].sort((a, b) => a - b);
      // Stamp completedAt the first time the plan covers all its days
      // (conserve-once-earned — see planCompletion). Use the EFFECTIVE day
      // count (a reflowed custom duration, if one was chosen), not the
      // curated default, or a reflowed plan would never reach 100%.
      const plan = allPlans().find(p => p.id === planId);
      const duration = plan
        ? effectivePlanDays(plan, current.customDuration).length
        : 0;
      await persist({
        ...base,
        [planId]: withCompletionStamp(
          {...current, completedDays},
          duration,
          new Date().toISOString(),
        ),
      });
    },
    [ensureRead, persist],
  );

  const setPlanStart = useCallback(
    async (planId: string, startedAtISO: string) => {
      if (unreadRef.current) await ensureRead();
      const base = progressRef.current;
      const current = base[planId];
      const next: PlanProgress = current
        ? {...current, startedAt: startedAtISO}
        : {completedDays: [], startedAt: startedAtISO};
      await persist({...base, [planId]: next});
    },
    [ensureRead, persist],
  );

  const migratePlanProgress = useCallback(
    async (fromId: string, toId: string, toDuration: number) => {
      if (unreadRef.current) await ensureRead();
      const base = progressRef.current;
      if (fromId === toId) return;
      const source = base[fromId];
      if (!source) return;
      const target = base[toId];
      // R9-55 — day numbers past the new length no longer exist: carried
      // verbatim they showed «5/2 · 250%». R9-64 — a target that already has
      // progress (an edit landing on the id of a plan with the same content,
      // or of a deleted one whose progress survives) is MERGED: the source
      // used to be dropped outright.
      const days = new Set([
        ...(target?.completedDays ?? []),
        ...source.completedDays,
      ]);
      const completedDays = [...days]
        .filter(d => Number.isInteger(d) && d >= 1 && d <= toDuration)
        .sort((a, b) => a - b);
      const stamps = [target?.completedAt, source.completedAt]
        .filter((x): x is string => !!x)
        .sort();
      const merged: PlanProgress = {
        ...target,
        ...source,
        completedDays,
        // The plan being edited keeps its own start (its pace).
        startedAt: source.startedAt || target?.startedAt || '',
      };
      // Conserve-once-earned: the earliest stamp of either survives, even
      // when it predates the start kept above (R9-622, decided): a custom
      // plan's id is the hash of its name and days, so a target with this id
      // is the same plan, finished before — like restartPlan, which also
      // keeps the stamp under a newer start.
      if (stamps.length > 0) merged.completedAt = stamps[0];
      else delete merged.completedAt;
      const next = {...base, [toId]: merged};
      delete next[fromId];
      await persist(next);
    },
    [ensureRead, persist],
  );

  const markChapterRead = useCallback(
    async (
      book: string | number,
      chapter: number,
    ): Promise<AutoCompletedDay[]> => {
      const key = chapterKey(book, chapter);
      if (!key) return [];
      if (unreadRef.current) await ensureRead();

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

      // Find every plan day not yet completed that contains this chapter and
      // whose chapters are now all read.
      // Uses each plan's EFFECTIVE days (a reflowed custom duration, if one
      // was chosen) so auto-complete checks the day groupings the reader
      // actually sees, not the curated default. Only plans the reader has
      // EXPLICITLY started (a real `startedAt`) are eligible — otherwise
      // ordinary Bible reading silently auto-starts and auto-completes plans
      // the reader never opened, which reads as broken tracking rather than a
      // feature. An unstarted plan's silent overlap surfaces instead as an
      // invitation via `getSilentDayCount` for the screen to show.
      const currentProgress = progressRef.current;
      const newlyCompleted: AutoCompletedDay[] = [];
      for (const plan of allPlans()) {
        if (!currentProgress[plan.id]?.startedAt) continue;
        const completedDays = currentProgress[plan.id]?.completedDays ?? [];
        const planDays = effectivePlanDays(
          plan,
          currentProgress[plan.id]?.customDuration,
        );
        for (const planDay of planDays) {
          if (completedDays.includes(planDay.day)) continue;
          // R9-54 — a reading completes only the days it belongs to. Scanning
          // every day re-completed one the reader had just UN-ticked (its
          // chapters stay read) on the next chapter read anywhere, with a
          // toast. Reading that day's chapter again still completes it.
          const containsRead = planDay.readings.some(
            r => chapterKey(r.book, r.chapter) === key,
          );
          if (!containsRead) continue;
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
          const existing = nextProgress[planId];
          // Same empty-startedAt fixup as toggleDay: a setPlanDuration-only
          // entry hasn't started the pace clock yet — the first completed
          // day (even an auto-completed one) starts it now.
          const cur: PlanProgress =
            existing && existing.startedAt
              ? existing
              : {
                  ...existing,
                  completedDays: existing?.completedDays ?? [],
                  startedAt: new Date().toISOString(),
                };
          if (!cur.completedDays.includes(day)) {
            // The auto-complete path can also finish a plan (reading the
            // last listed chapter) — stamp it here too (Sprint 81). Uses the
            // EFFECTIVE day count (a reflowed custom duration, if chosen).
            const plan = allPlans().find(p => p.id === planId);
            const duration = plan
              ? effectivePlanDays(plan, cur.customDuration).length
              : 0;
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
    [ensureRead, persist],
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

  const getSilentDayCount = useCallback(
    (planId: string) => {
      if (progress[planId]?.startedAt) return 0;
      const plan = allPlans().find(p => p.id === planId);
      if (!plan) return 0;
      const days = effectivePlanDays(plan, progress[planId]?.customDuration);
      return days.filter(day =>
        day.readings.every(r => {
          const key = chapterKey(r.book, r.chapter);
          return key != null && !!readChapters[key];
        }),
      ).length;
    },
    [progress, readChapters],
  );

  const getCompletedAt = useCallback(
    (planId: string) => progress[planId]?.completedAt ?? null,
    [progress],
  );

  const getPlanDuration = useCallback(
    (planId: string) => progress[planId]?.customDuration ?? null,
    [progress],
  );

  const setPlanDuration = useCallback(
    async (planId: string, totalDays: number) => {
      if (unreadRef.current) await ensureRead();
      const base = progressRef.current;
      const current = base[planId];
      if (current && current.completedDays.length > 0) return;
      const next: PlanProgress = current
        ? {...current, customDuration: totalDays}
        : {
            // No startedAt yet — merely dialing in a duration shouldn't start
            // the plan's pace clock (planPace treats a falsy startedAt as
            // 'notStarted'); that only happens on the first toggleDay/setPlanStart.
            completedDays: [],
            startedAt: '',
            customDuration: totalDays,
          };
      await persist({...base, [planId]: next});
    },
    [ensureRead, persist],
  );

  const restartPlan = useCallback(
    async (planId: string) => {
      if (unreadRef.current) await ensureRead();
      const base = progressRef.current;
      const plan = allPlans().find(p => p.id === planId);
      const current = base[planId];
      if (!plan || !current) return;

      // Drop the global read-chapter flags for exactly this plan's chapters
      // FIRST — otherwise the very next chapter read anywhere in the app
      // would find them still marked read and instantly auto-complete the
      // "restarted" plan again via markChapterRead's scan over all plans.
      const days = effectivePlanDays(plan, current.customDuration);
      const keysToClear = new Set<string>();
      for (const day of days) {
        for (const r of day.readings) {
          const key = chapterKey(r.book, r.chapter);
          if (key) keysToClear.add(key);
        }
      }
      const nextRead = {...readChaptersRef.current};
      for (const key of keysToClear) delete nextRead[key];
      readChaptersRef.current = nextRead;
      setReadChapters(nextRead);
      AsyncStorage.setItem(READ_CHAPTERS_KEY, JSON.stringify(nextRead)).catch(
        err =>
          logger.error('Could not save read chapters', err as Error, {
            component: 'ReadingPlanProgress',
          }),
      );

      const next: PlanProgress = {
        ...current,
        completedDays: [],
        startedAt: new Date().toISOString(),
      };
      await persist({...base, [planId]: next});
    },
    [ensureRead, persist],
  );

  const startPlanFromSilentProgress = useCallback(
    async (planId: string) => {
      if (unreadRef.current) await ensureRead();
      const base = progressRef.current;
      const plan = allPlans().find(p => p.id === planId);
      if (!plan) return;
      const current = base[planId];
      const days = effectivePlanDays(plan, current?.customDuration);
      const completedDays = days
        .filter(day =>
          day.readings.every(r => {
            const key = chapterKey(r.book, r.chapter);
            return key != null && !!readChaptersRef.current[key];
          }),
        )
        .map(day => day.day);
      const duration = effectivePlanDays(plan, current?.customDuration).length;
      await persist({
        ...base,
        [planId]: withCompletionStamp(
          {
            ...current,
            completedDays,
            startedAt: new Date().toISOString(),
          },
          duration,
          new Date().toISOString(),
        ),
      });
    },
    [ensureRead, persist],
  );

  return (
    <ReadingPlanProgressContext.Provider
      value={{
        getCompletedDays,
        isDayComplete,
        toggleDay,
        setPlanStart,
        migratePlanProgress,
        markChapterRead,
        isChapterRead,
        getStartedAt,
        getCompletedAt,
        getPlanDuration,
        setPlanDuration,
        restartPlan,
        getSilentDayCount,
        startPlanFromSilentProgress,
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
