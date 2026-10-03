/**
 * El motor pide a `adapter.getLocal` la copia local de un favorito. Leia
 * `favoritesRef`, que se copia del estado de React en un efecto, DESPUES del
 * render, mientras que cada escritura llega a la fila de SQLite en el acto.
 * Dos ventanas en las que el ref iba atrasado respecto de la fila:
 *
 * R9-210 — una edicion todavia sin renderizar. keepMine sube «lo local de
 * ahora» (R9-36): tomaba la copia de antes de la edicion, la re-sellaba, la
 * escribia en la fila (C4, R9-204), reemplazaba con ella la edicion en la cola
 * y la subia. La edicion se perdia en la fila, en la cola y en la nube.
 *
 * R9-133 — la carga en frio: el ref vale `[]` hasta que termina, y el motor
 * aplicaba una copia remota MAS VIEJA que la fila como si el favorito no
 * existiera aqui.
 *
 * Y la lectura de la fila espera a `initialize()`: sin eso, en el arranque
 * lanza y el motor salta el doc (R9-46).
 *
 * Lo REAL: el FavoritesProvider (con su adaptador), el SyncEngine y React.
 * Lo sustituido: SQLite (una tabla en memoria, con el UPDATE parcial del real y
 * el INSERT OR REPLACE del adaptador), Firestore (lo minimo que usa el motor:
 * la escucha de una coleccion, `set` con merge y su eco, `get`), NetInfo, y de
 * SyncEngineContext solo `useSyncEngineOptional`, para darle al provider el
 * motor de la prueba sin montar Auth.
 *
 * La ventana de R9-210 se abre con `act`: dentro de su callback React no
 * renderiza, asi que el efecto no copia el ref. Un control lo comprueba
 * (ningun render entre la edicion y keepMine, y la pantalla todavia con la
 * copia anterior). Lo que NO mide: cuanto dura esa ventana en el telefono
 * (alli la cierra el render siguiente, no el final de un `act`), ni la que deja
 * abierta un ref adelantado a mano, que el efecto vuelve a atrasar entre dos
 * renders (para eso esta la segunda prueba: un ref adelantado tampoco la pasa).
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
/** Cuando esta puesta, la carga del provider (`getFavorites`) la espera. */
let mockLoadGate: Promise<void> | null = null;
/** Las cargas de `getFavorites` que ya devolvieron la tabla. */
let mockLoadsDone = 0;
/** Como la base real: leer antes de `initialize()` lanza. */
let mockReady = true;
/** Cuando esta puesta, `initialize()` la espera. */
let mockInitGate: Promise<void> | null = null;
const mockNeedReady = () => {
  if (!mockReady) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
};

jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => {
      if (mockInitGate) await mockInitGate;
      mockReady = true;
    }),
    getFavorites: jest.fn(async () => {
      mockNeedReady();
      if (mockLoadGate) await mockLoadGate;
      mockLoadsDone += 1;
      return Array.from(mockRows.values()).map(mockCopy);
    }),
    getFavoriteById: jest.fn(async (id: string) => {
      mockNeedReady();
      const row = mockRows.get(id);
      return row ? mockCopy(row) : null;
    }),
    addFavorite: jest.fn(async (f: Row) => {
      mockRows.set(f.id, mockCopy(f));
    }),
    // Misma semantica que el UPDATE real: solo toca los campos DEFINIDOS.
    updateFavorite: jest.fn(async (id: string, updates: Partial<Row>) => {
      const row = mockRows.get(id);
      if (!row) return;
      for (const k of [
        'category',
        'rating',
        'tags',
        'note',
        'updatedAt',
      ] as const) {
        if (updates[k] !== undefined) {
          (row as Record<string, unknown>)[k] = updates[k];
        }
      }
    }),
    removeFavorite: jest.fn(async (id: string) => {
      mockRows.delete(id);
    }),
    // El INSERT OR REPLACE de `applyRemoteUpsert`, con sus 12 parametros.
    executeSql: jest.fn(async (_sql: string, p: unknown[]) => {
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
/** La nube: `${coleccion}/${id}` → doc. */
const mockServer = new Map<string, MockData>();
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
      // Como el SDK: la escritura propia llega primero a la escucha (su eco)
      // y el servidor la confirma despues.
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
import {logger} from '../src/lib/utils/logger';

jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});

const UID = 'uid-r9-210';
const HOUR = 60 * 60 * 1000;
const PATH = `users/${UID}/favorites`;

let engine: SyncEngine;
let captured: FavoritesContextType | null = null;
let renders = 0;
function Capture() {
  captured = useFavorites();
  renders += 1;
  return <Text>{captured.favorites.length}</Text>;
}

const settle = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setImmediate(resolve));
  }
};

function rowWith(note: string, updatedAt: number): Row {
  return {
    id: 'fav-1',
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

/** Lo que hay en la cola para `fav-1`: su nota. */
const queuedNotes = () =>
  engine
    .__getQueueForTests()
    .filter(q => q.collection === 'favorites' && q.id === 'fav-1')
    .map(q => (q.data as MockData).note);

beforeEach(async () => {
  await AsyncStorage.clear();
  captured = null;
  renders = 0;
  mockLoadGate = null;
  mockLoadsDone = 0;
  mockReady = true;
  mockInitGate = null;
  mockRows.clear();
  mockServer.clear();
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

describe('favoritos: el motor ve la fila de SQLite aunque React vaya atrasado', () => {
  it('R9-210: keepMine antes de que React renderice una edicion del favorito: sube la edicion', async () => {
    const T = Date.now() - HOUR;
    // Este telefono ya sincronizo hasta T, y tiene L; el otro escribe R 5 s
    // despues: dentro de la ventana de 30 s, con otra nota.
    mockRows.set('fav-1', rowWith('lo mio', T + 60_000));
    await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('favorites', UID), String(T));

    render(
      <FavoritesProvider>
        <Capture />
      </FavoritesProvider>,
    );
    await waitFor(() => expect(captured?.loading).toBe(false));
    await act(async () => {
      await engine.start(UID);
      await settle();
    });
    const R = rowWith('lo suyo', T + 65_000);
    await act(async () => {
      mockServer.set(`${PATH}/fav-1`, R);
      mockListeners.get(PATH)!(mockSnapshot([{id: 'fav-1', data: R}]));
      await settle();
    });
    // CONTROL: el conflicto existe y la fila sigue en L.
    expect({
      conflictos: engine.__getConflictsForTests().map(c => c.docId),
      fila: mockRows.get('fav-1')?.note,
    }).toEqual({conflictos: ['fav-1'], fila: 'lo mio'});

    // Sin red: la edicion y la resolucion esperan en la cola.
    engine.__setOnlineForTests(false);
    let mecanismo: unknown;
    let trasKeepMine: unknown;
    await act(async () => {
      const before = renders;
      await captured!.updateFavorite('fav-1', {note: 'E: mi edicion'});
      const colaTrasEditar = queuedNotes();
      await engine.resolveConflict('favorites__fav-1', 'keepMine');
      // Control del mecanismo: keepMine llego antes de cualquier render de la
      // edicion (la pantalla, y con ella el ref, siguen en L), y la edicion ya
      // estaba en la fila y en la cola. Si algun dia `act` renderizara en un
      // `await`, falla esto y no la asercion de abajo pasando en falso.
      mecanismo = {
        renders: renders - before,
        pantalla: captured!.favorites.find(f => f.id === 'fav-1')?.note,
        colaTrasEditar,
      };
      trasKeepMine = {cola: queuedNotes(), fila: mockRows.get('fav-1')?.note};
    });
    expect(mecanismo).toEqual({
      renders: 0,
      pantalla: 'lo mio',
      colaTrasEditar: ['E: mi edicion'],
    });
    // Pre-fix: {cola: ['lo mio'], fila: 'lo mio'}.
    expect(trasKeepMine).toEqual({
      cola: ['E: mi edicion'],
      fila: 'E: mi edicion',
    });

    // Con red: lo que sube, y como queda todo tras su eco.
    await act(async () => {
      engine.__setOnlineForTests(true);
      await engine.__flushForTests();
      await settle();
    });
    // Pre-fix: la nota de las tres es 'lo mio'.
    expect({
      nube: mockServer.get(`${PATH}/fav-1`)?.note,
      fila: mockRows.get('fav-1')?.note,
      pantalla: captured!.favorites.find(f => f.id === 'fav-1')?.note,
      conflictos: engine.__getConflictsForTests().length,
      cola: queuedNotes(),
    }).toEqual({
      nube: 'E: mi edicion',
      fila: 'E: mi edicion',
      pantalla: 'E: mi edicion',
      conflictos: 0,
      cola: [],
    });
  });

  it('R9-133: en la carga en frio, un remoto mas viejo que la fila no la pisa', async () => {
    // R9-133 — la otra ventana del mismo ref: vale `[]` hasta que termina la
    // primera carga, y el motor tomaba el favorito por ausente y aplicaba la
    // copia remota sin LWW. Un arreglo que solo adelante el ref a donde se
    // escribe la fila pasa la prueba de arriba y cae en esta.
    const T = Date.now() - HOUR;
    let releaseLoad!: () => void;
    mockLoadGate = new Promise<void>(resolve => (releaseLoad = resolve));
    mockRows.set('fav-1', rowWith('lo mio NUEVO', T + 60_000));
    await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('favorites', UID), String(T));

    render(
      <FavoritesProvider>
        <Capture />
      </FavoritesProvider>,
    );
    await act(async () => {
      await engine.start(UID);
      await settle();
    });
    let mecanismo: unknown;
    await act(async () => {
      // Del otro telefono, 30 s MAS VIEJO que la fila.
      const R = rowWith('viejo del otro', T + 30_000);
      mockServer.set(`${PATH}/fav-1`, R);
      mockListeners.get(PATH)?.(mockSnapshot([{id: 'fav-1', data: R}]));
      await settle();
      // Control del mecanismo: el motor termino el lote del remoto (su cursor
      // ya llego a esa copia) con la carga todavia sin devolver la tabla.
      mecanismo = {
        cursor: engine.__getCursorForTests('favorites'),
        cargasTerminadas: mockLoadsDone,
      };
    });
    await act(async () => {
      releaseLoad();
      await settle();
    });
    expect(mecanismo).toEqual({cursor: T + 30_000, cargasTerminadas: 0});
    // Pre-fix: las dos en 'viejo del otro'.
    expect({
      fila: mockRows.get('fav-1')?.note,
      pantalla: captured!.favorites.find(f => f.id === 'fav-1')?.note,
    }).toEqual({fila: 'lo mio NUEVO', pantalla: 'lo mio NUEVO'});
  });

  it('R9-210: con la base sin inicializar, getLocal espera a initialize(): un remoto mas nuevo que llega en el arranque entra al terminar, sin quedar retenido', async () => {
    // Leer la fila antes de `initialize()` lanza; sin esperarlo, el motor
    // salta el doc (R9-46) y lo deja retenido hasta el proximo enganche.
    const T = Date.now() - HOUR;
    let releaseInit!: () => void;
    mockReady = false;
    mockInitGate = new Promise<void>(resolve => (releaseInit = resolve));
    mockRows.set('fav-1', rowWith('lo mio', T + 60_000));
    await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('favorites', UID), String(T));

    render(
      <FavoritesProvider>
        <Capture />
      </FavoritesProvider>,
    );
    await act(async () => {
      await engine.start(UID);
      await settle();
    });
    let mecanismo: unknown;
    await act(async () => {
      // Del otro telefono, 10 min MAS NUEVO que la fila.
      const R = rowWith('nuevo del otro', T + 10 * 60_000);
      mockServer.set(`${PATH}/fav-1`, R);
      mockListeners.get(PATH)?.(mockSnapshot([{id: 'fav-1', data: R}]));
      await settle();
      // Control del mecanismo: el remoto llego con la base sin inicializar.
      mecanismo = {ready: mockReady, fila: mockRows.get('fav-1')?.note};
    });
    await act(async () => {
      releaseInit();
      await settle();
    });
    expect(mecanismo).toEqual({ready: false, fila: 'lo mio'});
    // Pre-fix (sin `initialize()` en getLocal): fila y pantalla en 'lo mio' y
    // la marca de no asentados con fav-1.
    expect({
      fila: mockRows.get('fav-1')?.note,
      pantalla: captured!.favorites.find(f => f.id === 'fav-1')?.note,
      marca: await AsyncStorage.getItem(`@sync_unsettled_favorites:${UID}`),
    }).toEqual({
      fila: 'nuevo del otro',
      pantalla: 'nuevo del otro',
      marca: null,
    });
  });

  it('R9-214: el primer bulk push durante la carga en frio sube los favoritos de la fila', async () => {
    // `pullAllLocal` leia `favoritesRef`, vacio hasta que termina la primera
    // carga: el bulk push no encolaba nada, grababa el flag '2', y esos
    // favoritos no subian nunca por esa via.
    const T = Date.now() - HOUR;
    let releaseInit!: () => void;
    mockReady = false;
    mockInitGate = new Promise<void>(resolve => (releaseInit = resolve));
    mockRows.set('fav-1', rowWith('lo mio', T + 60_000));
    // Sin flag: el primer `start()` de esta cuenta hace el bulk push.

    render(
      <FavoritesProvider>
        <Capture />
      </FavoritesProvider>,
    );
    await act(async () => {
      await engine.start(UID);
      await settle();
    });
    // Control del mecanismo: el bulk push empezo con la carga sin terminar.
    const dentro = {loading: captured?.loading, cargas: mockLoadsDone};
    await act(async () => {
      releaseInit();
      await settle();
    });

    // Pre-fix: fav-1 no sube, y el flag queda en '2'.
    expect({
      dentro,
      nube: mockServer.get(`${PATH}/fav-1`)?.note ?? null,
      flag: await AsyncStorage.getItem(`@sync_first_push_done:${UID}`),
    }).toEqual({
      dentro: {loading: true, cargas: 0},
      nube: 'lo mio',
      flag: '2',
    });
  });
});
