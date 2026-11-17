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
 * DEVICE-LOCAL. Never synced to Firestore (no adapter registers this key,
 * same as prep notes). R9-30 — it travels in `BackupService`'s export/import
 * file with the rest of the Mesa, by account: it was left out on purpose,
 * and a new phone lost it with no other way back (the backup is the ONLY
 * way to move the Mesa between devices).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {prepKey, prepWrite} from './prepAccount';
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
    const raw = await AsyncStorage.getItem(await prepKey(PREP_SELF_REVIEW_KEY));
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
 * R9-52 — rejects when the write failed (and logs it): a caller that does not
 * await it must `.catch` it.
 */
export function setPrepSelfReviewQuestion(
  passageKey: string,
  id: PrepSelfReviewQuestionId,
  checked: boolean,
  now: number = Date.now(),
): Promise<void> {
  // R9-59 — the account of the key `prepKey` gives (see there). R9-275 —
  // `prepWrite` may send the write to the Mesa «sin cuenta».
  const key = prepKey(PREP_SELF_REVIEW_KEY);
  const run = async (resolved: string) => {
    const raw = await AsyncStorage.getItem(resolved);
    const next = setMapQuestionChecked(
      parsePrepSelfReviewMap(raw),
      passageKey,
      id,
      checked,
      now,
    );
    await AsyncStorage.setItem(resolved, serializePrepSelfReviewMap(next));
  };
  // R9-52 — the caller gets this write's own outcome (it rejects when the
  // write failed); the queue keeps a copy that swallows, so the next write
  // does not inherit the failure.
  const mine = writeQueue.then(() => prepWrite(key, run));
  writeQueue = mine.catch(error => {
    logger.warn('Failed to save prep self-review', {error: String(error)});
  });
  return mine;
}
