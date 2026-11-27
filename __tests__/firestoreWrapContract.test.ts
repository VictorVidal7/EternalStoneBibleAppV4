/**
 * R9-241 — el contrato de `src/lib/sync/firestore.ts` que el motor da por
 * hecho y ningun mock de SyncEngine puede ver (todos sustituyen el modulo
 * entero): dentro de una entrega, `change.doc.data()` devuelve el MISMO objeto
 * cada vez que se lee. El veredicto de la llegada (`ownArrived`,
 * R9-220/R9-222) compara por identidad lo que `noteArrived` vio en el callback
 * con lo que procesa despues el lote, sobre el mismo arreglo de `docChanges()`.
 *
 * En RNFirebase 26.2.0 `DocumentChange.doc` es un getter que construye un
 * `DocumentSnapshot` nuevo en cada lectura, y su constructor vuelve a parsear
 * los datos: dos lecturas de `change.doc` dan dos objetos. Hoy no pasa nada
 * porque `wrapQuerySnapshot` lee `c.doc` una vez por cambio. Aqui el productor
 * es la clase REAL de RNFirebase (`FirestoreDocumentChange`), no un objeto
 * con `get doc()` dentro de un spread (Babel evalua el getter al copiar).
 */

let mockOnNext: ((snapshot: unknown) => void) | null = null;

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: (_db: unknown, path: string) => ({path}),
  doc: (ref: {path: string}, id: string) => ({path: `${ref.path}/${id}`}),
  query: (ref: unknown) => ref,
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  onSnapshot: (
    _query: unknown,
    _options: unknown,
    onNext: (snapshot: unknown) => void,
  ) => {
    mockOnNext = onNext;
    return () => {
      mockOnNext = null;
    };
  },
  getDocs: async () => ({docs: [], size: 0, docChanges: () => []}),
  getDoc: async () => ({exists: false, id: '', data: () => undefined}),
  setDoc: async () => undefined,
  deleteDoc: async () => undefined,
  serverTimestamp: () => 'SERVER_TS',
}));

import path from 'path';
import {
  getFirestore,
  __resetFirestoreCacheForTests,
} from '../src/lib/sync/firestore';
import type {QuerySnapshot} from '../src/lib/sync/firestore';

type RawChange = {doc: {data: () => unknown}};
// El `exports` del paquete no deja importar el archivo por su nombre: por ruta.
const RNFBDocumentChange = jest.requireActual(
  path.join(
    path.dirname(
      require.resolve('@react-native-firebase/firestore/package.json'),
    ),
    'dist/module/FirestoreDocumentChange.js',
  ),
).default as new (
  firestore: unknown,
  nativeData: unknown,
  converter: unknown,
) => RawChange;

/** Un cambio como lo manda el lado nativo: cada valor, `[tipo, valor]`
 *  (8 = string, 7 = double en `utils/typemap`). */
function nativeChange(id: string) {
  return {
    type: 'a',
    doc: {
      path: `users/u/test/${id}`,
      data: {value: [8, 'x'], updatedAt: [7, 123]},
      exists: true,
      metadata: [false, false],
    },
    ni: 0,
    oi: -1,
  };
}

afterEach(() => {
  __resetFirestoreCacheForTests();
  mockOnNext = null;
});

it('R9-241: dentro de una entrega, change.doc.data() es el mismo objeto en dos lecturas', () => {
  const raw = new RNFBDocumentChange({}, nativeChange('doc-1'), null);
  // Control: el productor real da un objeto nuevo en cada lectura de `doc`.
  expect(raw.doc.data()).toEqual({value: 'x', updatedAt: 123});
  expect(raw.doc.data()).not.toBe(raw.doc.data());

  const fn = getFirestore();
  expect(fn).not.toBeNull();
  let delivered: QuerySnapshot | null = null;
  fn!()
    .collection('users/u/test')
    .onSnapshot({includeMetadataChanges: true}, s => {
      delivered = s;
    });
  // Como `QuerySnapshot.docChanges()` de RNFirebase: un arreglo nuevo en cada
  // llamada, con las MISMAS instancias de `DocumentChange`.
  const rawChanges = [raw];
  mockOnNext!({
    docChanges: () => rawChanges.filter(() => true),
    docs: [],
    size: 1,
    metadata: {fromCache: false},
  });

  // Una sola llamada a `docChanges()` por entrega, como el motor.
  const [change] = delivered!.docChanges();
  const first = change.doc.data();
  expect({
    type: change.type,
    id: change.doc.id,
    exists: change.doc.exists,
    data: first,
  }).toEqual({
    type: 'added',
    id: 'doc-1',
    exists: true,
    data: {value: 'x', updatedAt: 123},
  });
  expect(change.doc.data()).toBe(first);
});
