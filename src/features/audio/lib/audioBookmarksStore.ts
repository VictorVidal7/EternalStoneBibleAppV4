/**
 * Audio-bookmark storage (Sprint 77 — saved listening positions).
 *
 * Device-local AsyncStorage I/O for the listening pins; mirror of
 * [[listeningStatsStore]] so the pure [[audioBookmarks]] model stays
 * React-/storage-free. Writes are serialized through one promise chain.
 *
 * NOT synced — like the playback position, a per-device convenience.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {AUDIO_STORAGE_KEYS} from '../constants/audioConstants';
import {
  AudioBookmark,
  parseAudioBookmarks,
  serializeAudioBookmarks,
} from './audioBookmarks';

/** Read all saved listening pins (empty if none/corrupt). */
export async function getAudioBookmarks(): Promise<AudioBookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(AUDIO_STORAGE_KEYS.bookmarks);
    return parseAudioBookmarks(raw);
  } catch (error) {
    logger.warn('Failed to read audio bookmarks', {error: String(error)});
    return [];
  }
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Persist a transformed bookmark list (add/remove handled by the pure model).
 * Fire-and-forget safe: failures log and never reject the chain.
 */
export function saveAudioBookmarks(bookmarks: AudioBookmark[]): Promise<void> {
  const run = async () => {
    await AsyncStorage.setItem(
      AUDIO_STORAGE_KEYS.bookmarks,
      serializeAudioBookmarks(bookmarks),
    );
  };
  writeQueue = writeQueue
    .then(run)
    .catch(error =>
      logger.warn('Failed to save audio bookmarks', {error: String(error)}),
    );
  return writeQueue;
}
