/**
 * The reader's own toolbar preferences, persisted one key each: dual mode on
 * or off (`@reader_side_by_side`), the chosen companion translation
 * (`@reader_secondary_version`), the dual layout (`@reader_dual_layout`) and
 * Focus mode (`@reader_focus_mode`). They lived inline in the reader screen,
 * read once on mount.
 *
 * R9-30 — the four keys travel in the backup, and the reader stays mounted in
 * the tab stack while a backup is imported from Ajustes: re-read them when the
 * restore lands, or the reader keeps the pre-import choices until it remounts.
 * A companion the restore names that this device does not have is harmless:
 * `resolveSecondaryVersion` falls back to the first installed one.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {subscribeBackupRestored} from '@lib/backup/restoreSignal';
import {
  normalizeDualLayout,
  toggleDualLayout as nextDualLayout,
  type DualLayout,
} from '@lib/reading/secondaryVersion';

export const READER_SIDE_BY_SIDE_KEY = '@reader_side_by_side';
export const READER_SECONDARY_VERSION_KEY = '@reader_secondary_version';
export const READER_DUAL_LAYOUT_KEY = '@reader_dual_layout';
export const READER_FOCUS_MODE_KEY = '@reader_focus_mode';

type Seq = {
  sideBySide: number;
  secondary: number;
  layout: number;
  focus: number;
};

export function useReaderDualPrefs(): {
  sideBySide: boolean;
  /** The user's chosen companion; null means "not chosen yet". */
  preferredSecondaryId: string | null;
  dualLayout: DualLayout;
  focusMode: boolean;
  toggleSideBySide: () => void;
  chooseSecondary: (versionId: string) => void;
  toggleLayout: () => void;
  toggleFocusMode: () => void;
} {
  const [sideBySide, setSideBySide] = useState(false);
  const [preferredSecondaryId, setPreferredSecondaryId] = useState<
    string | null
  >(null);
  const [dualLayout, setDualLayout] = useState<DualLayout>('stacked');
  const [focusMode, setFocusMode] = useState(false);
  // Bumped per key by every user change: a read that started before it must
  // not land over it (the change's own write may not have reached the disk).
  const seq = useRef<Seq>({sideBySide: 0, secondary: 0, layout: 0, focus: 0});

  const load = useCallback(() => {
    const at = {...seq.current};
    const fresh = (k: keyof Seq) => at[k] === seq.current[k];
    AsyncStorage.getItem(READER_SIDE_BY_SIDE_KEY)
      .then(v => {
        if (fresh('sideBySide')) setSideBySide(v === '1');
      })
      .catch(() => undefined);
    AsyncStorage.getItem(READER_SECONDARY_VERSION_KEY)
      .then(v => {
        if (fresh('secondary')) setPreferredSecondaryId(v || null);
      })
      .catch(() => undefined);
    AsyncStorage.getItem(READER_DUAL_LAYOUT_KEY)
      .then(v => {
        if (fresh('layout')) setDualLayout(normalizeDualLayout(v));
      })
      .catch(() => undefined);
    AsyncStorage.getItem(READER_FOCUS_MODE_KEY)
      .then(v => {
        if (fresh('focus')) setFocusMode(v === '1');
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeBackupRestored(load), [load]);

  const toggleSideBySide = useCallback(() => {
    seq.current.sideBySide += 1;
    setSideBySide(prev => {
      const next = !prev;
      AsyncStorage.setItem(READER_SIDE_BY_SIDE_KEY, next ? '1' : '0').catch(
        () => undefined,
      );
      return next;
    });
  }, []);

  const chooseSecondary = useCallback((versionId: string) => {
    seq.current.secondary += 1;
    setPreferredSecondaryId(versionId);
    AsyncStorage.setItem(READER_SECONDARY_VERSION_KEY, versionId).catch(
      () => undefined,
    );
  }, []);

  const toggleLayout = useCallback(() => {
    seq.current.layout += 1;
    setDualLayout(prev => {
      const next = nextDualLayout(prev);
      AsyncStorage.setItem(READER_DUAL_LAYOUT_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  const toggleFocusMode = useCallback(() => {
    seq.current.focus += 1;
    setFocusMode(prev => {
      const next = !prev;
      AsyncStorage.setItem(READER_FOCUS_MODE_KEY, next ? '1' : '0').catch(
        () => undefined,
      );
      return next;
    });
  }, []);

  return {
    sideBySide,
    preferredSecondaryId,
    dualLayout,
    focusMode,
    toggleSideBySide,
    chooseSecondary,
    toggleLayout,
    toggleFocusMode,
  };
}
