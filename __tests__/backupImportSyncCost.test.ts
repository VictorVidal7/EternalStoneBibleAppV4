/**
 * R9-29 — el import no sube el historial de repasos y encola lo demás de una
 * vez.
 *
 * `importBackup` real, con el `SyncEngine` REAL detrás de `getSyncEngine`
 * (solo Firestore y NetInfo mockeados). Antes del arreglo:
 *  - cada evento de repaso dentro de los 12 meses iba a la cola y a Firestore
 *    (una escritura facturada por evento, ~7 300 en una cuenta grande), aunque
 *    nadie lee `reviewEvents` de la nube: el adapter los descarta al llegar y
 *    la continuidad entre aparatos es el resumen de `memoryStatsSync`;
 *  - cada entidad hacía su propio `persistQueue`: la cola entera serializada y
 *    escrita a AsyncStorage una vez por entidad (O(N²) en el hilo JS).
 */
const mockSets: Array<{path: string; id: string; data?: unknown}> = [];
function mockColl(path: string): unknown {
  const self: Record<string, unknown> = {};
  Object.assign(self, {
    doc: (id: string) => ({
      set: async (data?: unknown) => {
        mockSets.push({path, id, data});
      },
      get: async () => ({exists: false, data: () => undefined}),
      delete: async () => {},
    }),
    where: () => self,
    orderBy: () => self,
    limit: () => self,
    get: async () => ({docs: []}),
    onSnapshot: () => () => {},
  });
  return self;
}
jest.mock('../src/lib/sync/firestore', () => ({
  __esModule: true,
  getFirestore: () => () => ({collection: (p: string) => mockColl(p)}),
  serverTimestamp: () => 'SERVER_TS',
  __resetFirestoreCacheForTests: () => {},
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: () => () => {},
    fetch: jest.fn(() =>
      Promise.resolve({isConnected: true, isInternetReachable: true}),
    ),
  },
}));
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    // R9-51 — the import folds the notes it wrote (none here).
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => {
        await fn();
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {
  importBackup,
  BACKUP_FORMAT_VERSION,
  type BackupPayload,
} from '../src/services/BackupService';
import {SyncEngine, setSyncEngine} from '../src/lib/sync';
import {logger} from '../src/lib/utils/logger';

jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'info').mockImplementation(() => {});

const QUEUE_KEY = '@sync_queue_v1';
const AHORA = Date.now();
const DIA = 24 * 60 * 60 * 1000;

function respaldo(n: number): BackupPayload {
  const favorites = Array.from({length: n}, (_, i) => ({
    id: `fav-${i}`,
    verseId: `John-3-${i + 1}`,
    book: 'John',
    chapter: 3,
    verse: i + 1,
    text: 't',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }));
  const notes = Array.from({length: n}, (_, i) => ({
    id: `note-${i}`,
    book: 'John',
    chapter: 3,
    verse: i + 1,
    text: 't',
    note: 'n',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }));
  const memoryDeck: Record<string, unknown> = {};
  for (let i = 0; i < n; i++) {
    const verseKey = `John/3/${i + 1}`;
    memoryDeck[verseKey] = {
      verseKey,
      bookName: 'John',
      chapter: 3,
      verse: i + 1,
      text: 't',
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
  }
  // Todos dentro de la ventana de 12 meses: hoy, todos iban a la nube.
  const reviewEvents = Array.from({length: n}, (_, i) => ({
    id: `John/3/16__${AHORA - DIA - i}`,
    verseKey: 'John/3/16',
    bookName: 'John',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 1,
    reviewedAt: AHORA - DIA - i,
  }));
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    generatedAt: '2026-01-01T00:00:00.000Z',
    app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
    bible: {
      favorites,
      notes,
      highlights: [],
      lastReadPosition: null,
      chapterProgressMap: null,
    },
    user: {
      readerPreferences: {sideBySide: false},
      readerPreferencesFull: null,
      appTheme: {mode: null, colorTheme: null},
    },
    achievements: {
      stats: null,
      achievements: [],
      streakLog: [],
      completedBooks: [],
      bookReadingLog: [],
      chaptersReadLog: [],
    },
    memory: {memoryDeck, reviewEvents},
    prep: {notes: null, series: null},
  } as unknown as BackupPayload;
}

let engine: SyncEngine;

beforeEach(async () => {
  await AsyncStorage.clear();
  setAchievementServiceInstance(null);
  mockSets.length = 0;
  engine = new SyncEngine();
  await engine.start('u1');
  setSyncEngine(engine);
});

afterEach(() => {
  engine.stop();
  setSyncEngine(null);
});

async function vaciar(): Promise<void> {
  for (let k = 0; k < 20 && engine.__getQueueForTests().length > 0; k++) {
    await engine.__flushForTests();
    await new Promise(r => setTimeout(r, 0));
  }
}

const porColeccion = () => {
  const out: Record<string, number> = {};
  for (const s of mockSets) {
    const c = s.path.split('/')[2];
    out[c] = (out[c] ?? 0) + 1;
  }
  return out;
};

it('R9-29: el import no sube ningún evento de repaso; lo demás sí sube', async () => {
  const r = await importBackup(respaldo(30));
  await vaciar();

  expect({
    restaurados: r.restoredSections.includes('reviewEvents'), // CONTROL: en SQLite
    subidos: porColeccion(),
    colaFinal: engine.__getQueueForTests().length,
  }).toEqual({
    restaurados: true,
    subidos: {favorites: 30, notes: 30, memoryCards: 30},
    colaFinal: 0,
  });
});

it('R9-29: encolar lo importado escribe la cola a disco una vez, no una por entidad', async () => {
  const multiSet = AsyncStorage.multiSet as unknown as jest.Mock;
  const vecesCola = () =>
    multiSet.mock.calls.filter(([pares]) =>
      (pares as Array<[string, string]>).some(([k]) => k === QUEUE_KEY),
    ).length;
  // La cola se escribe en el `multiSet` del import (claves del respaldo) y
  // en los de `persistQueue`. Contamos solo los que llevan la cola.
  const antes = vecesCola();
  await importBackup(respaldo(200));
  const durante = vecesCola() - antes;
  await vaciar();

  // 600 entidades a la nube (favoritos, notas y tarjetas). Antes: 800
  // escrituras de la cola (una por entidad, eventos incluidos), cada una con
  // la cola entera. El flush de después escribe la suya, aparte.
  expect({durante, subidas: mockSets.length}).toEqual({
    durante: 1,
    subidas: 600, // CONTROL: todo lo que debe subir, subió
  });
});

it('R9-51: el import sube las notas como las dejó el plegado, en el mismo lote', async () => {
  // El archivo trae dos notas viejas para Juan 3:1 (`note-0`, `note-1`, con el
  // libro del aparato que lo escribió) y una para Juan 3:3; el plegado (aquí
  // su resultado: lo mide con SQLite real `notesVerseKeyR951.test.ts`) dejó
  // una fila por versículo.
  const {__mockInstance: db} = jest.requireMock('../src/lib/database') as {
    __mockInstance: {foldVerseNotesInTransaction: jest.Mock};
  };
  const juan31 = {
    id: 'vnote:John:3:1',
    book: 'John',
    chapter: 3,
    verse: 1,
    text: 't',
    note: 'n\n\notra',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-11-24T00:00:00.000Z',
  };
  const juan33 = {...juan31, id: 'vnote:John:3:3', verse: 3, note: 'n'};
  db.foldVerseNotesInTransaction.mockResolvedValueOnce({
    written: [juan31, juan33],
    removedIds: ['note-0', 'note-1', 'note-2'],
  });
  const p = respaldo(3);
  p.bible.notes[1] = {...p.bible.notes[1], verse: 1, note: 'otra'};
  const lotes = jest.spyOn(engine, 'queueWrites');
  await importBackup(p);
  await vaciar();

  expect(lotes).toHaveBeenCalledTimes(1); // un solo lote, con todo lo demás
  const notas = mockSets
    .filter(x => x.path.endsWith('/notes'))
    .map(x => {
      const d = x.data as {deleted?: boolean; note?: string};
      return [x.id, d.deleted, d.note];
    });
  expect(notas).toEqual([
    ['vnote:John:3:1', false, 'n\n\notra'],
    ['vnote:John:3:3', false, 'n'],
    ['note-0', true, undefined],
    ['note-1', true, undefined],
    ['note-2', true, undefined],
  ]);
});
