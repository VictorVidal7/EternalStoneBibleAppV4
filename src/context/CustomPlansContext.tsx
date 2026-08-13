/**
 * 🧩 CustomPlansContext — the user's own reading plans (Sprint 108).
 *
 * Holds the device-local list of custom {@link ReadingPlan}s (built in the plan
 * editor or imported from a together `cplan` link) and persists it to
 * AsyncStorage. On every change it mirrors the list into the module-level
 * registry (see src/lib/reading/customPlans), so pure resolvers
 * (`getReadingPlanById`) and the reading-plan progress context treat a custom
 * plan exactly like a curated one — no server, no cost (DOCS/COMMUNITY_DESIGN
 * §9.1).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {logger} from '@lib/utils/logger';
import type {ReadingPlan} from '@/constants/reading-plans';
import {setRegisteredCustomPlans} from '@lib/reading/customPlans';

const STORAGE_KEY = '@custom_plans';

export interface CustomPlansContextValue {
  /** The user's custom plans, most-recently-saved first. */
  customPlans: ReadingPlan[];
  /** Resolve a custom plan by id (reactive — re-renders when the list loads). */
  getCustomPlanById: (id: string) => ReadingPlan | undefined;
  /** Add or replace a custom plan (dedup by its content-derived id). */
  saveCustomPlan: (plan: ReadingPlan) => Promise<void>;
  /**
   * Replace the plan `oldId` with `plan` in ONE write (Sprint 110 — editing a
   * custom plan rebuilds it under a fresh content-derived id). Drops both
   * `oldId` and any stale copy of the new id, then puts the edited plan at the
   * front. Atomic so the two ids can't clobber each other across renders.
   */
  replaceCustomPlan: (oldId: string, plan: ReadingPlan) => Promise<void>;
  /** Remove a custom plan. Does not touch its reading progress. */
  deleteCustomPlan: (id: string) => Promise<void>;
}

const CustomPlansContext = createContext<CustomPlansContextValue | undefined>(
  undefined,
);

export function CustomPlansProvider({children}: {children: ReactNode}) {
  const [customPlans, setCustomPlans] = useState<ReadingPlan[]>([]);

  // Keep the module-level registry (read by pure resolvers + the progress
  // context) in sync with state, on load and on every edit.
  useEffect(() => {
    setRegisteredCustomPlans(customPlans);
  }, [customPlans]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCustomPlans(parsed as ReadingPlan[]);
        }
      } catch {
        logger.warn('Could not load custom plans', {
          component: 'CustomPlansContext',
        });
      }
    })();
  }, []);

  const persist = useCallback(async (next: ReadingPlan[]) => {
    setCustomPlans(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      logger.error('Could not save custom plans', err as Error, {
        component: 'CustomPlansContext',
      });
    }
  }, []);

  const saveCustomPlan = useCallback(
    async (plan: ReadingPlan) => {
      // Content-derived id dedupes: re-saving the same plan replaces it in
      // place, a new plan goes to the front (most-recent first).
      await persist([plan, ...customPlans.filter(p => p.id !== plan.id)]);
    },
    [customPlans, persist],
  );

  const replaceCustomPlan = useCallback(
    async (oldId: string, plan: ReadingPlan) => {
      await persist([
        plan,
        ...customPlans.filter(p => p.id !== oldId && p.id !== plan.id),
      ]);
    },
    [customPlans, persist],
  );

  const deleteCustomPlan = useCallback(
    async (id: string) => {
      await persist(customPlans.filter(p => p.id !== id));
    },
    [customPlans, persist],
  );

  const getCustomPlanById = useCallback(
    (id: string) => customPlans.find(p => p.id === id),
    [customPlans],
  );

  const value = useMemo<CustomPlansContextValue>(
    () => ({
      customPlans,
      getCustomPlanById,
      saveCustomPlan,
      replaceCustomPlan,
      deleteCustomPlan,
    }),
    [
      customPlans,
      getCustomPlanById,
      saveCustomPlan,
      replaceCustomPlan,
      deleteCustomPlan,
    ],
  );

  return (
    <CustomPlansContext.Provider value={value}>
      {children}
    </CustomPlansContext.Provider>
  );
}

export function useCustomPlans(): CustomPlansContextValue {
  const ctx = useContext(CustomPlansContext);
  if (!ctx) {
    throw new Error('useCustomPlans must be used within a CustomPlansProvider');
  }
  return ctx;
}
