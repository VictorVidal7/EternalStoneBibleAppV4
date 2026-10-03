/**
 * R9-264 — el `pullAllLocal` de `memoryCards` espera a la carga del mazo.
 *
 * `deckRef` vale `{}` hasta que termina la carga de `@memory_deck`, y el bulk
 * push de una carga en frio no encolaba nada y grababa el flag igual: las
 * tarjetas no subian nunca (la forma de R9-214, en favoritos). Con la carga
 * fallida, lanza: el motor anota la coleccion para el reintento (R9-257).
 * Provider real y AsyncStorage real; del SyncEngineContext solo
 * `useSyncEngineOptional`, para capturar el adaptador.
 */

import {Text} from 'react-native';
import {act, cleanup, render} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {SyncAdapter} from '../src/lib/sync/types';

jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  getAllReviewEvents: jest.fn().mockResolvedValue([]),
  addReviewEvent: jest.fn().mockResolvedValue(undefined),
  getReviewEventById: jest.fn().mockResolvedValue(null),
  removeReviewEvent: jest.fn().mockResolvedValue(undefined),
}));

let mockAdapter: SyncAdapter<unknown> | null = null;
const mockEngineCtx = {
  engine: {
    register: (a: SyncAdapter<unknown>) => {
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
} from '../src/context/MemoryDeckContext';

const CARD = {
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
  updatedAt: 1000,
};

let hidratado: boolean | null = null;
function Capture() {
  hidratado = useMemoryDeck().hydrated;
  return <Text>x</Text>;
}

describe('R9-264 — el pullAllLocal de memoryCards espera a la carga del mazo', () => {
  const getItemMock = AsyncStorage.getItem as unknown as jest.Mock;
  let realGet: (k: string) => Promise<string | null>;

  beforeEach(async () => {
    mockAdapter = null;
    hidratado = null;
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      '@memory_deck',
      JSON.stringify({[CARD.verseKey]: CARD}),
    );
    realGet = getItemMock.getMockImplementation()!;
  });

  afterEach(() => {
    getItemMock.mockImplementation(realGet);
    cleanup();
  });

  /** La lectura de `@memory_deck` espera a `puerta`, o falla. */
  const mazoRetenido = (puerta: Promise<void> | 'falla') =>
    getItemMock.mockImplementation((k: string) => {
      if (k !== '@memory_deck') return realGet(k);
      if (puerta === 'falla') return Promise.reject(new Error('disco'));
      const foto = realGet(k);
      return puerta.then(() => foto);
    });

  it('durante la carga en frio devuelve las tarjetas del disco, no un mazo vacio', async () => {
    let abrir: (() => void) | null = null;
    mazoRetenido(new Promise<void>(r => (abrir = r)));
    render(
      <MemoryDeckProvider>
        <Capture />
      </MemoryDeckProvider>,
    );
    const filas = mockAdapter!.pullAllLocal();
    const hidratadoAlPedir = hidratado;
    await act(async () => {
      abrir!();
      await new Promise(r => setTimeout(r, 0));
    });

    // Sin R9-264 devolvia [] en el acto, y el bulk push grababa el flag '2'.
    expect({
      hidratadoAlPedir,
      ids: (await filas).map(f => f.id),
    }).toEqual({
      hidratadoAlPedir: false, // CONTROL: la carga seguia en vuelo
      ids: ['John/3/16'],
    });
  });

  it('con la carga fallida lanza, en vez de decir que no hay tarjetas', async () => {
    mazoRetenido('falla');
    render(
      <MemoryDeckProvider>
        <Capture />
      </MemoryDeckProvider>,
    );
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    // Sin R9-264 devolvia [], y el motor no anotaba la coleccion para el
    // reintento de R9-257.
    expect(hidratado).toBe(true); // CONTROL: la carga termino
    await expect(mockAdapter!.pullAllLocal()).rejects.toThrow(
      'the load did not read the disk',
    );
  });
});
