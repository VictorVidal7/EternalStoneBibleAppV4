/**
 * 💾 BACKUP SERVICE
 *
 * Builds a JSON snapshot of every piece of user-owned data the app has
 * persisted, and can restore that snapshot back onto a device (import).
 *
 * v1 (original) covered: favorites, notes, highlights, bookmarks,
 * reading-plan progress, search history, and ONE reader preference
 * (`sideBySide`) — plus a `bible.readingProgress` field that had a real bug:
 * it read `bibleDB.getReadingProgress()` (the SQLite `reading_progress`
 * table, a single "last position" pointer), while the actually-granular
 * per-chapter progress map lives in AsyncStorage under the key
 * `'readingProgress'` (written by `ReadingProgressContext`, shape
 * `{[bookNameEn]: {[chapter]: percentage}}`) and was never backed up at all.
 *
 * v2 (this tanda) fixes that bug and adds full coverage:
 *   - `bible.lastReadPosition` — the SQLite pointer v1 called `readingProgress`
 *     (renamed for clarity now that the real map exists alongside it).
 *   - `bible.chapterProgressMap` — the REAL granular AsyncStorage map (the fix).
 *   - `achievements` — stats/streaks/level/points + every ledger table backing
 *     them (SQLite, `AchievementService`). Device-local, never synced.
 *   - `user.readerPreferencesFull` — the complete `ReaderPreferences` object
 *     (fontFamily, fontSize, theme, `sepiaGrandfathered`, etc.), not just
 *     `sideBySide`.
 *   - `user.appTheme` — the app-wide light/dark mode + selected color theme.
 *   - `memory` — the memorization deck + full review-event history. These ARE
 *     synced to Firestore for a signed-in Google user, but a signed-out user
 *     (or an extra local safety net) had zero backup of them before.
 *   - `prep` — "Mesa de preparación" notes + series planner. Deliberately
 *     NEVER synced to the cloud (unfinished-sermon privacy) — export/import
 *     is the ONLY way to move this between devices.
 *
 * All v1 field names are kept where the data they described didn't change
 * meaning (favorites/notes/highlights/bookmarks/searchHistory/reading-plan
 * progress/`readerPreferences.sideBySide`). The one deliberate exception is
 * `bible.readingProgress`, split into `lastReadPosition` + `chapterProgressMap`
 * (see above) — `importBackup` still understands a v1 file's old field name.
 *
 * Exported via expo-sharing; imported via `pickBackupFileUri` (expo-document-
 * picker) + `readBackupFileFromUri` at the bottom. The on-disk JSON stays
 * human-readable.
 */

import {File, Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from '../lib/database';
import {logger} from '../lib/utils/logger';
import {getTranslations} from '../i18n/languageUtils';
import type {Note} from '../types/bible';
import type {Favorite} from '../context/FavoritesContext';
import type {Bookmark} from '../context/BookmarksContext';
import type {ReaderPreferences} from '../context/ReaderPreferencesContext';
import {
  AchievementService,
  type AchievementBackupData,
  type RawUserStatsRow,
} from '../lib/achievements/AchievementService';
import {getAchievementServiceInstance} from '../lib/achievements/instance';
import type {Achievement} from '../lib/achievements/types';
import type {BookReadingEntry} from '../lib/reading/bookReadingLog';
import {
  canonicalizeProgressMap,
  type ChapterProgressMap,
} from '../lib/progress/progressKeys';
import {
  type MemoryCard,
  type ReviewGrade,
  normalizeEase,
} from '../lib/memory/srs';
import {
  type ReviewEvent,
  isReviewEventWithinSyncWindow,
  reviewEventToRemote,
} from '../lib/memory/reviewEvents';
import {getAllReviewEvents} from '../lib/memory/reviewEventStore';
import {
  type PrepNotesMap,
  parsePrepNotesMap,
  serializePrepNotesMap,
} from '../features/study/prepNotes';
import {
  type PrepSeriesMap,
  parsePrepSeriesMap,
  serializePrepSeriesMap,
} from '../features/study/prepSeries';
import {getSyncEngine, withoutUndefined} from '../lib/sync';
import {buildNoteRemotePayload} from '../lib/sync/adapters/notes';
import {buildHighlightRemotePayload} from '../lib/sync/adapters/highlights';
import type {HighlightColor, HighlightCategory} from '../lib/highlights';

// Storage keys mirrored from the various contexts/screens so the
// service stays decoupled from the React tree.
const KEYS = {
  readingProgress: 'readingProgress',
  readingPlanProgress: '@reading_plan_progress',
  readingPlanReadChapters: '@reading_plan_read_chapters',
  bookmarks: '@bible_bookmarks',
  searchHistory: '@bible_search_history',
  sideBySide: '@reader_side_by_side',
  readerPreferences: '@reader_preferences',
  appThemeMode: '@app_theme_mode',
  appColorTheme: '@app_color_theme',
  memoryDeck: '@memory_deck',
  prepNotes: '@prep_notes',
  prepSeries: '@prep_series',
} as const;

/**
 * v1 → v2: fixes the `readingProgress` bug and adds achievements, full
 * reader preferences + app theme, memoryDeck/reviewEvents, and the whole
 * "Mesa de preparación" — see the file-level docstring for the full list.
 */
export const BACKUP_FORMAT_VERSION = 2;

/** Raw `highlights` SQLite row shape — kept snake_case (byte-identical to
 *  the table + to what v1 already exported) so import is a direct 1:1
 *  INSERT with zero remapping. */
export interface RawHighlightRow {
  id: string;
  verse_id: string;
  book_id: string;
  chapter: number;
  verse: number;
  color: string;
  category?: string | null;
  note?: string | null;
  created_at: number;
  updated_at: number;
}

export interface BackupPayload {
  formatVersion: number;
  generatedAt: string; // ISO-8601
  app: {
    name: string;
    package: string;
  };
  bible: {
    favorites: Favorite[];
    notes: Note[];
    highlights: RawHighlightRow[];
    /** SQLite `reading_progress` singleton — the single "last position"
     *  pointer. v1 called this field `readingProgress`; renamed here now
     *  that the real granular map exists alongside it as
     *  `chapterProgressMap`. `importBackup` still reads a v1 file's old
     *  `readingProgress` field under this same meaning. */
    lastReadPosition: {
      book: string;
      chapter: number;
      verse: number;
      timestamp: string;
    } | null;
    /** AsyncStorage `'readingProgress'` — the REAL per-book/per-chapter %
     *  map `ReadingProgressContext` writes. Absent from v1 (the bug). */
    chapterProgressMap: ChapterProgressMap | null;
  };
  user: {
    bookmarks: Bookmark[];
    readingPlanProgress: unknown;
    readingPlanReadChapters: unknown;
    searchHistory: unknown;
    readerPreferences: {
      sideBySide: boolean;
    };
    /** v2 — the FULL reader typography/layout preferences object, not just
     *  `sideBySide`. Preserves `sepiaGrandfathered`. */
    readerPreferencesFull: ReaderPreferences | null;
    /** v2 — app-wide light/dark mode + selected color theme (`useTheme`). */
    appTheme: {mode: string | null; colorTheme: string | null};
  };
  /** v2 — device-local achievement/stat/streak snapshot. Never synced. */
  achievements: {
    stats: RawUserStatsRow;
    achievements: Achievement[];
    streakLog: Array<{date: string; versesRead: number; timeSpent: number}>;
    completedBooks: Array<{bookName: string; completedAt: number}>;
    bookReadingLog: BookReadingEntry[];
    chaptersReadLog: Array<{
      bookName: string;
      chapter: number;
      firstReadAt: number;
    }>;
  };
  /** v2 — local copies of the two Firestore-synced datasets that have no
   *  backup today for a signed-out user (or extra safety net for a
   *  signed-in one): the memorization deck and its review history. */
  memory: {
    memoryDeck: Record<string, MemoryCard> | null;
    reviewEvents: ReviewEvent[];
  };
  /** v2 — "Mesa de preparación", deliberately never synced to the cloud
   *  (unfinished-sermon privacy) — export/import is the only way to move
   *  this between devices. */
  prep: {
    notes: PrepNotesMap | null;
    series: PrepSeriesMap | null;
  };
}

/**
 * What `buildBackup`/`exportBackup` actually managed to read. `safeQuery`/
 * `readJSON`/`readRaw` fall back to an empty/default value for ANY section
 * whose underlying read throws, so the export never aborts outright — but
 * that means a transient SQLite/AsyncStorage error can silently produce a
 * backup file that LOOKS complete (valid JSON, every field present) while
 * actually missing real data, normally only discovered much later when the
 * user tries to restore from it. `degradedSections` closes that visibility
 * gap: it lists every section whose read actually threw (never a section
 * that's just legitimately empty — see the doc on `readJSON`). */
export interface BuildBackupResult {
  payload: BackupPayload;
  degradedSections: string[];
}

/** What `exportBackup` actually wrote — human/log/test friendly. */
export interface ExportResult {
  /** Absolute `file://` URI of the written backup JSON. */
  uri: string;
  /** See `BuildBackupResult.degradedSections` — forwarded unchanged. Empty
   *  when every section read cleanly. */
  degradedSections: string[];
}

/** What `importBackup` actually wrote — human/log/test friendly. */
export interface ImportResult {
  formatVersion: number;
  /** Sections that were ACTUALLY restored. For SQLite-backed sections this
   *  means the shared transaction that wrote them committed; for
   *  AsyncStorage-backed sections it means the `multiSet` call that wrote
   *  them actually succeeded (see `asyncStorageWriteFailed`). */
  restoredSections: string[];
  /** Sections present in the backup with real (non-empty) source data where
   *  NOTHING ended up restored. Two distinct causes land here:
   *   1. Every row/entry in the section failed per-row validation (a
   *      structurally-valid-but-garbled backup) — the destructive
   *      DELETE-then-insert for that section was skipped entirely and the
   *      device's existing local data was deliberately left untouched,
   *      rather than being silently wiped and replaced with zero rows.
   *   2. (`asyncStorageWriteFailed` case) The section's data validated and
   *      serialized fine, but the single real `AsyncStorage.multiSet` call
   *      failed outright after the SQLite portion had already committed.
   *  A section legitimately absent from the file, or present as a genuinely
   *  empty array/map (a real "I have zero of these" backup), is NOT listed
   *  here — that is ordinary REPLACE-with-empty behavior, not a failure. */
  failedSections: string[];
  /** True only for the one scenario where SQLite already committed but the
   *  AsyncStorage write step then failed (e.g. device storage full, a
   *  serialization edge case the pre-flight build didn't catch). When true,
   *  `restoredSections` reflects ONLY what actually persisted (the SQLite
   *  sections); the AsyncStorage-backed sections that were supposed to be
   *  written are listed in `failedSections` instead. This is the one case
   *  where `importBackup` resolves instead of rejecting on a write failure,
   *  specifically so a caller can tell the user "part of your data was
   *  restored" instead of a flat, inaccurate "import failed" — by this
   *  point failing the promise would hide that SQLite data is already
   *  overwritten. See the atomicity note on `importBackup` itself. */
  asyncStorageWriteFailed: boolean;
}

const EMPTY_RAW_STATS: RawUserStatsRow = {
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
};

// Prefer the app-wide `AchievementService` instance ServicesContext creates
// (mirrored via `setAchievementServiceInstance` — see
// lib/achievements/instance.ts) so `restoreBackup()`'s cache invalidation
// lands on the SAME instance the Achievements tab reads from
// (`useAchievements` → `useServices()`). Falls back to a lazily-created,
// module-local instance — same pattern as the sync adapters
// (src/lib/sync/adapters/highlights.ts's `_service`) — for callers that run
// before ServicesProvider has mounted (e.g. this file's own unit tests).
let fallbackAchievementService: AchievementService | null = null;
function resolveAchievementService(): AchievementService {
  return (
    getAchievementServiceInstance() ??
    (fallbackAchievementService ??= new AchievementService(bibleDB))
  );
}

/**
 * Reads one AsyncStorage key as JSON. `null` is returned BOTH when the key
 * legitimately isn't set (a normal, healthy state for a new user or a
 * section they've never touched) AND when the read itself throws — those
 * two cases must never be confused. The optional `label`/`degraded` pair
 * lets a caller (`buildBackup`) distinguish them: `degraded` is only ever
 * pushed to inside the `catch` block, i.e. only for an ACTUAL read failure,
 * never for a legitimately-empty key.
 */
async function readJSON<T = unknown>(
  key: string,
  label?: string,
  degraded?: string[],
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // The reader-progress key is stored as a raw number on some
      // builds; fall back to the raw string instead of choking.
      return raw as unknown as T;
    }
  } catch (error) {
    logger.warn('Backup: AsyncStorage read failed', {key});
    void error;
    if (label) degraded?.push(label);
    return null;
  }
}

/** Same `null`-is-ambiguous caveat as `readJSON` (see its doc), for the raw
 *  (non-JSON) AsyncStorage keys `buildBackup` reads directly. */
async function readRaw(
  key: string,
  label?: string,
  degraded?: string[],
): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    logger.warn('Backup: AsyncStorage read failed', {key});
    void error;
    if (label) degraded?.push(label);
    return null;
  }
}

/**
 * Runs a SQLite read with a safe fallback on failure. Same distinction as
 * `readJSON`: `degraded` is only pushed to when `fn` actually throws, never
 * just because the result happens to equal `fallback`.
 */
async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  label?: string,
  degraded?: string[],
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.warn('Backup: SQLite read failed', {
      message: (error as Error)?.message,
    });
    if (label) degraded?.push(label);
    return fallback;
  }
}

/**
 * Read every user-owned dataset and assemble the backup payload.
 * Each source falls back to an empty value on failure so a partial
 * read still produces a usable file rather than aborting the whole
 * export. `degradedSections` (see `BuildBackupResult`) is how a caller
 * finds out that fallback actually happened for a given section, instead
 * of the file silently looking complete when it isn't.
 */
export async function buildBackup(): Promise<BuildBackupResult> {
  const achievementService = resolveAchievementService();
  const degradedSections: string[] = [];
  await bibleDB.initialize();
  // Idempotent schema bootstrap (CREATE TABLE IF NOT EXISTS + INSERT OR
  // IGNORE) — safe to call even though the app already ran it at boot.
  // Non-fatal on failure: a missing achievements table just yields empty
  // reads below via `safeQuery`, same as every other source here.
  await safeQuery(() => achievementService.initialize(), undefined);

  const [favorites, notes, highlightsResult, lastReadPosition] =
    await Promise.all([
      safeQuery(
        () => bibleDB.getFavorites(),
        [] as Favorite[],
        'favorites',
        degradedSections,
      ),
      safeQuery(
        () => bibleDB.getNotes(),
        [] as Note[],
        'notes',
        degradedSections,
      ),
      safeQuery(
        async () => {
          const result = await bibleDB.executeSql(
            'SELECT * FROM highlights ORDER BY created_at DESC',
          );
          return (result?.rows?._array ?? []) as RawHighlightRow[];
        },
        [] as RawHighlightRow[],
        'highlights',
        degradedSections,
      ),
      safeQuery(
        () => bibleDB.getReadingProgress(),
        null,
        'lastReadPosition',
        degradedSections,
      ),
    ]);

  const chapterProgressMapRaw = await readJSON<ChapterProgressMap>(
    KEYS.readingProgress,
    'chapterProgressMap',
    degradedSections,
  );
  const chapterProgressMap = chapterProgressMapRaw
    ? canonicalizeProgressMap(chapterProgressMapRaw)
    : null;

  const [
    bookmarks,
    planProgress,
    planReadChapters,
    searchHistory,
    sideBySide,
    readerPreferencesFull,
    appThemeMode,
    appColorTheme,
    memoryDeck,
    prepNotesRaw,
    prepSeriesRaw,
  ] = await Promise.all([
    readJSON<Bookmark[]>(KEYS.bookmarks, 'bookmarks', degradedSections),
    readJSON(KEYS.readingPlanProgress, 'readingPlanProgress', degradedSections),
    readJSON(
      KEYS.readingPlanReadChapters,
      'readingPlanReadChapters',
      degradedSections,
    ),
    readJSON(KEYS.searchHistory, 'searchHistory', degradedSections),
    readRaw(KEYS.sideBySide, 'readerPreferences', degradedSections),
    readJSON<ReaderPreferences>(
      KEYS.readerPreferences,
      'readerPreferencesFull',
      degradedSections,
    ),
    readRaw(KEYS.appThemeMode, 'appTheme', degradedSections),
    readRaw(KEYS.appColorTheme, 'appTheme', degradedSections),
    readJSON<Record<string, MemoryCard>>(
      KEYS.memoryDeck,
      'memoryDeck',
      degradedSections,
    ),
    readRaw(KEYS.prepNotes, 'prepNotes', degradedSections),
    readRaw(KEYS.prepSeries, 'prepSeries', degradedSections),
  ]);

  const [
    rawStats,
    achievementsAll,
    streakLog,
    completedBooks,
    bookReadingLog,
    chaptersReadLog,
    reviewEvents,
  ] = await Promise.all([
    safeQuery(
      () => achievementService.getRawUserStats(),
      EMPTY_RAW_STATS,
      'achievements.stats',
      degradedSections,
    ),
    safeQuery(
      () => achievementService.getAllAchievements(),
      [] as Achievement[],
      'achievements.list',
      degradedSections,
    ),
    safeQuery(
      () => achievementService.getReadingLog(),
      [],
      'achievements.streakLog',
      degradedSections,
    ),
    safeQuery(
      () => achievementService.getCompletedBooks(),
      [],
      'achievements.completedBooks',
      degradedSections,
    ),
    safeQuery(
      () => achievementService.getBookReadingLog(),
      [],
      'achievements.bookReadingLog',
      degradedSections,
    ),
    safeQuery(
      () => achievementService.getChaptersReadLog(),
      [],
      'achievements.chaptersReadLog',
      degradedSections,
    ),
    safeQuery(
      () => getAllReviewEvents(),
      [] as ReviewEvent[],
      'reviewEvents',
      degradedSections,
    ),
  ]);

  const payload: BackupPayload = {
    formatVersion: BACKUP_FORMAT_VERSION,
    generatedAt: new Date().toISOString(),
    app: {
      name: 'Eternal Stone Bible',
      package: 'com.eternalstonebible.app',
    },
    bible: {
      favorites: favorites ?? [],
      notes: notes ?? [],
      highlights: highlightsResult ?? [],
      lastReadPosition,
      chapterProgressMap,
    },
    user: {
      bookmarks: bookmarks ?? [],
      readingPlanProgress: planProgress ?? {},
      readingPlanReadChapters: planReadChapters ?? {},
      searchHistory: searchHistory ?? [],
      readerPreferences: {
        sideBySide: sideBySide === '1',
      },
      readerPreferencesFull: readerPreferencesFull ?? null,
      appTheme: {
        mode: appThemeMode ?? null,
        colorTheme: appColorTheme ?? null,
      },
    },
    achievements: {
      stats: rawStats,
      achievements: achievementsAll,
      streakLog,
      completedBooks,
      bookReadingLog,
      chaptersReadLog,
    },
    memory: {
      memoryDeck: memoryDeck ?? null,
      reviewEvents,
    },
    prep: {
      notes: prepNotesRaw ? parsePrepNotesMap(prepNotesRaw) : null,
      series: prepSeriesRaw ? parsePrepSeriesMap(prepSeriesRaw) : null,
    },
  };

  // A handful of sections (appTheme, readerPreferences) are read from more
  // than one AsyncStorage key and would otherwise appear twice.
  return {payload, degradedSections: Array.from(new Set(degradedSections))};
}

/**
 * Build the backup, dump it to a JSON file in the cache directory, and
 * hand it to expo-sharing. Returns the absolute URI of the written file
 * (plus `degradedSections`, see `ExportResult`) so the caller can show it
 * in a toast or log it. Throws if the device can't share — Settings can
 * then surface an error message. Does NOT throw just because some
 * sections degraded — the file is still written and shareable; a caller
 * that cares can inspect `degradedSections` instead.
 */
export async function exportBackup(): Promise<ExportResult> {
  const {payload, degradedSections} = await buildBackup();
  // Stable, sortable filename so multiple backups stack chronologically.
  const stamp = payload.generatedAt.replace(/[:.]/g, '-');
  const fileName = `eternalstone-backup-${stamp}.json`;
  const target = new File(Paths.cache, fileName);
  // Replace any previous backup with the same name — overwriting is the
  // expected behavior since the timestamp is per-second.
  if (target.exists) target.delete();
  target.create();
  target.write(JSON.stringify(payload, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  const t = await getTranslations();
  await Sharing.shareAsync(target.uri, {
    mimeType: 'application/json',
    dialogTitle: t.settings.backupDialogTitle,
    UTI: 'public.json',
  });

  return {uri: target.uri, degradedSections};
}

// ============================================================================
// IMPORT
// ============================================================================

function assertSupportedFormatVersion(formatVersion: unknown): number {
  const v = typeof formatVersion === 'number' ? formatVersion : NaN;
  if (!Number.isFinite(v) || v < 1) {
    throw new Error('Invalid backup: missing or invalid formatVersion.');
  }
  if (v > BACKUP_FORMAT_VERSION) {
    throw new Error(
      `This backup was created by a newer app version (format v${v}). ` +
        'Update the app before importing it.',
    );
  }
  return v;
}

/**
 * Parse + validate a raw backup file's text content. Throws a clear,
 * user-presentable error for: invalid JSON, no readable content, a
 * missing/invalid formatVersion, or a formatVersion from a NEWER app
 * version than this one understands. An older v1 file passes through —
 * `importBackup` fills in the gaps for fields v1 never had.
 */
export function parseBackupPayload(raw: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid backup: the file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup: the file has no readable content.');
  }
  assertSupportedFormatVersion(
    (parsed as Record<string, unknown>).formatVersion,
  );
  return parsed as BackupPayload;
}

function getLegacyField(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  return (obj as Record<string, unknown>)[key];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function clampBox(n: unknown): 1 | 2 | 3 | 4 | 5 {
  const v = typeof n === 'number' ? n : 1;
  if (v <= 1) return 1;
  if (v >= 5) return 5;
  return v as 1 | 2 | 3 | 4 | 5;
}

// ---- defensive per-row coercion — never trust the file blindly ----

function coerceFavorite(raw: unknown): Favorite | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.book !== 'string') return null;
  if (typeof raw.chapter !== 'number' || typeof raw.verse !== 'number') {
    return null;
  }
  const rating = Math.min(5, Math.max(1, Math.round(num(raw.rating, 5))));
  return {
    id: raw.id,
    verseId:
      typeof raw.verseId === 'string'
        ? raw.verseId
        : `${raw.book}_${raw.chapter}_${raw.verse}`,
    book: raw.book,
    chapter: raw.chapter,
    verse: raw.verse,
    text: typeof raw.text === 'string' ? raw.text : '',
    category: (typeof raw.category === 'string'
      ? raw.category
      : 'other') as Favorite['category'],
    rating: rating as Favorite['rating'],
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === 'string')
      : [],
    note: typeof raw.note === 'string' ? raw.note : undefined,
    createdAt: num(raw.createdAt, Date.now()),
    updatedAt: num(raw.updatedAt, Date.now()),
  };
}

function coerceNote(raw: unknown): Note | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.book !== 'string') return null;
  if (typeof raw.chapter !== 'number' || typeof raw.verse !== 'number') {
    return null;
  }
  const nowIso = new Date().toISOString();
  return {
    id: raw.id,
    book: raw.book,
    chapter: raw.chapter,
    verse: raw.verse,
    text: typeof raw.text === 'string' ? raw.text : '',
    note: typeof raw.note === 'string' ? raw.note : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso,
  };
}

function coerceHighlightRow(raw: unknown): RawHighlightRow | null {
  if (!isPlainObject(raw)) return null;
  if (
    typeof raw.id !== 'string' ||
    typeof raw.verse_id !== 'string' ||
    typeof raw.book_id !== 'string' ||
    typeof raw.chapter !== 'number' ||
    typeof raw.verse !== 'number' ||
    typeof raw.color !== 'string'
  ) {
    return null;
  }
  return {
    id: raw.id,
    verse_id: raw.verse_id,
    book_id: raw.book_id,
    chapter: raw.chapter,
    verse: raw.verse,
    color: raw.color,
    category: typeof raw.category === 'string' ? raw.category : null,
    note: typeof raw.note === 'string' ? raw.note : null,
    created_at: num(raw.created_at, Date.now()),
    updated_at: num(raw.updated_at, Date.now()),
  };
}

function coerceBookmark(raw: unknown): Bookmark | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.book !== 'string') return null;
  if (typeof raw.chapter !== 'number' || typeof raw.verse !== 'number') {
    return null;
  }
  const now = Date.now();
  return {
    id: raw.id,
    book: raw.book,
    chapter: raw.chapter,
    verse: raw.verse,
    text: typeof raw.text === 'string' ? raw.text : '',
    label: typeof raw.label === 'string' ? raw.label : undefined,
    createdAt: num(raw.createdAt, now),
    updatedAt: num(raw.updatedAt, now),
  };
}

function coerceLastReadPosition(
  raw: unknown,
): {book: string; chapter: number; verse: number; timestamp: string} | null {
  if (!isPlainObject(raw)) return null;
  if (
    typeof raw.book !== 'string' ||
    typeof raw.chapter !== 'number' ||
    typeof raw.verse !== 'number'
  ) {
    return null;
  }
  return {
    book: raw.book,
    chapter: raw.chapter,
    verse: raw.verse,
    timestamp:
      typeof raw.timestamp === 'string'
        ? raw.timestamp
        : new Date().toISOString(),
  };
}

function coerceMemoryCard(raw: unknown): MemoryCard | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.verseKey !== 'string' || typeof raw.box !== 'number') {
    return null;
  }
  const nowIso = new Date().toISOString();
  return {
    verseKey: raw.verseKey,
    bookName: typeof raw.bookName === 'string' ? raw.bookName : '',
    chapter: num(raw.chapter, 0),
    verse: num(raw.verse, 0),
    text: typeof raw.text === 'string' ? raw.text : '',
    version: typeof raw.version === 'string' ? raw.version : 'RVR1960',
    box: clampBox(raw.box),
    dueAt: typeof raw.dueAt === 'string' ? raw.dueAt : nowIso,
    addedAt: typeof raw.addedAt === 'string' ? raw.addedAt : nowIso,
    lastReviewedAt:
      typeof raw.lastReviewedAt === 'string' ? raw.lastReviewedAt : null,
    reviewCount: num(raw.reviewCount, 0),
    lapseCount: num(raw.lapseCount, 0),
    ease: normalizeEase(typeof raw.ease === 'number' ? raw.ease : undefined),
    updatedAt: num(raw.updatedAt, Date.now()),
  };
}

function coerceMemoryDeck(raw: unknown): Record<string, MemoryCard> {
  const out: Record<string, MemoryCard> = {};
  if (!isPlainObject(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    const card = coerceMemoryCard(value);
    if (card) out[key] = card;
  }
  return out;
}

const REVIEW_GRADES: ReviewGrade[] = ['again', 'hard', 'good', 'easy'];

function coerceReviewEvent(raw: unknown): ReviewEvent | null {
  if (!isPlainObject(raw)) return null;
  if (
    typeof raw.id !== 'string' ||
    typeof raw.verseKey !== 'string' ||
    typeof raw.reviewedAt !== 'number'
  ) {
    return null;
  }
  const grade = REVIEW_GRADES.includes(raw.grade as ReviewGrade)
    ? (raw.grade as ReviewGrade)
    : 'good';
  return {
    id: raw.id,
    verseKey: raw.verseKey,
    bookName: typeof raw.bookName === 'string' ? raw.bookName : '',
    grade,
    boxBefore: clampBox(raw.boxBefore),
    boxAfter: clampBox(raw.boxAfter),
    intervalDays:
      typeof raw.intervalDays === 'number' ? raw.intervalDays : null,
    reviewedAt: raw.reviewedAt,
  };
}

function coerceRawStats(raw: unknown): RawUserStatsRow | null {
  if (!isPlainObject(raw)) return null;
  return {
    totalVersesRead: num(raw.totalVersesRead),
    totalChaptersRead: num(raw.totalChaptersRead),
    totalBooksCompleted: num(raw.totalBooksCompleted),
    totalReadingTime: num(raw.totalReadingTime),
    currentStreak: num(raw.currentStreak),
    longestStreak: num(raw.longestStreak),
    lastReadDate:
      typeof raw.lastReadDate === 'string' ? raw.lastReadDate : null,
    totalHighlights: num(raw.totalHighlights),
    totalNotes: num(raw.totalNotes),
    totalBookmarks: num(raw.totalBookmarks),
    totalSearches: num(raw.totalSearches),
    totalShares: num(raw.totalShares),
    level: num(raw.level, 1),
    totalPoints: num(raw.totalPoints),
  };
}

function coerceAchievementRow(raw: unknown): {
  id: string;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt: number | null;
} | null {
  if (!isPlainObject(raw) || typeof raw.id !== 'string') return null;
  return {
    id: raw.id,
    currentProgress: num(raw.currentProgress, 0),
    isUnlocked: raw.isUnlocked === true,
    unlockedAt: typeof raw.unlockedAt === 'number' ? raw.unlockedAt : null,
  };
}

function coerceStreakEntry(
  raw: unknown,
): {date: string; versesRead: number; timeSpent: number} | null {
  if (!isPlainObject(raw) || typeof raw.date !== 'string') return null;
  return {
    date: raw.date,
    versesRead: num(raw.versesRead),
    timeSpent: num(raw.timeSpent),
  };
}

function coerceCompletedBookEntry(
  raw: unknown,
): {bookName: string; completedAt: number} | null {
  if (!isPlainObject(raw) || typeof raw.bookName !== 'string') return null;
  return {
    bookName: raw.bookName,
    completedAt: num(raw.completedAt, Date.now()),
  };
}

function coerceBookReadingEntry(raw: unknown): BookReadingEntry | null {
  if (!isPlainObject(raw) || typeof raw.book !== 'string') return null;
  return {
    book: raw.book,
    versesRead: num(raw.versesRead),
    timeSpent: num(raw.timeSpent),
    lastReadAt: num(raw.lastReadAt),
  };
}

function coerceChapterReadEntry(
  raw: unknown,
): {bookName: string; chapter: number; firstReadAt: number} | null {
  if (!isPlainObject(raw) || typeof raw.bookName !== 'string') return null;
  if (typeof raw.chapter !== 'number') return null;
  return {
    bookName: raw.bookName,
    chapter: raw.chapter,
    firstReadAt: num(raw.firstReadAt),
  };
}

function coerceArray<T>(raw: unknown, coerce: (v: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  for (const item of raw) {
    const c = coerce(item);
    if (c != null) out.push(c);
  }
  return out;
}

/** How many raw entries a section's source data actually had, for arrays. */
function sourceArrayLength(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

/** How many raw entries a section's source data actually had, for the one
 *  object-map-shaped section (`memoryDeck`, keyed by `verseKey`). */
function sourceObjectLength(raw: unknown): number {
  return isPlainObject(raw) ? Object.keys(raw).length : 0;
}

/**
 * Distinguishes "corrupted-but-structurally-valid backup where every row
 * failed per-row coercion" from "the backup legitimately has zero entries
 * for this section" (restore=replace's normal empty case). Only the former
 * should block the destructive DELETE-then-insert/overwrite and be reported
 * as failed rather than silently restored-as-empty.
 */
function allRowsFailedValidation(
  sourceLen: number,
  survivedLen: number,
): boolean {
  return sourceLen > 0 && survivedLen === 0;
}

/**
 * Hand off the 6 Firestore-synced collections' just-restored entities to the
 * EXISTING sync engine via its own public `queueWrite` — the same call every
 * Context already makes on a normal add/edit (see e.g. `FavoritesContext.
 * addFavorite`). This is deliberately NOT a new sync mechanism: `queueWrite`
 * already no-ops when nobody is signed in (`SyncEngine.queueWrite` returns
 * immediately if `this.uid` is unset), so this is safe to call unconditionally.
 *
 * Why not rely SOLELY on the engine's one-time "initial bulk push" (which
 * reads local storage via `pullAllLocal` on first sign-in)? That mechanism
 * is gated by a PER-DEVICE, per-uid flag that only fires once — a device
 * that already completed its bulk push before this import would otherwise
 * never re-upload the newly-restored rows until the user happened to edit
 * each one by hand. Calling `queueWrite` per entity here covers BOTH cases
 * (fresh device/first sign-in — where the bulk push would have caught it
 * anyway — and an already-synced device doing a same-account restore) with
 * the engine's own existing per-item API, not a reimplementation of it.
 */
function pushImportedEntitiesToSync(data: {
  favorites: Favorite[];
  notes: Note[];
  highlights: RawHighlightRow[];
  bookmarks: Bookmark[];
  memoryDeck: MemoryCard[];
  reviewEvents: ReviewEvent[];
}): void {
  const engine = getSyncEngine();
  if (!engine) return;

  for (const f of data.favorites) {
    engine.queueWrite(
      'favorites',
      f.id,
      withoutUndefined({
        id: f.id,
        verseId: f.verseId,
        book: f.book,
        chapter: f.chapter,
        verse: f.verse,
        text: f.text,
        category: f.category,
        rating: f.rating,
        tags: f.tags,
        note: f.note,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }),
    );
  }

  for (const n of data.notes) {
    engine.queueWrite('notes', n.id, buildNoteRemotePayload(n));
  }

  for (const h of data.highlights) {
    engine.queueWrite(
      'highlights',
      h.verse_id,
      buildHighlightRemotePayload({
        id: h.id,
        verseId: h.verse_id,
        bookId: h.book_id,
        chapter: h.chapter,
        verse: h.verse,
        color: h.color as HighlightColor,
        category: (h.category ?? undefined) as HighlightCategory | undefined,
        note: h.note ?? undefined,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
      }),
    );
  }

  for (const b of data.bookmarks) {
    engine.queueWrite('bookmarks', b.id, withoutUndefined({...b}));
  }

  for (const c of data.memoryDeck) {
    engine.queueWrite('memoryCards', c.verseKey, withoutUndefined({...c}));
  }

  for (const e of data.reviewEvents) {
    // Same 12-month cloud-sync window every other write path honors
    // (MemoryDeckContext.reviewCard) — an older imported event still gets
    // its full history kept in local SQLite, it just isn't re-pushed to
    // Firestore (which prunes past that window anyway).
    if (isReviewEventWithinSyncWindow(e.reviewedAt)) {
      engine.queueWrite('reviewEvents', e.id, reviewEventToRemote(e));
    }
  }
}

/**
 * Restore = REPLACE. Every section present in `payload` overwrites whatever
 * this device currently has for that section; a section ABSENT from the file
 * (only possible for a v1 file missing a v2-only field) is left untouched —
 * importing an old backup must never wipe data it never knew about. A
 * section that's PRESENT with real data but where every row/entry fails
 * per-row validation is treated the same as absent (see `failedSections` on
 * `ImportResult`) — a garbled-but-parseable backup must never silently wipe
 * real local data down to zero rows either.
 *
 * Atomicity — what's actually guaranteed vs. what is NOT:
 *   - Every SQLite write (favorites/notes/highlights/reviewEvents/
 *     lastReadPosition/achievements) happens inside ONE transaction
 *     (`db.withTransactionAsync`), so a failure partway through THAT
 *     transaction rolls back to the pre-import state for those sections —
 *     never a half-restored SQLite DB.
 *   - ALL data for BOTH engines — including the exact AsyncStorage
 *     key/value pairs — is validated, coerced, and serialized BEFORE the
 *     SQLite transaction even opens. This means a `JSON.stringify`/shape
 *     problem is caught up front (nothing written anywhere), and by the
 *     time the SQLite transaction is about to commit, the AsyncStorage
 *     payload is already known-buildable.
 *   - SQLite and AsyncStorage can NEVER share one real transaction — they're
 *     different storage engines with no shared commit protocol — so this is
 *     NOT true cross-engine atomicity, and the docstring previously
 *     overclaimed it. There is a real (small) window between "the SQLite
 *     transaction commits" and "the `AsyncStorage.multiSet` call returns"
 *     where the device can be left with SQLite sections restored but
 *     AsyncStorage sections not, e.g. if `multiSet` itself throws (storage
 *     full, a native-module error). That call is wrapped in try/catch: on
 *     failure, `importBackup` does NOT reject — it RESOLVES with
 *     `asyncStorageWriteFailed: true` and `restoredSections`/
 *     `failedSections` that honestly reflect the split outcome, so a caller
 *     can tell the user "part of your data was restored" instead of a flat,
 *     inaccurate "import failed" that would hide the fact SQLite data is
 *     already overwritten. Pre-building the payload before the transaction
 *     minimizes how often this window is ever actually hit, but cannot
 *     eliminate it — a true rollback of the already-committed SQLite portion
 *     if `multiSet` fails is not attempted (it would mean re-deriving and
 *     re-writing the PREVIOUS state, which importBackup never captured, and
 *     is out of scope for this fix).
 *
 * Does NOT reload most in-memory app state — see Settings' import handler,
 * which asks the user to close and reopen the app (the same fallback this
 * project's own `performResetData` pattern documents as acceptable when a
 * safe universal hot-reload isn't reasonably achievable for every affected
 * context — and here there are over a dozen: favorites, notes, highlights,
 * bookmarks, two reading-progress stores, reader preferences, app theme,
 * memory deck, review events, prep notes, prep series).
 *
 * `achievements` is the one exception: `resolveAchievementService()` reaches
 * the SAME `AchievementService` instance the Achievements tab reads from
 * (via `useAchievements` → `useServices()`, mirrored into
 * `lib/achievements/instance.ts` by `ServicesContext`), so `restoreBackup()`'s
 * existing in-memory cache invalidation (`this.stats = null`) lands on that
 * shared instance — the tab reflects the restore on its next read (e.g. on
 * screen focus), no app restart required.
 */
export async function importBackup(
  payload: BackupPayload,
): Promise<ImportResult> {
  assertSupportedFormatVersion(payload?.formatVersion);
  const achievementService = resolveAchievementService();
  await bibleDB.initialize();
  await achievementService.initialize();

  const restoredSections: string[] = [];
  const failedSections: string[] = [];
  const bible: Record<string, unknown> = isPlainObject(payload.bible)
    ? payload.bible
    : {};
  const user: Record<string, unknown> = isPlainObject(payload.user)
    ? payload.user
    : {};

  // ---- pre-validate + coerce every present section BEFORE writing anything.
  // Each `*AllFailed` flag distinguishes "this section is legitimately empty
  // in the backup" (0 source rows — a normal REPLACE-with-empty) from "this
  // section had real data but every row failed per-row coercion" (a
  // corrupted-but-structurally-valid file) — only the latter should block
  // the destructive write and get reported via `failedSections`. ----
  const favoritesPresent = Array.isArray(bible.favorites);
  const favoritesIn = coerceArray(bible.favorites, coerceFavorite);
  const favoritesAllFailed = allRowsFailedValidation(
    sourceArrayLength(bible.favorites),
    favoritesIn.length,
  );

  const notesPresent = Array.isArray(bible.notes);
  const notesIn = coerceArray(bible.notes, coerceNote);
  const notesAllFailed = allRowsFailedValidation(
    sourceArrayLength(bible.notes),
    notesIn.length,
  );

  const highlightsPresent = Array.isArray(bible.highlights);
  const highlightsIn = coerceArray(bible.highlights, coerceHighlightRow);
  const highlightsAllFailed = allRowsFailedValidation(
    sourceArrayLength(bible.highlights),
    highlightsIn.length,
  );

  // v1 compat: the SQLite pointer was called `readingProgress` back then.
  const legacyPointer = getLegacyField(bible, 'readingProgress');
  const lastReadPositionIn = coerceLastReadPosition(
    bible.lastReadPosition ?? legacyPointer,
  );

  const chapterProgressMapPresent = bible.chapterProgressMap !== undefined;
  const chapterProgressMapIn = chapterProgressMapPresent
    ? canonicalizeProgressMap(
        bible.chapterProgressMap as ChapterProgressMap | null,
      )
    : null;

  const bookmarksPresent = Array.isArray(user.bookmarks);
  const bookmarksIn = coerceArray(user.bookmarks, coerceBookmark);
  const bookmarksAllFailed = allRowsFailedValidation(
    sourceArrayLength(user.bookmarks),
    bookmarksIn.length,
  );

  const readingPlanProgressPresent = user.readingPlanProgress !== undefined;
  const readingPlanReadChaptersPresent =
    user.readingPlanReadChapters !== undefined;
  const searchHistoryPresent = user.searchHistory !== undefined;

  const sideBySideIn =
    isPlainObject(user.readerPreferences) &&
    typeof user.readerPreferences.sideBySide === 'boolean'
      ? user.readerPreferences.sideBySide
      : null;

  const readerPreferencesFullPresent = isPlainObject(
    user.readerPreferencesFull,
  );

  const appThemeModeIn =
    isPlainObject(user.appTheme) && typeof user.appTheme.mode === 'string'
      ? user.appTheme.mode
      : null;
  const appColorThemeIn =
    isPlainObject(user.appTheme) && typeof user.appTheme.colorTheme === 'string'
      ? user.appTheme.colorTheme
      : null;

  const achievementsSection = isPlainObject(payload.achievements)
    ? payload.achievements
    : null;
  const rawStatsIn = achievementsSection
    ? coerceRawStats(achievementsSection.stats)
    : null;

  const memorySection: Record<string, unknown> = isPlainObject(payload.memory)
    ? payload.memory
    : {};
  const memoryDeckPresent = memorySection.memoryDeck !== undefined;
  const memoryDeckIn = coerceMemoryDeck(memorySection.memoryDeck);
  const memoryDeckAllFailed = allRowsFailedValidation(
    sourceObjectLength(memorySection.memoryDeck),
    Object.keys(memoryDeckIn).length,
  );

  const reviewEventsPresent = Array.isArray(memorySection.reviewEvents);
  const reviewEventsIn = coerceArray(
    memorySection.reviewEvents,
    coerceReviewEvent,
  );
  const reviewEventsAllFailed = allRowsFailedValidation(
    sourceArrayLength(memorySection.reviewEvents),
    reviewEventsIn.length,
  );

  const prepSection: Record<string, unknown> = isPlainObject(payload.prep)
    ? payload.prep
    : {};
  const prepNotesPresent = prepSection.notes !== undefined;
  const prepNotesIn = prepNotesPresent
    ? parsePrepNotesMap(JSON.stringify(prepSection.notes ?? {}))
    : null;
  const prepSeriesPresent = prepSection.series !== undefined;
  const prepSeriesIn = prepSeriesPresent
    ? parsePrepSeriesMap(JSON.stringify(prepSection.series ?? {}))
    : null;

  // ---- AsyncStorage portion: fully built (validated + serialized into the
  // exact key/value pairs) BEFORE the SQLite transaction even opens. This is
  // the Bug-1 mitigation: proving every AsyncStorage value serializes
  // cleanly up front means a `JSON.stringify` problem is caught before
  // ANYTHING has been written, instead of after SQLite has already
  // committed. `pendingAsyncStorageSections` mirrors `pairs` 1:1 — section
  // names only move into `restoredSections`/`failedSections` AFTER the real
  // `multiSet` call below is known to have succeeded or failed. ----
  const pairs: [string, string][] = [];
  const pendingAsyncStorageSections: string[] = [];
  if (bookmarksPresent) {
    if (bookmarksAllFailed) {
      failedSections.push('bookmarks');
    } else {
      pairs.push([KEYS.bookmarks, JSON.stringify(bookmarksIn)]);
      pendingAsyncStorageSections.push('bookmarks');
    }
  }
  if (readingPlanProgressPresent) {
    pairs.push([
      KEYS.readingPlanProgress,
      JSON.stringify(user.readingPlanProgress),
    ]);
    pendingAsyncStorageSections.push('readingPlanProgress');
  }
  if (readingPlanReadChaptersPresent) {
    pairs.push([
      KEYS.readingPlanReadChapters,
      JSON.stringify(user.readingPlanReadChapters),
    ]);
    pendingAsyncStorageSections.push('readingPlanReadChapters');
  }
  if (searchHistoryPresent) {
    pairs.push([KEYS.searchHistory, JSON.stringify(user.searchHistory)]);
    pendingAsyncStorageSections.push('searchHistory');
  }
  if (sideBySideIn !== null) {
    pairs.push([KEYS.sideBySide, sideBySideIn ? '1' : '0']);
  }
  if (readerPreferencesFullPresent) {
    pairs.push([
      KEYS.readerPreferences,
      JSON.stringify(user.readerPreferencesFull),
    ]);
    pendingAsyncStorageSections.push('readerPreferences');
  }
  if (appThemeModeIn) {
    pairs.push([KEYS.appThemeMode, appThemeModeIn]);
    pendingAsyncStorageSections.push('appThemeMode');
  }
  if (appColorThemeIn) {
    pairs.push([KEYS.appColorTheme, appColorThemeIn]);
    pendingAsyncStorageSections.push('appColorTheme');
  }
  if (chapterProgressMapPresent) {
    pairs.push([KEYS.readingProgress, JSON.stringify(chapterProgressMapIn)]);
    pendingAsyncStorageSections.push('chapterProgressMap');
  }
  if (memoryDeckPresent) {
    if (memoryDeckAllFailed) {
      failedSections.push('memoryDeck');
    } else {
      pairs.push([KEYS.memoryDeck, JSON.stringify(memoryDeckIn)]);
      pendingAsyncStorageSections.push('memoryDeck');
    }
  }
  if (prepNotesPresent && prepNotesIn) {
    pairs.push([KEYS.prepNotes, serializePrepNotesMap(prepNotesIn)]);
    pendingAsyncStorageSections.push('prepNotes');
  }
  if (prepSeriesPresent && prepSeriesIn) {
    pairs.push([KEYS.prepSeries, serializePrepSeriesMap(prepSeriesIn)]);
    pendingAsyncStorageSections.push('prepSeries');
  }

  // ---- SQLite portion: ONE transaction, all-or-nothing ----
  const db = await bibleDB.getDatabase();
  await db.withTransactionAsync(async () => {
    if (favoritesPresent) {
      if (favoritesAllFailed) {
        failedSections.push('favorites');
      } else {
        await bibleDB.executeSql('DELETE FROM favorites');
        for (const f of favoritesIn) {
          await bibleDB.executeSql(
            `INSERT INTO favorites (id, verse_id, book_name, chapter, verse, text, category, rating, tags, note, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              f.id,
              f.verseId,
              f.book,
              f.chapter,
              f.verse,
              f.text,
              f.category,
              f.rating,
              JSON.stringify(f.tags),
              f.note ?? null,
              f.createdAt,
              f.updatedAt,
            ],
          );
        }
        restoredSections.push('favorites');
      }
    }

    if (notesPresent) {
      if (notesAllFailed) {
        failedSections.push('notes');
      } else {
        await bibleDB.executeSql('DELETE FROM notes');
        for (const n of notesIn) {
          await bibleDB.executeSql(
            `INSERT INTO notes (id, book_name, chapter, verse, verse_text, note, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              n.id,
              n.book,
              n.chapter,
              n.verse,
              n.text,
              n.note,
              n.createdAt,
              n.updatedAt,
            ],
          );
        }
        restoredSections.push('notes');
      }
    }

    if (highlightsPresent) {
      if (highlightsAllFailed) {
        failedSections.push('highlights');
      } else {
        await bibleDB.executeSql('DELETE FROM highlights');
        for (const h of highlightsIn) {
          await bibleDB.executeSql(
            `INSERT INTO highlights (id, verse_id, book_id, chapter, verse, color, category, note, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              h.id,
              h.verse_id,
              h.book_id,
              h.chapter,
              h.verse,
              h.color,
              h.category ?? null,
              h.note ?? null,
              h.created_at,
              h.updated_at,
            ],
          );
        }
        restoredSections.push('highlights');
      }
    }

    if (lastReadPositionIn) {
      await bibleDB.executeSql(
        'UPDATE reading_progress SET book_name = ?, chapter = ?, verse = ?, timestamp = ? WHERE id = 1',
        [
          lastReadPositionIn.book,
          lastReadPositionIn.chapter,
          lastReadPositionIn.verse,
          lastReadPositionIn.timestamp,
        ],
      );
      restoredSections.push('lastReadPosition');
    }

    if (reviewEventsPresent) {
      if (reviewEventsAllFailed) {
        failedSections.push('reviewEvents');
      } else {
        await bibleDB.executeSql('DELETE FROM review_events');
        for (const e of reviewEventsIn) {
          await bibleDB.executeSql(
            `INSERT OR REPLACE INTO review_events (id, verse_key, book_name, grade, box_before, box_after, interval_days, reviewed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              e.id,
              e.verseKey,
              e.bookName,
              e.grade,
              e.boxBefore,
              e.boxAfter,
              e.intervalDays,
              e.reviewedAt,
            ],
          );
        }
        restoredSections.push('reviewEvents');
      }
    }

    if (achievementsSection && rawStatsIn) {
      const streakLogIn = coerceArray(
        achievementsSection.streakLog,
        coerceStreakEntry,
      );
      const completedBooksIn = coerceArray(
        achievementsSection.completedBooks,
        coerceCompletedBookEntry,
      );
      const bookReadingLogIn = coerceArray(
        achievementsSection.bookReadingLog,
        coerceBookReadingEntry,
      );
      const chaptersReadLogIn = coerceArray(
        achievementsSection.chaptersReadLog,
        coerceChapterReadEntry,
      );
      // Same "every row failed validation" check as the outer sections
      // (favorites/notes/highlights/bookmarks/memoryDeck) above — computed
      // here because `AchievementService.restoreBackup` only ever receives
      // the already-coerced arrays and has no way to tell "the backup
      // legitimately has zero entries" apart from "every entry was garbage"
      // on its own. See `AchievementBackupData.allFailed`.
      const data: AchievementBackupData = {
        stats: rawStatsIn,
        achievements: coerceArray(
          achievementsSection.achievements,
          coerceAchievementRow,
        ),
        streakLog: streakLogIn,
        completedBooks: completedBooksIn,
        bookReadingLog: bookReadingLogIn,
        chaptersReadLog: chaptersReadLogIn,
        allFailed: {
          streakLog: allRowsFailedValidation(
            sourceArrayLength(achievementsSection.streakLog),
            streakLogIn.length,
          ),
          completedBooks: allRowsFailedValidation(
            sourceArrayLength(achievementsSection.completedBooks),
            completedBooksIn.length,
          ),
          bookReadingLog: allRowsFailedValidation(
            sourceArrayLength(achievementsSection.bookReadingLog),
            bookReadingLogIn.length,
          ),
          chaptersReadLog: allRowsFailedValidation(
            sourceArrayLength(achievementsSection.chaptersReadLog),
            chaptersReadLogIn.length,
          ),
        },
      };
      await achievementService.restoreBackup(data);
      restoredSections.push('achievements');
    }
  });

  // ---- AsyncStorage portion: one multiSet call. Wrapped in try/catch so a
  // real write failure here (device storage full, a native-module error) —
  // which can only happen AFTER the SQLite transaction above has already
  // committed — is distinguished from every earlier, pre-write validation
  // failure. On failure this function RESOLVES with
  // `asyncStorageWriteFailed: true` instead of rejecting, specifically so
  // the caller can tell the user their data was PARTIALLY restored instead
  // of a flat, inaccurate "import failed" (see the docstring above
  // `importBackup`). ----
  let asyncStorageWriteFailed = false;
  if (pairs.length > 0) {
    try {
      await AsyncStorage.multiSet(pairs);
      restoredSections.push(...pendingAsyncStorageSections);
    } catch (error) {
      asyncStorageWriteFailed = true;
      failedSections.push(...pendingAsyncStorageSections);
      logger.error(
        'Backup: AsyncStorage write failed AFTER the SQLite portion of the ' +
          'restore already committed — device is left with the imported ' +
          'SQLite sections but the pre-import AsyncStorage sections.',
        error as Error,
        {component: 'BackupService', action: 'importBackup'},
      );
    }
  }

  // ---- Hand off the Firestore-synced collections to the normal sync path.
  // favorites/notes/highlights/reviewEvents are SQLite-backed and already
  // committed above regardless of the AsyncStorage outcome, so pushing them
  // is always safe. bookmarks/memoryDeck are AsyncStorage-backed: pushing
  // them to the cloud when the LOCAL write just failed would leave this
  // device's cloud data ahead of what actually landed locally, so they're
  // skipped in that one failure case. ----
  pushImportedEntitiesToSync({
    favorites: favoritesIn,
    notes: notesIn,
    highlights: highlightsIn,
    bookmarks: asyncStorageWriteFailed ? [] : bookmarksIn,
    memoryDeck: asyncStorageWriteFailed ? [] : Object.values(memoryDeckIn),
    reviewEvents: reviewEventsIn,
  });

  return {
    formatVersion: payload.formatVersion,
    restoredSections,
    failedSections,
    asyncStorageWriteFailed,
  };
}

/**
 * Read a backup file's full text content from an already-known URI. Uses
 * `expo-file-system`'s `File` class (already a dependency, already used
 * above for export), which accepts an arbitrary URI and can read it back as
 * text with no picker involved.
 */
export async function readBackupFileFromUri(uri: string): Promise<string> {
  return new File(uri).text();
}

/**
 * Prompt the user to choose a backup `.json` file and return its URI (or
 * `null` if they cancelled).
 */
export async function pickBackupFileUri(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}
