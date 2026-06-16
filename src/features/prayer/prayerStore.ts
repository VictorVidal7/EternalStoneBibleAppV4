/**
 * 🙏 PRAYER STORE — device-local AsyncStorage persistence for the prayer
 * journal (Sprint 93).
 *
 * Kept separate from the pure [[prayer]] model (no I/O there) like
 * [[devotionLogStore]] / [[readingGoalStore]]. The journal is DEVICE-LOCAL and
 * never syncs — a prayer list is private. Parsing is defensive (every persisted
 * blob is shape-validated, the S90 audit lesson): a malformed entry is dropped,
 * never crashes a load.
 *
 * Writes go through a single serialized queue so a Home-card refresh and a
 * journal edit can't race a read-modify-write and lose an entry. The screen
 * mutates via {@link mutatePrayerRequests}, passing one of the pure ops from
 * [[prayer]], and gets back the persisted list.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  isPrayerCategory,
  PRAYER_DETAIL_MAX,
  PRAYER_NOTE_MAX,
  PRAYER_TITLE_MAX,
  type PrayerRequest,
} from './prayer';

const PRAYER_KEY = '@prayer_requests_v1';

/** Coerce one raw item into a valid request, or null if unsalvageable. */
function parseOne(raw: unknown): PrayerRequest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id.length === 0) return null;
  if (typeof o.title !== 'string') return null;
  if (!isPrayerCategory(o.category)) return null;
  if (typeof o.createdAt !== 'number' || !Number.isFinite(o.createdAt)) {
    return null;
  }
  const title = o.title.trim().slice(0, PRAYER_TITLE_MAX);
  if (title.length === 0) return null;

  const req: PrayerRequest = {
    id: o.id,
    title,
    category: o.category,
    createdAt: o.createdAt,
    answered: o.answered === true,
  };
  if (typeof o.detail === 'string') {
    const detail = o.detail.trim().slice(0, PRAYER_DETAIL_MAX);
    if (detail) req.detail = detail;
  }
  if (req.answered) {
    if (typeof o.answeredAt === 'number' && Number.isFinite(o.answeredAt)) {
      req.answeredAt = o.answeredAt;
    }
    if (typeof o.answeredNote === 'string') {
      const note = o.answeredNote.trim().slice(0, PRAYER_NOTE_MAX);
      if (note) req.answeredNote = note;
    }
  }
  return req;
}

/** Parse a raw storage blob into a clean list (malformed entries dropped). */
export function parsePrayerRequests(raw: string | null): PrayerRequest[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: PrayerRequest[] = [];
    for (const item of parsed) {
      const req = parseOne(item);
      if (req) out.push(req);
    }
    return out;
  } catch {
    return [];
  }
}

export function serializePrayerRequests(
  list: readonly PrayerRequest[],
): string {
  return JSON.stringify(list);
}

/** Read the prayer journal (empty list if none/corrupt). */
export async function getPrayerRequests(): Promise<PrayerRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_KEY);
    return parsePrayerRequests(raw);
  } catch (error) {
    logger.warn('Failed to read prayer journal', {error: String(error)});
    return [];
  }
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<PrayerRequest[]> = Promise.resolve([]);

/**
 * Apply a pure mutation to the persisted journal and return the new list.
 * Read-modify-write is serialized through {@link writeQueue} so concurrent
 * edits can't drop an entry. On failure the previous list is returned and the
 * error logged (never rejects the chain).
 */
export function mutatePrayerRequests(
  mutator: (list: readonly PrayerRequest[]) => PrayerRequest[],
): Promise<PrayerRequest[]> {
  const run = async (): Promise<PrayerRequest[]> => {
    const raw = await AsyncStorage.getItem(PRAYER_KEY);
    const current = parsePrayerRequests(raw);
    const next = mutator(current);
    await AsyncStorage.setItem(PRAYER_KEY, serializePrayerRequests(next));
    return next;
  };
  const result = writeQueue.then(run);
  // The queue tail must never reject; swallow + log, keep the chain alive.
  writeQueue = result.catch(async error => {
    logger.warn('Failed to mutate prayer journal', {error: String(error)});
    return getPrayerRequests();
  });
  return writeQueue;
}
