/**
 * Local-first quota feature — the impure memoryStats plumbing.
 *
 * Firestore + the SQLite review-event store are mocked so the seed's
 * fresh-vs-not-fresh branch and the write's skip-on-unchanged guard run
 * pure-in-memory. `mock`-prefixed shared state per babel-plugin-jest-hoist.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';

// ---- firestore mock ----
// Mocks our own sync/firestore.ts wrapper (not the native module
// directly) — that wrapper's whole job is to hide the
// namespaced-vs-modular API difference from every consumer, so tests
// for the consumers only need to know its stable exported shape.
let mockSummaryDoc: Record<string, unknown> | null = null;
const mockDocSet = jest.fn(async () => {});
const mockDocGet = jest.fn(async () => ({
  exists: mockSummaryDoc !== null,
  id: 'summary',
  data: () => mockSummaryDoc ?? undefined,
}));
const mockDoc = {set: mockDocSet, get: mockDocGet, delete: jest.fn()};
const mockCollection = jest.fn(() => ({doc: jest.fn(() => mockDoc)}));
const mockFirestoreFn = jest.fn(() => ({collection: mockCollection}));
jest.mock('../src/lib/sync/firestore', () => ({
  __esModule: true,
  getFirestore: () => mockFirestoreFn,
  serverTimestamp: () => Date.now(),
  __resetFirestoreCacheForTests: () => {},
}));

// ---- review-event store mock ----
const mockGetAllReviewEvents = jest.fn<Promise<ReviewEvent[]>, []>();
const mockClearAllReviewEvents = jest.fn<Promise<void>, []>();
jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  getAllReviewEvents: () => mockGetAllReviewEvents(),
  clearAllReviewEvents: () => mockClearAllReviewEvents(),
  addReviewEvent: jest.fn(),
  getReviewEventById: jest.fn(),
  removeReviewEvent: jest.fn(),
}));

// Imports AFTER the mocks so the lazy firestore require captures the mock.
import {
  getMemoryStatsFloor,
  maybeWriteMemoryStatsSummary,
  seedMemoryStatsFloorIfFresh,
  shouldShowRestoreBanner,
  dismissRestoreBanner,
  clearMemoryStatsFloor,
  __resetMemoryStatsSessionForTests,
} from '../src/lib/memory/memoryStatsSync';
import {setSyncEngine} from '../src/lib/sync';
import {__resetFirestoreCacheForTests} from '../src/lib/sync/firestore';

const FLOOR_KEY = '@memory_stats_floor';
const BANNER_KEY = '@memory_stats_floor_banner_pending';

function mkEvent(reviewedAt: number): ReviewEvent {
  return {
    id: `John/3/16__${reviewedAt}`,
    verseKey: 'John/3/16',
    bookName: 'John',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 1,
    reviewedAt,
  };
}

/** Minimal SyncEngine stand-in exposing just getActiveUid. */
function fakeEngine(uid: string | null) {
  setSyncEngine({getActiveUid: () => uid} as never);
}

const SAMPLE_SUMMARY = {
  updatedAt: 5,
  longestStreak: 7,
  earliestReviewMs: 1000,
  recentDays: {'86400000': 2},
  retentionBands: {d1: {total: 4, recalled: 3}},
};

beforeEach(async () => {
  await AsyncStorage.clear();
  mockSummaryDoc = null;
  mockDocSet.mockClear();
  mockDocGet.mockClear();
  mockCollection.mockClear();
  mockGetAllReviewEvents.mockReset();
  mockClearAllReviewEvents.mockReset().mockResolvedValue(undefined);
  __resetFirestoreCacheForTests();
  __resetMemoryStatsSessionForTests();
  fakeEngine('u1');
});

afterEach(() => setSyncEngine(null));

describe('seedMemoryStatsFloorIfFresh', () => {
  it('stores the cloud aggregate as the floor on a fresh device', async () => {
    mockGetAllReviewEvents.mockResolvedValue([]); // fresh: no local rows
    mockSummaryDoc = SAMPLE_SUMMARY;
    await seedMemoryStatsFloorIfFresh('u1');
    expect(mockDocGet).toHaveBeenCalledTimes(1);
    const floor = await getMemoryStatsFloor();
    expect(floor?.longestStreak).toBe(7);
    expect(floor?.retentionBands.d1).toEqual({total: 4, recalled: 3});
  });

  it('does nothing (and never reads the cloud) when the device is not fresh', async () => {
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(1000)]);
    mockSummaryDoc = SAMPLE_SUMMARY;
    await seedMemoryStatsFloorIfFresh('u1');
    expect(mockDocGet).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(FLOOR_KEY)).toBeNull();
  });

  it('never refetches once a floor already exists', async () => {
    await AsyncStorage.setItem(FLOOR_KEY, JSON.stringify(SAMPLE_SUMMARY));
    mockGetAllReviewEvents.mockResolvedValue([]);
    await seedMemoryStatsFloorIfFresh('u1');
    expect(mockDocGet).not.toHaveBeenCalled();
    expect(mockGetAllReviewEvents).not.toHaveBeenCalled();
  });

  it('writes no floor when the cloud has no aggregate yet', async () => {
    mockGetAllReviewEvents.mockResolvedValue([]);
    mockSummaryDoc = null; // doc.exists === false
    await seedMemoryStatsFloorIfFresh('u1');
    expect(await AsyncStorage.getItem(FLOOR_KEY)).toBeNull();
  });

  it('marks the restore banner pending alongside a successful seed', async () => {
    mockGetAllReviewEvents.mockResolvedValue([]);
    mockSummaryDoc = SAMPLE_SUMMARY;
    expect(await shouldShowRestoreBanner()).toBe(false);
    await seedMemoryStatsFloorIfFresh('u1');
    expect(await shouldShowRestoreBanner()).toBe(true);
  });

  it('does not mark the banner pending when nothing was seeded', async () => {
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(1000)]); // not fresh
    mockSummaryDoc = SAMPLE_SUMMARY;
    await seedMemoryStatsFloorIfFresh('u1');
    expect(await shouldShowRestoreBanner()).toBe(false);
  });
});

describe('shouldShowRestoreBanner / dismissRestoreBanner', () => {
  it('flips to false once dismissed, and stays false after', async () => {
    await AsyncStorage.setItem(BANNER_KEY, '1');
    expect(await shouldShowRestoreBanner()).toBe(true);
    await dismissRestoreBanner();
    expect(await shouldShowRestoreBanner()).toBe(false);
    // Dismissing again is a harmless no-op.
    await dismissRestoreBanner();
    expect(await shouldShowRestoreBanner()).toBe(false);
  });
});

describe('clearMemoryStatsFloor', () => {
  it('removes both the floor and the pending-banner flag', async () => {
    await AsyncStorage.setItem(FLOOR_KEY, JSON.stringify(SAMPLE_SUMMARY));
    await AsyncStorage.setItem(BANNER_KEY, '1');
    await clearMemoryStatsFloor();
    expect(await getMemoryStatsFloor()).toBeNull();
    expect(await shouldShowRestoreBanner()).toBe(false);
  });

  it('lets a later sign-in on the same device re-seed a fresh floor', async () => {
    // Account A restores...
    mockGetAllReviewEvents.mockResolvedValue([]);
    mockSummaryDoc = SAMPLE_SUMMARY;
    await seedMemoryStatsFloorIfFresh('u1');
    expect(await getMemoryStatsFloor()).not.toBeNull();

    // ...signs out (the shared-device fix)...
    await clearMemoryStatsFloor();

    // ...and account B signs in with its own, different aggregate — must
    // NOT still see account A's floor.
    const otherSummary = {...SAMPLE_SUMMARY, longestStreak: 30};
    mockSummaryDoc = otherSummary;
    await seedMemoryStatsFloorIfFresh('u2');
    const floor = await getMemoryStatsFloor();
    expect(floor?.longestStreak).toBe(30);
  });

  it('is a harmless no-op when nothing was ever seeded', async () => {
    await expect(clearMemoryStatsFloor()).resolves.toBeUndefined();
    expect(await getMemoryStatsFloor()).toBeNull();
  });
});

describe('maybeWriteMemoryStatsSummary', () => {
  it('writes the aggregate, then skips an unchanged re-write', async () => {
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(1000)]);
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).toHaveBeenCalledTimes(1);
    // Nothing changed → the signature guard skips the second write.
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).toHaveBeenCalledTimes(1);
  });

  it('writes again once the underlying log changes', async () => {
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(1000)]);
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).toHaveBeenCalledTimes(1);
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(1000), mkEvent(2000)]);
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).toHaveBeenCalledTimes(2);
  });

  it('no-ops when there is no signed-in uid', async () => {
    fakeEngine(null);
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(1000)]);
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).not.toHaveBeenCalled();
  });

  it('no-ops when there is nothing to summarize', async () => {
    mockGetAllReviewEvents.mockResolvedValue([]); // empty log, no floor
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).not.toHaveBeenCalled();
  });
});

/**
 * R9-48 — the local `review_events` table is device-level and was never
 * uid-scoped, and nothing clears it on sign-out. On a shared phone that let
 * Ana's history reach Beto's account, and it broke BOTH directions of the
 * memoryStats aggregate.
 */
const OWNER_KEY = '@review_log_owner_uid';

describe('R9-48 — one account’s review log cannot reach another’s cloud doc', () => {
  it('never writes an aggregate built from a log owned by someone else', async () => {
    await AsyncStorage.setItem(OWNER_KEY, 'ana');
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(86400000)]);
    fakeEngine('beto');

    await maybeWriteMemoryStatsSummary();

    // The write is `.set()` — a TOTAL overwrite of the one doc anchoring
    // Beto's memory stats in the cloud. Pre-fix it replaced his real history
    // with Ana's.
    expect(mockDocSet).not.toHaveBeenCalled();
  });

  it('claims an unclaimed log for the account that writes first', async () => {
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(86400000)]);
    fakeEngine('ana');

    await maybeWriteMemoryStatsSummary();

    expect(mockDocSet).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(OWNER_KEY)).toBe('ana');
  });

  it('still writes normally for the account that already owns the log', async () => {
    await AsyncStorage.setItem(OWNER_KEY, 'ana');
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(86400000)]);
    fakeEngine('ana');

    await maybeWriteMemoryStatsSummary();

    expect(mockDocSet).toHaveBeenCalledTimes(1);
  });

  it('hands the log over at sign-in, so the new account is not locked out', async () => {
    await AsyncStorage.setItem(OWNER_KEY, 'ana');
    // Ana's leftovers. Pre-fix these made Beto look like a returning heavy
    // user, so his own cloud floor was never restored. The fake store honors
    // the clear, like the real one does.
    let rows = [mkEvent(86400000)];
    mockGetAllReviewEvents.mockImplementation(async () => rows);
    mockClearAllReviewEvents.mockImplementation(async () => {
      rows = [];
    });
    mockSummaryDoc = SAMPLE_SUMMARY;

    await seedMemoryStatsFloorIfFresh('beto');

    expect(mockClearAllReviewEvents).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(OWNER_KEY)).toBe('beto');
    // …and with the log handed over, Beto's own floor is restored.
    const floor = await getMemoryStatsFloor();
    expect(floor?.longestStreak).toBe(7);
  });

  it('keeps ownership with the previous account if the clear fails', async () => {
    await AsyncStorage.setItem(OWNER_KEY, 'ana');
    mockClearAllReviewEvents.mockRejectedValue(new Error('SQLite busy'));
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(86400000)]);
    mockSummaryDoc = SAMPLE_SUMMARY;

    await seedMemoryStatsFloorIfFresh('beto');

    // Claiming a log we failed to clear would hand Beto Ana's history.
    expect(await AsyncStorage.getItem(OWNER_KEY)).toBe('ana');
    // And the write-side guard still protects Beto's doc.
    fakeEngine('beto');
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).not.toHaveBeenCalled();
  });

  it('does not touch the log when the same account signs in again', async () => {
    await AsyncStorage.setItem(OWNER_KEY, 'ana');
    mockGetAllReviewEvents.mockResolvedValue([mkEvent(86400000)]);

    await seedMemoryStatsFloorIfFresh('ana');

    expect(mockClearAllReviewEvents).not.toHaveBeenCalled();
  });
});
