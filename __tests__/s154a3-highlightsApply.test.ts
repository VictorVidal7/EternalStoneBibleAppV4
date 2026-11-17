/**
 * R9-128 y R9-132 — el adaptador de SUBRAYADOS ya no dice «hecho» ni «ausente»
 * cuando la base fallo.
 *
 * R9-132: `getLocal` atrapaba un fallo de lectura y devolvia `null`. El motor
 * toma `null` por «este versiculo no tiene subrayado aqui» y aplica la copia
 * remota sin LWW ni conflicto: una copia VIEJA del otro telefono pisaba color,
 * categoria y nota de la local nueva. Ahora la lectura que falla lanza, y el
 * motor salta el doc (R9-46).
 *
 * R9-128: `applyRemoteUpsert` y `applyRemoteDelete` atrapaban su error y
 * resolvian. El motor contaba el doc como aplicado y movia el cursor por encima:
 * el cambio remoto no volvia nunca. Ahora rechazan.
 *
 * Y el upsert es UNA sentencia con los relojes remotos: `addHighlight` sellaba
 * la fila con Date.now() y un UPDATE aparte ponia los remotos; si fallaba solo
 * el UPDATE, la fila quedaba con un reloj mas nuevo que cualquier copia.
 *
 * Lo REAL: el adaptador, `HighlightService` y el SyncEngine. Lo sustituido:
 * SQLite (una tabla `highlights` en memoria que entiende las cuatro sentencias
 * que usan el adaptador y el servicio, con un fallo inyectable por patron),
 * Firestore (lo minimo que usa el motor) y NetInfo.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

type HRow = {
  id: string;
  verse_id: string;
  book_id: string;
  chapter: number;
  verse: number;
  color: string;
  category: string | null;
  note: string | null;
  created_at: number;
  updated_at: number;
};

/** La tabla `highlights`, por `verse_id` (UNIQUE). */
const mockRows = new Map<string, HRow>();
/** Una sentencia que casa con este patron lanza, como `database is locked`. */
let mockFail: RegExp | null = null;
/** Todas las sentencias que llegaron a la base. */
const mockSql: string[] = [];

jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => {}),
    getDatabase: jest.fn(async () => ({execAsync: async () => {}})),
    executeSql: jest.fn(async (sql: string, p: unknown[] = []) => {
      const s = sql.replace(/\s+/g, ' ').trim();
      mockSql.push(s);
      if (mockFail && mockFail.test(s)) {
        throw new Error('database is locked');
      }
      if (s.startsWith('INSERT OR REPLACE INTO highlights')) {
        mockRows.set(p[1] as string, {
          id: p[0] as string,
          verse_id: p[1] as string,
          book_id: p[2] as string,
          chapter: p[3] as number,
          verse: p[4] as number,
          color: p[5] as string,
          category: (p[6] as string | null) ?? null,
          note: (p[7] as string | null) ?? null,
          created_at: p[8] as number,
          updated_at: p[9] as number,
        });
        return {changes: 1};
      }
      if (s.startsWith('UPDATE highlights SET created_at')) {
        const row = mockRows.get(p[2] as string);
        if (row) {
          row.created_at = p[0] as number;
          row.updated_at = p[1] as number;
        }
        return {changes: row ? 1 : 0};
      }
      if (s.startsWith('DELETE FROM highlights WHERE verse_id')) {
        mockRows.delete(p[0] as string);
        return {changes: 1};
      }
      if (s.startsWith('SELECT * FROM highlights WHERE verse_id')) {
        const row = mockRows.get(p[0] as string);
        const arr = row ? [{...row}] : [];
        return {rows: {_array: arr, length: arr.length}};
      }
      throw new Error('sentencia no prevista en la prueba: ' + s);
    }),
  },
}));

// ---- Firestore: lo minimo que usa el motor ----
type MockData = Record<string, unknown>;
const mockServer = new Map<string, MockData>();
const mockListeners = new Map<string, (snapshot: unknown) => void>();

function mockSnapshot(changes: Array<{id: string; data: MockData}>) {
  const docs = changes.map(c => ({id: c.id, exists: true, data: () => c.data}));
  return {
    docChanges: () => docs.map(doc => ({type: 'modified', doc})),
    docs,
    size: docs.length,
  };
}

function mockCollection(path: string) {
  const query = {
    where: () => query,
    orderBy: () => query,
    limit: () => query,
    onSnapshot: (...args: unknown[]) => {
      // R9-126 option E — the engine passes `{includeMetadataChanges}` first.
      const next = (typeof args[0] === 'function' ? args[0] : args[1]) as (
        snapshot: unknown,
      ) => void;
      mockListeners.set(path, next);
      return () => {
        if (mockListeners.get(path) === next) mockListeners.delete(path);
      };
    },
    get: async () => mockSnapshot([]),
    doc: (id: string) => ({
      set: async (data: MockData, options?: {merge?: boolean}) => {
        const key = `${path}/${id}`;
        const next = {
          ...(options?.merge ? mockServer.get(key) : undefined),
          ...data,
        };
        mockServer.set(key, next);
        mockListeners.get(path)?.(mockSnapshot([{id, data: next}]));
        await new Promise(resolve => setImmediate(resolve));
      },
      get: async () => {
        const data = mockServer.get(`${path}/${id}`);
        return {id, exists: data !== undefined, data: () => data};
      },
      delete: async () => {
        mockServer.delete(`${path}/${id}`);
      },
    }),
  };
  return query;
}

const mockFirestoreFn = Object.assign(
  () => ({collection: (path: string) => mockCollection(path)}),
  {FieldValue: {serverTimestamp: () => 'SERVER_TS'}},
);

jest.mock('../src/lib/sync/firestore', () => ({
  ...jest.requireActual('../src/lib/sync/firestore'),
  getFirestore: () => mockFirestoreFn,
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

import {highlightsSyncAdapter} from '../src/lib/sync/adapters/highlights';
import {SyncEngine, cursorStorageKey} from '../src/lib/sync/SyncEngine';
import {logger} from '../src/lib/utils/logger';

jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});

const UID = 'uid-s154-a3';
const PATH = `users/${UID}/highlights`;
const VID = 'Salmos:23:1';
const HOUR = 60 * 60 * 1000;

let engine: SyncEngine;

const settle = async (): Promise<void> => {
  for (let i = 0; i < 8; i++) {
    await new Promise(resolve => setImmediate(resolve));
  }
};

function row(note: string, updatedAt: number): HRow {
  return {
    id: `highlight_${VID}_1`,
    verse_id: VID,
    book_id: 'Salmos',
    chapter: 23,
    verse: 1,
    color: '#FFF59D',
    category: 'promise',
    note,
    created_at: 1000,
    updated_at: updatedAt,
  };
}

function remote(note: string, updatedAt: number, deleted = false): MockData {
  return {
    verseId: VID,
    bookId: 'Salmos',
    chapter: 23,
    verse: 1,
    color: '#90CAF9',
    category: 'prayer',
    note,
    createdAt: 1000,
    updatedAt,
    ...(deleted ? {deleted: true} : {}),
  };
}

async function startAt(cursor: number): Promise<void> {
  await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
  await AsyncStorage.setItem(
    cursorStorageKey('highlights', UID),
    String(cursor),
  );
  engine.register(highlightsSyncAdapter);
  await engine.start(UID);
  await settle();
}

async function fire(data: MockData): Promise<void> {
  mockServer.set(`${PATH}/${VID}`, data);
  mockListeners.get(PATH)!(mockSnapshot([{id: VID, data}]));
  await settle();
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockRows.clear();
  mockServer.clear();
  mockListeners.clear();
  mockSql.length = 0;
  mockFail = null;
  engine = new SyncEngine();
});

afterEach(() => {
  engine.stop();
});

describe('S154 — el adaptador de subrayados no miente cuando la base falla', () => {
  it('R9-132: con la lectura rota, una copia remota VIEJA no pisa la local nueva', async () => {
    const T = Date.now() - HOUR;
    mockRows.set(VID, row('nota NUEVA (local)', T + 60_000));
    await startAt(T);

    // CONTROL: con la lectura sana, LWW ignora la copia vieja.
    await fire(remote('nota VIEJA del otro', T + 10_000));
    expect(mockRows.get(VID)?.note).toBe('nota NUEVA (local)');

    // La lectura de la fila falla (database is locked).
    mockFail = /^SELECT \* FROM highlights WHERE verse_id/;
    await fire(remote('nota VIEJA del otro, otra vez', T + 20_000));
    mockFail = null;
    // Pre-fix: getLocal daba `null` y el motor aplicaba la vieja encima.
    expect({
      nota: mockRows.get(VID)?.note,
      color: mockRows.get(VID)?.color,
      actualizado: mockRows.get(VID)?.updated_at,
    }).toEqual({
      nota: 'nota NUEVA (local)',
      color: '#FFF59D',
      actualizado: T + 60_000,
    });
  });

  it('R9-128: un upsert remoto que no se escribio no mueve el cursor por encima del doc', async () => {
    const T = Date.now() - HOUR;
    await startAt(T);

    mockFail = /^INSERT OR REPLACE INTO highlights/;
    await fire(remote('lo suyo', T + 10_000));
    mockFail = null;
    // CONTROL del disparador: la escritura se intento y no quedo fila.
    expect({
      intentos: mockSql.filter(s => s.startsWith('INSERT OR REPLACE')).length,
      fila: mockRows.has(VID),
    }).toEqual({intentos: 1, fila: false});
    // Pre-fix: el apply resolvia y el cursor pasaba a T + 10 s.
    expect(engine.__getCursorForTests('highlights') ?? T).toBeLessThan(
      T + 10_000,
    );
    expect(
      Number(await AsyncStorage.getItem(cursorStorageKey('highlights', UID))),
    ).toBeLessThan(T + 10_000);
  });

  it('R9-128: un borrado remoto que no se escribio no mueve el cursor por encima del doc', async () => {
    const T = Date.now() - HOUR;
    mockRows.set(VID, row('lo mio', T + 5_000));
    await startAt(T);

    mockFail = /^DELETE FROM highlights WHERE verse_id/;
    await fire(remote('lo suyo', T + 10_000, true));
    mockFail = null;
    // CONTROL del disparador: el borrado se intento y la fila sigue.
    expect({
      intentos: mockSql.filter(s => s.startsWith('DELETE FROM highlights'))
        .length,
      fila: mockRows.has(VID),
    }).toEqual({intentos: 1, fila: true});
    // Pre-fix: el apply resolvia y el cursor pasaba a T + 10 s.
    expect(engine.__getCursorForTests('highlights') ?? T).toBeLessThan(
      T + 10_000,
    );
  });

  it('R9-128: el adaptador rechaza cuando su escritura falla, y resuelve cuando no', async () => {
    const data = remote('lo suyo', 5000) as never;
    // CONTROL: con la base sana, escribe con los relojes remotos.
    await expect(
      highlightsSyncAdapter.applyRemoteUpsert(VID, data),
    ).resolves.toBeUndefined();
    expect(mockRows.get(VID)?.updated_at).toBe(5000);
    await expect(
      highlightsSyncAdapter.applyRemoteDelete(VID),
    ).resolves.toBeUndefined();
    expect(mockRows.has(VID)).toBe(false);

    mockFail = /^INSERT OR REPLACE INTO highlights/;
    await expect(
      highlightsSyncAdapter.applyRemoteUpsert(VID, data),
    ).rejects.toThrow(/database is locked/);
    mockRows.set(VID, row('lo mio', 4000));
    mockFail = /^DELETE FROM highlights/;
    await expect(highlightsSyncAdapter.applyRemoteDelete(VID)).rejects.toThrow(
      /database is locked/,
    );
  });

  it('R9-132: getLocal lanza si la lectura falla, y da null solo si no hay fila', async () => {
    // CONTROL: sin fila, `null` de verdad.
    await expect(highlightsSyncAdapter.getLocal(VID)).resolves.toBeNull();
    mockFail = /^SELECT \* FROM highlights WHERE verse_id/;
    await expect(highlightsSyncAdapter.getLocal(VID)).rejects.toThrow(
      /database is locked/,
    );
  });

  it('el upsert deja los relojes remotos aunque falle cualquier sentencia de relojes aparte', async () => {
    // El caso de dos sentencias: la de contenido entra y la de relojes falla.
    // Pre-fix (addHighlight + UPDATE), la fila quedaba con el contenido remoto
    // y un `updated_at` = Date.now(), mas nuevo que cualquier copia: al volver
    // el doc, LWW lo tomaba por mas viejo que lo local y no lo aplicaba.
    mockFail = /^UPDATE highlights SET created_at/;
    let error: unknown = null;
    try {
      await highlightsSyncAdapter.applyRemoteUpsert(
        VID,
        remote('lo suyo', 5000) as never,
      );
    } catch (err) {
      error = err;
    }
    expect({
      error: error === null ? null : String(error),
      actualizado: mockRows.get(VID)?.updated_at,
      nota: mockRows.get(VID)?.note,
    }).toEqual({error: null, actualizado: 5000, nota: 'lo suyo'});
  });
});
