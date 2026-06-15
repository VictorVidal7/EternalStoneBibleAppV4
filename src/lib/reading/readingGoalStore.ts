/**
 * 📖 READING GOAL STORE — AsyncStorage persistence for the daily reading goal
 * (Sprint 85).
 *
 * Kept separate from the pure [[readingGoal]] (no I/O there), exactly like
 * [[goalStore]] is the storage side of the pure [[goals]]. The goal is a
 * DEVICE-LOCAL preference (never synced) — the reading streak it complements is
 * already cross-device through the reading log.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {clampReadingGoal, DEFAULT_READING_GOAL} from './readingGoal';
import {logger} from '../utils/logger';

const READING_GOAL_KEY = '@reading_daily_goal';

/** The reader's daily verse goal, defaulted + clamped. */
export async function getReadingGoal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(READING_GOAL_KEY);
    if (raw == null) return DEFAULT_READING_GOAL;
    return clampReadingGoal(parseInt(raw, 10));
  } catch {
    return DEFAULT_READING_GOAL;
  }
}

/** Persist the daily reading goal (clamped). */
export async function setReadingGoal(goal: number): Promise<void> {
  try {
    await AsyncStorage.setItem(
      READING_GOAL_KEY,
      String(clampReadingGoal(goal)),
    );
  } catch (err) {
    logger.warn('Could not persist reading goal', {
      component: 'readingGoalStore',
      error: err,
    });
  }
}
