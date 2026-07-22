/**
 * 📝 sermonNotesStore — device-local AsyncStorage I/O for "Notas de sermón"
 * (free tier).
 *
 * Persists the whole `SermonNotesMap` under one key, same shape as
 * [[prepSeriesStore]]. Writes are SERIALIZED through a single promise chain
 * — the editor autosaves shortly after typing stops, and a quick "create,
 * then immediately type" sequence must never race a read-modify-write into
 * losing an edit. NOT synced: a listener's own sermon notes are
 * device-local, same privacy-first precedent as [[prepNotesStore]] /
 * [[prepSeriesStore]] — and this app's standing rule to minimize Firestore
 * sync.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  type SermonNoteDraft,
  type SermonNoteSession,
  type SermonNotesMap,
  createSession,
  deleteSession,
  generateSermonNoteId,
  parseSermonNotesMap,
  serializeSermonNotesMap,
  updateSession,
} from './sermonNotes';

const SERMON_NOTES_KEY = '@sermon_notes';

/** Read the whole map (empty map if none/corrupt). */
export async function getAllSermonNotes(): Promise<SermonNotesMap> {
  try {
    const raw = await AsyncStorage.getItem(SERMON_NOTES_KEY);
    return parseSermonNotesMap(raw);
  } catch (error) {
    logger.warn('Failed to read sermon notes', {error: String(error)});
    return {};
  }
}

/** Read one session (null if it doesn't exist). */
export async function getSermonNote(
  id: string,
): Promise<SermonNoteSession | null> {
  const map = await getAllSermonNotes();
  return map[id] ?? null;
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/** Read-modify-write the whole map through the shared queue. */
function mutate(fn: (map: SermonNotesMap) => SermonNotesMap): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(SERMON_NOTES_KEY);
    const next = fn(parseSermonNotesMap(raw));
    await AsyncStorage.setItem(SERMON_NOTES_KEY, serializeSermonNotesMap(next));
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to save sermon notes', {error: String(error)});
  });
  return writeQueue;
}

/**
 * Create a new session. Returns the created `SermonNoteSession`, or `null`
 * if the title was blank or the store was already at `MAX_SESSIONS` (callers
 * should check `canCreateSession` first for a real "llegaste al máximo"
 * message; this is the defensive result to branch on).
 */
export async function createSermonNoteSession(
  title: string,
  source: string = '',
): Promise<SermonNoteSession | null> {
  const id = generateSermonNoteId();
  const now = Date.now();
  let created: SermonNoteSession | null = null;
  await mutate(map => {
    const next = createSession(map, title, source, now, id);
    created = next[id] ?? null;
    return next;
  });
  return created;
}

/**
 * Save a partial edit (title/source/bodyText) to an existing session.
 * Fire-and-forget safe: failures log and never reject. Callers typically
 * debounce this shortly after typing stops, same as [[prepNotesStore]]'s
 * `savePrepNote`.
 */
export function saveSermonNoteSession(
  id: string,
  patch: SermonNoteDraft,
): Promise<void> {
  return mutate(map => updateSession(map, id, patch));
}

/** Delete a whole session. */
export function deleteSermonNoteSession(id: string): Promise<void> {
  return mutate(map => deleteSession(map, id));
}
