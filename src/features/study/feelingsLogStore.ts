/**
 * Emotional check-in storage (Sprint 80).
 *
 * Device-local AsyncStorage I/O for the per-day feelings log. Kept separate
 * from the pure [[feelingsLog]] model (the [[listeningStatsStore]] mirror) so
 * the model stays React-/storage-free.
 *
 * Writes are SERIALIZED through a single promise chain: check-ins arrive
 * from independent screens and a read-modify-write race would drop one.
 *
 * NOT synced — how the reader felt is theirs alone; the log never leaves
 * the device (privacy-first, like the listening history).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  FeelingsLog,
  parseFeelingsLog,
  recordFeeling,
  serializeFeelingsLog,
} from './feelingsLog';

const FEELINGS_LOG_KEY = '@feelings_log';

/** Read the retained check-in history (empty log if none/corrupt). */
export async function getFeelingsLog(): Promise<FeelingsLog> {
  try {
    const raw = await AsyncStorage.getItem(FEELINGS_LOG_KEY);
    return parseFeelingsLog(raw);
  } catch (error) {
    logger.warn('Failed to read feelings log', {error: String(error)});
    return parseFeelingsLog(null);
  }
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Record today's feeling (local day of `now`, last write wins, bounded
 * retention). Fire-and-forget safe: failures log and never reject the chain.
 */
export function recordTodayFeeling(
  feelingId: string,
  now: number = Date.now(),
): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(FEELINGS_LOG_KEY);
    const next = recordFeeling(parseFeelingsLog(raw), feelingId, now);
    await AsyncStorage.setItem(FEELINGS_LOG_KEY, serializeFeelingsLog(next));
    logger.info('Feeling checked in', {feelingId});
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to record feeling', {error: String(error)});
  });
  return writeQueue;
}
