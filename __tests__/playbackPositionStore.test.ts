/**
 * Sprint 51 — device-local playback-position store ("Continue listening").
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLastPosition,
  setLastPosition,
  clearLastPosition,
} from '../src/features/audio/lib/playbackPositionStore';
import {AUDIO_STORAGE_KEYS} from '../src/features/audio/constants/audioConstants';
import {PlaybackPosition} from '../src/features/audio/lib/playbackPosition';

const pos: PlaybackPosition = {
  book: 'Genesis',
  chapter: 1,
  verseIndex: 7,
  verse: 8,
  totalVerses: 31,
  updatedAt: 1_700_000_000_000,
};

describe('playbackPositionStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns null when nothing is persisted', async () => {
    await expect(getLastPosition()).resolves.toBeNull();
  });

  it('persists and reads back a position', async () => {
    await setLastPosition(pos);
    await expect(getLastPosition()).resolves.toEqual(pos);
    await expect(
      AsyncStorage.getItem(AUDIO_STORAGE_KEYS.lastPosition),
    ).resolves.toBe(JSON.stringify(pos));
  });

  it('clears the position', async () => {
    await setLastPosition(pos);
    await clearLastPosition();
    await expect(getLastPosition()).resolves.toBeNull();
  });

  it('returns null for a corrupt stored value', async () => {
    await AsyncStorage.setItem(AUDIO_STORAGE_KEYS.lastPosition, '{bad json');
    await expect(getLastPosition()).resolves.toBeNull();
  });
});
