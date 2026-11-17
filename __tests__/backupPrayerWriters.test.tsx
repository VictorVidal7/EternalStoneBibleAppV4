/**
 * R9-30 — the prayer journal (`@prayer_requests_v1`) and the prayer log
 * (`@prayer_log`) can travel in `payload.local` only if nothing mounted keeps
 * the whole value in memory and writes it back over a restored one while the
 * app stays open.
 *
 * Their mounted readers (`usePrayerJournal`, `usePrayerStreak`, both on the
 * Home card) hold a copy for display only. Every write goes through the store
 * and re-reads the disk inside its serialized queue: a journal edit or a
 * finished prayer after a restore lands on top of the restored value, not on
 * the pre-restore copy. This test pins that, with the real hooks and stores.
 *
 * Lo REAL: the two hooks, the two stores and AsyncStorage (the jest mock).
 * Lo sustituido: `useFocusEffect` runs once on mount, as a focus would.
 */
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) =>
      React.useEffect(cb, [cb]),
  };
});

import {usePrayerJournal} from '../src/hooks/usePrayerJournal';
import {usePrayerStreak} from '../src/hooks/usePrayerStreak';
import {recordTodayPrayer} from '../src/features/prayer/prayerLogStore';
import {emitBackupRestored} from '../src/lib/backup/restoreSignal';
import {prayerDateKey} from '../src/features/prayer/prayerLog';
import type {PrayerRequest} from '../src/features/prayer/prayer';

const JOURNAL = '@prayer_requests_v1';
const LOG = '@prayer_log';

const req = (id: string, title: string): PrayerRequest => ({
  id,
  title,
  category: 'intercession',
  createdAt: 1_700_000_000_000,
  answered: false,
});

/** What an import does to the key: write the file's value, then announce. */
async function restore(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
  emitBackupRestored();
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('R9-30 — @prayer_requests_v1: a mounted journal does not undo a restore', () => {
  it('an add after the restore keeps the restored requests, not the old copy', async () => {
    await AsyncStorage.setItem(JOURNAL, JSON.stringify([req('old', 'Antes')]));
    const {result} = renderHook(() => usePrayerJournal());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.requests.map(r => r.id)).toEqual(['old']);

    const restored = [req('r1', 'Por mi madre'), req('r2', 'Por la iglesia')];
    await restore(JOURNAL, JSON.stringify(restored));

    await act(async () => {
      await result.current.add({title: 'Nueva', category: 'praise'});
    });

    const onDisk: PrayerRequest[] = JSON.parse(
      (await AsyncStorage.getItem(JOURNAL)) as string,
    );
    expect(onDisk.slice(1)).toEqual(restored);
    expect(onDisk[0].title).toBe('Nueva');
    expect(onDisk.map(r => r.id)).not.toContain('old');
  });

  it('mounting and unmounting the journal never writes the key', async () => {
    await AsyncStorage.setItem(JOURNAL, JSON.stringify([req('old', 'Antes')]));
    const {result, unmount} = renderHook(() => usePrayerJournal());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    const restoredRaw = JSON.stringify([req('r1', 'Por mi madre')]);
    await restore(JOURNAL, restoredRaw);
    unmount();
    // Let any write queued by the unmount land before reading.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(await AsyncStorage.getItem(JOURNAL)).toBe(restoredRaw);
  });
});

describe('R9-30 — @prayer_log: a mounted streak does not undo a restore', () => {
  it('a prayer finished after the restore stamps today on the restored log', async () => {
    const now = new Date(2026, 10, 17, 9, 0, 0).getTime();
    const day = (offset: number) =>
      prayerDateKey(new Date(2026, 10, 17 + offset, 9, 0, 0).getTime());

    await AsyncStorage.setItem(LOG, JSON.stringify({days: {[day(-30)]: 1}}));
    const {result, unmount} = renderHook(() => usePrayerStreak());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const restoredDays = {[day(-2)]: 3, [day(-1)]: 1};
    await restore(LOG, JSON.stringify({days: restoredDays}));

    await act(async () => {
      await recordTodayPrayer(now);
    });
    unmount();

    const onDisk = JSON.parse((await AsyncStorage.getItem(LOG)) as string);
    expect(onDisk.days).toEqual({...restoredDays, [day(0)]: 1});
  });
});
