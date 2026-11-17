/**
 * R9-128 — en favoritos, un apply remoto que FALLA se tragaba su error. El
 * motor veia un `await` que resolvia, lo contaba como aplicado y movia el
 * cursor por encima: el cambio remoto no volvia nunca. Y el borrado fallido
 * quitaba ademas el favorito de la pantalla aunque la fila siguiera en SQLite.
 *
 * Lo REAL: el FavoritesProvider (con su adaptador), el SyncEngine y React.
 * Lo sustituido: SQLite (una tabla en memoria que puede fallar al escribir, y
 * que lanza antes de `initialize()` como la base real), Firestore (la escucha
 * de una coleccion, lo minimo que usa el motor), NetInfo, y de
 * SyncEngineContext solo `useSyncEngineOptional`.
 *
 * Lo que NO mide: que el doc vuelva tras otro lote o un reattach. Eso depende
 * de la otra mitad del arreglo (el motor retiene el doc que no aplico), y se
 * mide al integrar.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';

type Row = {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  category: string;
  rating: number;
  tags: string[];
  note?: string | null;
  createdAt: number;
  updatedAt: number;
};

/** La tabla `favorites`, en memoria. `mock`-prefijada para las factorias. */
const mockRows = new Map<string, Row>();
const mockCopy = (r: Row): Row => ({...r, tags: [...r.tags]});
/** Como la base real: leer o escribir antes de `initialize()` lanza. */
let mockReady = true;
/** Cuando esta puesta, toda escritura falla (disco lleno, base bloqueada). */
let mockWriteFails = false;
const mockNeedReady = () => {
  if (!mockReady) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
};
const mockNeedWritable = () => {
  mockNeedReady();
  if (mockWriteFails) throw new Error('database or disk is full');
};

jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => {
      mockReady = true;
    }),
    getFavorites: jest.fn(async () => {
      mockNeedReady();
      return Array.from(mockRows.values()).map(mockCopy);
    }),
    getFavoriteById: jest.fn(async (id: string) => {
      mockNeedReady();
      const row = mockRows.get(id);
      return row ? mockCopy(row) : null;
    }),
    addFavorite: jest.fn(async (f: Row) => {
      mockNeedWritable();
      mockRows.set(f.id, mockCopy(f));
    }),
    removeFavorite: jest.fn(async (id: string) => {
      mockNeedWritable();
      mockRows.delete(id);
    }),
    // El INSERT OR REPLACE de `applyRemoteUpsert`, con sus 12 parametros.
    executeSql: jest.fn(async (_sql: string, p: unknown[]) => {
      mockNeedWritable();
      mockRows.set(p[0] as string, {
        id: p[0] as string,
        verseId: p[1] as string,
        book: p[2] as string,
        chapter: p[3] as number,
        verse: p[4] as number,
        text: p[5] as string,
        category: p[6] as string,
        rating: p[7] as number,
        tags: JSON.parse(p[8] as string) as string[],
        note: p[9] as string | null,
        createdAt: p[10] as number,
        updatedAt: p[11] as number,
      });
    }),
  },
}));

// ---- Firestore: lo minimo que usa el motor ----
type MockData = Record<string, unknown>;
/** La escucha viva de cada coleccion. */
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
    onSnapshot: (next: (snapshot: unknown) => void) => {
      mockListeners.set(path, next);
      return () => {
        if (mockListeners.get(path) === next) mockListeners.delete(path);
      };
    },
    get: async () => mockSnapshot([]),
    doc: (id: string) => ({
      set: async () => {},
      get: async () => ({id, exists: false, data: () => undefined}),
      delete: async () => {},
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

/** El motor de la prueba, para el provider. */
let mockEngineCtx: {engine: unknown} | undefined;
jest.mock('../src/context/SyncEngineContext', () => ({
  ...jest.requireActual('../src/context/SyncEngineContext'),
  useSyncEngineOptional: () => mockEngineCtx,
}));

import {
  FavoritesProvider,
  useFavorites,
  type FavoritesContextType,
} from '../src/context/FavoritesContext';
import {setSyncEngine} from '../src/lib/sync';
import {SyncEngine, cursorStorageKey} from '../src/lib/sync/SyncEngine';
import type {SyncAdapter} from '../src/lib/sync/types';
import {logger} from '../src/lib/utils/logger';

jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});

const UID = 'uid-s154-a4';
const HOUR = 60 * 60 * 1000;
const PATH = `users/${UID}/favorites`;

let engine: SyncEngine;
let captured: FavoritesContextType | null = null;
function Capture() {
  captured = useFavorites();
  return <Text>{captured.favorites.length}</Text>;
}

const settle = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setImmediate(resolve));
  }
};

function rowWith(id: string, note: string, updatedAt: number): Row {
  return {
    id,
    verseId: 'Salmos_23_1',
    book: 'Salmos',
    chapter: 23,
    verse: 1,
    text: 'Jehová es mi pastor; nada me faltará.',
    category: 'promise',
    rating: 3,
    tags: [],
    note,
    createdAt: 1000,
    updatedAt,
  };
}

/** El adaptador que el provider registro en el motor. */
const favoritesAdapter = () =>
  (
    engine as unknown as {adapters: Map<string, SyncAdapter<MockData>>}
  ).adapters.get('favorites')!;

const screenNotes = () =>
  (captured?.favorites ?? []).map(f => `${f.id}:${f.note ?? ''}`);

async function mountProvider(): Promise<void> {
  render(
    <FavoritesProvider>
      <Capture />
    </FavoritesProvider>,
  );
  await waitFor(() => expect(captured?.loading).toBe(false));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  captured = null;
  mockReady = true;
  mockWriteFails = false;
  mockRows.clear();
  mockListeners.clear();
  engine = new SyncEngine();
  mockEngineCtx = {engine};
  setSyncEngine(engine);
});

afterEach(() => {
  engine.stop();
  cleanup();
  setSyncEngine(null);
  mockEngineCtx = undefined;
});

describe('R9-128 — favoritos: un apply remoto que falla no se cuenta como aplicado', () => {
  it('applyRemoteUpsert: si la escritura en SQLite falla, rechaza y la pantalla no cambia', async () => {
    mockRows.set('fav-1', rowWith('fav-1', 'lo mio', 1000));
    await mountProvider();
    expect(favoritesAdapter()).toBeDefined();

    mockWriteFails = true;
    let outcome = 'resolvio';
    await act(async () => {
      await favoritesAdapter()
        .applyRemoteUpsert('fav-1', rowWith('fav-1', 'lo suyo', 2000))
        .catch((e: Error) => {
          outcome = `rechazo: ${e.message}`;
        });
      await settle();
    });

    expect({
      outcome,
      fila: mockRows.get('fav-1')?.note,
      pantalla: screenNotes(),
    }).toEqual({
      outcome: 'rechazo: database or disk is full',
      fila: 'lo mio',
      pantalla: ['fav-1:lo mio'],
    });
  });

  it('applyRemoteDelete: si el borrado en SQLite falla, rechaza y el favorito sigue en la pantalla', async () => {
    mockRows.set('fav-1', rowWith('fav-1', 'lo mio', 1000));
    await mountProvider();
    // CONTROL: la carga lo puso en la pantalla.
    expect(screenNotes()).toEqual(['fav-1:lo mio']);

    mockWriteFails = true;
    let outcome = 'resolvio';
    await act(async () => {
      await favoritesAdapter()
        .applyRemoteDelete('fav-1')
        .catch((e: Error) => {
          outcome = `rechazo: ${e.message}`;
        });
      await settle();
    });

    // La fila sigue en SQLite: la pantalla tiene que seguir diciendolo.
    expect({
      outcome,
      fila: mockRows.has('fav-1'),
      pantalla: screenNotes(),
    }).toEqual({
      outcome: 'rechazo: database or disk is full',
      fila: true,
      pantalla: ['fav-1:lo mio'],
    });
  });

  it('applyRemoteDelete antes de abrir la base: espera a initialize() y borra', async () => {
    mockRows.set('fav-1', rowWith('fav-1', 'lo mio', 1000));
    await mountProvider();

    // El motor llama a applyRemoteDelete sin getLocal para un doc borrado de
    // verdad: nada abrio la base antes.
    mockReady = false;
    let outcome = 'resolvio';
    await act(async () => {
      await favoritesAdapter()
        .applyRemoteDelete('fav-1')
        .catch((e: Error) => {
          outcome = `rechazo: ${e.message}`;
        });
      await settle();
    });

    expect({
      outcome,
      fila: mockRows.has('fav-1'),
      pantalla: screenNotes(),
    }).toEqual({outcome: 'resolvio', fila: false, pantalla: []});
  });

  it('con el motor real: la copia remota que no se pudo escribir no mueve el cursor', async () => {
    const T0 = Date.now() - 2 * HOUR;
    const T = Date.now() - HOUR;
    mockRows.set('fav-1', rowWith('fav-1', 'lo mio', T0 - 60_000));
    await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('favorites', UID), String(T0));
    await mountProvider();
    await act(async () => {
      await engine.start(UID);
      await settle();
    });
    // CONTROL: el cursor arranca en T0.
    expect(engine.__getCursorForTests('favorites')).toBe(T0);

    // El otro telefono edita (T, mas nueva que la fila: LWW la aplica), y la
    // escritura en SQLite falla.
    mockWriteFails = true;
    const R = rowWith('fav-1', 'lo suyo', T);
    await act(async () => {
      mockListeners.get(PATH)!(mockSnapshot([{id: 'fav-1', data: R}]));
      await settle();
    });

    expect({
      cursor: engine.__getCursorForTests('favorites'),
      cursorEnDisco: await AsyncStorage.getItem(
        cursorStorageKey('favorites', UID),
      ),
      fila: mockRows.get('fav-1')?.note,
      pantalla: screenNotes(),
    }).toEqual({
      cursor: T0,
      cursorEnDisco: String(T0),
      fila: 'lo mio',
      pantalla: ['fav-1:lo mio'],
    });
  });
});
