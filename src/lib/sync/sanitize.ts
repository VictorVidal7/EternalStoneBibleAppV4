/**
 * 🧹 sanitize — drop `undefined`-valued keys from a Firestore payload
 * (Sprint 77, deep variant Sprint 78).
 *
 * Firestore REJECTS any document containing an `undefined` field value
 * ("Unsupported field value: undefined"), and the SyncEngine retries such a
 * write until it drops the queue entry — so a single optional field set to
 * `undefined` silently kept an entity from EVER syncing (live-caught with a
 * note-less favorite; label-less bookmarks and note-less/category-less
 * highlights had the same flaw). Every *ToRemote payload builder must pass
 * its object through here.
 *
 * `null` is a legal Firestore value and passes through untouched — only the
 * JS-only `undefined` is stripped.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A copy of `obj` without its `undefined`-valued keys (top level only). */
export function withoutUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

/**
 * Sprint 78 — deep variant for payloads that NEST objects (the resolved-
 * conflict audit record carries whole localVersion/remoteVersion/
 * resolvedValue entities). Applied at the engine's Firestore boundary
 * (pushOne / logResolvedConflict) as defense-in-depth, so a payload that
 * skipped its builder's `withoutUndefined` — a future adapter, a merge
 * resolution typed in the UI — still can't wedge the queue.
 *
 * Only PLAIN objects and arrays are recursed. Class instances (Firestore
 * FieldValue sentinels, Date) pass through untouched — recursing into them
 * would strip their semantics. An `undefined` array ELEMENT becomes `null`
 * (Firestore rejects undefined inside arrays too; null keeps the indices).
 */
export function deepWithoutUndefined<T extends object>(obj: T): T {
  return deepClean(obj) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function deepClean(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(el => (el === undefined ? null : deepClean(el)));
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[key] = deepClean(v);
    }
    return out;
  }
  return value;
}
