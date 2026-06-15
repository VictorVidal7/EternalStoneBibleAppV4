/**
 * 🏆 WEEKLY TARGET STORE — AsyncStorage persistence for the weekly mastery
 * target (Sprint 86).
 *
 * The only stored bit of the weekly challenge (the mastered count itself is
 * derived fresh each week from the review-event log). Device-local, never
 * synced — like [[goalStore]] / [[readingGoalStore]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {clampWeeklyTarget, DEFAULT_WEEKLY_TARGET} from './weeklyChallenge';
import {logger} from '../utils/logger';

const WEEKLY_TARGET_KEY = '@memory_weekly_target';

/** The reader's weekly verses-to-master target, defaulted + clamped. */
export async function getWeeklyTarget(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(WEEKLY_TARGET_KEY);
    if (raw == null) return DEFAULT_WEEKLY_TARGET;
    return clampWeeklyTarget(parseInt(raw, 10));
  } catch {
    return DEFAULT_WEEKLY_TARGET;
  }
}

/** Persist the weekly mastery target (clamped). */
export async function setWeeklyTarget(target: number): Promise<void> {
  try {
    await AsyncStorage.setItem(
      WEEKLY_TARGET_KEY,
      String(clampWeeklyTarget(target)),
    );
  } catch (err) {
    logger.warn('Could not persist weekly target', {
      component: 'weeklyTargetStore',
      error: err,
    });
  }
}
