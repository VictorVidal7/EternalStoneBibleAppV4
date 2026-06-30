/**
 * The keep-screen-awake route policy — which screens honor the setting.
 */
import {
  shouldKeepAwakeOnRoute,
  READING_KEEP_AWAKE_TAG,
} from '../src/lib/reading/keepAwakeRoutes';

describe('shouldKeepAwakeOnRoute', () => {
  it('keeps awake on the long-dwell reading/study/memory/prayer screens', () => {
    const awake = [
      '/verse/Juan/3',
      '/verse/John/3',
      '/features/study',
      '/features/study-shared',
      '/features/word-study',
      '/features/constellation',
      '/features/reference-chain',
      '/features/memory',
      '/features/memory/practice',
      '/features/prayer',
      '/features/prayer/acts',
      '/features/lectio',
      '/features/prep',
      '/features/devotional',
    ];
    for (const path of awake) {
      expect(shouldKeepAwakeOnRoute(path)).toBe(true);
    }
  });

  it('does not keep awake on home, settings or other screens', () => {
    const sleepy = [
      '/',
      '/(tabs)',
      '/settings',
      '/bible',
      '/search',
      '/achievements',
      '/features/themes',
      '/features/badges',
    ];
    for (const path of sleepy) {
      expect(shouldKeepAwakeOnRoute(path)).toBe(false);
    }
  });

  it('is defensive about a null/empty pathname', () => {
    expect(shouldKeepAwakeOnRoute(null)).toBe(false);
    expect(shouldKeepAwakeOnRoute(undefined)).toBe(false);
    expect(shouldKeepAwakeOnRoute('')).toBe(false);
  });

  it('exposes a stable, distinct wake-lock tag', () => {
    expect(READING_KEEP_AWAKE_TAG).toBe('essb-reading-keep-awake');
  });
});
