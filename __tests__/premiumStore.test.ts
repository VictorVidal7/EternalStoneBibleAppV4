/**
 * Sprint 50 — device-local premium flag store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PREMIUM_STORAGE_KEY,
  getPremiumUnlocked,
  setPremiumUnlocked,
} from '../src/lib/premium/premiumStore';

describe('premiumStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to locked when nothing is persisted', async () => {
    await expect(getPremiumUnlocked()).resolves.toBe(false);
  });

  it('persists and reads back the unlocked flag', async () => {
    await setPremiumUnlocked(true);
    await expect(getPremiumUnlocked()).resolves.toBe(true);
    await expect(AsyncStorage.getItem(PREMIUM_STORAGE_KEY)).resolves.toBe(
      'true',
    );
  });

  it('can be locked again after unlocking', async () => {
    await setPremiumUnlocked(true);
    await setPremiumUnlocked(false);
    await expect(getPremiumUnlocked()).resolves.toBe(false);
  });

  it('treats any non-"true" stored value as locked', async () => {
    await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, 'yes');
    await expect(getPremiumUnlocked()).resolves.toBe(false);
  });
});
