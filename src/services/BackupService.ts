/**
 * 💾 BACKUP SERVICE
 *
 * Builds a JSON snapshot of every piece of user-owned data the app has
 * persisted (favorites, notes, highlights, bookmarks, reading-plan
 * progress, reading position, search history, reader preferences) and
 * exports it via expo-sharing. The user can save the file to Drive,
 * email it to themselves, or hand it to support.
 *
 * Re-imports are deliberately out of scope here — this sprint only
 * ships export. The on-disk JSON is human-readable so a future import
 * (or a manual rescue) doesn't need to know the version yet.
 */

import {File, Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from '../lib/database';
import {logger} from '../lib/utils/logger';

// Storage keys mirrored from the various contexts/screens so the
// service stays decoupled from the React tree.
const KEYS = {
  readingProgress: 'readingProgress',
  lastReadPosition: 'lastReadPosition',
  readingPlanProgress: '@reading_plan_progress',
  readingPlanReadChapters: '@reading_plan_read_chapters',
  bookmarks: '@bible_bookmarks',
  searchHistory: '@bible_search_history',
  sideBySide: '@reader_side_by_side',
  dataLoadedRVR: '@bible_data_loaded_rvr1960',
  dataLoadedKJV: '@bible_data_loaded_kjv',
} as const;

export const BACKUP_FORMAT_VERSION = 1;

export interface BackupPayload {
  formatVersion: number;
  generatedAt: string; // ISO-8601
  app: {
    name: string;
    package: string;
  };
  bible: {
    favorites: unknown[];
    notes: unknown[];
    highlights: unknown[];
    readingProgress: unknown | null;
  };
  user: {
    bookmarks: unknown;
    readingPlanProgress: unknown;
    readingPlanReadChapters: unknown;
    searchHistory: unknown;
    readerPreferences: {
      sideBySide: boolean;
    };
  };
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
  await bibleDB.initialize();

  const [favorites, notes, readingProgress, highlightsResult] =
    await Promise.all([
      safeQuery(() => bibleDB.getFavorites(), [] as unknown[]),
      safeQuery(() => bibleDB.getNotes(), [] as unknown[]),
      safeQuery(() => bibleDB.getReadingProgress(), null),
      safeQuery(async () => {
        const result = await bibleDB.executeSql(
          'SELECT * FROM highlights ORDER BY created_at DESC',
        );
        return (result?.rows?._array ?? []) as unknown[];
      }, [] as unknown[]),
    ]);

  const [bookmarks, planProgress, planReadChapters, searchHistory, sideBySide] =
    await Promise.all([
      readJSON(KEYS.bookmarks),
      readJSON(KEYS.readingPlanProgress),
      readJSON(KEYS.readingPlanReadChapters),
      readJSON(KEYS.searchHistory),
      AsyncStorage.getItem(KEYS.sideBySide).catch(() => null),
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
      readingProgress,
    },
    user: {
      bookmarks: bookmarks ?? [],
      readingPlanProgress: planProgress ?? {},
      readingPlanReadChapters: planReadChapters ?? {},
      searchHistory: searchHistory ?? [],
      readerPreferences: {
        sideBySide: sideBySide === '1',
      },
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

  await Sharing.shareAsync(target.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Eternal Stone Bible — Backup',
    UTI: 'public.json',
  });

  return target.uri;
}
