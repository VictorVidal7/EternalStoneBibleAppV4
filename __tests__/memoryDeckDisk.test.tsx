/**
 * El mazo y su disco: R9-133 (el `getLocal` de `memoryCards`), R9-277 (lo
 * editado mientras la carga esta en vuelo), R9-267 (la lectura fallida) y
 * R9-283 (cada escritor, la salida, y el orden de AsyncStorage).
 *
 * Provider real y AsyncStorage real; del SyncEngineContext solo
 * `useSyncEngineOptional`, para capturar el adaptador. `motor` hace lo que hace
 * `applyRemoteChange` con `memoryCards`, que no tiene campos materiales:
 * `getLocal`, LWW si hay copia local, y aplicar.
 *
 * R9-283 — `@memory_deck` pasa por un modelo del ejecutor serie de AsyncStorage
 * en Android (`SerialExecutor`): cada operacion corre cuando termino la
 * anterior, en el orden en que se pidio, y su respuesta llega despues de la de
 * la anterior. Nada pedido despues de una operacion pendiente corre ni llega
 * antes que ella. Una puerta demora cuando CORRE una operacion, y lo pedido
 * detras espera con ella.
 */

import {Text} from 'react-native';
import {act, cleanup, render} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {SyncAdapter} from '../src/lib/sync/types';
import type {MemoryCard} from '../src/lib/memory/srs';

jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  getAllReviewEvents: jest.fn().mockResolvedValue([]),
  addReviewEvent: jest.fn().mockResolvedValue(undefined),
  getReviewEventById: jest.fn().mockResolvedValue(null),
  removeReviewEvent: jest.fn().mockResolvedValue(undefined),
}));

let mockAdapter: SyncAdapter<MemoryCard> | null = null;
const mockEngineCtx = {
  engine: {
    register: (a: SyncAdapter<MemoryCard>) => {
      mockAdapter = a;
    },
    unregister: () => undefined,
  },
};
jest.mock('../src/context/SyncEngineContext', () => ({
  ...jest.requireActual('../src/context/SyncEngineContext'),
  useSyncEngineOptional: () => mockEngineCtx,
}));
/** La cola del motor: `W <id> r<reviewCount>` y `D <id>`. */
let mockCola: string[] = [];
jest.mock('../src/lib/sync', () => ({
  ...jest.requireActual('../src/lib/sync'),
  getSyncEngine: () => ({
    queueWrite: (_: string, id: string, d: {reviewCount: number}) =>
      mockCola.push(`W ${id} r${d.reviewCount}`),
    queueDelete: (_: string, id: string) => mockCola.push(`D ${id}`),
  }),
}));

import {
  MemoryDeckProvider,
  useMemoryDeck,
  type MemoryDeckContextValue,
} from '../src/context/MemoryDeckContext';
import {
  emitBackupRestored,
  emitBackupRestoring,
} from '../src/lib/backup/restoreSignal';

const card = (verseKey: string, updatedAt: number): MemoryCard => ({
  verseKey,
  bookName: verseKey.split('/')[0],
  chapter: 1,
  verse: 1,
  text: 'texto ' + verseKey,
  version: 'RVR1960',
  box: 1,
  dueAt: '2026-10-01T00:00:00.000Z',
  addedAt: '2026-09-01T00:00:00.000Z',
  lastReviewedAt: null,
  reviewCount: 0,
  lapseCount: 0,
  ease: 2.5,
  updatedAt,
});
const JOHN = card('John/3/16', 1000);
const LUKE = card('Luke/2/1', 1000);

let ctx: MemoryDeckContextValue | null = null;
function Capture() {
  ctx = useMemoryDeck();
  return <Text>x</Text>;
}

const AS = AsyncStorage as unknown as {
  multiGet: jest.Mock;
  multiSet: jest.Mock;
  __INTERNAL_MOCK_STORAGE__: Record<string, string>;
};
const realMultiGet = AS.multiGet.getMockImplementation()!;
const realMultiSet = AS.multiSet.getMockImplementation()!;

let cola: Promise<unknown> = Promise.resolve();
let llegadas: Promise<unknown> = Promise.resolve();
/** Corre `fn` cuando termino lo pedido antes (y, si hay `puerta`, al abrirla). */
const enSerie = <T,>(fn: () => Promise<T>, puerta?: Promise<void>) => {
  const corre = cola.then(async () => {
    await puerta;
    return fn();
  });
  cola = corre.catch(() => undefined);
  const llega = llegadas.then(() => corre);
  llegadas = llega.catch(() => undefined);
  return llega;
};

let lecturas = 0;
let escrituras = 0;
let falla: (n: number) => boolean = () => false;
let puertasLectura: Array<Promise<void> | undefined> = [];
let puertaEscritura: Promise<void> | undefined;

/**
 * La lectura n de `@memory_deck` falla si `fallos` la incluye (un numero: las
 * primeras), y no corre hasta abrir `puertas[n - 1]`.
 */
const mazo = (
  fallos: number | ((n: number) => boolean),
  puertas: Array<Promise<void> | undefined> = [],
) => {
  falla = typeof fallos === 'number' ? n => n <= fallos : fallos;
  puertasLectura = puertas;
};

AS.multiGet.mockImplementation((keys: string[], cb?: unknown) => {
  if (!keys.includes('@memory_deck')) return realMultiGet(keys, cb);
  const n = ++lecturas;
  return enSerie(
    () =>
      falla(n) ? Promise.reject(new Error('disco')) : realMultiGet(keys, cb),
    puertasLectura[n - 1],
  );
});
AS.multiSet.mockImplementation(
  (pares: Array<[string, string]>, cb?: unknown) => {
    if (!pares.some(([k]) => k === '@memory_deck')) {
      return realMultiSet(pares, cb);
    }
    escrituras++;
    const puerta = puertaEscritura;
    puertaEscritura = undefined;
    return enSerie(() => realMultiSet(pares, cb), puerta);
  },
);

const puerta = () => {
  let abrir: () => void = () => undefined;
  const p = new Promise<void>(r => (abrir = r));
  return {p, abrir};
};

const MARK = {
  bookName: 'Mark',
  chapter: 1,
  verse: 1,
  text: 'El principio del evangelio',
  version: 'RVR1960',
};
const HECHOS = {
  bookName: 'Acts',
  chapter: 1,
  verse: 8,
  text: 'Pero recibireis poder',
  version: 'RVR1960',
};
const RESTAURADA = card('Mark/9/9', 3000);

/**
 * Lo que hace `importBackup`: avisa que va a escribir (R9-278; sin `inicio`,
 * la prueba ya avisó), escribe el mazo por detras del provider (con `puerta`,
 * no corre hasta abrirla), y avisa apenas termina.
 */
const escribirRespaldo = (
  p?: Promise<void>,
  restaurado: Record<string, MemoryCard> = {[RESTAURADA.verseKey]: RESTAURADA},
  inicio = true,
) => {
  if (inicio) emitBackupRestoring();
  puertaEscritura = p;
  return AsyncStorage.setItem('@memory_deck', JSON.stringify(restaurado)).then(
    () => emitBackupRestored(),
  );
};
const restaurar = () =>
  act(async () => {
    await escribirRespaldo();
    await new Promise(r => setTimeout(r, 0));
  });

const pantalla = () => ctx!.cards.map(c => c.verseKey).sort();

const montar = () =>
  render(
    <MemoryDeckProvider>
      <Capture />
    </MemoryDeckProvider>,
  );

const tick = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });

/** `@memory_deck` en disco, sin pasar por la cola: verseKey -> updatedAt. */
const disco = () => {
  const raw = AS.__INTERNAL_MOCK_STORAGE__['@memory_deck'];
  if (raw === undefined) return null;
  const m = JSON.parse(raw) as Record<string, MemoryCard>;
  return Object.fromEntries(
    Object.keys(m)
      .sort()
      .map(k => [k, m[k].updatedAt]),
  );
};

/** `applyRemoteChange` para memoryCards; `retener` demora el paso de aplicar. */
const motor = (id: string, remota: MemoryCard, retener?: Promise<void>) =>
  mockAdapter!.getLocal(id).then(
    async l => {
      const local = l ? (l.updatedAt as number) : null;
      if (retener) await retener;
      if (l && remota.updatedAt <= (l.updatedAt as number)) {
        return {local, aplicada: false};
      }
      await mockAdapter!.applyRemoteUpsert(id, remota);
      return {local, aplicada: true};
    },
    (e: Error) => ({local: 'lanza: ' + e.message, aplicada: false}),
  );

beforeEach(async () => {
  ctx = null;
  mockAdapter = null;
  mockCola = [];
  cola = Promise.resolve();
  llegadas = Promise.resolve();
  lecturas = 0;
  escrituras = 0;
  mazo(0);
  puertaEscritura = undefined;
  await AsyncStorage.clear();
  AS.__INTERNAL_MOCK_STORAGE__['@memory_deck'] = JSON.stringify({
    [JOHN.verseKey]: JOHN,
    [LUKE.verseKey]: LUKE,
  });
});

afterEach(() => {
  cleanup();
});

describe('R9-133 — el getLocal del mazo no dice «ausente» sin haber leido el disco', () => {
  it('en la carga en frio espera al disco: una copia remota mas vieja no reemplaza la tarjeta', async () => {
    const carga = puerta();
    mazo(0, [carga.p]);
    montar();
    // El motor pide la copia local durante la carga y aplica despues de ella.
    const retenido = puerta();
    const paso = motor('John/3/16', card('John/3/16', 500), retenido.p);
    await tick();
    const hidratadoAlPedir = ctx!.hydrated;
    await act(async () => {
      carga.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await act(async () => {
      retenido.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Sin R9-133, getLocal decia null durante la carga, y la copia de 500
    // entraba sin LWW: {local: null, aplicada: true}, y John en 500.
    expect({
      hidratadoAlPedir,
      paso: await paso,
      disco: disco(),
    }).toEqual({
      hidratadoAlPedir: false, // CONTROL: la carga seguia en vuelo
      paso: {local: 1000, aplicada: false},
      disco: {'John/3/16': 1000, 'Luke/2/1': 1000},
    });
  });

  it('con la carga fallida lanza, y el motor salta el doc', async () => {
    mazo(1);
    montar();
    await tick();

    // Sin R9-133 decia null: la copia de 500 entraba sin LWW.
    expect({
      hidratado: ctx!.hydrated,
      paso: await motor('John/3/16', card('John/3/16', 500)),
    }).toEqual({
      hidratado: true, // CONTROL: la carga termino
      paso: {
        local: 'lanza: memory deck: the load did not read the disk',
        aplicada: false,
      },
    });
  });

  it('despues de un repaso lee el repaso, no la tarjeta del render anterior', async () => {
    montar();
    await tick();
    let paso: {local: unknown} = {local: null};
    // La copia remota (2000) es mas nueva que la tarjeta (1000) y mas vieja que
    // el repaso, y llega antes del render siguiente.
    await act(async () => {
      ctx!.reviewCard('John/3/16', 'good');
      paso = await motor('John/3/16', card('John/3/16', 2000));
    });
    await tick();
    const john = ctx!.cards.find(c => c.verseKey === 'John/3/16')!;
    const repaso = (v: unknown) =>
      typeof v === 'number' && v > 2000 ? 'repaso' : v;

    // Sin R9-133, getLocal leia la tarjeta de antes (1000), la copia de 2000
    // entraba, y el repaso se perdia en pantalla y en disco (reviewCount 0).
    expect({
      local: repaso(paso.local),
      reviewCount: john.reviewCount,
      disco: repaso(disco()!['John/3/16']),
    }).toEqual({local: 'repaso', reviewCount: 1, disco: 'repaso'});
  });
});

describe('R9-277 — la carga pone encima lo editado mientras estaba en vuelo', () => {
  it('una tarjeta agregada durante la carga en frio queda, en pantalla y en disco', async () => {
    const carga = puerta();
    mazo(0, [carga.p]);
    montar();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    const hidratadoAlAgregar = ctx!.hydrated;
    await act(async () => {
      carga.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Sin R9-277, la carga reemplazaba el mazo: Mark no estaba en ninguno.
    expect({
      hidratadoAlAgregar,
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      hidratadoAlAgregar: false, // CONTROL: la carga seguia en vuelo
      pantalla: ['John/3/16', 'Luke/2/1', 'Mark/1/1'],
      disco: ['John/3/16', 'Luke/2/1', 'Mark/1/1'],
    });
  });

  it('lo editado antes de la carga no vuelve encima de lo que lee (el respaldo reemplaza el mazo)', async () => {
    montar();
    await tick();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    await restaurar();
    await tick();

    // Si lo editado no se soltara al leer, Mark/1/1 volveria sobre lo restaurado.
    expect({
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      pantalla: ['Mark/9/9'],
      disco: ['Mark/9/9'],
    });
  });

  it('con la relectura y la recarga del respaldo en vuelo, lo editado entre las dos queda', async () => {
    const relectura = puerta();
    const recarga = puerta();
    // 1: falla. Mark/1/1 pide la relectura (2); el respaldo avisa y pide su
    // escritura, detras. La relectura lee el mazo de antes; la escritura
    // corre y avisa, y la recarga (3) espera.
    mazo(1, [undefined, relectura.p, recarga.p]);
    montar();
    await tick();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    let avisado = false;
    void escribirRespaldo().then(() => (avisado = true));
    await act(async () => {
      relectura.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    const trasLaRelectura = pantalla();
    const avisadoAntesDeLaRecarga = avisado;
    await act(async () => {
      ctx!.addCard(HECHOS);
      await new Promise(r => setTimeout(r, 0));
    });
    await act(async () => {
      recarga.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Si la relectura soltara lo editado, Mark/1/1 se perdia: la recarga ya
    // estaba pedida cuando corria el efecto, que volvia a retener sin
    // escribirlo (quedaban Acts/1/8 y Mark/9/9).
    expect({
      lecturas,
      trasLaRelectura,
      avisadoAntesDeLaRecarga,
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      lecturas: 3,
      trasLaRelectura: ['John/3/16', 'Luke/2/1', 'Mark/1/1'], // CONTROL: la relectura leyo el mazo de antes
      avisadoAntesDeLaRecarga: true, // CONTROL: la recarga se pidio con la relectura ya llegada
      pantalla: ['Acts/1/8', 'Mark/1/1', 'Mark/9/9'],
      disco: ['Acts/1/8', 'Mark/1/1', 'Mark/9/9'],
    });
  });

  it('con el respaldo ya avisado, lo editado con el mazo sin leer no relee: espera a la recarga', async () => {
    // 1: falla. El respaldo avisa, y su escritura todavia no se pidio (la
    // Mesa tiene el turno, R9-273) cuando se agrega Mark/1/1.
    mazo(1);
    montar();
    await tick();
    await act(async () => {
      emitBackupRestoring();
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    const lecturasAlEscribir = lecturas;
    await act(async () => {
      await escribirRespaldo(undefined, undefined, false);
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // R9-278 — una relectura pedida ahi corria ANTES de la escritura del
    // respaldo, y siendo la carga mas nueva soltaba lo editado: se escribia
    // antes del respaldo, que lo reemplazaba, y la recarga no lo traia.
    expect({
      lecturasAlEscribir,
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      lecturasAlEscribir: 1,
      pantalla: ['Mark/1/1', 'Mark/9/9'],
      disco: ['Mark/1/1', 'Mark/9/9'],
    });
  });
});

describe('R9-278 — el respaldo avisa antes de escribir: lo editado mientras tanto espera a su recarga', () => {
  it('un alta mientras el respaldo escribe queda encima de lo restaurado', async () => {
    montar();
    await tick();
    const escritura = puerta();
    let avisado = false;
    void escribirRespaldo(escritura.p).then(() => (avisado = true));
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    const avisadoAlAgregar = avisado;
    await act(async () => {
      escritura.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Sin el aviso, la escritura del alta (el mazo de antes con Mark/1/1)
    // corria detras de la del respaldo, y la recarga la leia.
    expect({
      avisadoAlAgregar,
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      avisadoAlAgregar: false, // CONTROL: la escritura del respaldo seguia retenida
      pantalla: ['Mark/1/1', 'Mark/9/9'],
      disco: ['Mark/1/1', 'Mark/9/9'],
    });
  });

  it('una copia remota que llega mientras el respaldo escribe se juzga contra lo restaurado', async () => {
    montar();
    await tick();
    const escritura = puerta();
    let avisado = false;
    // El respaldo trae John de 5000; la copia remota (2000) es mas nueva que
    // la local (1000) y mas vieja que la restaurada.
    void escribirRespaldo(escritura.p, {
      [JOHN.verseKey]: card('John/3/16', 5000),
      [RESTAURADA.verseKey]: RESTAURADA,
    }).then(() => (avisado = true));
    const paso = motor('John/3/16', card('John/3/16', 2000));
    await tick();
    const avisadoAlPedir = avisado;
    await act(async () => {
      escritura.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();

    // Sin el aviso, la copia entraba contra la local y su escritura corria
    // detras del respaldo: la recarga leia John de 2000 y Luke. Sin la espera
    // del getLocal, la copia entraba igual y quedaba encima del John de 5000.
    expect({avisadoAlPedir, paso: await paso, disco: disco()}).toEqual({
      avisadoAlPedir: false, // CONTROL: el motor pidio con la escritura retenida
      paso: {local: 5000, aplicada: false},
      disco: {'John/3/16': 5000, 'Mark/9/9': 3000},
    });
  });
});

describe('R9-267 — una lectura fallida del mazo no escribe encima del disco', () => {
  /** Monta con las primeras `fallos` lecturas fallando, y agrega Mark/1/1. */
  const agregarTrasFallar = async (fallos: number) => {
    mazo(fallos);
    montar();
    await tick();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();
  };

  it('con las lecturas fallando siempre y sin edicion, el disco conserva las tarjetas', async () => {
    mazo(99);
    montar();
    await tick();
    await tick();

    // Sin R9-267, el efecto escribia el mazo vacio: el disco quedaba en {}.
    // R9-283 — sin la guarda de `unsaved` vacio, relee sin edicion, se rinde y
    // escribe {} igual.
    expect({
      hidratado: ctx!.hydrated,
      lecturas,
      disco: Object.keys(disco()!),
    }).toEqual({
      hidratado: true, // CONTROL: la carga termino
      lecturas: 1,
      disco: ['John/3/16', 'Luke/2/1'],
    });
  });

  it('lo agregado despues relee el disco y se le une', async () => {
    await agregarTrasFallar(1);

    // Sin R9-267, quedaba solo Mark/1/1 (John y Luke, borrados).
    expect({
      lecturas,
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      lecturas: 2, // CONTROL: la escritura releyo
      pantalla: ['John/3/16', 'Luke/2/1', 'Mark/1/1'],
      disco: ['John/3/16', 'Luke/2/1', 'Mark/1/1'],
    });
  });

  it('si la relectura tambien falla, escribe lo de memoria (la salida de R9-212)', async () => {
    await agregarTrasFallar(99);

    // Una lectura puede fallar siempre: esperando, ninguna edicion llegaria al
    // disco. Se pierden las tarjetas del disco, como antes de R9-267.
    // R9-280 — una sola escritura: la relectura que falla no fuerza otro
    // render, se rinde.
    expect({lecturas, escrituras, disco: Object.keys(disco()!)}).toEqual({
      lecturas: 2, // CONTROL: releyo una vez
      escrituras: 1,
      disco: ['Mark/1/1'],
    });
  });

  it('lo agregado mientras falla la recarga del respaldo llega al disco sin otra edicion', async () => {
    const recarga = puerta();
    // 1 lee; la recarga del aviso (2) no corre hasta abrir, y falla; 3 lee.
    mazo(n => n === 2, [undefined, recarga.p]);
    montar();
    await tick();
    void escribirRespaldo();
    await tick();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    const hidratadoAlAgregar = ctx!.hydrated;
    await act(async () => {
      recarga.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();

    // R9-280 — con `hydrated` ya en true, la recarga que fallaba no
    // renderizaba: Mark/1/1 esperaba a otra edicion, y el disco seguia en
    // Mark/9/9 (2 lecturas).
    expect({
      hidratadoAlAgregar,
      lecturas,
      disco: Object.keys(disco()!),
    }).toEqual({
      hidratadoAlAgregar: true, // CONTROL: una carga ya habia leido
      lecturas: 3,
      disco: ['Mark/1/1', 'Mark/9/9'],
    });
  });

  it('tras rendirse, lo editado despues llega al disco y getLocal responde', async () => {
    await agregarTrasFallar(99);
    await act(async () => {
      ctx!.addCard(HECHOS);
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    const local = await mockAdapter!.getLocal('Acts/1/8').then(
      c => (c ? c.verseKey : null),
      (e: Error) => 'lanza: ' + e.message,
    );

    // R9-283 — si la salida no soltara lo editado, Acts/1/8 esperaba para
    // siempre; si no diera la carga por leida, getLocal lanzaba el resto del
    // proceso.
    expect({lecturas, disco: Object.keys(disco()!), local}).toEqual({
      lecturas: 2, // CONTROL: no volvio a releer
      disco: ['Acts/1/8', 'Mark/1/1'],
      local: 'Acts/1/8',
    });
  });

  it('sin mazo en disco, lo agregado tras una lectura fallida llega al disco', async () => {
    delete AS.__INTERNAL_MOCK_STORAGE__['@memory_deck'];
    await agregarTrasFallar(1);

    // La relectura no adopta nada: sin un render, el efecto no escribia.
    expect({lecturas, disco: disco()}).toEqual({
      lecturas: 2, // CONTROL: la escritura releyo
      disco: {'Mark/1/1': expect.any(Number)},
    });
  });

  it('si falla la recarga del respaldo, lo agregado despues no pisa lo restaurado', async () => {
    // La recarga (la lectura 2) falla; la relectura (la 3) lee.
    mazo(n => n === 2);
    montar();
    await tick();
    await restaurar();
    const trasLaRecarga = pantalla();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();

    // Sin R9-267, el mazo de antes del respaldo se escribia encima:
    // John, Luke y Mark/1/1, y Mark/9/9 perdido.
    expect({trasLaRecarga, disco: Object.keys(disco()!)}).toEqual({
      trasLaRecarga: ['John/3/16', 'Luke/2/1'], // CONTROL: la recarga no leyo
      disco: ['Mark/1/1', 'Mark/9/9'],
    });
  });

  it('si el respaldo escribe mientras relee y la relectura falla, la salida no pisa lo restaurado', async () => {
    const relectura = puerta();
    // 1: falla; 2 (la relectura de Mark/1/1): no corre hasta abrir, y falla;
    // 3 (la recarga del aviso): lee.
    mazo(2, [undefined, relectura.p]);
    montar();
    await tick();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    // El respaldo pide su escritura con la relectura pendiente: corre detras
    // de ella, y avisa al terminar.
    let avisado = false;
    void escribirRespaldo().then(() => (avisado = true));
    await act(async () => {
      relectura.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();

    // R9-281 — el fallo de la relectura llega antes del aviso de fin: sin
    // el de inicio, la salida se rendia y su escritura corria detras de la
    // del respaldo. La recarga leia Mark/1/1 solo.
    expect({
      avisado,
      lecturas,
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      avisado: true, // CONTROL: el respaldo escribio y aviso
      lecturas: 3, // CONTROL: la relectura y la recarga
      pantalla: ['Mark/1/1', 'Mark/9/9'],
      disco: ['Mark/1/1', 'Mark/9/9'],
    });
  });
});

describe('R9-279 — un alta con el mazo sin leer es «agregar si falta»', () => {
  const JOHN_ALTA = {
    bookName: 'John',
    chapter: 3,
    verse: 16,
    text: 'Porque de tal manera amo Dios al mundo',
    version: 'RVR1960',
  };
  const JOHN_REPASADO: MemoryCard = {...JOHN, box: 4, reviewCount: 5};
  const conRepasos = () => {
    AS.__INTERNAL_MOCK_STORAGE__['@memory_deck'] = JSON.stringify({
      [JOHN.verseKey]: JOHN_REPASADO,
      [LUKE.verseKey]: LUKE,
    });
  };
  /** verseKey -> reviewCount, en pantalla y en disco. */
  const repasos = () => {
    const de = (cs: MemoryCard[]) =>
      Object.fromEntries(cs.map(c => [c.verseKey, c.reviewCount]));
    const raw = AS.__INTERNAL_MOCK_STORAGE__['@memory_deck'];
    return {
      pantalla: de(ctx!.cards),
      disco: de(Object.values(JSON.parse(raw) as Record<string, MemoryCard>)),
    };
  };
  /** John con 5 repasos en disco; `editar` corre con la carga en frio retenida. */
  const durante = async (editar: () => void) => {
    conRepasos();
    const carga = puerta();
    mazo(0, [carga.p]);
    montar();
    await act(async () => {
      editar();
      await new Promise(r => setTimeout(r, 0));
    });
    const hidratadoAlEditar = ctx!.hydrated;
    await act(async () => {
      carga.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    return hidratadoAlEditar;
  };
  const igual = (m: Record<string, number>) => ({pantalla: m, disco: m});

  it('en la carga en frio, el versiculo que ya estaba conserva sus repasos, y solo sube el que faltaba', async () => {
    const hidratadoAlEditar = await durante(() => {
      ctx!.addCard(JOHN_ALTA);
      ctx!.addCard(MARK);
    });

    // Sin R9-279, la lectura ponia encima la tarjeta nueva: John con 0
    // repasos en pantalla, en disco y en la cola (W John r0).
    expect({hidratadoAlEditar, ...repasos(), cola: mockCola}).toEqual({
      hidratadoAlEditar: false, // CONTROL: la carga seguia en vuelo
      ...igual({'John/3/16': 5, 'Luke/2/1': 0, 'Mark/1/1': 0}),
      cola: ['W Mark/1/1 r0'],
    });
  });

  it('tras una lectura fallida, la relectura decide igual', async () => {
    conRepasos();
    mazo(1);
    montar();
    await tick();
    await act(async () => {
      ctx!.addCard(JOHN_ALTA);
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();

    expect({lecturas, ...repasos(), cola: mockCola}).toEqual({
      lecturas: 2, // CONTROL: el alta releyo
      ...igual({'John/3/16': 5, 'Luke/2/1': 0}),
      cola: [],
    });
  });

  it('una baja antes de leer retira el alta: sin lapida, y el disco conserva la suya', async () => {
    await durante(() => {
      ctx!.addCard(JOHN_ALTA);
      ctx!.removeCard('John/3/16');
    });

    // Como borrado de verdad, la lectura quitaba el John del disco, y la
    // cola llevaba D John: una lapida para la tarjeta de 5 repasos.
    expect({...repasos(), cola: mockCola}).toEqual({
      ...igual({'John/3/16': 5, 'Luke/2/1': 0}),
      cola: [],
    });
  });

  it('un repaso antes de leer sigue siendo condicional', async () => {
    await durante(() => {
      ctx!.addCard(JOHN_ALTA);
      ctx!.reviewCard('John/3/16', 'good');
    });

    // Como edicion de verdad, John quedaba con 1 repaso, y W John r1.
    expect({...repasos(), cola: mockCola}).toEqual({
      ...igual({'John/3/16': 5, 'Luke/2/1': 0}),
      cola: [],
    });
  });

  it('un borrado remoto de verdad sobre una condicional borra tambien la del disco', async () => {
    await durante(() => {
      ctx!.addCard(JOHN_ALTA);
      void mockAdapter!.applyRemoteDelete('John/3/16');
    });

    // Si la edicion de verdad no le quitara la marca, la lectura se quedaba
    // con el John del disco: el borrado de la nube no llegaba.
    expect({...repasos(), cola: mockCola}).toEqual({
      ...igual({'Luke/2/1': 0}),
      cola: [],
    });
  });

  it('reiniciar antes de leer retira las altas, y lo que no se veia queda', async () => {
    await durante(() => {
      ctx!.addCard(JOHN_ALTA);
      ctx!.addCard(MARK);
      ctx!.resetDeck();
    });

    // Como borrado de verdad, John salia del disco y la cola llevaba D John.
    expect({...repasos(), cola: mockCola}).toEqual({
      ...igual({'John/3/16': 5, 'Luke/2/1': 0}),
      cola: [],
    });
  });

  it('si las lecturas fallan siempre, el alta se escribe pero no sube a la nube', async () => {
    conRepasos();
    mazo(99);
    montar();
    await tick();
    await act(async () => {
      ctx!.addCard(JOHN_ALTA);
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();
    const colaAlRendirse = [...mockCola];
    await act(async () => {
      ctx!.reviewCard('John/3/16', 'good');
      await new Promise(r => setTimeout(r, 0));
    });

    // La salida de R9-267 escribe lo de memoria. Ninguna lectura dijo si John
    // estaba: subirlo pisaria la copia de la nube, la unica con sus repasos.
    // Desde ahi John es del usuario: su primer repaso sube.
    expect({
      lecturas,
      disco: repasos().disco,
      colaAlRendirse,
      cola: mockCola,
    }).toEqual({
      lecturas: 2, // CONTROL: se rindio tras releer
      disco: {'John/3/16': 1},
      colaAlRendirse: [],
      cola: ['W John/3/16 r1'],
    });
  });

  it('un alta tras una baja de verdad no es condicional: la recarga no resucita la de antes', async () => {
    conRepasos();
    const recarga = puerta();
    mazo(0, [undefined, recarga.p]);
    montar();
    await tick();
    // La recarga del respaldo (con John de 9 repasos) queda en vuelo; con el
    // mazo de antes en pantalla, se quita John y se vuelve a agregar.
    void escribirRespaldo(undefined, {
      [JOHN.verseKey]: {...JOHN, box: 5, reviewCount: 9},
    });
    await tick();
    await act(async () => {
      ctx!.removeCard('John/3/16');
      ctx!.addCard(JOHN_ALTA);
      await new Promise(r => setTimeout(r, 0));
    });
    await act(async () => {
      recarga.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // La lapida ya salio: si el alta fuera condicional, la recarga se quedaba
    // con el John restaurado y la nube lo borraba.
    expect({lecturas, ...repasos(), cola: mockCola}).toEqual({
      lecturas: 2, // CONTROL: la recarga
      ...igual({'John/3/16': 0}),
      cola: ['D John/3/16', 'W John/3/16 r0'],
    });
  });

  it('con la relectura y la recarga en vuelo, decide la ultima: gana el John restaurado', async () => {
    const relectura = puerta();
    // 1: falla. El alta de John pide la relectura (2); el respaldo (John con
    // 9 repasos y Mark/9/9) avisa y pide su escritura, detras. La relectura
    // lee el John de 5 repasos sin ser la ultima; la recarga (3), el de 9.
    conRepasos();
    mazo(1, [undefined, relectura.p]);
    montar();
    await tick();
    await act(async () => {
      ctx!.addCard(JOHN_ALTA);
      await new Promise(r => setTimeout(r, 0));
    });
    void escribirRespaldo(undefined, {
      [JOHN.verseKey]: {...JOHN, box: 5, reviewCount: 9},
      [RESTAURADA.verseKey]: RESTAURADA,
    });
    await act(async () => {
      relectura.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Si la relectura (que no es la ultima) soltara la marca, la recarga
    // ponia encima el John nuevo, con 0 repasos.
    expect({lecturas, ...repasos(), cola: mockCola}).toEqual({
      lecturas: 3, // CONTROL: la relectura y la recarga
      ...igual({'John/3/16': 9, 'Mark/9/9': 0}),
      cola: [],
    });
  });
});

describe('R9-282 — un borrado remoto de verdad con el mazo sin leer se anota', () => {
  it('durante la carga en frio, la lectura lo aplica', async () => {
    const carga = puerta();
    mazo(0, [carga.p]);
    montar();
    await act(async () => {
      await mockAdapter!.applyRemoteDelete('John/3/16');
      await new Promise(r => setTimeout(r, 0));
    });
    const hidratadoAlBorrar = ctx!.hydrated;
    await act(async () => {
      carga.abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Sin R9-282, el ref vacio decia «no esta», no se anotaba nada, y la
    // lectura traia a John de vuelta (el motor ya lo dio por asentado).
    expect({
      hidratadoAlBorrar,
      pantalla: pantalla(),
      disco: Object.keys(disco()!),
    }).toEqual({
      hidratadoAlBorrar: false, // CONTROL: la carga seguia en vuelo
      pantalla: ['Luke/2/1'],
      disco: ['Luke/2/1'],
    });
  });

  it('tras una lectura fallida, el borrado relee y se aplica', async () => {
    mazo(1);
    montar();
    await tick();
    await act(async () => {
      await mockAdapter!.applyRemoteDelete('John/3/16');
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    await tick();

    // Sin R9-282, ni se anotaba ni releia: John seguia en el disco.
    expect({lecturas, disco: Object.keys(disco()!)}).toEqual({
      lecturas: 2, // CONTROL: el borrado releyo
      disco: ['Luke/2/1'],
    });
  });
});

describe('R9-283 — cada escritor pasa por `edit`: la edicion siguiente no lo deshace', () => {
  it.each([
    [
      'applyRemoteUpsert',
      () =>
        mockAdapter!.applyRemoteUpsert('John/3/16', card('John/3/16', 2000)),
      ['John/3/16', 'Luke/2/1', 'Mark/1/1'],
      2000,
    ],
    [
      'applyRemoteDelete',
      () => mockAdapter!.applyRemoteDelete('John/3/16'),
      ['Luke/2/1', 'Mark/1/1'],
      null,
    ],
    [
      'removeCard',
      () => ctx!.removeCard('John/3/16'),
      ['Luke/2/1', 'Mark/1/1'],
      null,
    ],
    ['resetDeck', () => ctx!.resetDeck(), ['Mark/1/1'], null],
  ])('%s', async (_, escribir, enDisco, john) => {
    montar();
    await tick();
    await act(async () => {
      await escribir();
      await new Promise(r => setTimeout(r, 0));
    });
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();
    const local = await mockAdapter!.getLocal('John/3/16');

    // Una escritura que no pasara por `edit` no llegaba al ref: el alta
    // siguiente partia del mazo de antes y la deshacia en pantalla y en disco
    // (la copia remota volvia a 1000; la tarjeta borrada resucitaba).
    expect({
      disco: Object.keys(disco()!),
      john: disco()!['John/3/16'] ?? null,
      local: local ? local.updatedAt : null,
    }).toEqual({disco: enDisco, john, local: john});
  });
});
