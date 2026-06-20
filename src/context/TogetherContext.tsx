/**
 * 🤝 TogetherContext — local "group" membership (Sprint 107).
 *
 * A "group" here is NOT a server entity. When the user joins a shared plan
 * (via a together link/code, see src/lib/together), we record — purely on the
 * device — that this plan is being read "together with [name], since [start]".
 * That lets the Home and plan screens say "leyendo … con [grupo]". Nothing
 * leaves the device; there is no backend, no cost, and no content of any other
 * user is ever stored or shown (DOCS/COMMUNITY_DESIGN.md §9.1).
 *
 * The agreed start date itself is seeded into ReadingPlanProgress via
 * `setPlanStart`, so day-alignment lives with the rest of the plan progress;
 * this context only holds the lightweight membership label.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {
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

const STORAGE_KEY = '@together_groups';

export interface GroupMembership {
  /** Optional group label the creator put on the invite (already sanitized). */
  name?: string;
  /** Agreed start date, ISO calendar date `YYYY-MM-DD`. */
  startDate: string;
  /** When this device joined, ISO timestamp. */
  joinedAt: string;
}

type MembershipMap = Record<string, GroupMembership>;

export interface TogetherContextValue {
  /** Membership for a plan, or null if not joined as a group. */
  getMembership: (planId: string) => GroupMembership | null;
  /** Record/refresh membership for a plan (idempotent). */
  joinPlan: (
    planId: string,
    membership: {name?: string; startDate: string},
  ) => Promise<void>;
  /** Drop the group label for a plan (does not touch reading progress). */
  leavePlan: (planId: string) => Promise<void>;
}

const TogetherContext = createContext<TogetherContextValue | undefined>(
  undefined,
);

export function TogetherProvider({children}: {children: ReactNode}) {
  const [memberships, setMemberships] = useState<MembershipMap>({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setMemberships(JSON.parse(raw));
      } catch {
        logger.warn('Could not load together memberships', {
          component: 'TogetherContext',
        });
      }
    })();
  }, []);

  const persist = useCallback(async (next: MembershipMap) => {
    setMemberships(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      logger.error('Could not save together memberships', err as Error, {
        component: 'TogetherContext',
      });
    }
  }, []);

  const getMembership = useCallback(
    (planId: string) => memberships[planId] ?? null,
    [memberships],
  );

  const joinPlan = useCallback(
    async (planId: string, membership: {name?: string; startDate: string}) => {
      const next: GroupMembership = {
        startDate: membership.startDate,
        joinedAt: new Date().toISOString(),
      };
      if (membership.name) next.name = membership.name;
      await persist({...memberships, [planId]: next});
    },
    [memberships, persist],
  );

  const leavePlan = useCallback(
    async (planId: string) => {
      if (!memberships[planId]) return;
      const next = {...memberships};
      delete next[planId];
      await persist(next);
    },
    [memberships, persist],
  );

  const value = useMemo<TogetherContextValue>(
    () => ({getMembership, joinPlan, leavePlan}),
    [getMembership, joinPlan, leavePlan],
  );

  return (
    <TogetherContext.Provider value={value}>
      {children}
    </TogetherContext.Provider>
  );
}

export function useTogether(): TogetherContextValue {
  const ctx = useContext(TogetherContext);
  if (!ctx) {
    throw new Error('useTogether must be used within a TogetherProvider');
  }
  return ctx;
}
