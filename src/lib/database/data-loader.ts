import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from './index';

const DATA_LOADED_KEY = '@bible_data_loaded_rvr1960';

export async function initializeBibleData(
    onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  try {
    console.log('🔵 Starting Bible data initialization...');

    const isLoaded = await AsyncStorage.getItem(DATA_LOADED_KEY);

    if (isLoaded === 'true') {
      console.log('🟢 Bible data already loaded, skipping');
      return;
    }

    console.log('🟡 Initializing database schema...');
    await bibleDB.initialize();

    console.log('📖 Loading RVR1960 Bible data...');
    // Importación dinámica para evitar cargar 7.7MB innecesariamente
    const { RVR1960_DATA } = await import('./bible-data-rvr1960');

    const totalVerses = RVR1960_DATA.length;
    console.log(`📊 Total verses to load: ${totalVerses}`);

    // Insertar en chunks de 1000 versículos para mejor rendimiento
    const CHUNK_SIZE = 1000;
    let loadedCount = 0;

    for (let i = 0; i < totalVerses; i += CHUNK_SIZE) {
      const chunk = RVR1960_DATA.slice(i, i + CHUNK_SIZE);
      await bibleDB.insertVerses(chunk);

      loadedCount += chunk.length;

      // Reportar progreso
      if (onProgress) {
        onProgress(loadedCount, totalVerses);
      }

      console.log(`⏳ Progress: ${loadedCount}/${totalVerses} verses (${Math.round(loadedCount/totalVerses*100)}%)`);
    }

    // Marcar como cargado
    await AsyncStorage.setItem(DATA_LOADED_KEY, 'true');

    console.log('✅ Bible data initialization complete!');
    console.log(`📚 Successfully loaded ${totalVerses} verses from RVR1960`);
  } catch (error) {
    console.error('❌ Bible data initialization error:', error);
    // En caso de error, limpiar el flag para permitir reintento
    await AsyncStorage.removeItem(DATA_LOADED_KEY);
    throw error;
  }
}

export async function checkDataStatus(): Promise<{
  isLoaded: boolean;
  stats?: { totalVerses: number; versions: string[] };
}> {
  const isLoaded = (await AsyncStorage.getItem(DATA_LOADED_KEY)) === 'true';

  if (isLoaded) {
    try {
      // Asegurar que la base de datos esté inicializada antes de consultarla
      await bibleDB.initialize();

      // Verificar que realmente hay datos en la base de datos
      const stats = await bibleDB.getDatabaseStats();

      if (stats.totalVerses > 0) {
        return {
          isLoaded: true,
          stats: {
            totalVerses: stats.totalVerses,
            versions: stats.versions
          }
        };
      }
    } catch (error) {
      console.warn('Could not check database stats:', error);
    }
  }

  return { isLoaded: false };
}

export async function resetBibleData(): Promise<void> {
  console.log('🔄 Resetting Bible data...');

  // Limpiar flag de AsyncStorage
  await AsyncStorage.removeItem(DATA_LOADED_KEY);

  // Limpiar la base de datos
  try {
    // Asegurar que la base de datos esté inicializada antes de limpiarla
    await bibleDB.initialize();
    await bibleDB.clearAllData();
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }

  console.log('✅ Bible data reset complete - app will reload data on next launch');
}
