/**
 * 🎯 MEMORY GOAL STORE — AsyncStorage persistence for the daily goal and the
 * set of already-celebrated milestones (Sprint 47).
 *
 * Kept separate from the pure `goals.ts` (which has no I/O) exactly like
 * `reviewEventStore.ts` is the SQLite side of the pure `reviewEvents.ts`.
 *
 * Design (Sprint 47 decision): the goal is a DEVICE-LOCAL preference (like the
 * daily-verse reminder hour), NOT a synced dataset — the streak it feeds is
 * already cross-device because it derives from the synced review-event log.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {clampGoal, DEFAULT_DAILY_GOAL} from './goals';
import {logger} from '../utils/logger';

const GOAL_KEY = '@memory_daily_goal';
const CELEBRATED_KEY = '@memory_celebrated_milestones';
/** Cap the celebrated-keys list so per-day goal keys can't grow unbounded. */
const MAX_CELEBRATED = 60;

/** The user's daily review goal, defaulted + clamped. */
export async function getDailyGoal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(GOAL_KEY);
    if (raw == null) return DEFAULT_DAILY_GOAL;
    return clampGoal(parseInt(raw, 10));
  } catch {
    return DEFAULT_DAILY_GOAL;
  }
}

/** Persist the daily review goal (clamped). */
export async function setDailyGoal(goal: number): Promise<void> {
  try {
    await AsyncStorage.setItem(GOAL_KEY, String(clampGoal(goal)));
  } catch (err) {
    logger.warn('Could not persist daily goal', {
      component: 'goalStore',
      error: err,
    });
  }
}

/** Milestone keys already celebrated (so we never celebrate twice). */
export async function getCelebratedMilestones(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(CELEBRATED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(k => typeof k === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Merge `keys` into the celebrated set and persist. FIFO-pruned to the most
 * recent MAX_CELEBRATED entries — safe because per-day goal keys never recur
 * and a streak key re-firing only happens after the streak actually rebuilds.
 */
export async function addCelebratedMilestones(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    const existing = await getCelebratedMilestones();
    const merged = [...existing];
    for (const k of keys) if (!merged.includes(k)) merged.push(k);
    const pruned = merged.slice(-MAX_CELEBRATED);
    await AsyncStorage.setItem(CELEBRATED_KEY, JSON.stringify(pruned));
  } catch (err) {
    logger.warn('Could not persist celebrated milestones', {
      component: 'goalStore',
      error: err,
    });
  }
}
