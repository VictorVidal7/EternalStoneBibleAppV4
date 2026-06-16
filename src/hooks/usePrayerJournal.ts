/**
 * usePrayerJournal (Sprint 93) — the device-local prayer journal, wired to
 * React.
 *
 * Loads the persisted requests on screen focus (so returning from the guided
 * prayer or another screen reflects new entries) and exposes the pure ops from
 * [[prayer]] applied through the serialized [[prayerStore]] mutate path. The
 * model/store stay React-free; this hook only bridges storage → state.
 *
 * Device-local throughout — a prayer journal is private and never syncs.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {
  getPrayerRequests,
  mutatePrayerRequests,
} from '@/features/prayer/prayerStore';
import {
  addRequest,
  deleteRequest,
  editRequest,
  markAnswered,
  newPrayerRequest,
  reopenRequest,
  type PrayerCategory,
  type PrayerRequest,
} from '@/features/prayer/prayer';

let idCounter = 0;
/** A unique-enough id for a device-local journal entry. */
function prayerId(): string {
  idCounter += 1;
  return `prayer_${Date.now()}_${idCounter}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export interface PrayerJournalState {
  /** False until the first load resolves (the screen shows a spinner). */
  loaded: boolean;
  requests: PrayerRequest[];
  add: (fields: {
    title: string;
    detail?: string;
    category: PrayerCategory;
  }) => Promise<void>;
  edit: (
    id: string,
    fields: {title: string; detail?: string; category: PrayerCategory},
  ) => Promise<void>;
  answer: (id: string, note?: string) => Promise<void>;
  reopen: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function usePrayerJournal(): PrayerJournalState {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const next = await getPrayerRequests();
        if (!active) return;
        setRequests(next);
        setLoaded(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const add = useCallback(
    async (fields: {
      title: string;
      detail?: string;
      category: PrayerCategory;
    }) => {
      const req = newPrayerRequest(fields, prayerId(), Date.now());
      setRequests(await mutatePrayerRequests(list => addRequest(list, req)));
    },
    [],
  );

  const edit = useCallback(
    async (
      id: string,
      fields: {title: string; detail?: string; category: PrayerCategory},
    ) => {
      setRequests(
        await mutatePrayerRequests(list => editRequest(list, id, fields)),
      );
    },
    [],
  );

  const answer = useCallback(async (id: string, note?: string) => {
    setRequests(
      await mutatePrayerRequests(list =>
        markAnswered(list, id, Date.now(), note),
      ),
    );
  }, []);

  const reopen = useCallback(async (id: string) => {
    setRequests(await mutatePrayerRequests(list => reopenRequest(list, id)));
  }, []);

  const remove = useCallback(async (id: string) => {
    setRequests(await mutatePrayerRequests(list => deleteRequest(list, id)));
  }, []);

  return {loaded, requests, add, edit, answer, reopen, remove};
}
