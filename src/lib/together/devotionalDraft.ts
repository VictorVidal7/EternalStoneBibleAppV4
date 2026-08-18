/**
 * 🗓️ Devotional-builder local persistence (companion to bundle.ts).
 *
 * The devotional builder (`app/features/devotional/index.tsx`) previously kept
 * its in-progress draft in plain `useState` — closing the screen (or the app)
 * before tapping "Compartir" silently lost everything typed. This module adds
 * two AsyncStorage-backed pieces, both pure here (no React/Native imports) so
 * they round-trip test the same way as the rest of this folder:
 *
 *  - **Draft** — title/startDate/days while the user is still building. Parsed
 *    defensively (AsyncStorage content can be stale/corrupted) and considered
 *    "nothing to restore" once empty, so a finished/cleared form doesn't come
 *    back from a previous session.
 *  - **Saved list** — one entry per devotional actually shared, so the creator
 *    can find it again and re-share the SAME link without rebuilding it. Each
 *    entry stores the bundle as the same opaque `d=` payload a link carries
 *    (via `encodeBundleParam`/`decodeTogetherParam`), reusing the codec's own
 *    validation instead of re-implementing bundle-shape checks here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {decodeTogetherParam, encodeBundleParam, todayDateISO} from './bundle';
import {
  BOOK_ID_MAX,
  CAL_NOTE_MAX,
  CAL_TITLE_MAX,
  CHAPTER_MAX,
  VERSE_MAX,
  type CalBundle,
} from './types';

export const DEVOTIONAL_DRAFT_KEY = '@devotional_draft';
export const DEVOTIONAL_SAVED_KEY = '@devotional_saved';

/** Caps how many shared devotionals a device remembers (most recent first). */
export const MAX_SAVED_DEVOTIONALS = 30;

export interface DevotionalDraftDay {
  bookId: number;
  chapter: number;
  verse: number;
  note: string;
}

export interface DevotionalDraft {
  title: string;
  startDate: string;
  days: DevotionalDraftDay[];
}

export interface SavedDevotional {
  id: string;
  createdAt: string;
  bundle: CalBundle;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDraftDay(x: unknown): x is DevotionalDraftDay {
  if (typeof x !== 'object' || x === null) return false;
  const d = x as Record<string, unknown>;
  return (
    Number.isInteger(d.bookId) &&
    (d.bookId as number) >= 1 &&
    (d.bookId as number) <= BOOK_ID_MAX &&
    Number.isInteger(d.chapter) &&
    (d.chapter as number) >= 1 &&
    (d.chapter as number) <= CHAPTER_MAX &&
    Number.isInteger(d.verse) &&
    (d.verse as number) >= 1 &&
    (d.verse as number) <= VERSE_MAX &&
    typeof d.note === 'string'
  );
}

/**
 * Parse a persisted draft blob. Returns `null` for anything malformed OR
 * empty (an untouched/finished form is not worth restoring). A start date
 * saved before "today" (the app was closed for a few days) is clamped
 * forward to today, the same floor the screen enforces live. `now` is
 * injectable so the clamp is testable without faking global timers.
 */
export function parseDevotionalDraft(
  raw: string | null,
  now: Date = new Date(),
): DevotionalDraft | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const o = parsed as Record<string, unknown>;
  if (typeof o.title !== 'string') return null;
  if (typeof o.startDate !== 'string' || !DATE_RE.test(o.startDate)) {
    return null;
  }
  if (!Array.isArray(o.days)) return null;
  const title = o.title.slice(0, CAL_TITLE_MAX);
  const days = o.days
    .filter(isValidDraftDay)
    .map(d => ({...d, note: d.note.slice(0, CAL_NOTE_MAX)}));
  if (!title.trim() && days.length === 0) return null;
  const today = todayDateISO(now);
  const startDate = o.startDate < today ? today : o.startDate;
  return {title, startDate, days};
}

export function serializeDevotionalDraft(draft: DevotionalDraft): string {
  return JSON.stringify(draft);
}

/** An empty, untouched form isn't worth writing to storage. */
export function isDraftWorthSaving(draft: DevotionalDraft): boolean {
  return draft.title.trim().length > 0 || draft.days.length > 0;
}

/** Parse the persisted "my devotionals" list, dropping anything that no longer decodes. */
export function parseSavedDevotionals(raw: string | null): SavedDevotional[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: SavedDevotional[] = [];
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    if (
      typeof o.id !== 'string' ||
      typeof o.createdAt !== 'string' ||
      typeof o.d !== 'string'
    ) {
      continue;
    }
    const res = decodeTogetherParam(o.d);
    if (!res.ok || res.bundle.t !== 'cal') continue;
    out.push({id: o.id, createdAt: o.createdAt, bundle: res.bundle});
  }
  return out.slice(0, MAX_SAVED_DEVOTIONALS);
}

export function serializeSavedDevotionals(list: SavedDevotional[]): string {
  const trimmed = list.slice(0, MAX_SAVED_DEVOTIONALS).map(e => ({
    id: e.id,
    createdAt: e.createdAt,
    d: encodeBundleParam(e.bundle),
  }));
  return JSON.stringify(trimmed);
}

/**
 * Record a just-shared bundle at the front of the list. Re-sharing the exact
 * same content (identical `title`/`startDate`/days) just bumps the existing
 * entry to the front with a fresh timestamp instead of piling up duplicates.
 */
export function addSavedDevotional(
  list: SavedDevotional[],
  bundle: CalBundle,
  now: Date = new Date(),
): SavedDevotional[] {
  const key = JSON.stringify(bundle);
  const rest = list.filter(e => JSON.stringify(e.bundle) !== key);
  const createdAt = now.toISOString();
  const entry: SavedDevotional = {id: createdAt, createdAt, bundle};
  return [entry, ...rest].slice(0, MAX_SAVED_DEVOTIONALS);
}
