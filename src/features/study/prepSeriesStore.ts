/**
 * 📚 prepSeriesStore — device-local AsyncStorage I/O for the "Series de
 * predicación" planner ([[prepSeries]], T8.4.4).
 *
 * Persists the whole `PrepSeriesMap` under one key, same shape as
 * [[prepNotesStore]]. Writes are SERIALIZED through a single promise chain
 * — a quick "add passage" tap right after creating a series (or two rapid
 * reorders) must never race a read-modify-write into losing an edit. NOT
 * synced: a series plan is device-local like every other prep artifact
 * (privacy-first, like [[feelingsLogStore]] / [[prepNotesStore]]).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  type PrepSeries,
  type PrepSeriesMap,
  addPassageToSeries,
  createSeries,
  deleteSeries,
  generateSeriesId,
  moveSeriesPassage,
  parsePrepSeriesMap,
  removePassageFromSeries,
  renameSeries,
  serializePrepSeriesMap,
} from './prepSeries';

const PREP_SERIES_KEY = '@prep_series';

/** Read the whole map (empty map if none/corrupt). */
export async function getAllPrepSeries(): Promise<PrepSeriesMap> {
  try {
    const raw = await AsyncStorage.getItem(PREP_SERIES_KEY);
    return parsePrepSeriesMap(raw);
  } catch (error) {
    logger.warn('Failed to read prep series', {error: String(error)});
    return {};
  }
}

/** Read one series (null if it doesn't exist). */
export async function getPrepSeries(id: string): Promise<PrepSeries | null> {
  const map = await getAllPrepSeries();
  return map[id] ?? null;
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/** Read-modify-write the whole map through the shared queue. */
function mutate(fn: (map: PrepSeriesMap) => PrepSeriesMap): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(PREP_SERIES_KEY);
    const next = fn(parsePrepSeriesMap(raw));
    await AsyncStorage.setItem(PREP_SERIES_KEY, serializePrepSeriesMap(next));
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to save prep series', {error: String(error)});
  });
  return writeQueue;
}

/**
 * Create a new series. Returns the created `PrepSeries`, or `null` if the
 * name was blank or the store was already at `MAX_SERIES` (callers should
 * check `canCreateSeries` first for a real "series llenas" message; this is
 * the defensive result to branch on).
 */
export async function createPrepSeries(
  name: string,
  passageKeys: readonly string[] = [],
): Promise<PrepSeries | null> {
  const id = generateSeriesId();
  const now = Date.now();
  let created: PrepSeries | null = null;
  await mutate(map => {
    const next = createSeries(map, name, passageKeys, now, id);
    created = next[id] ?? null;
    return next;
  });
  return created;
}

/** Rename a series. Fire-and-forget safe: failures log and never reject. */
export function renamePrepSeries(id: string, name: string): Promise<void> {
  return mutate(map => renameSeries(map, id, name));
}

/**
 * Add a passage to a series. Returns whether the passage actually got
 * added (false when it was already present or the series was full).
 */
export async function addPrepSeriesPassage(
  id: string,
  passageKey: string,
): Promise<boolean> {
  let added = false;
  await mutate(map => {
    const next = addPassageToSeries(map, id, passageKey);
    added = next !== map;
    return next;
  });
  return added;
}

/** Remove a passage from a series. Fire-and-forget safe. */
export function removePrepSeriesPassage(
  id: string,
  passageKey: string,
): Promise<void> {
  return mutate(map => removePassageFromSeries(map, id, passageKey));
}

/** Reorder a passage within a series. Fire-and-forget safe. */
export function movePrepSeriesPassage(
  id: string,
  passageKey: string,
  direction: 'up' | 'down',
): Promise<void> {
  return mutate(map => moveSeriesPassage(map, id, passageKey, direction));
}

/** Delete a whole series (never touches the passages' own prep notes). */
export function deletePrepSeries(id: string): Promise<void> {
  return mutate(map => deleteSeries(map, id));
}
