/* eslint-disable no-console -- dev-mode init/progress logging. Will
   migrate to logger.* in Sprint 41 alongside Crashlytics wiring. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from './index';
import {packLoadedKey} from './pack-import';
import {BIBLE_VERSIONS} from '../../constants/bible';

// The BUNDLED base seeded into bible-seed.db: RVR1960 (es) + WEB (en). KJV/BSB
// are downloadable translation packs (imported via importVersionPack), NOT
// JS-loaded here — so the 8 MB KJV JS blob no longer ships in the bundle.
const DATA_LOADED_KEY_RVR1960 = packLoadedKey('RVR1960');
const DATA_LOADED_KEY_WEB = packLoadedKey('WEB');

export async function initializeBibleData(
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  try {
    console.log('🔵 Starting Bible data initialization...');

    console.log('🟡 Initializing database schema...');
    await bibleDB.initialize();

    // Load the bundled base. On a normal launch the pre-seeded bible.db already
    // holds these (their flags set in seedFromBundleIfMissing), so each call is
    // a cheap flag read. This JS path is the fallback when the seed copy failed
    // (or after a Settings "reset"): it rebuilds the base from the in-repo data.

    // RVR1960 (Spanish base)
    await loadBibleVersion(
      'RVR1960',
      DATA_LOADED_KEY_RVR1960,
      async () => (await import('./bible-data-rvr1960')).RVR1960_DATA,
      onProgress,
    );

    // WEB (World English Bible — English base). Public domain.
    await loadBibleVersion(
      'WEB',
      DATA_LOADED_KEY_WEB,
      async () => (await import('./bible-data-web')).WEB_DATA,
      onProgress,
    );

    console.log('✅ All Bible versions initialization complete!');
  } catch (error) {
    console.error('❌ Bible data initialization error:', error);
    throw error;
  }
}

async function loadBibleVersion(
  versionName: string,
  storageKey: string,
  dataLoader: () => Promise<any[]>,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  try {
    const isLoaded = await AsyncStorage.getItem(storageKey);

    if (isLoaded === 'true') {
      console.log(`🟢 ${versionName} data already loaded, skipping`);
      return;
    }

    console.log(`📖 Loading ${versionName} Bible data...`);
    const bibleData = await dataLoader();

    const totalVerses = bibleData.length;
    console.log(`📊 Total ${versionName} verses to load: ${totalVerses}`);

    // Insertar en chunks de 1000 versículos para mejor rendimiento
    const CHUNK_SIZE = 1000;
    let loadedCount = 0;

    for (let i = 0; i < totalVerses; i += CHUNK_SIZE) {
      const chunk = bibleData.slice(i, i + CHUNK_SIZE);
      await bibleDB.insertVerses(chunk);

      loadedCount += chunk.length;

      // Reportar progreso
      if (onProgress) {
        onProgress(loadedCount, totalVerses);
      }

      console.log(
        `⏳ ${versionName} Progress: ${loadedCount}/${totalVerses} verses (${Math.round((loadedCount / totalVerses) * 100)}%)`,
      );
    }

    // Marcar como cargado
    await AsyncStorage.setItem(storageKey, 'true');

    console.log(`✅ ${versionName} data loaded successfully!`);
    console.log(
      `📚 Successfully loaded ${totalVerses} verses from ${versionName}`,
    );
  } catch (error) {
    console.error(`❌ Error loading ${versionName}:`, error);
    // En caso de error, limpiar el flag para permitir reintento
    await AsyncStorage.removeItem(storageKey);
    throw error;
  }
}

export async function checkDataStatus(): Promise<{
  isLoaded: boolean;
  stats?: {totalVerses: number; versions: string[]};
}> {
  // Check if at least one of the bundled base versions is loaded.
  const rvr1960Loaded =
    (await AsyncStorage.getItem(DATA_LOADED_KEY_RVR1960)) === 'true';
  const webLoaded =
    (await AsyncStorage.getItem(DATA_LOADED_KEY_WEB)) === 'true';
  const isLoaded = rvr1960Loaded || webLoaded;

  if (isLoaded) {
    try {
      // Verificar que realmente hay datos en la base de datos.
      // initialize() es idempotente y debe ejecutarse antes de consultar la BD.
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
      console.warn('Could not check database stats:', error);
    }
  }

  return {isLoaded: false};
}

export async function resetBibleData(): Promise<void> {
  console.log('🔄 Resetting Bible data...');

  // R9-558 — only the BUNDLED base is reset: it is what `initializeBibleData`
  // can put back. A downloaded pack (KJV, RV1909…) keeps its rows, its index
  // and its flag: the reset used to wipe every version and reload two, so the
  // chosen pack was left with no text (and, offline, no way to get it back).
  const bundledIds = BIBLE_VERSIONS.filter(v => v.bundled).map(v => v.id);

  // Flags first: a process killed from here on finds the base unflagged and
  // reloads it on the next start.
  await Promise.all(
    bundledIds.map(id => AsyncStorage.removeItem(packLoadedKey(id))),
  );

  // Limpiar la base de datos
  try {
    const db = await bibleDB.getDatabase();
    // The `verses_ad` trigger drops each deleted row from `verses_fts`. No
    // `DELETE FROM verses_fts` after it: on this external-content index that
    // statement walks the rows LEFT in `verses`, i.e. it would unindex the
    // packs just kept (measured on SQLite with FTS5: their search goes to 0).
    await db.runAsync(
      `DELETE FROM verses WHERE version COLLATE NOCASE IN (${bundledIds
        .map(() => '?')
        .join(', ')})`,
      bundledIds,
    );
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }

  console.log(
    '✅ Bible data reset complete - app will reload data on next launch',
  );
}
