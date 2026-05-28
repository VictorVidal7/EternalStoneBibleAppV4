/**
 * Sprint 42 — time format conversions between local stores and Firestore.
 *
 * Local stores are inconsistent:
 *  - SQLite `favorites` table: createdAt/updatedAt are millis (number)
 *  - SQLite `notes` table: createdAt/updatedAt are ISO strings (set via
 *    `new Date().toISOString()` from the chapter screen and updateNote)
 *  - SQLite `highlights` table: created_at/updated_at are millis (number)
 *  - AsyncStorage memory deck: lastReviewedAt/dueAt are ISO strings, no
 *    top-level updatedAt
 *  - AsyncStorage bookmarks: only createdAt (millis), no updatedAt
 *
 * For LWW comparison the engine treats updatedAt as a number (millis
 * since epoch). These helpers normalize each store's clock to that
 * format on the way out and back.
 */

/** Coerce any reasonable representation of a timestamp to millis.
 *  Returns 0 if the input is undefined/null/unparseable — which makes
 *  the LWW comparison treat a missing timestamp as the oldest possible. */
export function toMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    // Some legacy data might be a numeric string.
    const asNum = Number(value);
    if (Number.isFinite(asNum)) return asNum;
  }
  // Firestore serverTimestamp() comes back as an object with seconds/nanos
  // when read from a snapshot (`Timestamp` instance). We're treating
  // these as the lowest precision (seconds) and dropping nanos.
  if (value && typeof value === 'object') {
    const obj = value as {
      seconds?: number;
      nanoseconds?: number;
      toMillis?: () => number;
    };
    if (typeof obj.toMillis === 'function') return obj.toMillis();
    if (typeof obj.seconds === 'number') return obj.seconds * 1000;
  }
  return 0;
}

/** Convert millis to the ISO string format the notes table expects. */
export function millisToIso(ms: number): string {
  return new Date(ms).toISOString();
}
