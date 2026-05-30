/**
 * Audio playback-position storage (Sprint 51 — "Continue listening").
 *
 * Device-local AsyncStorage I/O for the last audio position. Kept separate from
 * the pure `playbackPosition` model (mirror of premiumStore.ts / goalStore.ts)
 * so the model stays React-/storage-free and unit-testable.
 *
 * NOT synced — like the existing `lastReadPosition` (ReadingProgressContext)
 * and the premium flag (Sprint 50), "where I last listened" is a per-device
 * convenience, not user data we reconcile across devices via Firestore.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {AUDIO_STORAGE_KEYS} from '../constants/audioConstants';
import {
  PlaybackPosition,
  parsePosition,
  serializePosition,
} from './playbackPosition';

/** Read the last saved audio position, or `null` if none/invalid. */
export async function getLastPosition(): Promise<PlaybackPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(AUDIO_STORAGE_KEYS.lastPosition);
    return parsePosition(raw);
  } catch (error) {
    logger.warn('Failed to read audio last position', {error: String(error)});
    return null;
  }
}

/** Persist the last audio position. */
export async function setLastPosition(pos: PlaybackPosition): Promise<void> {
  try {
    await AsyncStorage.setItem(
      AUDIO_STORAGE_KEYS.lastPosition,
      serializePosition(pos),
    );
  } catch (error) {
    logger.warn('Failed to persist audio last position', {
      error: String(error),
    });
  }
}

/** Forget the last audio position (e.g. when the player is closed). */
export async function clearLastPosition(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUDIO_STORAGE_KEYS.lastPosition);
  } catch (error) {
    logger.warn('Failed to clear audio last position', {error: String(error)});
  }
}
