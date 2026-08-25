/**
 * ✅ prepSelfReviewStore — device-local AsyncStorage I/O for the "Mesa de
 * preparación" self-review checklist ([[prepSelfReview]]).
 *
 * Persists which questions a preacher has checked off, per passage, under one
 * key. Writes are SERIALIZED through a single promise chain, same discipline
 * as [[prepNotesStore]] — a checkbox tap fires a write immediately (there's
 * no blur/debounce here, unlike free-text notes) and a read-modify-write race
 * on rapid taps would otherwise drop a toggle.
 *
 * STRICTLY DEVICE-LOCAL — more so than [[prepNotesStore]]'s own notes. Never
 * synced to Firestore (no adapter registers this key, same as prep notes).
 * UNLIKE prep notes/series, this key is also deliberately left OUT of
 * `BackupService`'s export/import file: prep notes are included there on
 * purpose ("export/import is the ONLY way to move this between devices" —
 * see BackupService.ts's own docstring), but a self-review checklist is a
 * private, in-the-moment self-check with no reason to travel between devices
 * or sit in a shareable backup file, so it follows [[prepIllustrationsStore]]'s
 * precedent (also prep-related, also never backed up) instead.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  type PrepSelfReview,
  type PrepSelfReviewMap,
  type PrepSelfReviewQuestionId,
  emptyPrepSelfReview,
  parsePrepSelfReviewMap,
  serializePrepSelfReviewMap,
  setMapQuestionChecked,
} from './prepSelfReview';

const PREP_SELF_REVIEW_KEY = '@prep_self_review';

/** Read the whole map (empty map if none/corrupt). */
export async function getAllPrepSelfReview(): Promise<PrepSelfReviewMap> {
  try {
    const raw = await AsyncStorage.getItem(PREP_SELF_REVIEW_KEY);
    return parsePrepSelfReviewMap(raw);
  } catch (error) {
    logger.warn('Failed to read prep self-review', {error: String(error)});
    return {};
  }
}

/** Read one passage's self-review (empty review if none). */
export async function getPrepSelfReview(
  passageKey: string,
): Promise<PrepSelfReview> {
  const map = await getAllPrepSelfReview();
  return map[passageKey] ?? emptyPrepSelfReview();
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Toggle one question's checked state for a passage (last write wins; a
 * passage whose last checked question is unchecked drops out of storage).
 * Fire-and-forget safe: failures log and never reject.
 */
export function setPrepSelfReviewQuestion(
  passageKey: string,
  id: PrepSelfReviewQuestionId,
  checked: boolean,
  now: number = Date.now(),
): Promise<void> {
  const run = async () => {
    const raw = await AsyncStorage.getItem(PREP_SELF_REVIEW_KEY);
    const next = setMapQuestionChecked(
      parsePrepSelfReviewMap(raw),
      passageKey,
      id,
      checked,
      now,
    );
    await AsyncStorage.setItem(
      PREP_SELF_REVIEW_KEY,
      serializePrepSelfReviewMap(next),
    );
  };
  writeQueue = writeQueue.then(run).catch(error => {
    logger.warn('Failed to save prep self-review', {error: String(error)});
  });
  return writeQueue;
}
