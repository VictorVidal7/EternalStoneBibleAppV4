/**
 * 📝 prepNotesStore — device-local AsyncStorage I/O for the "Mesa de preparación"
 * notes (Sprint 103).
 *
 * Persists the preparer's per-passage prose ([[prepNotes]]) under one key so a
 * passage re-opens with the work in progress. Writes are SERIALIZED through a
 * single promise chain — the screen autosaves on blur from several fields and a
 * read-modify-write race would otherwise drop an edit. NOT synced: an unfinished
 * sermon is the preparer's alone (privacy-first, like [[feelingsLogStore]]).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import type {PrepSection} from './prepTable';
import {
  type PrepNotes,
  type PrepNotesMap,
  emptyPrepNotes,
  parsePrepNotesMap,
  serializePrepNotesMap,
  setMapSectionNote,
} from './prepNotes';

const PREP_NOTES_KEY = '@prep_notes';

/** Read the whole map (empty map if none/corrupt). */
export async function getAllPrepNotes(): Promise<PrepNotesMap> {
  try {
    const raw = await AsyncStorage.getItem(PREP_NOTES_KEY);
    return parsePrepNotesMap(raw);
  } catch (error) {
    logger.warn('Failed to read prep notes', {error: String(error)});
    return {};
  }
}

/** Read one passage's notes (empty notes if none). */
export async function getPrepNotes(passageKey: string): Promise<PrepNotes> {
  const map = await getAllPrepNotes();
  return map[passageKey] ?? emptyPrepNotes();
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Save one section's prose for a passage (last write wins; an emptied passage
 * drops out of storage). Fire-and-forget safe: failures log and never reject.
 */
export function savePrepNote(
  passageKey: string,
  section: PrepSection,
  text: string,
  now: number = Date.now(),
): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(PREP_NOTES_KEY);
    const next = setMapSectionNote(
      parsePrepNotesMap(raw),
      passageKey,
      section,
      text,
      now,
    );
    await AsyncStorage.setItem(PREP_NOTES_KEY, serializePrepNotesMap(next));
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to save prep note', {error: String(error)});
  });
  return writeQueue;
}
