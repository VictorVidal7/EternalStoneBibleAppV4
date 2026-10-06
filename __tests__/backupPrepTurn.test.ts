/**
 * R9-273 — el respaldo escribe la Mesa de preparacion en su turno (el de
 * `prepAccount`), con las escrituras de los stores y las uniones.
 *
 * `importBackup` real; `bibleDB` y `AchievementService` mockeados como en
 * `backupServiceImport.test.ts`. En un archivo aparte: alli una prueba hace
 * `spyOn` sobre el `multiSet` del mock (un `jest.fn`), y su `mockRestore` lo
 * deja llamandose a si mismo para las que vienen despues.
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
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {
  importBackup,
  BACKUP_FORMAT_VERSION,
  type BackupPayload,
} from '../src/services/BackupService';
import {
  __resetPrepAccountForTests,
  adoptNoAccountPrep,
  managePrepAccount,
  setPrepAccount,
} from '../src/features/study/prepAccount';
import {savePrepNote} from '../src/features/study/prepNotesStore';

/** Un respaldo v2 sin nada mas que la Mesa (las notas de `notes`). */
function respaldoConMesa(notes: unknown): BackupPayload {
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
    prep: {notes, series: null},
  } as unknown as BackupPayload;
}

beforeEach(async () => {
  __resetPrepAccountForTests();
  await AsyncStorage.clear();
  setAchievementServiceInstance(null);
});

afterEach(() => {
  __resetPrepAccountForTests();
});

it('R9-273: restaurado mientras corre una union, o la escritura de un store, el respaldo no se pierde', async () => {
  const T = Date.now() - 60 * 60 * 1000;
  const P = 'John/3/16-21';
  const R = 'Ps/23/1-6';
  const ms = AsyncStorage.multiSet as unknown as jest.Mock;
  const real = ms.getMockImplementation()!;
  const pasajes = async (k: string) => {
    const raw = await AsyncStorage.getItem(k);
    return raw == null ? null : Object.keys(JSON.parse(raw)).sort();
  };
  // Sin sesion, la Mesa «sin cuenta» tiene P. La escritura que `retener`
  // elige espera en una puerta; mientras, se restaura un respaldo con R.
  const caso = async (
    retener: (pairs: Array<[string, string]>) => boolean,
    empezar: () => Promise<void>,
  ) => {
    __resetPrepAccountForTests();
    await AsyncStorage.clear();
    managePrepAccount();
    await setPrepAccount(null);
    await savePrepNote(P, 'observation', 'sin cuenta', T);
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let retenida = 0;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      if (retener(pairs)) {
        retenida += 1;
        await puerta;
      }
      return real(pairs);
    });
    let restaurado = false;
    try {
      const primero = empezar();
      await new Promise(r => setImmediate(r));
      const respaldo = importBackup(
        respaldoConMesa({
          [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
        }),
      ).then(r => {
        restaurado = r.restoredSections.includes('prepNotes');
      });
      // Sin turno, el respaldo termina con la otra escritura retenida.
      for (let i = 0; i < 20 && !restaurado; i++) {
        await new Promise(r => setImmediate(r));
      }
      const antesDeAbrir = restaurado;
      abrir();
      await primero;
      await respaldo;
      return {
        retenida, // CONTROL: la otra escritura se retuvo
        antesDeAbrir,
        restaurado,
        sinCuenta: await pasajes('@prep_notes'),
        ana: await pasajes('@prep_notes:ana'),
      };
    } finally {
      abrir();
      ms.mockImplementation(real);
    }
  };
  // La union de un inicio de sesion (su escritura, en la Mesa de Ana).
  const union = await caso(
    pairs => pairs.some(([k]) => k.endsWith(':ana')),
    () => adoptNoAccountPrep('ana'),
  );
  // La escritura de un store, entre su lectura y su escritura.
  const store = await caso(
    pairs => pairs.some(([, v]) => v.includes('durante')),
    () => savePrepNote(P, 'application', 'durante', T + 1000),
  );
  // Sin R9-273, la union pisaba lo restaurado (lo borraba con su clave), y el
  // store escribia encima lo que habia leido antes: R no quedaba en ninguna
  // Mesa, y la restauracion decia que si. En su turno, el respaldo espera a la
  // otra escritura, y despues reemplaza la Mesa, que es lo que hace un
  // respaldo.
  expect({union, store}).toEqual({
    union: {
      retenida: 1,
      antesDeAbrir: false,
      restaurado: true,
      sinCuenta: [R],
      ana: [P],
    },
    store: {
      retenida: 1,
      antesDeAbrir: false,
      restaurado: true,
      sinCuenta: [R],
      ana: null,
    },
  });
});
