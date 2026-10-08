/**
 * R9-278 — `importBackup` avisa ANTES de escribir las claves de AsyncStorage
 * (el mazo retiene sus escrituras desde ahi; los otros providers no, R9-284)
 * y despues, siempre: con el aviso de fin en un `finally`, el que retiene no
 * espera para siempre si algo lanza entre medias.
 *
 * `importBackup` real; `bibleDB` y `AchievementService` mockeados como en
 * `backupPrepTurn.test.ts`, y el motor de sync (`getSyncEngine`), para que su
 * `queueWrite` pueda lanzar.
 *
 * R9-303 — la parte de SQLite del respaldo puede esperar en una puerta
 * (`mockSqlite`): el respaldo ya empezo, y todavia no pidio el turno. La
 * puerta va DESPUES del cuerpo de la transaccion: antes del cuerpo, un turno
 * tomado mientras el cuerpo corria no lo veia ninguna prueba (R9-307).
 */
const mockSqlite: {puerta: Promise<void> | null; retenida: number} = {
  puerta: null,
  retenida: 0,
};
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => {
        await fn();
        if (mockSqlite.puerta) {
          mockSqlite.retenida += 1;
          await mockSqlite.puerta;
        }
      },
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
import {
  __resetPrepAccountForTests,
  prepWrite,
} from '../src/features/study/prepAccount';
import * as prepAccount from '../src/features/study/prepAccount';

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
  mockSqlite.puerta = null;
  mockSqlite.retenida = 0;
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
  // la Mesa en su turno, antes (y el respaldo la borraba). Aqui se ve el
  // aviso; que el mazo retiene desde el, en `memoryDeckDisk.test.tsx`.
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

// `antes`: el store toma el turno antes de que empiece el respaldo. `durante`:
// lo toma con el respaldo ya empezado, esperando en SQLite, y el `multiSet`
// tiene que esperarlo igual. Con la espera de R9-302, `antes` solo ya no lo
// veia: el store entraba siempre antes de empezar el respaldo (R9-303).
// `pedido antes`: el store se pide antes de que empiece el respaldo (con la
// clave sin resolver) y toma el turno con el respaldo ya empezado: el orden
// de la carrera de antes de R9-302, que `antes` y `durante` no armaban
// (R9-306).
it.each(['antes', 'durante', 'pedido antes'] as const)(
  'R9-287: con la Mesa en su turno, avisa antes de esperarlo (store %s)',
  async caso => {
    // Una escritura de la Mesa tiene el turno: `prepMultiSet` espera, y el
    // `multiSet` del respaldo no se pide hasta abrir la puerta.
    __resetPrepAccountForTests();
    const turno = jest.spyOn(prepAccount, 'prepMultiSet');
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let soltarSqlite = () => {};
    if (caso !== 'antes') {
      mockSqlite.puerta = new Promise<void>(r => (soltarSqlite = r));
    }
    let soltarClave = () => {};
    const clave =
      caso === 'pedido antes'
        ? new Promise<string>(r => (soltarClave = () => r('@prep_notes')))
        : Promise.resolve('@prep_notes');
    const ms = AsyncStorage.multiSet as jest.Mock;
    const antes = ms.mock.calls.length;
    let terminado = false;
    const pedirRespaldo = () =>
      importBackup(respaldoConMazo()).then(() => (terminado = true));
    let dentro = false;
    const pedirStore = () =>
      prepWrite(clave, () => {
        dentro = true;
        return puerta;
      });
    let store = caso === 'pedido antes' ? pedirStore() : null;
    let respaldo = caso === 'antes' ? null : pedirRespaldo();
    for (let i = 0; i < 40 && respaldo && mockSqlite.retenida === 0; i++) {
      await new Promise(r => setImmediate(r));
    }
    const respaldoEnSqlite = mockSqlite.retenida;
    if (store) soltarClave();
    else store = pedirStore();
    // Se espera a que el store este DENTRO de su turno antes de pedir (o
    // soltar) el respaldo: con `prepWrite` una vuelta mas lento, el respaldo
    // tomaba el turno primero, y el rojo era el de un `multiSet` sin turno
    // (R9-302).
    for (let i = 0; i < 40 && !dentro; i++) {
      await new Promise(r => setImmediate(r));
    }
    const otraConElTurno = dentro;
    if (respaldo) soltarSqlite();
    else respaldo = pedirRespaldo();
    // Se espera a que el respaldo pida el turno, no al aviso: esperando el
    // aviso, su falta daba el mismo rojo con el aviso dentro del turno que con
    // un respaldo que no llego al turno en estas vueltas (R9-289).
    for (let i = 0; i < 20 && turno.mock.calls.length === 0; i++) {
      await new Promise(r => setImmediate(r));
    }
    const turnoPedidoAntesDeAbrir = turno.mock.calls.length;
    turno.mockRestore();
    const vistosAntesDeAbrir = [...vistos];
    const mazoPedidoAntesDeAbrir = ms.mock.calls
      .slice(antes)
      .filter(([pares]: [Array<[string, string]>]) =>
        pares.some(([k]) => k === '@memory_deck'),
      ).length;
    const terminadoAntesDeAbrir = terminado;
    abrir();
    await store;
    await respaldo;

    // Con el aviso dentro del turno, al pedir el `multiSet`, no llegaba hasta
    // abrir: lo que el mazo escribia mientras tanto corria antes del `multiSet`,
    // y el respaldo lo borraba (lo midio la sonda TURNO, R9-287).
    expect({
      respaldoEnSqlite,
      otraConElTurno,
      turnoPedidoAntesDeAbrir,
      vistosAntesDeAbrir,
      mazoPedidoAntesDeAbrir,
      terminadoAntesDeAbrir,
      vistos,
    }).toEqual({
      respaldoEnSqlite: caso === 'antes' ? 0 : 1, // CONTROL: el respaldo esperaba en SQLite
      otraConElTurno: true, // CONTROL: el store ya tenia el turno
      turnoPedidoAntesDeAbrir: 1, // CONTROL: el respaldo pidio el turno
      vistosAntesDeAbrir: ['inicio: Luke/2/1'],
      mazoPedidoAntesDeAbrir: 0, // CONTROL: el multiSet esperaba el turno
      terminadoAntesDeAbrir: false, // CONTROL: el respaldo seguia esperando
      vistos: ['inicio: Luke/2/1', 'fin: John/3/16'],
    });
  },
);
