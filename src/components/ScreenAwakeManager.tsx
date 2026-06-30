/**
 * 🔆 ScreenAwakeManager — applies the "keep screen on" reading setting.
 *
 * Render-less. Watches the persisted setting + the current route and holds the
 * screen awake (expo-keep-awake, own tag) only while BOTH are true: the setting
 * is on AND the user is on a long-dwell reading/study/memory/prayer screen
 * ([[keepAwakeRoutes]]). Releases the lock the moment either turns false, so the
 * OS screen-timeout resumes everywhere else. Independent of the audio wake-lock.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect} from 'react';
import {usePathname} from 'expo-router';
import {activateKeepAwakeAsync, deactivateKeepAwake} from 'expo-keep-awake';
import {useReaderPreferences} from '@context/ReaderPreferencesContext';
import {
  shouldKeepAwakeOnRoute,
  READING_KEEP_AWAKE_TAG,
} from '@lib/reading/keepAwakeRoutes';
import {logger} from '@lib/utils/logger';

export function ScreenAwakeManager(): null {
  const {preferences} = useReaderPreferences();
  const pathname = usePathname();
  const active =
    preferences.keepScreenAwake && shouldKeepAwakeOnRoute(pathname);

  useEffect(() => {
    if (!active) return undefined;
    activateKeepAwakeAsync(READING_KEEP_AWAKE_TAG).catch(err =>
      logger.warn('Failed to activate reading keep-awake', {
        error: String(err),
      }),
    );
    return () => {
      deactivateKeepAwake(READING_KEEP_AWAKE_TAG).catch(err =>
        logger.warn('Failed to release reading keep-awake', {
          error: String(err),
        }),
      );
    };
  }, [active]);

  return null;
}
