/**
 * T10 — importBackup: round-trip through the coercion/validation layer,
 * corrupted payloads, and v1→v2 format compatibility.
 *
 * `bibleDB` and `AchievementService` are mocked (not a real SQLite/native
 * achievements singleton) so this stays a fast unit suite that pins down
 * BackupService's own contract: which rows survive coercion, which
 * AsyncStorage keys get written, and how achievement restore is delegated.
 * The full real-device round trip (real SQLite, real achievements) is
 * verified separately on the emulator per this tanda's checklist.
 *
 * Each mock factory is fully self-contained (no reference to outer
 * variables) and stashes its fake instance as `__mockInstance` on the
 * mocked module, which is read back AFTER the imports below run — this
 * sidesteps jest/babel's mock-hoisting order entirely.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
  };
  return {
    __esModule: true,
    default: instance,
    bibleDB: instance,
    BibleDatabase: jest.fn(),
    __mockInstance: instance,
  };
});

jest.mock('../src/lib/achievements/AchievementService', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    restoreBackup: jest.fn().mockResolvedValue(undefined),
  };
  return {
    AchievementService: jest.fn().mockImplementation(() => instance),
    __mockInstance: instance,
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DatabaseModule from '../src/lib/database';
import * as AchievementServiceModule from '../src/lib/achievements/AchievementService';
// NOT mocked — this is the real module-level singleton BackupService reads
// via `resolveAchievementService()` (see lib/achievements/instance.ts).
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {
  importBackup,
  parseBackupPayload,
  BACKUP_FORMAT_VERSION,
  type BackupPayload,
} from '../src/services/BackupService';

interface MockDbInstance {
  initialize: jest.Mock;
  getDatabase: jest.Mock;
  executeSql: jest.Mock;
}
interface MockAchievementsInstance {
  initialize: jest.Mock;
  restoreBackup: jest.Mock;
}

const mockDb = (DatabaseModule as unknown as {__mockInstance: MockDbInstance})
  .__mockInstance;
const mockExecuteSql = mockDb.executeSql;
const mockDbInitialize = mockDb.initialize;

const mockAchievements = (
  AchievementServiceModule as unknown as {
    __mockInstance: MockAchievementsInstance;
  }
).__mockInstance;
const mockRestoreBackup = mockAchievements.restoreBackup;
const mockAchievementInitialize = mockAchievements.initialize;

function sqlCallsStartingWith(prefix: string): unknown[][] {
  return mockExecuteSql.mock.calls
    .filter(([sql]: [string]) => sql.trim().startsWith(prefix))
    .map(([, params]: [string, unknown[]]) => params ?? []);
}

/** A minimal, fully-populated v2 payload. Tests override only what they need. */
function basePayload(overrides: Partial<BackupPayload> = {}): BackupPayload {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    generatedAt: '2026-01-01T00:00:00.000Z',
    app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
    bible: {
      favorites: [],
      notes: [],
      highlights: [],
      lastReadPosition: null,
      chapterProgressMap: null,
    },
    user: {
      readingPlanProgress: undefined,
      readingPlanReadChapters: undefined,
      searchHistory: undefined,
      readerPreferences: {sideBySide: false},
      readerPreferencesFull: null,
      appTheme: {mode: null, colorTheme: null},
    },
    achievements: {
      stats: {
        totalVersesRead: 0,
        totalChaptersRead: 0,
        totalBooksCompleted: 0,
        totalReadingTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        totalHighlights: 0,
        totalNotes: 0,
        totalBookmarks: 0,
        totalSearches: 0,
        totalShares: 0,
        level: 1,
        totalPoints: 0,
      },
      achievements: [],
      streakLog: [],
      completedBooks: [],
      bookReadingLog: [],
      chaptersReadLog: [],
    },
    memory: {memoryDeck: null, reviewEvents: []},
    prep: {notes: null, series: null},
    ...overrides,
  } as BackupPayload;
}

beforeEach(async () => {
  mockExecuteSql.mockClear();
  mockDbInitialize.mockClear();
  mockRestoreBackup.mockClear();
  mockAchievementInitialize.mockClear();
  mockExecuteSql.mockImplementation(async () => ({
    rows: {_array: [], length: 0},
  }));
  await AsyncStorage.clear();
  // Every test starts with no shared instance registered — otherwise a
  // shared-instance test earlier in the file would leak into a later test
  // that expects BackupService's own fallback instance to be used instead.
  setAchievementServiceInstance(null);
});

describe('parseBackupPayload — corrupted files', () => {
  it('rejects text that is not valid JSON', () => {
    expect(() => parseBackupPayload('{not json')).toThrow(/not valid JSON/);
  });

  it('rejects a JSON value that is not an object (e.g. a bare string)', () => {
    expect(() => parseBackupPayload(JSON.stringify('hello'))).toThrow(
      /no readable content/,
    );
  });

  it('rejects a payload with no formatVersion', () => {
    expect(() => parseBackupPayload(JSON.stringify({}))).toThrow(
      /missing or invalid formatVersion/,
    );
  });

  it('rejects a formatVersion newer than this app understands', () => {
    const raw = JSON.stringify({formatVersion: BACKUP_FORMAT_VERSION + 1});
    expect(() => parseBackupPayload(raw)).toThrow(/newer app version/);
  });

  it('accepts a well-formed payload and returns it unchanged', () => {
    const payload = basePayload();
    const parsed = parseBackupPayload(JSON.stringify(payload));
    expect(parsed.formatVersion).toBe(BACKUP_FORMAT_VERSION);
  });
});

describe('importBackup — formatVersion guard', () => {
  it('throws before touching the DB when the payload is too new', async () => {
    const payload = basePayload({
      formatVersion: BACKUP_FORMAT_VERSION + 1,
    });
    await expect(importBackup(payload)).rejects.toThrow(/newer app version/);
    expect(mockExecuteSql).not.toHaveBeenCalled();
  });
});

describe('importBackup — round trip through coercion + persistence', () => {
  it('writes only the valid rows and drops corrupted ones', async () => {
    const payload = basePayload({
      bible: {
        favorites: [
          {
            id: 'fav-1',
            book: 'John',
            chapter: 3,
            verse: 16,
            text: 'For God so loved the world',
            category: 'other',
            rating: 5,
            tags: [],
            createdAt: 1,
            updatedAt: 1,
          },
          // Corrupted: missing required `book` — must be dropped silently.
          {id: 'fav-2', chapter: 1, verse: 1} as unknown,
        ] as never,
        notes: [],
        highlights: [],
        lastReadPosition: {
          book: 'John',
          chapter: 3,
          verse: 16,
          timestamp: '2026-01-01T00:00:00.000Z',
        },
        chapterProgressMap: null,
      },
    });

    const result = await importBackup(payload);

    expect(result.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(result.restoredSections).toEqual(
      expect.arrayContaining(['favorites', 'lastReadPosition']),
    );

    const favoriteInserts = sqlCallsStartingWith('INSERT INTO favorites');
    expect(favoriteInserts).toHaveLength(1);
    expect(favoriteInserts[0][0]).toBe('fav-1');

    const progressUpdates = sqlCallsStartingWith('UPDATE reading_progress');
    expect(progressUpdates).toHaveLength(1);
    expect(progressUpdates[0]).toEqual([
      'John',
      3,
      16,
      '2026-01-01T00:00:00.000Z',
    ]);
  });

  it('persists AsyncStorage-backed sections (theme)', async () => {
    const payload = basePayload({
      user: {
        readingPlanProgress: undefined,
        readingPlanReadChapters: undefined,
        searchHistory: undefined,
        readerPreferences: {sideBySide: true},
        readerPreferencesFull: null,
        appTheme: {mode: 'dark', colorTheme: 'default'},
      },
    });

    const result = await importBackup(payload);

    expect(result.restoredSections).toEqual(
      expect.arrayContaining(['appThemeMode', 'appColorTheme']),
    );

    expect(await AsyncStorage.getItem('@app_theme_mode')).toBe('dark');
    expect(await AsyncStorage.getItem('@app_color_theme')).toBe('default');
  });

  it('delegates the achievements section to AchievementService.restoreBackup', async () => {
    const payload = basePayload({
      achievements: {
        stats: {
          totalVersesRead: 1234,
          totalChaptersRead: 12,
          totalBooksCompleted: 1,
          totalReadingTime: 100,
          currentStreak: 3,
          longestStreak: 9,
          lastReadDate: '2026-01-01',
          totalHighlights: 0,
          totalNotes: 0,
          totalBookmarks: 0,
          totalSearches: 0,
          totalShares: 0,
          level: 2,
          totalPoints: 500,
        },
        // Raw backup JSON only carries the fields `coerceAchievementRow`
        // reads back (id/currentProgress/isUnlocked/unlockedAt) — the full
        // `Achievement` shape (name/description/icon/…) is re-derived from
        // `ACHIEVEMENT_DEFINITIONS` on restore, not round-tripped.
        achievements: [
          {
            id: 'reader_100',
            currentProgress: 100,
            isUnlocked: true,
            unlockedAt: 123,
          },
        ] as unknown as BackupPayload['achievements']['achievements'],
        streakLog: [],
        completedBooks: [],
        bookReadingLog: [],
        chaptersReadLog: [],
      },
    });

    const result = await importBackup(payload);

    expect(result.restoredSections).toContain('achievements');
    expect(mockAchievementInitialize).toHaveBeenCalled();
    expect(mockRestoreBackup).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({totalVersesRead: 1234, level: 2}),
        achievements: expect.arrayContaining([
          expect.objectContaining({id: 'reader_100', isUnlocked: true}),
        ]),
      }),
    );
  });
});

describe('importBackup — shared AchievementService instance (staleness fix)', () => {
  // Regression coverage for the bug this fix addresses: BackupService used
  // to always construct its OWN `AchievementService`, whose in-memory
  // `stats` cache is separate from the app-wide instance the Achievements
  // tab reads (via `useAchievements` → `useServices()`). A restore would
  // invalidate the WRONG cache, so the tab kept showing pre-restore stats
  // until an app restart threw the stale cache away. `resolveAchievementService()`
  // now prefers whatever `ServicesContext` has mirrored into the module-level
  // singleton (`lib/achievements/instance.ts`) so the SAME instance's cache
  // gets invalidated.
  it('delegates to the registered shared instance instead of its own fallback', async () => {
    const sharedInstance = {
      initialize: jest.fn().mockResolvedValue(undefined),
      restoreBackup: jest.fn().mockResolvedValue(undefined),
    };
    setAchievementServiceInstance(
      sharedInstance as unknown as Parameters<
        typeof setAchievementServiceInstance
      >[0],
    );

    const payload = basePayload();
    const result = await importBackup(payload);

    expect(result.restoredSections).toContain('achievements');
    expect(sharedInstance.initialize).toHaveBeenCalled();
    expect(sharedInstance.restoreBackup).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({totalPoints: 0}),
      }),
    );
    // The fallback (module-mocked) instance must NOT have been touched —
    // proves the shared instance was actually used, not just constructed
    // alongside it.
    expect(mockAchievementInitialize).not.toHaveBeenCalled();
    expect(mockRestoreBackup).not.toHaveBeenCalled();

    setAchievementServiceInstance(null);
  });

  it('falls back to its own instance when no shared instance is registered', async () => {
    setAchievementServiceInstance(null);

    const payload = basePayload();
    const result = await importBackup(payload);

    expect(result.restoredSections).toContain('achievements');
    expect(mockAchievementInitialize).toHaveBeenCalled();
    expect(mockRestoreBackup).toHaveBeenCalled();
  });
});

describe('importBackup — v1 payload compatibility', () => {
  it('reads the legacy `bible.readingProgress` pointer field (v1 name)', async () => {
    // v1 files never had achievements/memory/prep at all.
    const v1Payload = {
      formatVersion: 1,
      generatedAt: '2025-01-01T00:00:00.000Z',
      app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
      bible: {
        favorites: [],
        notes: [],
        highlights: [],
        // v1 field name — NOT `lastReadPosition`.
        readingProgress: {
          book: 'Psalms',
          chapter: 23,
          verse: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
      },
      user: {
        bookmarks: [],
        readerPreferences: {sideBySide: false},
      },
    } as unknown as BackupPayload;

    const result = await importBackup(v1Payload);

    expect(result.restoredSections).toContain('lastReadPosition');
    expect(result.restoredSections).not.toContain('achievements');
    expect(mockRestoreBackup).not.toHaveBeenCalled();

    const progressUpdates = sqlCallsStartingWith('UPDATE reading_progress');
    expect(progressUpdates).toEqual([
      ['Psalms', 23, 1, '2025-01-01T00:00:00.000Z'],
    ]);

    // Sections absent from the v1 file must not leave stray AsyncStorage keys.
    expect(await AsyncStorage.getItem('@memory_deck')).toBeNull();
    expect(await AsyncStorage.getItem('@prep_notes')).toBeNull();
  });
});

describe('importBackup — Bug 2: every row in a present section fails validation', () => {
  it('does NOT wipe existing favorites when every favorites row is corrupted', async () => {
    const payload = basePayload({
      bible: {
        // Both entries are missing required fields — nothing survives
        // `coerceFavorite`, but the section IS present with real (non-empty)
        // source data, unlike a genuinely empty backup.
        favorites: [
          {id: 'fav-bad-1'} as unknown,
          {chapter: 1, verse: 1} as unknown,
        ] as never,
        notes: [],
        highlights: [],
        lastReadPosition: null,
        chapterProgressMap: null,
      },
    });

    const result = await importBackup(payload);

    // The OLD (buggy) behavior silently pushed 'favorites' into
    // restoredSections regardless of how many rows survived. The fix must
    // report this differently: not restored, and distinctly failed.
    expect(result.restoredSections).not.toContain('favorites');
    expect(result.failedSections).toContain('favorites');

    // The destructive DELETE must never have run — proves existing local
    // favorites were left untouched instead of being wiped to zero rows.
    expect(sqlCallsStartingWith('DELETE FROM favorites')).toHaveLength(0);
    expect(sqlCallsStartingWith('INSERT INTO favorites')).toHaveLength(0);
  });

  it('still clears favorites via a genuinely empty array (REPLACE semantics preserved)', async () => {
    const payload = basePayload({
      bible: {
        favorites: [],
        notes: [],
        highlights: [],
        lastReadPosition: null,
        chapterProgressMap: null,
      },
    });

    const result = await importBackup(payload);

    // A real "I have zero favorites" backup must still replace-with-empty —
    // this is NOT the same case as Bug 2 and must not regress.
    expect(result.restoredSections).toContain('favorites');
    expect(result.failedSections).not.toContain('favorites');
    expect(sqlCallsStartingWith('DELETE FROM favorites')).toHaveLength(1);
  });
});

describe('importBackup — legacy `user.bookmarks` field (removed Bookmarks feature)', () => {
  // The Bookmarks ("Marcadores") feature was removed and its data now lives
  // as Favoritos (see src/lib/migrations/retiredBookmarksMigration.ts, which
  // handles converting any PRE-EXISTING bookmark — this file is NOT that
  // migration). A backup created before the removal may still carry a
  // `user.bookmarks` array; `importBackup` must never crash or fail
  // validation on it, and — critically — every OTHER section in the same
  // file must still restore normally.
  it('silently ignores a legacy user.bookmarks array without crashing or dropping other sections', async () => {
    const payload = basePayload({
      bible: {
        favorites: [
          {
            id: 'fav-1',
            book: 'John',
            chapter: 3,
            verse: 16,
            text: 'For God so loved the world',
            category: 'other',
            rating: 5,
            tags: [],
            createdAt: 1,
            updatedAt: 1,
          },
        ] as never,
        notes: [],
        highlights: [],
        lastReadPosition: null,
        chapterProgressMap: null,
      },
      user: {
        // Legacy field from a pre-removal backup. There is nothing left to
        // restore it into — it must simply be ignored.
        bookmarks: [
          {
            id: 'bm-1',
            book: 'Genesis',
            chapter: 1,
            verse: 1,
            text: 'In the beginning',
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        readingPlanProgress: {plan: 'gospel-of-john'},
        readingPlanReadChapters: undefined,
        searchHistory: ['grace'],
        readerPreferences: {sideBySide: true},
        readerPreferencesFull: null,
        appTheme: {mode: 'dark', colorTheme: 'default'},
      } as unknown as BackupPayload['user'],
    });

    // Awaiting directly (rather than wrapping in expect(...).resolves) is
    // itself the "does not crash" assertion — an unexpected rejection here
    // fails the test.
    const result = await importBackup(payload);

    // The rest of the SAME payload restored normally.
    expect(result.restoredSections).toEqual(
      expect.arrayContaining([
        'favorites',
        'readingPlanProgress',
        'searchHistory',
        'appThemeMode',
        'appColorTheme',
      ]),
    );
    // Never restored (nothing to restore it into) and never reported as a
    // failure either — it's simply unread, not a corrupted section.
    expect(result.restoredSections).not.toContain('bookmarks');
    expect(result.failedSections).not.toContain('bookmarks');
    // The retired local store is never (re-)created by import.
    expect(await AsyncStorage.getItem('@bible_bookmarks')).toBeNull();
  });
});

describe('importBackup — Bug 1: AsyncStorage write fails after SQLite already committed', () => {
  it('resolves (does not reject) with asyncStorageWriteFailed=true, keeping the already-committed SQLite section out of failedSections', async () => {
    const multiSetSpy = jest
      .spyOn(AsyncStorage, 'multiSet')
      .mockRejectedValueOnce(new Error('mock: device storage full'));

    const payload = basePayload({
      bible: {
        favorites: [
          {
            id: 'fav-1',
            book: 'John',
            chapter: 3,
            verse: 16,
            text: 'For God so loved the world',
            category: 'other',
            rating: 5,
            tags: [],
            createdAt: 1,
            updatedAt: 1,
          },
        ] as never,
        notes: [],
        highlights: [],
        lastReadPosition: null,
        chapterProgressMap: null,
      },
      user: {
        readingPlanProgress: undefined,
        readingPlanReadChapters: undefined,
        searchHistory: ['grace', 'faith'],
        readerPreferences: {sideBySide: false},
        readerPreferencesFull: null,
        appTheme: {mode: null, colorTheme: null},
      },
    });

    // The pre-fix behavior was a generic reject here, indistinguishable from
    // "nothing was written" even though SQLite had already committed. The
    // fix must resolve with an honest, distinguishing signal instead.
    const result = await importBackup(payload);

    expect(result.asyncStorageWriteFailed).toBe(true);
    // SQLite-backed section: already committed before multiSet ever ran.
    expect(result.restoredSections).toContain('favorites');
    // AsyncStorage-backed section: never actually persisted.
    expect(result.restoredSections).not.toContain('searchHistory');
    expect(result.failedSections).toContain('searchHistory');

    // Prove the SQLite write really happened (not just claimed in the
    // result) — this is the crux of Bug 1: the DB write is real and
    // unrecoverable by the time AsyncStorage fails.
    expect(sqlCallsStartingWith('INSERT INTO favorites')).toHaveLength(1);

    // Prove the AsyncStorage write really did NOT happen.
    expect(await AsyncStorage.getItem('@bible_search_history')).toBeNull();

    multiSetSpy.mockRestore();
  });
});
