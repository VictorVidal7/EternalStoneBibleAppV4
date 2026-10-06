/**
 * El mazo y su disco: R9-133 (el `getLocal` de `memoryCards`) y R9-277 (lo
 * editado mientras la carga esta en vuelo).
 *
 * Provider real y AsyncStorage real; del SyncEngineContext solo
 * `useSyncEngineOptional`, para capturar el adaptador. `motor` hace lo que hace
 * `applyRemoteChange` con `memoryCards`, que no tiene campos materiales:
 * `getLocal`, LWW si hay copia local, y aplicar.
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

import {
  MemoryDeckProvider,
  useMemoryDeck,
  type MemoryDeckContextValue,
} from '../src/context/MemoryDeckContext';
import {emitBackupRestored} from '../src/lib/backup/restoreSignal';

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

const getItemMock = AsyncStorage.getItem as unknown as jest.Mock;
let realGet: (k: string) => Promise<string | null>;
let lecturas = 0;

/**
 * Las primeras `fallos` lecturas de `@memory_deck` fallan; las demas esperan a
 * `puerta` (con una lista, la lectura n espera a la n-esima). Cada una ve el
 * disco de cuando se pidio.
 */
const mazo = (
  fallos: number,
  puerta?: Promise<void> | Array<Promise<void> | undefined>,
) =>
  getItemMock.mockImplementation((k: string) => {
    if (k !== '@memory_deck') return realGet(k);
    lecturas++;
    if (lecturas <= fallos) return Promise.reject(new Error('disco'));
    const foto = realGet(k);
    const p = Array.isArray(puerta) ? puerta[lecturas - 1] : puerta;
    return p ? p.then(() => foto) : foto;
  });

const MARK = {
  bookName: 'Mark',
  chapter: 1,
  verse: 1,
  text: 'El principio del evangelio',
  version: 'RVR1960',
};
const RESTAURADA = card('Mark/9/9', 3000);

/** Lo que hace `importBackup`: escribe el mazo por detras del provider, y avisa. */
const restaurar = async () => {
  await AsyncStorage.setItem(
    '@memory_deck',
    JSON.stringify({[RESTAURADA.verseKey]: RESTAURADA}),
  );
  await act(async () => {
    emitBackupRestored();
    await new Promise(r => setTimeout(r, 0));
  });
};

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

/** `@memory_deck` en disco: verseKey -> updatedAt. */
const disco = async () => {
  const raw = await realGet('@memory_deck');
  if (raw === null) return null;
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
  lecturas = 0;
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    '@memory_deck',
    JSON.stringify({[JOHN.verseKey]: JOHN, [LUKE.verseKey]: LUKE}),
  );
  realGet = getItemMock.getMockImplementation()!;
});

afterEach(() => {
  getItemMock.mockImplementation(realGet);
  cleanup();
});

describe('R9-133 — el getLocal del mazo no dice «ausente» sin haber leido el disco', () => {
  it('en la carga en frio espera al disco: una copia remota mas vieja no reemplaza la tarjeta', async () => {
    let abrir: () => void = () => undefined;
    mazo(0, new Promise<void>(r => (abrir = r)));
    montar();
    // El motor pide la copia local durante la carga y aplica despues de ella.
    let soltar: () => void = () => undefined;
    const paso = motor(
      'John/3/16',
      card('John/3/16', 500),
      new Promise<void>(r => (soltar = r)),
    );
    await tick();
    const hidratadoAlPedir = ctx!.hydrated;
    await act(async () => {
      abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await act(async () => {
      soltar();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Sin R9-133, getLocal decia null durante la carga, y la copia de 500
    // entraba sin LWW: {local: null, aplicada: true}, y John en 500.
    expect({
      hidratadoAlPedir,
      paso: await paso,
      disco: await disco(),
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
    mazo(0);
    montar();
    await tick();
    let paso: unknown;
    // La copia remota (2000) es mas nueva que la tarjeta (1000) y mas vieja que
    // el repaso, y llega antes del render siguiente.
    await act(async () => {
      ctx!.reviewCard('John/3/16', 'good');
      paso = await motor('John/3/16', card('John/3/16', 2000));
    });
    await tick();
    const john = ctx!.cards.find(c => c.verseKey === 'John/3/16')!;

    // Sin R9-133, getLocal leia la tarjeta de antes (1000), la copia de 2000
    // entraba, y el repaso se perdia en pantalla y en disco (reviewCount 0).
    expect({
      local: (paso as {local: unknown}).local === 1000 ? 'antes' : 'repaso',
      reviewCount: john.reviewCount,
      disco: (await disco())!['John/3/16'] === 2000 ? 'remota' : 'repaso',
    }).toEqual({local: 'repaso', reviewCount: 1, disco: 'repaso'});
  });
});

describe('R9-277 — la carga pone encima lo editado mientras estaba en vuelo', () => {
  it('una tarjeta agregada durante la carga en frio queda, en pantalla y en disco', async () => {
    let abrir: () => void = () => undefined;
    mazo(0, new Promise<void>(r => (abrir = r)));
    montar();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    const hidratadoAlAgregar = ctx!.hydrated;
    await act(async () => {
      abrir();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Sin R9-277, la carga reemplazaba el mazo: Mark no estaba en ninguno.
    expect({
      hidratadoAlAgregar,
      pantalla: pantalla(),
      disco: Object.keys((await disco())!),
    }).toEqual({
      hidratadoAlAgregar: false, // CONTROL: la carga seguia en vuelo
      pantalla: ['John/3/16', 'Luke/2/1', 'Mark/1/1'],
      disco: ['John/3/16', 'Luke/2/1', 'Mark/1/1'],
    });
  });

  it('lo editado antes de la carga no vuelve encima de lo que lee (el respaldo reemplaza el mazo)', async () => {
    mazo(0);
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
      disco: Object.keys((await disco())!),
    }).toEqual({
      pantalla: ['Mark/9/9'],
      disco: ['Mark/9/9'],
    });
  });

  it('con dos cargas en vuelo, lo editado entre la primera y la segunda queda', async () => {
    let abrir1: () => void = () => undefined;
    let abrir2: () => void = () => undefined;
    mazo(0, [
      new Promise<void>(r => (abrir1 = r)),
      new Promise<void>(r => (abrir2 = r)),
    ]);
    montar();
    // El respaldo llega con la carga del montaje todavia en vuelo.
    await restaurar();
    await act(async () => {
      abrir1();
      await new Promise(r => setTimeout(r, 0));
    });
    const trasLaPrimera = pantalla();
    await act(async () => {
      ctx!.addCard(MARK);
      await new Promise(r => setTimeout(r, 0));
    });
    await act(async () => {
      abrir2();
      await new Promise(r => setTimeout(r, 0));
    });
    await tick();

    // Si la primera carga soltara lo editado, la segunda reemplazaba el mazo
    // sin Mark/1/1.
    expect({trasLaPrimera, pantalla: pantalla()}).toEqual({
      trasLaPrimera: ['John/3/16', 'Luke/2/1'], // CONTROL: la primera leyo el mazo de antes
      pantalla: ['Mark/1/1', 'Mark/9/9'],
    });
  });
});
