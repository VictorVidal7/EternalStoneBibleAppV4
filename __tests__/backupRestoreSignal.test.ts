/**
 * R9-278 — `importBackup` avisa ANTES de escribir las claves de AsyncStorage
 * (el mazo retiene sus escrituras desde ahi; los otros providers no, R9-284)
 * y despues, siempre: con el aviso de fin en un `finally`, el que retiene no
 * espera para siempre si algo lanza entre medias.
 *
 * `importBackup` real; `bibleDB` y `AchievementService` mockeados como en
 * `backupPrepTurn.test.ts`, y el motor de sync (`getSyncEngine`), para que su
 * `queueWrite` pueda lanzar.
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

let mockEngine: {queueWrite: () => void} | null = null;
jest.mock('../src/lib/sync', () => ({
  ...jest.requireActual('../src/lib/sync'),
  getSyncEngine: () => mockEngine,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {
  importBackup,
  BACKUP_FORMAT_VERSION,
  type BackupPayload,
} from '../src/services/BackupService';
import {
  __resetBackupRestoredListenersForTests,
  subscribeBackupRestored,
  subscribeBackupRestoring,
} from '../src/lib/backup/restoreSignal';

const JOHN = {
  verseKey: 'John/3/16',
  bookName: 'John',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amo Dios al mundo',
  version: 'RVR1960',
  box: 1,
  dueAt: '2026-10-01T00:00:00.000Z',
  addedAt: '2026-09-01T00:00:00.000Z',
  lastReviewedAt: null,
  reviewCount: 0,
  lapseCount: 0,
  ease: 2.5,
  updatedAt: 5000,
};

/** Un respaldo v2 sin nada mas que el mazo (John). */
function respaldoConMazo(): BackupPayload {
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
    memory: {memoryDeck: {[JOHN.verseKey]: JOHN}, reviewEvents: []},
    prep: {notes: null, series: null},
  } as unknown as BackupPayload;
}

/** Las claves del mazo en disco, en cada aviso. */
const vistos: string[] = [];
const mazo = () => {
  const raw = (
    AsyncStorage as unknown as {
      __INTERNAL_MOCK_STORAGE__: Record<string, string>;
    }
  ).__INTERNAL_MOCK_STORAGE__['@memory_deck'];
  return raw ? Object.keys(JSON.parse(raw)).join('+') : 'nada';
};

beforeEach(async () => {
  __resetBackupRestoredListenersForTests();
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    '@memory_deck',
    JSON.stringify({'Luke/2/1': {...JOHN, verseKey: 'Luke/2/1'}}),
  );
  setAchievementServiceInstance(null);
  mockEngine = null;
  vistos.length = 0;
  subscribeBackupRestoring(() => vistos.push('inicio: ' + mazo()));
  subscribeBackupRestored(() => vistos.push('fin: ' + mazo()));
});

afterEach(() => {
  __resetBackupRestoredListenersForTests();
});

it('R9-278: avisa antes de escribir el mazo, y despues', async () => {
  const r = await importBackup(respaldoConMazo());

  // Sin el aviso de inicio, el mazo no sabia que el respaldo iba a escribir:
  // su escritura corria detras del `multiSet` (y la recarga la leia) o, con
  // la Mesa en su turno, antes (y el respaldo la borraba).
  expect({
    restaurado: r.restoredSections.includes('memoryDeck'),
    vistos,
  }).toEqual({
    restaurado: true, // CONTROL: el mazo entro en el multiSet
    vistos: ['inicio: Luke/2/1', 'fin: John/3/16'],
  });
});

it('R9-278: si algo lanza despues de escribir, el aviso de fin llega igual', async () => {
  mockEngine = {
    queueWrite: () => {
      throw new Error('motor');
    },
  };
  const error = await importBackup(respaldoConMazo()).then(
    () => null,
    (e: Error) => e.message,
  );

  // Sin el `finally`, el provider que retiene desde el inicio esperaba una
  // recarga que no llegaba: lo editado no llegaba nunca al disco.
  expect({error, vistos}).toEqual({
    error: 'motor', // CONTROL: el push a sync lanzo tras el multiSet
    vistos: ['inicio: Luke/2/1', 'fin: John/3/16'],
  });
});
