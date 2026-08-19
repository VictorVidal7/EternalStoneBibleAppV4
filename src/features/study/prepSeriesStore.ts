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
  setSeriesPassageDate,
  setSeriesPassageNote,
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
  // `attempt` reflects the real outcome for the immediate caller; `writeQueue`
  // always resolves so a failed write never wedges the next one behind it.
  const attempt = writeQueue.then(run);
  writeQueue = attempt.catch(error => {
    logger.warn('Failed to save prep series', {error: String(error)});
  });
  return attempt;
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
  try {
    await mutate(map => {
      const next = createSeries(map, name, passageKeys, now, id);
      created = next[id] ?? null;
      return next;
    });
  } catch {
    return null;
  }
  return created;
}

/** Rename a series. Fire-and-forget safe: failures log and never reject. */
export function renamePrepSeries(id: string, name: string): Promise<void> {
  return mutate(map => renameSeries(map, id, name)).catch(() => undefined);
}

/**
 * Add a passage to a series. Returns whether the passage actually got
 * added (false when it was already present, the series was full, or the
 * underlying write failed).
 */
export async function addPrepSeriesPassage(
  id: string,
  passageKey: string,
): Promise<boolean> {
  let added = false;
  try {
    await mutate(map => {
      const next = addPassageToSeries(map, id, passageKey);
      added = next !== map;
      return next;
    });
  } catch {
    return false;
  }
  return added;
}

/** Remove a passage from a series. Fire-and-forget safe. */
export function removePrepSeriesPassage(
  id: string,
  passageKey: string,
): Promise<void> {
  return mutate(map => removePassageFromSeries(map, id, passageKey)).catch(
    () => undefined,
  );
}

/** Reorder a passage within a series. Fire-and-forget safe. */
export function movePrepSeriesPassage(
  id: string,
  passageKey: string,
  direction: 'up' | 'down',
): Promise<void> {
  return mutate(map => moveSeriesPassage(map, id, passageKey, direction)).catch(
    () => undefined,
  );
}

/**
 * Set (or clear, with `date === null`) a passage's target preaching date
 * ("YYYY-MM-DD"). Fire-and-forget safe.
 */
export function setPrepSeriesPassageDate(
  id: string,
  passageKey: string,
  date: string | null,
): Promise<void> {
  return mutate(map => setSeriesPassageDate(map, id, passageKey, date)).catch(
    () => undefined,
  );
}

/** Set (or clear, with '') a passage's short schedule note. Fire-and-forget safe. */
export function setPrepSeriesPassageNote(
  id: string,
  passageKey: string,
  note: string,
): Promise<void> {
  return mutate(map => setSeriesPassageNote(map, id, passageKey, note)).catch(
    () => undefined,
  );
}

/** Delete a whole series (never touches the passages' own prep notes). */
export function deletePrepSeries(id: string): Promise<void> {
  return mutate(map => deleteSeries(map, id)).catch(() => undefined);
}
