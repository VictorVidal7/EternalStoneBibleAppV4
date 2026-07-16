/**
 * 💡 prepIllustrationsStore — device-local AsyncStorage I/O for the "Banco de
 * ilustraciones" ([[prepIllustrations]], Tanda 4).
 *
 * Persists the whole `PrepIllustrationsMap` under one key, same shape as
 * [[prepSeriesStore]]. Writes are SERIALIZED through a single promise chain —
 * a title edit right after a body edit (or two rapid autosaves) must never
 * race a read-modify-write into losing an edit. NOT synced: a preacher's
 * illustration bank is device-local like every other prep artifact
 * (privacy-first, like [[prepSeriesStore]] / [[prepNotesStore]]).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  type IllustrationCategory,
  type PrepIllustration,
  type PrepIllustrationsMap,
  createIllustration,
  deleteIllustration,
  generateIllustrationId,
  parsePrepIllustrationsMap,
  serializePrepIllustrationsMap,
  setIllustrationBody,
  setIllustrationCategory,
  setIllustrationTitle,
} from './prepIllustrations';

const PREP_ILLUSTRATIONS_KEY = '@prep_illustrations';

/** Read the whole map (empty map if none/corrupt). */
export async function getAllPrepIllustrations(): Promise<PrepIllustrationsMap> {
  try {
    const raw = await AsyncStorage.getItem(PREP_ILLUSTRATIONS_KEY);
    return parsePrepIllustrationsMap(raw);
  } catch (error) {
    logger.warn('Failed to read prep illustrations', {error: String(error)});
    return {};
  }
}

/** Read one illustration (null if it doesn't exist). */
export async function getPrepIllustration(
  id: string,
): Promise<PrepIllustration | null> {
  const map = await getAllPrepIllustrations();
  return map[id] ?? null;
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/** Read-modify-write the whole map through the shared queue. */
function mutate(
  fn: (map: PrepIllustrationsMap) => PrepIllustrationsMap,
): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(PREP_ILLUSTRATIONS_KEY);
    const next = fn(parsePrepIllustrationsMap(raw));
    await AsyncStorage.setItem(
      PREP_ILLUSTRATIONS_KEY,
      serializePrepIllustrationsMap(next),
    );
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to save prep illustrations', {error: String(error)});
  });
  return writeQueue;
}

/**
 * Create a new BLANK illustration. Returns the created `PrepIllustration`, or
 * `null` if the store was already at `MAX_ILLUSTRATIONS` (callers should
 * check `canCreateIllustration` first for a real "banco lleno" message; this
 * is the defensive result to branch on).
 */
export async function createPrepIllustration(
  category?: IllustrationCategory,
): Promise<PrepIllustration | null> {
  const id = generateIllustrationId();
  const now = Date.now();
  let created: PrepIllustration | null = null;
  await mutate(map => {
    const next = createIllustration(map, now, id, category);
    created = next[id] ?? null;
    return next;
  });
  return created;
}

/** Save an illustration's title. Fire-and-forget safe: failures log and never reject. */
export function savePrepIllustrationTitle(
  id: string,
  title: string,
): Promise<void> {
  return mutate(map => setIllustrationTitle(map, id, title));
}

/** Save an illustration's body. Fire-and-forget safe. */
export function savePrepIllustrationBody(
  id: string,
  body: string,
): Promise<void> {
  return mutate(map => setIllustrationBody(map, id, body));
}

/** Save an illustration's category. Fire-and-forget safe. */
export function savePrepIllustrationCategory(
  id: string,
  category: IllustrationCategory,
): Promise<void> {
  return mutate(map => setIllustrationCategory(map, id, category));
}

/** Delete an illustration. Fire-and-forget safe. */
export function deletePrepIllustration(id: string): Promise<void> {
  return mutate(map => deleteIllustration(map, id));
}
