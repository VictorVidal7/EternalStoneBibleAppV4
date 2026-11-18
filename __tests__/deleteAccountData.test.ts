/**
 * R9-25 — `deleteAllCloudData` reads and deletes in bounded pages.
 *
 * Runs the REAL `deleteAllCloudData` over the REAL `getFirestore()` wrapper;
 * only the modular `@react-native-firebase/firestore` exports are faked, with
 * an in-memory mockStore that honors `limit()` and counts what reaches it.
 */

type Doc = {id: string};

const mockStore = new Map<string, string[]>();
let mockGetDocsCalls: {path: string; limit: number | undefined}[] = [];
let mockInFlight = 0;
let mockMaxInFlight = 0;
let mockDeleteCalls = 0;
let mockFailDelete: ((path: string, id: string) => boolean) | null = null;

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: (_db: unknown, path: string) => ({path}),
  doc: (ref: {path: string}, id: string) => ({path: ref.path, id}),
  query: (ref: {path: string; limit?: number}, c: {limit?: number}) => ({
    ...ref,
    ...(c && typeof c.limit === 'number' ? {limit: c.limit} : {}),
  }),
  where: () => ({}),
  orderBy: () => ({}),
  limit: (n: number) => ({limit: n}),
  onSnapshot: () => () => undefined,
  getDocs: async (q: {path: string; limit?: number}) => {
    mockGetDocsCalls.push({path: q.path, limit: q.limit});
    const ids = mockStore.get(q.path) ?? [];
    const page = q.limit === undefined ? ids : ids.slice(0, q.limit);
    const docs: Doc[] = page.map(id => ({id}));
    return {
      docs: docs.map(d => ({id: d.id, exists: true, data: () => ({})})),
      size: docs.length,
      docChanges: () => [],
    };
  },
  getDoc: async () => ({exists: false, id: '', data: () => undefined}),
  setDoc: async () => undefined,
  deleteDoc: async (ref: {path: string; id: string}) => {
    mockDeleteCalls += 1;
    mockInFlight += 1;
    mockMaxInFlight = Math.max(mockMaxInFlight, mockInFlight);
    await Promise.resolve();
    await Promise.resolve();
    mockInFlight -= 1;
    if (mockFailDelete && mockFailDelete(ref.path, ref.id)) {
      throw new Error('resource-exhausted');
    }
    const ids = mockStore.get(ref.path) ?? [];
    mockStore.set(
      ref.path,
      ids.filter(x => x !== ref.id),
    );
  },
  serverTimestamp: () => 0,
}));

jest.mock('@lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  deleteAllCloudData,
  ACCOUNT_DELETION_BATCH_SIZE,
  USER_DATA_COLLECTIONS,
} from '../src/lib/sync/deleteAccountData';

const UID = 'u1';
const path = (c: string) => `users/${UID}/${c}`;
const seed = (c: string, n: number) =>
  mockStore.set(
    path(c),
    Array.from({length: n}, (_, i) => `${c}-${i}`),
  );
const left = () =>
  [...mockStore.values()].reduce((sum, ids) => sum + ids.length, 0);

beforeEach(() => {
  mockStore.clear();
  mockGetDocsCalls = [];
  mockInFlight = 0;
  mockMaxInFlight = 0;
  mockDeleteCalls = 0;
  mockFailDelete = null;
});

describe('R9-25 — deleteAllCloudData in pages', () => {
  const B = ACCOUNT_DELETION_BATCH_SIZE;

  it('never reads a collection without a limit, and never has more than one page in flight', async () => {
    seed('reviewEvents', 7000);
    seed('notes', 3);
    await deleteAllCloudData(UID);
    expect(left()).toBe(0);
    expect(mockGetDocsCalls.every(c => c.limit === B)).toBe(true);
    expect(mockMaxInFlight).toBeLessThanOrEqual(B);
    expect(mockDeleteCalls).toBe(7003);
  });

  it('0 docs: one read per collection, no delete', async () => {
    await deleteAllCloudData(UID);
    expect(mockGetDocsCalls).toHaveLength(USER_DATA_COLLECTIONS.length);
    expect(mockDeleteCalls).toBe(0);
  });

  it('exactly one page: deletes it and reads once more to see it empty', async () => {
    seed('favorites', B);
    await deleteAllCloudData(UID);
    expect(left()).toBe(0);
    expect(
      mockGetDocsCalls.filter(c => c.path === path('favorites')),
    ).toHaveLength(2);
  });

  it('one page plus one: two pages, a short last page ends without an extra read', async () => {
    seed('favorites', B + 1);
    await deleteAllCloudData(UID);
    expect(left()).toBe(0);
    expect(
      mockGetDocsCalls.filter(c => c.path === path('favorites')),
    ).toHaveLength(2);
  });

  it('a failure in page 2 stops the wipe, throws, and leaves the later collections untouched', async () => {
    seed('favorites', B * 3);
    seed('notes', 5);
    let seen = 0;
    mockFailDelete = p => p === path('favorites') && ++seen > B;
    await expect(deleteAllCloudData(UID)).rejects.toThrow(
      'Account data deletion incomplete for: favorites',
    );
    expect(mockStore.get(path('notes'))).toHaveLength(5);
    // Page 2 attempted, page 3 never read.
    expect(mockDeleteCalls).toBe(B * 2);
    expect(
      mockGetDocsCalls.filter(c => c.path === path('favorites')),
    ).toHaveLength(2);
  });

  it('a retry after a failure finishes the job (idempotent)', async () => {
    seed('favorites', B * 3);
    seed('notes', 5);
    let seen = 0;
    mockFailDelete = p => p === path('favorites') && ++seen > B;
    await expect(deleteAllCloudData(UID)).rejects.toThrow();
    mockFailDelete = null;
    await deleteAllCloudData(UID);
    expect(left()).toBe(0);
  });

  it('a doc that keeps coming back after its delete resolved is a failure, not a loop', async () => {
    seed('notes', B);
    // The delete resolves but the doc stays (a stale read).
    mockFailDelete = null;
    const realStore = mockStore;
    const ghost = 'notes-0';
    const origSet = realStore.set.bind(realStore);
    realStore.set = (k: string, v: string[]) =>
      origSet(k, k === path('notes') && !v.includes(ghost) ? [ghost, ...v] : v);
    await expect(deleteAllCloudData(UID)).rejects.toThrow(
      'Account data deletion incomplete for: notes',
    );
    realStore.set = origSet;
  });

  it('a query that throws (missing index, permission) is a failure of that collection', async () => {
    seed('favorites', 1);
    const mod = jest.requireMock('@react-native-firebase/firestore');
    const orig = mod.getDocs;
    mod.getDocs = async () => {
      throw new Error('permission-denied');
    };
    await expect(deleteAllCloudData(UID)).rejects.toThrow(
      'Account data deletion incomplete for: favorites',
    );
    mod.getDocs = orig;
  });
});
