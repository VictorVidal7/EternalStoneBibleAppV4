/**
 * One-time data migration for the retired "Marcadores" (Bookmarks) feature.
 *
 * Victor removed Bookmarks entirely — it was redundant with the richer
 * Favorites feature (collections, add-to-memorize, listen-all, share) and
 * barely used. Removing the FEATURE must not mean removing the DATA: any
 * verse a user already bookmarked becomes a Favorito instead of silently
 * disappearing.
 *
 * NOT the same thing as `BibleDatabase.migrateBookmarksToFavorites` in
 * `src/lib/database/index.ts` — that is a much older, already-shipped,
 * unrelated migration for a legacy SQLite `bookmarks` table that predates
 * this AsyncStorage/Firestore-backed feature and has nothing to do with it.
 * Both happen to share a similar name/shape (bookmarks → favorites) because
 * they solve the same *kind* of problem, not because they're connected.
 *
 * Two data sources, because the removed `BookmarksContext` had two:
 *  - local AsyncStorage `@bible_bookmarks` (every device that ever ran the
 *    Bookmarks feature, signed in or not)
 *  - Firestore `users/{uid}/bookmarks` (only for a non-anonymous/signed-in
 *    user — and only reachable via a ONE-SHOT `get()` here, since the old
 *    sync adapter that used to mirror it into local storage is gone)
 *
 * Repo-wide rule: minimize Firestore reads (see memoryStatsSync.ts, which
 * this module's Firestore gating deliberately mirrors). The Firestore
 * portion is skipped entirely for an anonymous/signed-out caller, and once
 * it has been attempted successfully for a real uid, `@migration_
 * bookmarks_to_favorites_v1` is set to `` `done:${uid}` `` and this function
 * skips Firestore (and does no meaningful work at all) again for THAT SAME
 * uid on this device. Until then it may store the intermediate value
 * `'local-only'`, which means "local pass complete, but no signed-in uid
 * has been seen yet (or the one Firestore attempt so far failed) — try the
 * Firestore side again next time a real uid is available." A permanently-
 * anonymous user simply never advances past `'local-only'`, which is fine:
 * there is nothing in Firestore for them anyway, and each further run is a
 * cheap local no-op once `@bible_bookmarks` has been cleared.
 *
 * The `'done'` state is deliberately keyed BY UID, not device-global — on a
 * shared device, a second account signing in after a first account's
 * `'done:<uidA>'` must still get its own Firestore pass (`'done:<uidA>'` !==
 * `deps.uid === uidB`), otherwise uidB's bookmarks would sit unread in
 * `users/{uidB}/bookmarks` with no UI left to reach them (Bookmarks itself
 * is gone). Re-running for a new uid is safe even though the local store was
 * already cleared by the first pass — it's empty by then, so the local
 * portion is a harmless no-op and only the Firestore portion does real work.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {canonicalBookName} from '@/constants/bible';
import {getFirestore} from '@lib/sync/firestore';
import {logger} from '@lib/utils/logger';

/** Legacy BookmarksContext local store — see BookmarksContext.tsx (deleted). */
export const LEGACY_BOOKMARKS_STORAGE_KEY = '@bible_bookmarks';

export const BOOKMARKS_MIGRATION_FLAG_KEY =
  '@migration_bookmarks_to_favorites_v1';

/** Minimal shape a migratable legacy bookmark must have — a structural
 *  subset of the deleted `BookmarksContext.Bookmark`, re-declared here so
 *  this module has no dependency on the deleted file. */
export interface LegacyBookmarkLike {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  label?: string;
}

function isLegacyBookmark(value: unknown): value is LegacyBookmarkLike {
  const b = value as Record<string, unknown> | null;
  return (
    !!b &&
    typeof b === 'object' &&
    typeof b.id === 'string' &&
    typeof b.book === 'string' &&
    typeof b.chapter === 'number' &&
    typeof b.verse === 'number'
  );
}

/** Matches `Favorite.verseId` (`FavoritesContext.addFavorite`): canonical
 *  book identity + chapter + verse, so a bookmark that already has a
 *  matching favorite is recognized regardless of which version-language
 *  name it was stored under. */
export function bookmarkVerseKey(
  book: string,
  chapter: number,
  verse: number,
): string {
  return `${canonicalBookName(book)}_${chapter}_${verse}`;
}

/**
 * Pure — given a batch of legacy bookmarks (already merged from whichever
 * sources were available) and the verse-keys already favorited, returns the
 * subset that should actually become new favorites. De-dupes BOTH against
 * the pre-existing favorites AND within the batch itself (two bookmarks at
 * the same verse only ever produce one favorite), so the caller doesn't
 * depend on `addFavorite`'s own (React-state-closure-based, and therefore
 * not safely re-entrant mid-loop) duplicate check.
 *
 * Exported for direct unit testing without touching AsyncStorage/Firestore.
 */
export function selectBookmarksToMigrate(
  bookmarks: readonly LegacyBookmarkLike[],
  existingFavoriteVerseKeys: ReadonlySet<string> | ReadonlyArray<string>,
): LegacyBookmarkLike[] {
  const seen = new Set<string>(existingFavoriteVerseKeys);
  const out: LegacyBookmarkLike[] = [];
  for (const bookmark of bookmarks) {
    const key = bookmarkVerseKey(
      bookmark.book,
      bookmark.chapter,
      bookmark.verse,
    );
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(bookmark);
  }
  return out;
}

export interface RetiredBookmarksMigrationDeps {
  /** Snapshot of the verse-keys (see `bookmarkVerseKey`) already favorited —
   *  used so a bookmark that duplicates an existing favorite is skipped. */
  existingFavoriteVerseKeys: ReadonlyArray<string>;
  /** `FavoritesContext.addFavorite`, or a structurally-compatible stand-in
   *  for tests. */
  addFavorite: (
    verse: {book: string; chapter: number; verse: number; text: string},
    category: 'other',
    rating?: number,
    tags?: string[],
    note?: string,
  ) => Promise<void>;
  /** Non-anonymous uid, or null/undefined when signed out or anonymous —
   *  gates the one-shot Firestore read (see file header). */
  uid?: string | null;
}

/** Guards against two overlapping invocations (e.g. a fast auth-state
 *  transition re-firing the caller's effect before the previous run
 *  finished) double-migrating the same bookmark into two favorites. */
let migrationInFlight = false;

/**
 * Run the one-time migration. Safe to call on every app launch (and, for a
 * caller that re-fires when auth state changes, more than once per launch)
 * — cheap and correct either way once `BOOKMARKS_MIGRATION_FLAG_KEY` is
 * `'done'`. Never throws: every failure is logged and swallowed, same as
 * every other best-effort startup migration in this codebase.
 */
export async function migrateRetiredBookmarksToFavorites(
  deps: RetiredBookmarksMigrationDeps,
): Promise<void> {
  if (migrationInFlight) return;
  migrationInFlight = true;
  try {
    let flag: string | null = null;
    try {
      flag = await AsyncStorage.getItem(BOOKMARKS_MIGRATION_FLAG_KEY);
    } catch (error) {
      logger.warn('retiredBookmarksMigration: flag read failed, proceeding', {
        component: 'retiredBookmarksMigration',
        error: error instanceof Error ? error.message : String(error),
      });
    }
    const doneForUid = flag?.startsWith('done:') ? flag.slice(5) : null;
    if (doneForUid && deps.uid && doneForUid === deps.uid) return;

    // ---- gather candidates from every source ----
    const collected = new Map<string, LegacyBookmarkLike>();

    try {
      const raw = await AsyncStorage.getItem(LEGACY_BOOKMARKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (isLegacyBookmark(item)) collected.set(item.id, item);
          }
        }
      }
    } catch (error) {
      logger.warn('retiredBookmarksMigration: local read failed', {
        component: 'retiredBookmarksMigration',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    let firestoreSucceeded = false;
    const firestoreDocIds: string[] = [];
    if (deps.uid) {
      const fn = getFirestore();
      if (fn) {
        try {
          const snapshot = await fn()
            .collection(`users/${deps.uid}/bookmarks`)
            .get();
          for (const doc of snapshot.docs) {
            firestoreDocIds.push(doc.id);
            const data = doc.data();
            if (!data || data.deleted === true) continue;
            const candidate = {...data, id: doc.id};
            if (isLegacyBookmark(candidate)) {
              collected.set(candidate.id, candidate);
            }
          }
          firestoreSucceeded = true;
        } catch (error) {
          logger.warn('retiredBookmarksMigration: firestore read failed', {
            component: 'retiredBookmarksMigration',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // ---- migrate whatever survived, deduped against existing favorites ----
    const toMigrate = selectBookmarksToMigrate(
      Array.from(collected.values()),
      deps.existingFavoriteVerseKeys,
    );
    for (const bookmark of toMigrate) {
      try {
        await deps.addFavorite(
          {
            book: canonicalBookName(bookmark.book),
            chapter: bookmark.chapter,
            verse: bookmark.verse,
            text: bookmark.text,
          },
          'other',
          5,
          [],
          bookmark.label,
        );
      } catch (error) {
        logger.warn('retiredBookmarksMigration: addFavorite failed', {
          component: 'retiredBookmarksMigration',
          bookmarkId: bookmark.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // ---- clear the legacy local store (best-effort — see file header) ----
    try {
      await AsyncStorage.removeItem(LEGACY_BOOKMARKS_STORAGE_KEY);
    } catch (error) {
      logger.warn('retiredBookmarksMigration: failed to clear legacy store', {
        component: 'retiredBookmarksMigration',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // ---- clean up the retired Firestore collection (best-effort) ----
    // Every doc we successfully READ above (migrated OR skipped as an
    // already-existing favorite) no longer needs to live in
    // `users/{uid}/bookmarks` — the whole collection is retired. Deleting it
    // here means `deleteAccountData.ts`'s defense-in-depth sweep of this same
    // collection normally finds nothing left to do. Failures here are NOT
    // fatal to the migration itself (the data is already safely a Favorito;
    // a leftover cloud doc is a cleanliness issue, not a data-loss one) — see
    // deleteAccountData.ts, which is the actual backstop for this.
    if (deps.uid && firestoreDocIds.length > 0) {
      const fn = getFirestore();
      if (fn) {
        for (const docId of firestoreDocIds) {
          try {
            await fn()
              .collection(`users/${deps.uid}/bookmarks`)
              .doc(docId)
              .delete();
          } catch (error) {
            logger.warn(
              'retiredBookmarksMigration: firestore cleanup delete failed',
              {
                component: 'retiredBookmarksMigration',
                docId,
                error: error instanceof Error ? error.message : String(error),
              },
            );
          }
        }
      }
    }

    // ---- persist how far we got (see file header for the state machine) ----
    try {
      await AsyncStorage.setItem(
        BOOKMARKS_MIGRATION_FLAG_KEY,
        deps.uid && firestoreSucceeded ? `done:${deps.uid}` : 'local-only',
      );
    } catch (error) {
      logger.warn('retiredBookmarksMigration: failed to persist flag', {
        component: 'retiredBookmarksMigration',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } finally {
    migrationInFlight = false;
  }
}

/** Test-only — reset the in-flight guard between cases. */
export function __resetRetiredBookmarksMigrationForTests(): void {
  migrationInFlight = false;
}
