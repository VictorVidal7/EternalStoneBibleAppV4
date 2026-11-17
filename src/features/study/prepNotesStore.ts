/**
 * 📝 prepNotesStore — device-local AsyncStorage I/O for the "Mesa de preparación"
 * notes (Sprint 103).
 *
 * Persists the preparer's per-passage prose ([[prepNotes]]) under one key so a
 * passage re-opens with the work in progress. Writes are SERIALIZED through a
 * single promise chain — the screen autosaves on blur from several fields and a
 * read-modify-write race would otherwise drop an edit. NOT synced (privacy-
 * first, like [[feelingsLogStore]]), and kept per account: the key is the
 * account's ([[prepAccount]], R9-59).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {prepKey, prepWrite} from './prepAccount';
import type {PrepSection, PrepTemplateId} from './prepTable';
import {
  type PrepNotes,
  type PrepNotesMap,
  emptyPrepNotes,
  parsePrepNotesMap,
  serializePrepNotesMap,
  setMapSectionNote,
} from './prepNotes';

const PREP_NOTES_KEY = '@prep_notes';

/**
 * R9-600 — `strict: true` rethrows a failed read instead of degrading it to
 * "no notes". A screen that only SHOWS the notes keeps the tolerant default.
 * A caller that builds a write on top of what it read (the illustrations
 * bank appends to a section, the Mesa edits the sections it loaded) asks for
 * the throw: read as "no notes", it saved its text alone over the section
 * and the preparer's prose was lost. Same opt-in as `getAllReviewEvents`
 * (R9-129).
 */
export interface PrepNotesReadOptions {
  strict?: boolean;
}

/** Read the whole map (empty map if none/corrupt; see the options). */
export async function getAllPrepNotes(
  options?: PrepNotesReadOptions,
): Promise<PrepNotesMap> {
  try {
    const raw = await AsyncStorage.getItem(await prepKey(PREP_NOTES_KEY));
    return parsePrepNotesMap(raw);
  } catch (error) {
    logger.warn('Failed to read prep notes', {error: String(error)});
    if (options?.strict) throw error;
    return {};
  }
}

/** Read one passage's notes (empty notes if none; see the options). */
export async function getPrepNotes(
  passageKey: string,
  options?: PrepNotesReadOptions,
): Promise<PrepNotes> {
  const map = await getAllPrepNotes(options);
  return map[passageKey] ?? emptyPrepNotes();
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Save one section's prose for a passage (last write wins; an emptied passage
 * drops out of storage). R9-52 — rejects when the write failed (and logs it):
 * a caller that does not await it must `.catch` it.
 *
 * `template` is the caller's CURRENT effective template (e.g. the screen's
 * own resolved `notes.template ?? DEFAULT_PREP_TEMPLATE` state) — passed
 * through to `setMapSectionNote`, which only ever uses it to stamp a
 * brand-new entry that has none yet; an already-templated entry ignores it.
 * Omitting it (every pre-existing call site) preserves today's exact
 * behavior: no template ever gets written.
 */
export function savePrepNote(
  passageKey: string,
  section: PrepSection,
  text: string,
  now: number = Date.now(),
  template?: PrepTemplateId,
): Promise<void> {
  // R9-59 — the account of the key `prepKey` gives (see there). R9-275 —
  // `prepWrite` may send the write to the Mesa «sin cuenta».
  const key = prepKey(PREP_NOTES_KEY);
  const run = async (resolved: string) => {
    const raw = await AsyncStorage.getItem(resolved);
    const next = setMapSectionNote(
      parsePrepNotesMap(raw),
      passageKey,
      section,
      text,
      now,
      template,
    );
    await AsyncStorage.setItem(resolved, serializePrepNotesMap(next));
  };
  // R9-52 — the caller gets this write's own outcome (it rejects when the
  // write failed); the queue keeps a copy that swallows, so the next write
  // does not inherit the failure.
  const mine = writeQueue.then(() => prepWrite(key, run));
  writeQueue = mine.catch(error => {
    logger.warn('Failed to save prep note', {error: String(error)});
  });
  return mine;
}
