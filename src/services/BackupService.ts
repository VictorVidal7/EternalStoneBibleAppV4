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

/** What `importBackup` actually wrote — human/log/test friendly. */
export interface ImportResult {
  formatVersion: number;
  restoredSections: string[];
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

async function readJSON<T = unknown>(key: string): Promise<T | null> {
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
    return null;
  }
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.warn('Backup: SQLite read failed', {
      message: (error as Error)?.message,
    });
    return fallback;
  }
}

/**
 * Read every user-owned dataset and assemble the backup payload.
 * Each source falls back to an empty value on failure so a partial
 * read still produces a usable file rather than aborting the whole
 * export.
 */
export async function buildBackup(): Promise<BackupPayload> {
  const achievementService = resolveAchievementService();
  await bibleDB.initialize();
  // Idempotent schema bootstrap (CREATE TABLE IF NOT EXISTS + INSERT OR
  // IGNORE) — safe to call even though the app already ran it at boot.
  // Non-fatal on failure: a missing achievements table just yields empty
  // reads below via `safeQuery`, same as every other source here.
  await safeQuery(() => achievementService.initialize(), undefined);

  const [favorites, notes, highlightsResult, lastReadPosition] =
    await Promise.all([
      safeQuery(() => bibleDB.getFavorites(), [] as Favorite[]),
      safeQuery(() => bibleDB.getNotes(), [] as Note[]),
      safeQuery(async () => {
        const result = await bibleDB.executeSql(
          'SELECT * FROM highlights ORDER BY created_at DESC',
        );
        return (result?.rows?._array ?? []) as RawHighlightRow[];
      }, [] as RawHighlightRow[]),
      safeQuery(() => bibleDB.getReadingProgress(), null),
    ]);

  const chapterProgressMapRaw = await readJSON<ChapterProgressMap>(
    KEYS.readingProgress,
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
    readJSON<Bookmark[]>(KEYS.bookmarks),
    readJSON(KEYS.readingPlanProgress),
    readJSON(KEYS.readingPlanReadChapters),
    readJSON(KEYS.searchHistory),
    AsyncStorage.getItem(KEYS.sideBySide).catch(() => null),
    readJSON<ReaderPreferences>(KEYS.readerPreferences),
    AsyncStorage.getItem(KEYS.appThemeMode).catch(() => null),
    AsyncStorage.getItem(KEYS.appColorTheme).catch(() => null),
    readJSON<Record<string, MemoryCard>>(KEYS.memoryDeck),
    AsyncStorage.getItem(KEYS.prepNotes).catch(() => null),
    AsyncStorage.getItem(KEYS.prepSeries).catch(() => null),
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
    safeQuery(() => achievementService.getRawUserStats(), EMPTY_RAW_STATS),
    safeQuery(
      () => achievementService.getAllAchievements(),
      [] as Achievement[],
    ),
    safeQuery(() => achievementService.getReadingLog(), []),
    safeQuery(() => achievementService.getCompletedBooks(), []),
    safeQuery(() => achievementService.getBookReadingLog(), []),
    safeQuery(() => achievementService.getChaptersReadLog(), []),
    safeQuery(() => getAllReviewEvents(), [] as ReviewEvent[]),
  ]);

  return {
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
}

/**
 * Build the backup, dump it to a JSON file in the cache directory, and
 * hand it to expo-sharing. Returns the absolute path of the written
 * file so the caller can show it in a toast or log it. Throws if the
 * device can't share — Settings can then surface an error message.
 */
export async function exportBackup(): Promise<string> {
  const payload = await buildBackup();
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

  return target.uri;
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
 * importing an old backup must never wipe data it never knew about.
 *
 * Atomicity: every SQLite write (favorites/notes/highlights/reviewEvents/
 * lastReadPosition/achievements) happens inside ONE transaction
 * (`db.withTransactionAsync`), so a failure partway through rolls back to
 * the pre-import state — never a half-restored, inconsistent DB. The
 * AsyncStorage writes (bookmarks, plans, search history, reader prefs, app
 * theme, chapter-progress map, memory deck, prep notes/series) go through a
 * single `AsyncStorage.multiSet` call for the same reason — the best
 * available atomicity primitive for that storage engine. SQLite and
 * AsyncStorage can never share one real transaction (different engines), so
 * the SQLite portion runs first: if the (larger, more failure-prone)
 * transaction fails, NOTHING has been written yet — including AsyncStorage —
 * so the device is left at its exact pre-import state rather than a mixed
 * one. Every top-level section is pre-validated + coerced BEFORE any write
 * begins, so a malformed backup is rejected up front rather than partway
 * through a write.
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
  const bible: Record<string, unknown> = isPlainObject(payload.bible)
    ? payload.bible
    : {};
  const user: Record<string, unknown> = isPlainObject(payload.user)
    ? payload.user
    : {};

  // ---- pre-validate + coerce every present section BEFORE writing anything ----
  const favoritesPresent = Array.isArray(bible.favorites);
  const favoritesIn = coerceArray(bible.favorites, coerceFavorite);

  const notesPresent = Array.isArray(bible.notes);
  const notesIn = coerceArray(bible.notes, coerceNote);

  const highlightsPresent = Array.isArray(bible.highlights);
  const highlightsIn = coerceArray(bible.highlights, coerceHighlightRow);

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

  const reviewEventsPresent = Array.isArray(memorySection.reviewEvents);
  const reviewEventsIn = coerceArray(
    memorySection.reviewEvents,
    coerceReviewEvent,
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

  // ---- SQLite portion: ONE transaction, all-or-nothing ----
  const db = await bibleDB.getDatabase();
  await db.withTransactionAsync(async () => {
    if (favoritesPresent) {
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

    if (notesPresent) {
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

    if (highlightsPresent) {
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

    if (achievementsSection && rawStatsIn) {
      const data: AchievementBackupData = {
        stats: rawStatsIn,
        achievements: coerceArray(
          achievementsSection.achievements,
          coerceAchievementRow,
        ),
        streakLog: coerceArray(
          achievementsSection.streakLog,
          coerceStreakEntry,
        ),
        completedBooks: coerceArray(
          achievementsSection.completedBooks,
          coerceCompletedBookEntry,
        ),
        bookReadingLog: coerceArray(
          achievementsSection.bookReadingLog,
          coerceBookReadingEntry,
        ),
        chaptersReadLog: coerceArray(
          achievementsSection.chaptersReadLog,
          coerceChapterReadEntry,
        ),
      };
      await achievementService.restoreBackup(data);
      restoredSections.push('achievements');
    }
  });

  // ---- AsyncStorage portion: one multiSet, only present sections ----
  const pairs: [string, string][] = [];
  if (bookmarksPresent) {
    pairs.push([KEYS.bookmarks, JSON.stringify(bookmarksIn)]);
    restoredSections.push('bookmarks');
  }
  if (readingPlanProgressPresent) {
    pairs.push([
      KEYS.readingPlanProgress,
      JSON.stringify(user.readingPlanProgress),
    ]);
    restoredSections.push('readingPlanProgress');
  }
  if (readingPlanReadChaptersPresent) {
    pairs.push([
      KEYS.readingPlanReadChapters,
      JSON.stringify(user.readingPlanReadChapters),
    ]);
    restoredSections.push('readingPlanReadChapters');
  }
  if (searchHistoryPresent) {
    pairs.push([KEYS.searchHistory, JSON.stringify(user.searchHistory)]);
    restoredSections.push('searchHistory');
  }
  if (sideBySideIn !== null) {
    pairs.push([KEYS.sideBySide, sideBySideIn ? '1' : '0']);
  }
  if (readerPreferencesFullPresent) {
    pairs.push([
      KEYS.readerPreferences,
      JSON.stringify(user.readerPreferencesFull),
    ]);
    restoredSections.push('readerPreferences');
  }
  if (appThemeModeIn) {
    pairs.push([KEYS.appThemeMode, appThemeModeIn]);
    restoredSections.push('appThemeMode');
  }
  if (appColorThemeIn) {
    pairs.push([KEYS.appColorTheme, appColorThemeIn]);
    restoredSections.push('appColorTheme');
  }
  if (chapterProgressMapPresent) {
    pairs.push([KEYS.readingProgress, JSON.stringify(chapterProgressMapIn)]);
    restoredSections.push('chapterProgressMap');
  }
  if (memoryDeckPresent) {
    pairs.push([KEYS.memoryDeck, JSON.stringify(memoryDeckIn)]);
    restoredSections.push('memoryDeck');
  }
  if (prepNotesPresent && prepNotesIn) {
    pairs.push([KEYS.prepNotes, serializePrepNotesMap(prepNotesIn)]);
    restoredSections.push('prepNotes');
  }
  if (prepSeriesPresent && prepSeriesIn) {
    pairs.push([KEYS.prepSeries, serializePrepSeriesMap(prepSeriesIn)]);
    restoredSections.push('prepSeries');
  }

  if (pairs.length > 0) {
    await AsyncStorage.multiSet(pairs);
  }

  // ---- Hand off the 6 Firestore-synced collections to the normal sync path ----
  pushImportedEntitiesToSync({
    favorites: favoritesIn,
    notes: notesIn,
    highlights: highlightsIn,
    bookmarks: bookmarksIn,
    memoryDeck: Object.values(memoryDeckIn),
    reviewEvents: reviewEventsIn,
  });

  return {formatVersion: payload.formatVersion, restoredSections};
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
