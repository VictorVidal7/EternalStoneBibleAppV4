/**
 * 🧹 sanitize — make a Firestore payload express ABSENCE explicitly
 * (Sprint 77 origin, deep variant Sprint 78, null semantics R9-44/45/50).
 *
 * Two separate hazards live here, and the fix for the first created the
 * second:
 *
 *  1. Firestore REJECTS any document containing an `undefined` field value
 *     ("Unsupported field value: undefined"), and the SyncEngine retries such
 *     a write until it drops the queue entry — so a single optional field set
 *     to `undefined` silently kept an entity from EVER syncing (live-caught
 *     with a note-less favorite; label-less bookmarks and note-less/
 *     category-less highlights had the same flaw).
 *
 *  2. The original fix DROPPED those keys — and `SyncEngine.pushOne` writes
 *     with `{merge: true}`, under which an ABSENT key means "leave whatever
 *     the server already has". That made an optional field impossible to
 *     unset by sync: clearing a highlight's note locally left the old note
 *     in Firestore forever, and any other device happily resurrected it.
 *
 * So the contract is: every synced entity is pushed COMPLETE, and a field
 * the user doesn't have is sent as `null` — a legal Firestore value that,
 * under merge, actually overwrites. Readers already treat `null` and
 * `undefined` alike (`?? fallback` / `|| null`), and the engine's own
 * `valuesEqual` deliberately equates them, so no reader had to change and a
 * doc written by the previous behavior compares equal to one written now.
 *
 * Every *ToRemote payload builder must pass its object through here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A copy of `obj` with its `undefined`-valued keys replaced by `null`. */
export function nullifyUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = value === undefined ? null : value;
  }
  return out as T;
}

/**
 * Sprint 78 — deep variant for payloads that NEST objects (the resolved-
 * conflict audit record carries whole localVersion/remoteVersion/
 * resolvedValue entities). Applied at the engine's Firestore boundary
 * (pushOne / logResolvedConflict) as defense-in-depth, so a payload that
 * skipped its builder's `nullifyUndefined` — a future adapter, a merge
 * resolution typed in the UI — still can't wedge the queue, and still can't
 * silently inherit a stale server value through `{merge: true}`.
 *
 * Only PLAIN objects and arrays are recursed. Class instances (Firestore
 * FieldValue sentinels, Date) pass through untouched — recursing into them
 * would strip their semantics. An `undefined` array ELEMENT becomes `null`
 * too (Firestore rejects undefined inside arrays; null keeps the indices).
 */
export function deepNullifyUndefined<T extends object>(obj: T): T {
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
      out[key] = v === undefined ? null : deepClean(v);
    }
    return out;
  }
  return value;
}
