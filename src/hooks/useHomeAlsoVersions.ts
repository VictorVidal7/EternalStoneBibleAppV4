/**
 * "Ver también en…" chips on the Home daily verse card (Sprint 77). OFF by
 * default to keep the card minimal; the footer globe toggles it and the
 * choice persists across sessions in `@home_also_versions` ('1' / '0').
 *
 * R9-30 — the key travels in the backup (`payload.local`), and the Home tab
 * stays mounted while a backup is imported from Ajustes: re-read it when the
 * restore lands, or the card keeps the pre-import choice until a cold start.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {haptics} from '@lib/haptics';
import {subscribeBackupRestored} from '@lib/backup/restoreSignal';

export const HOME_ALSO_VERSIONS_KEY = '@home_also_versions';

export function useHomeAlsoVersions(): {
  alsoVersionsVisible: boolean;
  toggleAlsoVersions: () => void;
} {
  const [alsoVersionsVisible, setAlsoVersionsVisible] = useState(false);
  // Bumped by every toggle: a read that started before it must not land over
  // it (the toggle's own write may not have reached the disk yet).
  const toggleSeq = useRef(0);

  const load = useCallback(() => {
    const seq = toggleSeq.current;
    AsyncStorage.getItem(HOME_ALSO_VERSIONS_KEY)
      .then(value => {
        if (seq === toggleSeq.current) setAlsoVersionsVisible(value === '1');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeBackupRestored(load), [load]);

  const toggleAlsoVersions = useCallback(() => {
    haptics.tap();
    toggleSeq.current += 1;
    setAlsoVersionsVisible(prev => {
      const next = !prev;
      AsyncStorage.setItem(HOME_ALSO_VERSIONS_KEY, next ? '1' : '0').catch(
        () => {},
      );
      return next;
    });
  }, []);

  return {alsoVersionsVisible, toggleAlsoVersions};
}
