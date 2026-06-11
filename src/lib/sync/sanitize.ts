/**
 * 🧹 sanitize — drop `undefined`-valued keys from a Firestore payload
 * (Sprint 77).
 *
 * Firestore REJECTS any document containing an `undefined` field value
 * ("Unsupported field value: undefined"), and the SyncEngine retries such a
 * write until it drops the queue entry — so a single optional field set to
 * `undefined` silently kept an entity from EVER syncing (live-caught with a
 * note-less favorite; label-less bookmarks had the same flaw). Every
 * *ToRemote payload builder must pass its object through here.
 *
 * `null` is a legal Firestore value and passes through untouched — only the
 * JS-only `undefined` is stripped.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A copy of `obj` without its `undefined`-valued keys. */
export function withoutUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}
