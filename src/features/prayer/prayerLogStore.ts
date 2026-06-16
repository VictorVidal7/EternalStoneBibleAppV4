/**
 * Prayer-habit storage (Sprint 93).
 *
 * Device-local AsyncStorage I/O for the per-day prayer log, kept separate from
 * the pure [[prayerLog]] model (the [[devotionLogStore]] mirror) so the model
 * stays React-/storage-free.
 *
 * Writes are SERIALIZED through a single promise chain: a completion and a
 * background read could otherwise race a read-modify-write and drop a day.
 *
 * NOT synced — a private record of time in prayer, exactly like the devotion
 * log.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  PrayerLog,
  parsePrayerLog,
  recordPrayer,
  serializePrayerLog,
} from './prayerLog';

const PRAYER_LOG_KEY = '@prayer_log';

/** Read the retained prayer history (empty log if none/corrupt). */
export async function getPrayerLog(): Promise<PrayerLog> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_LOG_KEY);
    return parsePrayerLog(raw);
  } catch (error) {
    logger.warn('Failed to read prayer log', {error: String(error)});
    return parsePrayerLog(null);
  }
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Stamp today's completed prayer (local day of `now`, bounded retention).
 * Fire-and-forget safe: failures log and never reject the chain.
 */
export function recordTodayPrayer(now: number = Date.now()): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(PRAYER_LOG_KEY);
    const next = recordPrayer(parsePrayerLog(raw), now);
    await AsyncStorage.setItem(PRAYER_LOG_KEY, serializePrayerLog(next));
    logger.info('Prayer completed');
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to record prayer', {error: String(error)});
  });
  return writeQueue;
}
