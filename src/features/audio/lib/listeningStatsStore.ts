/**
 * Listening-stats storage (Sprint 75 — listening time).
 *
 * Device-local AsyncStorage I/O for the per-day listening buckets. Kept
 * separate from the pure [[listeningStats]] model (mirror of
 * [[playbackPositionStore]]) so the model stays React-/storage-free.
 *
 * Writes are SERIALIZED through a single promise chain: appends arrive from
 * independent effects (time flush on pause, verse count on advance) and a
 * read-modify-write race would drop one of them.
 *
 * NOT synced — like the playback position, listening history is a per-device
 * convenience, not Firestore-reconciled user data.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {AUDIO_STORAGE_KEYS} from '../constants/audioConstants';
import {
  ListeningStats,
  listeningDateKey,
  parseListeningStats,
  recordListening,
  serializeListeningStats,
} from './listeningStats';

/** Read all retained listening history (empty stats if none/corrupt). */
export async function getListeningStats(): Promise<ListeningStats> {
  try {
    const raw = await AsyncStorage.getItem(AUDIO_STORAGE_KEYS.listeningStats);
    return parseListeningStats(raw);
  } catch (error) {
    logger.warn('Failed to read listening stats', {error: String(error)});
    return parseListeningStats(null);
  }
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Append listening time and/or voiced verses to today's bucket (local day of
 * `now`). Fire-and-forget safe: failures log and never reject the chain.
 */
export function appendListening(
  delta: {ms?: number; verses?: number},
  now: number = Date.now(),
): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(AUDIO_STORAGE_KEYS.listeningStats);
    const next = recordListening(
      parseListeningStats(raw),
      listeningDateKey(now),
      delta.ms ?? 0,
      delta.verses ?? 0,
    );
    await AsyncStorage.setItem(
      AUDIO_STORAGE_KEYS.listeningStats,
      serializeListeningStats(next),
    );
  };
  writeQueue = writeQueue
    .then(run)
    .catch(error =>
      logger.warn('Failed to append listening stats', {error: String(error)}),
    );
  return writeQueue;
}
