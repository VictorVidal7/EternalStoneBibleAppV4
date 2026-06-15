/**
 * Devotion-habit storage (Sprint 84).
 *
 * Device-local AsyncStorage I/O for the per-day devotion log, kept separate
 * from the pure [[devotionLog]] model (the [[feelingsLogStore]] mirror) so the
 * model stays React-/storage-free.
 *
 * Writes are SERIALIZED through a single promise chain: a completion and a
 * background read could otherwise race a read-modify-write and drop a day.
 *
 * NOT synced — a private record of time spent with God, exactly like the
 * feelings log.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  DevotionLog,
  parseDevotionLog,
  recordDevotion,
  serializeDevotionLog,
} from './devotionLog';

const DEVOTION_LOG_KEY = '@devotion_log';

/** Read the retained devotion history (empty log if none/corrupt). */
export async function getDevotionLog(): Promise<DevotionLog> {
  try {
    const raw = await AsyncStorage.getItem(DEVOTION_LOG_KEY);
    return parseDevotionLog(raw);
  } catch (error) {
    logger.warn('Failed to read devotion log', {error: String(error)});
    return parseDevotionLog(null);
  }
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Stamp today's completed devotion (local day of `now`, bounded retention).
 * Fire-and-forget safe: failures log and never reject the chain.
 */
export function recordTodayDevotion(now: number = Date.now()): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(DEVOTION_LOG_KEY);
    const next = recordDevotion(parseDevotionLog(raw), now);
    await AsyncStorage.setItem(DEVOTION_LOG_KEY, serializeDevotionLog(next));
    logger.info('Devotion completed');
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to record devotion', {error: String(error)});
  });
  return writeQueue;
}
