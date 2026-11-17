/**
 * R9-117 — FavoritesContext re-reads the table when a backup is restored.
 *
 * An import rewrites the favorites table directly. The provider kept the
 * pre-import copy in memory (the screens showed the old note and rating until
 * a restart, and the deletion tombstone reads that copy). The other providers
 * that cache an imported dataset already listen to subscribeBackupRestored.
 *
 * Lo REAL: FavoritesProvider and the restore signal. Lo sustituido: SQLite (a
 * table in memory), the services and the sync engine (a queue that records).
 */
import {Text} from 'react-native';
import {act, render, waitFor} from '@testing-library/react-native';

type Row = Record<string, unknown> & {id: string};
const mockRows = new Map<string, Row>();
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => {}),
    getFavorites: jest.fn(async () =>
      Array.from(mockRows.values()).map(r => ({...r})),
    ),
    getFavoriteById: jest.fn(async (id: string) =>
      mockRows.get(id) ? {...mockRows.get(id)} : null,
    ),
    updateFavorite: jest.fn(async (id: string, u: Record<string, unknown>) => {
      const r = mockRows.get(id);
      if (!r) return;
      for (const [k, v] of Object.entries(u)) if (v !== undefined) r[k] = v;
    }),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    executeSql: jest.fn(),
  },
}));
jest.mock('../src/context/ServicesContext', () => ({
  useServices: () => ({achievementService: null}),
}));
jest.mock('../src/context/SyncEngineContext', () => ({
  useSyncEngineOptional: () => undefined,
}));
const mockQueued: unknown[] = [];
jest.mock('../src/lib/sync', () => ({
  ...jest.requireActual('../src/lib/sync'),
  getSyncEngine: () => ({
    queueWrite: (_c: string, _id: string, d: unknown) => mockQueued.push(d),
  }),
}));

import {
  FavoritesProvider,
  useFavorites,
  type FavoritesContextType,
} from '../src/context/FavoritesContext';
import {emitBackupRestored} from '../src/lib/backup/restoreSignal';

let captured: FavoritesContextType | null = null;
function Capture() {
  captured = useFavorites();
  return <Text>{captured.favorites.length}</Text>;
}
const row = (note: string, rating: number): Row => ({
  id: 'fav-1',
  verseId: 'Salmos_23_1',
  book: 'Salmos',
  chapter: 23,
  verse: 1,
  text: 'x',
  category: 'promise',
  rating,
  tags: [],
  note,
  createdAt: 1,
  updatedAt: 1,
});

it('R9-117 — after the restore signal the provider holds the restored row', async () => {
  mockRows.set('fav-1', row('nota PRE-import', 2));
  render(
    <FavoritesProvider>
      <Capture />
    </FavoritesProvider>,
  );
  await waitFor(() => expect(captured?.favorites.length).toBe(1));
  mockRows.set('fav-1', row('nota RESTAURADA', 5));
  await act(async () => {
    emitBackupRestored();
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });
  const enMemoria = captured?.favorites[0]?.note;
  await act(async () => {
    await captured?.updateFavorite('fav-1', {category: 'faith' as never});
  });
  const subido = mockQueued[0] as {note?: string; rating?: number} | undefined;
  expect(enMemoria).toBe('nota RESTAURADA');
  expect(captured?.favorites[0]?.rating).toBe(5);
  // CONTROL: the push already came from the row (R9-102), with or without
  // the re-read.
  expect(subido).toMatchObject({note: 'nota RESTAURADA', rating: 5});
});
