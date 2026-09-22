/**
 * R9-102 — editar un favorito tiene que encolar su subida SIEMPRE.
 *
 * `updateFavorite` solo llamaba a `queueWrite` si una variable de afuera
 * (`mergedForSync`) quedaba asignada DENTRO del actualizador de
 * `setFavorites`. React ejecuta ese actualizador en el acto solo cuando la
 * fibra no tiene trabajo pendiente (el atajo de «eager state»); si lo tiene, lo
 * corre en el siguiente render, y en la linea de abajo la variable vale
 * `undefined`. La edicion se veia en pantalla y nunca llegaba a la cola:
 * `pendingWrites` en 0, la nube sin el cambio, y la siguiente edicion del mismo
 * favorito desde otro dispositivo lo pisaba por LWW. Afecta tambien a las
 * colecciones, que son etiquetas de favoritos.
 *
 * El provider y el reconciliador son los REALES. Lo que se sustituye es SQLite
 * (una tabla en memoria con la misma semantica de UPDATE parcial) y el motor
 * de sync, instalado con `setSyncEngine` para ver exactamente que se encola.
 *
 * La trampa que cazo la sesion 19: sin trabajo pendiente en la fibra, el
 * actualizador corre en el acto y la prueba pasa con el bug puesto. Por eso
 * cada prueba edita DENTRO de un `act` en el que ya hay un `setFavorites` sin
 * renderizar, y lleva un control que lo comprueba.
 */

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

/** La tabla `favorites`, en memoria. `mock`-prefijada para la factoria. */
const mockRows = new Map<string, Row>();
const mockCopy = (r: Row): Row => ({...r, tags: [...r.tags]});

jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getFavorites: jest.fn(async () =>
      Array.from(mockRows.values()).map(mockCopy),
    ),
    getFavoriteById: jest.fn(async (id: string) => {
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
  },
}));

import {
  FavoritesProvider,
  useFavorites,
  type FavoritesContextType,
} from '../src/context/FavoritesContext';
import {setSyncEngine, type SyncEngine} from '../src/lib/sync';

const queueWrite = jest.fn();
const queueDelete = jest.fn();

let captured: FavoritesContextType | null = null;
let renders = 0;
function Capture() {
  captured = useFavorites();
  renders += 1;
  return <Text>{captured.favorites.length}</Text>;
}

async function mountAndSettle(): Promise<void> {
  render(
    <FavoritesProvider>
      <Capture />
    </FavoritesProvider>,
  );
  await waitFor(() => expect(captured?.loading).toBe(false));
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

/** Lo que se encolo para `id`, en orden. */
function queuedFor(id: string): Array<Record<string, unknown>> {
  return queueWrite.mock.calls
    .filter(([collection, docId]) => collection === 'favorites' && docId === id)
    .map(([, , payload]) => payload as Record<string, unknown>);
}

beforeEach(() => {
  captured = null;
  renders = 0;
  queueWrite.mockReset();
  queueDelete.mockReset();
  mockRows.clear();
  mockRows.set('fav-1', {
    id: 'fav-1',
    verseId: 'Salmos_23_1',
    book: 'Salmos',
    chapter: 23,
    verse: 1,
    text: 'Jehová es mi pastor; nada me faltará.',
    category: 'promise',
    rating: 3,
    tags: [],
    note: 'nota vieja',
    createdAt: 1000,
    updatedAt: 1000,
  });
  setSyncEngine({queueWrite, queueDelete} as unknown as SyncEngine);
});

// El render de una prueba no puede pisar el `captured` de la siguiente.
afterEach(() => {
  cleanup();
  setSyncEngine(null);
});

describe('R9-102 — editar un favorito encola su subida', () => {
  it('con trabajo pendiente en la fibra, la edicion se encola igual', async () => {
    await mountAndSettle();

    await act(async () => {
      const before = renders;
      // El flujo ordinario: la pestaña Favoritos llama a `refreshFavorites` al
      // ganar el foco, y eso deja un `setFavorites` por renderizar.
      await captured!.refreshFavorites();
      // Control del mecanismo: dentro de este `act` no se renderizo nada, asi
      // que la fibra del provider TIENE trabajo pendiente cuando llega la
      // edicion. Si algun dia `act` renderizara en cada `await`, es esto lo
      // que falla, y no la asercion de abajo pasando en falso.
      expect(renders).toBe(before);
      await captured!.updateFavorite('fav-1', {tags: ['Esperanza']});
      expect(renders).toBe(before);
    });

    // Pre-fix: `[]`. La edicion estaba en SQLite y en pantalla, y en ningun
    // otro sitio.
    const queued = queuedFor('fav-1');
    expect(queued).toHaveLength(1);
    // Y lo encolado es la fila ENTERA con la edicion, no solo el campo tocado:
    // `pushOne` escribe con `{merge: true}`, asi que una clave que falte
    // significa «conserva lo del servidor».
    expect(queued[0]).toMatchObject({
      tags: ['Esperanza'],
      note: 'nota vieja',
      rating: 3,
      category: 'promise',
      verseId: 'Salmos_23_1',
    });
    expect(queued[0].updatedAt).toBeGreaterThan(1000);
    // La otra mitad de la afirmacion: la pantalla muestra la edicion.
    expect(captured!.favorites.find(f => f.id === 'fav-1')?.tags).toEqual([
      'Esperanza',
    ]);
  });

  it('añadir y editar antes de que React renderice: la cola lleva la edicion', async () => {
    // El vecino, y es el que desarma un arreglo a medias: calcular la fila a
    // partir del estado de React (o de un ref que lo copia tras cada render)
    // no ve un favorito que se añadio hace un instante, ni la edicion anterior
    // del mismo favorito si todavia no se renderizo.
    await mountAndSettle();

    await act(async () => {
      const before = renders;
      await captured!.addFavorite(
        {
          book: 'Juan',
          chapter: 3,
          verse: 16,
          text: 'Porque de tal manera amó Dios al mundo…',
        },
        'promise',
      );
      const newId = queueWrite.mock.calls[0][1] as string;
      await captured!.updateFavorite(newId, {note: 'para el domingo'});
      await captured!.updateFavorite(newId, {tags: ['Evangelio']});
      // Control: nada se renderizo entre el alta y las dos ediciones.
      expect(renders).toBe(before);
    });

    const newId = queueWrite.mock.calls[0][1] as string;
    const queued = queuedFor(newId);
    // El alta, y una entrada por cada edicion. La cola del motor se queda con
    // la ULTIMA por id, asi que es esa la que tiene que llevar las dos.
    expect(queued).toHaveLength(3);
    expect(queued[2]).toMatchObject({
      note: 'para el domingo',
      tags: ['Evangelio'],
      category: 'promise',
    });
  });

  it('editar un favorito que ya no existe no encola nada', async () => {
    // Control, y no discrimina contra R9-102 a proposito: el arreglo no puede
    // subir un favorito fantasma (borrado en otro dispositivo, o en otra
    // pestaña) que la nube ya tiene como lapida.
    await mountAndSettle();
    await act(async () => {
      await captured!.updateFavorite('no-existe', {tags: ['x']});
    });
    expect(queueWrite).not.toHaveBeenCalled();
  });
});
