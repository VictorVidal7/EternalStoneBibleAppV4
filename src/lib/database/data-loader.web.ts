/* eslint-disable no-console -- mirrors data-loader.ts's dev-mode init logging. */
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from './index';
import {packLoadedKey} from './pack-import';

/**
 * Web variant of data-loader.ts (T21). Native embeds RVR1960 + WEB in
 * assets/bible-seed.db and falls back to the in-repo bible-data-*.ts arrays
 * (~6 MB of JS each) if that seed copy fails. Web deliberately has NEITHER:
 * this file must never import bible-data-rvr1960.ts / bible-data-web.ts, or
 * Metro would bundle that weight into the web build regardless of whether
 * it's ever used (T19 §3.1a chose "start empty, download a ~4.7 MB pack" over
 * embarking the 20.8 MB seed specifically to keep the Hosting deploy light).
 *
 * Instead: fetch the small web-only bootstrap pack (built by
 * scripts/build-web-packs.js, published alongside — but NOT listed in —
 * web/packs/versions.json, since that catalog is also read by the native
 * download-versions screen, which doesn't filter out already-bundled
 * versions), open it as a temporary in-memory SQLite db, read its rows over
 * the public getAllAsync API, and insert them into the main (OPFS-persisted)
 * db via the same bibleDB.insertVerses() the legacy JS loader already uses.
 * No ATTACH DATABASE / OPFS-naming needed for the pack itself — it's only
 * read once, then discarded.
 */

/**
 * Both bundled versions download on first run — the shared BIBLE_VERSIONS
 * catalog (src/constants/bible.ts) marks RVR1960 + WEB `bundled: true`
 * unconditionally (it's not platform-aware), so useBibleVersion's
 * language-sync effect treats both as "available" regardless of what's
 * actually in the web DB. Importing only one left the other selectable but
 * empty — confirmed live in Chrome: the UI language auto-selected WEB
 * (unimported) and every chapter query returned zero rows.
 */
const DATA_LOADED_KEY_RVR1960 = packLoadedKey('RVR1960');
const DATA_LOADED_KEY_WEB = packLoadedKey('WEB');

/**
 * Base URL for the web-only bootstrap packs. Points at the same GitHub Pages
 * host the native downloadable packs already use (T20 confirmed cross-origin
 * fetch works fine under COEP credentialless). Overridable via
 * EXPO_PUBLIC_WEB_PACKS_BASE_URL for local verification against a same-origin
 * dev static server before the packs are uploaded to Pages.
 */
const WEB_PACKS_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_PACKS_BASE_URL ??
  'https://eternalstonebible.github.io/packs/';

interface PackRow {
  book_id: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

/** Fetch + import one web-bootstrap pack into the main db, tagged `versionId`. */
async function importWebPack(
  versionId: string,
  fileName: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const res = await fetch(`${WEB_PACKS_BASE_URL}${fileName}`);
  if (!res.ok) {
    throw new Error(`Web pack fetch failed (${fileName}): HTTP ${res.status}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());

  const packDb = await SQLite.deserializeDatabaseAsync(bytes);
  try {
    const rows = await packDb.getAllAsync<PackRow>(
      'SELECT book_id, book_name, chapter, verse, text FROM verses ORDER BY book_id, chapter, verse',
    );
    const total = rows.length;
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE).map(r => ({
        book: r.book_name,
        bookNumber: r.book_id,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        version: versionId,
      }));
      await bibleDB.insertVerses(chunk);
      onProgress?.(Math.min(i + CHUNK_SIZE, total), total);
    }
  } finally {
    await packDb.closeAsync();
  }

  await AsyncStorage.setItem(packLoadedKey(versionId), 'true');
}

const BOOTSTRAP_PACKS: Array<{versionId: string; key: string; file: string}> = [
  {versionId: 'RVR1960', key: DATA_LOADED_KEY_RVR1960, file: 'rvr1960.sqlite'},
  {versionId: 'WEB', key: DATA_LOADED_KEY_WEB, file: 'web.sqlite'},
];

export async function initializeBibleData(
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  try {
    console.log('🔵 [web] Starting Bible data initialization...');
    await bibleDB.initialize();

    for (const pack of BOOTSTRAP_PACKS) {
      const isLoaded = await AsyncStorage.getItem(pack.key);
      if (isLoaded === 'true') {
        console.log(`🟢 [web] ${pack.versionId} already loaded, skipping`);
        continue;
      }
      console.log(`📖 [web] Downloading ${pack.versionId} bootstrap pack...`);
      await importWebPack(pack.versionId, pack.file, onProgress);
      console.log(`✅ [web] ${pack.versionId} bootstrap pack imported`);
    }
  } catch (error) {
    console.error('❌ [web] Bible data initialization error:', error);
    throw error;
  }
}

export async function checkDataStatus(): Promise<{
  isLoaded: boolean;
  stats?: {totalVerses: number; versions: string[]};
}> {
  const isLoaded =
    (await AsyncStorage.getItem(DATA_LOADED_KEY_RVR1960)) === 'true';
  if (!isLoaded) return {isLoaded: false};

  try {
    await bibleDB.initialize();
    const db = await bibleDB.getDatabase();
    const result = await db.getFirstAsync<{count: number; versions: string}>(
      'SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT version) as versions FROM verses',
    );
    if (result && result.count > 0) {
      return {
        isLoaded: true,
        stats: {
          totalVerses: result.count,
          versions: result.versions ? result.versions.split(',') : [],
        },
      };
    }
  } catch (error) {
    console.warn('[web] Could not check database stats:', error);
  }
  return {isLoaded: false};
}

export async function resetBibleData(): Promise<void> {
  console.log('🔄 [web] Resetting Bible data...');
  await AsyncStorage.removeItem(DATA_LOADED_KEY_RVR1960);
  await AsyncStorage.removeItem(packLoadedKey('WEB'));
  try {
    const db = await bibleDB.getDatabase();
    await db.execAsync('DELETE FROM verses;');
    console.log('✅ [web] Database cleared successfully');
  } catch (error) {
    console.error('❌ [web] Error clearing database:', error);
  }
}
