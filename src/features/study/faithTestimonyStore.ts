/**
 * 📖 faithTestimonyStore — device-local AsyncStorage I/O for "Mi testimonio"
 * (free tier, "Comparte tu fe" Part 3).
 *
 * Persists the whole `FaithTestimonyMap` under one key, same shape as
 * [[sermonNotesStore]]. Writes are SERIALIZED through a single promise chain
 * — the editor autosaves shortly after typing stops, and a quick "create,
 * then immediately type" sequence must never race a read-modify-write into
 * losing an edit. NOT synced: a writer's own testimony is device-local, same
 * privacy-first precedent as [[sermonNotesStore]] / [[prepNotesStore]] — and
 * this app's standing rule to minimize Firestore sync.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  type FaithTestimonyDraft,
  type FaithTestimonyMap,
  type FaithTestimonySession,
  createTestimonySession,
  deleteTestimonySession,
  generateFaithTestimonyId,
  parseFaithTestimonyMap,
  serializeFaithTestimonyMap,
  updateTestimonySession,
} from './faithTestimony';

const FAITH_TESTIMONY_KEY = '@faith_testimony';

/** Read the whole map (empty map if none/corrupt). */
export async function getAllFaithTestimonies(): Promise<FaithTestimonyMap> {
  try {
    const raw = await AsyncStorage.getItem(FAITH_TESTIMONY_KEY);
    return parseFaithTestimonyMap(raw);
  } catch (error) {
    logger.warn('Failed to read faith testimonies', {error: String(error)});
    return {};
  }
}

/** Read one session (null if it doesn't exist). */
export async function getFaithTestimony(
  id: string,
): Promise<FaithTestimonySession | null> {
  const map = await getAllFaithTestimonies();
  return map[id] ?? null;
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/** Read-modify-write the whole map through the shared queue. */
function mutate(
  fn: (map: FaithTestimonyMap) => FaithTestimonyMap,
): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(FAITH_TESTIMONY_KEY);
    const next = fn(parseFaithTestimonyMap(raw));
    await AsyncStorage.setItem(
      FAITH_TESTIMONY_KEY,
      serializeFaithTestimonyMap(next),
    );
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to save faith testimony', {error: String(error)});
  });
  return writeQueue;
}

/**
 * Create a new session. Returns the created `FaithTestimonySession`, or
 * `null` if the title was blank or the store was already at
 * `MAX_TESTIMONY_SESSIONS` (callers should check `canCreateTestimonySession`
 * first for a real "llegaste al máximo" message; this is the defensive
 * result to branch on).
 */
export async function createFaithTestimonySession(
  title: string,
): Promise<FaithTestimonySession | null> {
  const id = generateFaithTestimonyId();
  const now = Date.now();
  let created: FaithTestimonySession | null = null;
  await mutate(map => {
    const next = createTestimonySession(map, title, now, id);
    created = next[id] ?? null;
    return next;
  });
  return created;
}

/**
 * Save a partial edit (title/before/change/now) to an existing session.
 * Fire-and-forget safe: failures log and never reject. Callers typically
 * debounce this shortly after typing stops, same as [[sermonNotesStore]]'s
 * `saveSermonNoteSession`.
 */
export function saveFaithTestimonySession(
  id: string,
  patch: FaithTestimonyDraft,
): Promise<void> {
  return mutate(map => updateTestimonySession(map, id, patch));
}

/** Delete a whole session. */
export function deleteFaithTestimonySession(id: string): Promise<void> {
  return mutate(map => deleteTestimonySession(map, id));
}
