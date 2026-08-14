/**
 * Tests for the one-time "Marcadores" (Bookmarks) → Favoritos migration
 * that runs after the Bookmarks feature was removed (see
 * src/lib/migrations/retiredBookmarksMigration.ts for the full rationale).
 *
 * Covers:
 *  - `selectBookmarksToMigrate` (pure): dedupes against pre-existing
 *    favorites AND within the batch itself.
 *  - `migrateRetiredBookmarksToFavorites` (impure): local-only migration,
 *    the Firestore safety-net for a signed-in uid, the flag state machine
 *    ('local-only' vs 'done:<uid>', per-uid so a second account on a shared
 *    device still gets its own Firestore pass), idempotency (never
 *    re-migrates once done for that uid), and that it clears the legacy
 *    AsyncStorage store.
 *
 * Firestore is mocked at the module boundary (`@lib/sync/firestore`), same
 * idiom the codebase already uses in memoryStatsSync's own tests.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- firestore mock (same idiom as memoryStatsSync.test.ts) ----
let mockDocs: Array<{id: string; data: Record<string, unknown> | undefined}> =
  [];
const mockDelete = jest.fn(async () => {});
const mockGet = jest.fn(async () => ({
  docs: mockDocs.map(d => ({id: d.id, data: () => d.data})),
}));
const mockDoc = jest.fn(() => ({delete: mockDelete}));
const mockCollection = jest.fn(() => ({get: mockGet, doc: mockDoc}));
const mockFirestoreFn = jest.fn(() => ({collection: mockCollection}));
jest.mock('../src/lib/sync/firestore', () => ({
  __esModule: true,
  getFirestore: () => mockFirestoreFn,
  serverTimestamp: () => Date.now(),
  __resetFirestoreCacheForTests: () => {},
}));

// Imports AFTER the mock so the lazy firestore require captures it.
import {
  migrateRetiredBookmarksToFavorites,
  selectBookmarksToMigrate,
  bookmarkVerseKey,
  LEGACY_BOOKMARKS_STORAGE_KEY,
  BOOKMARKS_MIGRATION_FLAG_KEY,
  __resetRetiredBookmarksMigrationForTests,
  type LegacyBookmarkLike,
} from '../src/lib/migrations/retiredBookmarksMigration';
import {__resetFirestoreCacheForTests} from '../src/lib/sync/firestore';

function bookmark(over: Partial<LegacyBookmarkLike> = {}): LegacyBookmarkLike {
  return {
    id: 'bm-1',
    book: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning',
    ...over,
  };
}

describe('selectBookmarksToMigrate (pure)', () => {
  it('returns every bookmark when nothing is already favorited', () => {
    const out = selectBookmarksToMigrate(
      [
        bookmark({id: 'a'}),
        bookmark({id: 'b', book: 'John', chapter: 3, verse: 16}),
      ],
      [],
    );
    expect(out.map(b => b.id)).toEqual(['a', 'b']);
  });

  it('skips a bookmark whose verse already has a favorite', () => {
    const existing = [bookmarkVerseKey('Genesis', 1, 1)];
    const out = selectBookmarksToMigrate([bookmark({id: 'a'})], existing);
    expect(out).toEqual([]);
  });

  it('de-dupes two bookmarks at the same verse within the same batch (keeps the first)', () => {
    const out = selectBookmarksToMigrate(
      [
        bookmark({id: 'a', text: 'first'}),
        bookmark({id: 'b', text: 'second'}), // same book/chapter/verse as 'a'
      ],
      [],
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('a');
  });

  it('recognizes the same verse across version-language book names via canonicalBookName', () => {
    // "Juan" (Spanish) and "John" (English) canonicalize to the same book.
    const existing = [bookmarkVerseKey('John', 3, 16)];
    const out = selectBookmarksToMigrate(
      [bookmark({id: 'a', book: 'Juan', chapter: 3, verse: 16})],
      existing,
    );
    expect(out).toEqual([]);
  });
});

describe('migrateRetiredBookmarksToFavorites', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetRetiredBookmarksMigrationForTests();
    __resetFirestoreCacheForTests();
    mockDocs = [];
    mockDelete.mockClear();
    mockGet.mockClear();
    mockDoc.mockClear();
    mockCollection.mockClear();
  });

  it('does nothing when there are no local bookmarks and no uid', async () => {
    const addFavorite = jest.fn().mockResolvedValue(undefined);
    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: null,
    });
    expect(addFavorite).not.toHaveBeenCalled();
    // Anonymous/no-uid run never reaches "fully done".
    expect(await AsyncStorage.getItem(BOOKMARKS_MIGRATION_FLAG_KEY)).toBe(
      'local-only',
    );
  });

  it('migrates every local bookmark into a favorite and clears the legacy store', async () => {
    await AsyncStorage.setItem(
      LEGACY_BOOKMARKS_STORAGE_KEY,
      JSON.stringify([
        bookmark({id: 'bm-1', book: 'Genesis', chapter: 1, verse: 1}),
        bookmark({
          id: 'bm-2',
          book: 'John',
          chapter: 3,
          verse: 16,
          text: 'For God so loved the world',
          label: 'Sunday sermon',
        }),
      ]),
    );
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: null,
    });

    expect(addFavorite).toHaveBeenCalledTimes(2);
    expect(addFavorite).toHaveBeenCalledWith(
      {book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning'},
      'other',
      5,
      [],
      undefined,
    );
    expect(addFavorite).toHaveBeenCalledWith(
      {
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world',
      },
      'other',
      5,
      [],
      'Sunday sermon',
    );
    // Legacy store cleared so it's never re-read.
    expect(await AsyncStorage.getItem(LEGACY_BOOKMARKS_STORAGE_KEY)).toBeNull();
  });

  it('skips a bookmark whose verse is already favorited (no duplicate)', async () => {
    await AsyncStorage.setItem(
      LEGACY_BOOKMARKS_STORAGE_KEY,
      JSON.stringify([
        bookmark({id: 'bm-1', book: 'Genesis', chapter: 1, verse: 1}),
      ]),
    );
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [bookmarkVerseKey('Genesis', 1, 1)],
      addFavorite,
      uid: null,
    });

    expect(addFavorite).not.toHaveBeenCalled();
    // Still clears the legacy store — there's nothing left worth keeping it for.
    expect(await AsyncStorage.getItem(LEGACY_BOOKMARKS_STORAGE_KEY)).toBeNull();
  });

  it('only runs once: a second call for the SAME uid is a no-op once the flag is "done:<uid>"', async () => {
    await AsyncStorage.setItem(BOOKMARKS_MIGRATION_FLAG_KEY, 'done:some-uid');
    await AsyncStorage.setItem(
      LEGACY_BOOKMARKS_STORAGE_KEY,
      JSON.stringify([bookmark()]),
    );
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: 'some-uid',
    });

    expect(addFavorite).not.toHaveBeenCalled();
    // A pre-existing legacy blob is left alone once the flag says done —
    // this function should not even have looked at it.
    expect(
      await AsyncStorage.getItem(LEGACY_BOOKMARKS_STORAGE_KEY),
    ).not.toBeNull();
  });

  it('shared-device fix: a DIFFERENT uid still runs its own Firestore pass even though a prior uid already reached "done"', async () => {
    // uidA already completed its migration on this device.
    await AsyncStorage.setItem(BOOKMARKS_MIGRATION_FLAG_KEY, 'done:uid-a');
    mockDocs = [
      {
        id: 'bm-remote-b',
        data: {book: 'John', chapter: 3, verse: 16, text: 'uidB verse'},
      },
    ];
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: 'uid-b',
    });

    // Without the fix, this would short-circuit on the stale device-global
    // 'done' flag and never look at uid-b's own Firestore bookmarks.
    expect(mockCollection).toHaveBeenCalledWith('users/uid-b/bookmarks');
    expect(addFavorite).toHaveBeenCalledWith(
      {book: 'John', chapter: 3, verse: 16, text: 'uidB verse'},
      'other',
      5,
      [],
      undefined,
    );
    expect(await AsyncStorage.getItem(BOOKMARKS_MIGRATION_FLAG_KEY)).toBe(
      'done:uid-b',
    );
  });

  it('never re-runs for the SAME already-migrated bookmark across two calls (idempotent)', async () => {
    await AsyncStorage.setItem(
      LEGACY_BOOKMARKS_STORAGE_KEY,
      JSON.stringify([bookmark({id: 'bm-1'})]),
    );
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: null,
    });
    expect(addFavorite).toHaveBeenCalledTimes(1);

    // Second call: the legacy store is already empty (cleared above), so
    // even though the flag is only 'local-only' (no uid was ever seen),
    // there is nothing left to migrate.
    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [bookmarkVerseKey('Genesis', 1, 1)],
      addFavorite,
      uid: null,
    });
    expect(addFavorite).toHaveBeenCalledTimes(1);
  });

  it('leaves the flag as "local-only" (not "done") when no uid is available, so a later sign-in can retry', async () => {
    await AsyncStorage.setItem(
      LEGACY_BOOKMARKS_STORAGE_KEY,
      JSON.stringify([bookmark()]),
    );
    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite: jest.fn().mockResolvedValue(undefined),
      uid: null,
    });
    expect(await AsyncStorage.getItem(BOOKMARKS_MIGRATION_FLAG_KEY)).toBe(
      'local-only',
    );
  });

  it('addFavorite failures for one bookmark do not block the others or the flag/clear steps', async () => {
    await AsyncStorage.setItem(
      LEGACY_BOOKMARKS_STORAGE_KEY,
      JSON.stringify([
        bookmark({id: 'bm-1', book: 'Genesis', chapter: 1, verse: 1}),
        bookmark({id: 'bm-2', book: 'John', chapter: 3, verse: 16}),
      ]),
    );
    const addFavorite = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: null,
    });

    expect(addFavorite).toHaveBeenCalledTimes(2);
    expect(await AsyncStorage.getItem(LEGACY_BOOKMARKS_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(BOOKMARKS_MIGRATION_FLAG_KEY)).toBe(
      'local-only',
    );
  });
});

describe('migrateRetiredBookmarksToFavorites — Firestore safety-net (signed-in uid)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetRetiredBookmarksMigrationForTests();
    __resetFirestoreCacheForTests();
    mockDocs = [];
    mockDelete.mockClear();
    mockGet.mockClear();
    mockDoc.mockClear();
    mockCollection.mockClear();
  });

  it('pulls a bookmark that only exists in Firestore (never synced to this device), migrates it, deletes the cloud doc, and marks the flag "done"', async () => {
    mockDocs = [
      {
        id: 'bm-remote',
        data: {
          book: 'John',
          chapter: 3,
          verse: 16,
          text: 'For God so loved the world',
        },
      },
    ];
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: 'user-1',
    });

    expect(mockCollection).toHaveBeenCalledWith('users/user-1/bookmarks');
    expect(addFavorite).toHaveBeenCalledWith(
      {book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world'},
      'other',
      5,
      [],
      undefined,
    );
    // The retired collection is cleaned up so nothing lingers in the cloud.
    expect(mockDoc).toHaveBeenCalledWith('bm-remote');
    expect(mockDelete).toHaveBeenCalledTimes(1);
    // A successful Firestore attempt with a real uid is the only way to
    // reach the PERMANENT 'done:<uid>' state, keyed to that specific uid.
    expect(await AsyncStorage.getItem(BOOKMARKS_MIGRATION_FLAG_KEY)).toBe(
      'done:user-1',
    );
  });

  it('ignores a tombstoned (deleted: true) Firestore doc but still cleans it up', async () => {
    mockDocs = [
      {
        id: 'bm-deleted',
        data: {
          book: 'John',
          chapter: 3,
          verse: 16,
          text: 'stale',
          deleted: true,
        },
      },
    ];
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: 'user-1',
    });

    expect(addFavorite).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('merges local + Firestore sources by id and still only migrates each verse once', async () => {
    await AsyncStorage.setItem(
      LEGACY_BOOKMARKS_STORAGE_KEY,
      JSON.stringify([
        bookmark({id: 'bm-local', book: 'Genesis', chapter: 1, verse: 1}),
      ]),
    );
    mockDocs = [
      // Same verse as the local one, different id (e.g. re-bookmarked on
      // another device before that device's old doc got tombstoned).
      {
        id: 'bm-remote-dup',
        data: {book: 'Genesis', chapter: 1, verse: 1, text: 'dup'},
      },
      {
        id: 'bm-remote-new',
        data: {book: 'John', chapter: 3, verse: 16, text: 'new'},
      },
    ];
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: 'user-1',
    });

    // Genesis 1:1 only produces ONE favorite despite appearing twice.
    expect(addFavorite).toHaveBeenCalledTimes(2);
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it('does not reach "done" (retries next time) when the Firestore read itself fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('network error'));
    const addFavorite = jest.fn().mockResolvedValue(undefined);

    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite,
      uid: 'user-1',
    });

    expect(await AsyncStorage.getItem(BOOKMARKS_MIGRATION_FLAG_KEY)).toBe(
      'local-only',
    );
  });

  it('does not touch Firestore at all for an anonymous/signed-out caller (uid omitted)', async () => {
    await migrateRetiredBookmarksToFavorites({
      existingFavoriteVerseKeys: [],
      addFavorite: jest.fn().mockResolvedValue(undefined),
      uid: null,
    });
    expect(mockCollection).not.toHaveBeenCalled();
  });
});
