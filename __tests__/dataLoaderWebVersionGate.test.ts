/**
 * Version-gate coverage for data-loader.web.ts's initializeBibleData (Phase
 * 3, red-letter web port). Before this gate, `packLoadedKey` alone made a
 * pack's AsyncStorage flag permanent — once a browser imported a pack, a
 * server-side content update (e.g. the Phase 1 WEB re-ingest, commit
 * 086882b) never reached it. `initializeBibleData` now also fetches
 * web-bootstrap.json and compares its per-pack sha256 against
 * `packVersionKey`'s stored value, re-importing whenever they differ — and
 * degrades to the original flag-only check if the manifest is unreachable.
 *
 * `../src/lib/database` (bibleDB) and `expo-sqlite` are mocked below via
 * lazy wrapper closures — the same pattern `_layout.test.tsx` documents:
 * `jest.mock(...)` factories run the first time the mocked module is
 * required, which happens while this file's own `import {initializeBibleData}
 * from '../src/lib/database/data-loader.web'` is being hoisted/evaluated —
 * i.e. BEFORE any `const mock... = jest.fn()` below has executed. A direct
 * reference captured at factory-eval time would be `undefined`; a closure
 * that only looks the variable up when actually CALLED is safe.
 *
 * AsyncStorage itself needs no local mock — jest.setup.js already installs
 * the official in-memory `@react-native-async-storage/async-storage/jest/
 * async-storage-mock` for every test, so this file just seeds/reads it
 * directly and resets it with `AsyncStorage.clear()` between cases.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {initializeBibleData} from '../src/lib/database/data-loader.web';
import {packLoadedKey, packVersionKey} from '../src/lib/database/pack-import';

const mockInitialize = jest.fn(async (): Promise<void> => undefined);
const mockInsertVerses = jest.fn(
  async (_verses: unknown): Promise<void> => undefined,
);
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    initialize: () => mockInitialize(),
    insertVerses: (verses: unknown) => mockInsertVerses(verses),
  },
}));

const mockGetAllAsync = jest.fn(async (_sql: unknown) => [
  {
    book_id: 1,
    book_name: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning, God created the heavens and the earth.',
  },
]);
const mockCloseAsync = jest.fn(async (): Promise<void> => undefined);
const mockDeserializeDatabaseAsync = jest.fn(async (_bytes: unknown) => ({
  getAllAsync: (sql: unknown) => mockGetAllAsync(sql),
  closeAsync: () => mockCloseAsync(),
}));
jest.mock('expo-sqlite', () => ({
  deserializeDatabaseAsync: (bytes: unknown) =>
    mockDeserializeDatabaseAsync(bytes),
}));

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

const RVR_SHA = 'sha-rvr-current';
const WEB_SHA = 'sha-web-current';
const WEB_SHA_NEW = 'sha-web-new';

function buildManifest(rvrSha = RVR_SHA, webSha = WEB_SHA) {
  return {
    schema: 1,
    generated: '2026-07-23',
    packs: [
      {
        id: 'RVR1960',
        file: 'rvr1960.sqlite',
        bytes: 0,
        sha256: rvrSha,
        verseCount: 0,
      },
      {id: 'WEB', file: 'web.sqlite', bytes: 0, sha256: webSha, verseCount: 0},
    ],
    redLetter: {
      file: 'web-red-letter.json',
      bytes: 0,
      sha256: 'irrelevant-to-this-file',
      entries: 0,
      spans: 0,
    },
  };
}

const okPackFileResponse: FakeResponse = {
  ok: true,
  status: 200,
  json: async () => ({}),
  arrayBuffer: async () => new ArrayBuffer(8),
};

/** Routes `fetch` by URL: the manifest per `manifestMode`, else a pack file. */
function installFetchMock(
  manifestMode:
    {kind: 'ok'; manifest: unknown} | {kind: 'reject'} | {kind: 'http-error'},
): jest.Mock {
  const mock = jest.fn(async (input: unknown): Promise<FakeResponse> => {
    const url = String(input);
    if (url.endsWith('web-bootstrap.json')) {
      if (manifestMode.kind === 'reject') {
        throw new Error('network down');
      }
      if (manifestMode.kind === 'http-error') {
        return {
          ok: false,
          status: 500,
          json: async () => ({}),
          arrayBuffer: async () => new ArrayBuffer(0),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => manifestMode.manifest,
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    }
    // Any other URL is a pack-file fetch (rvr1960.sqlite / web.sqlite).
    return okPackFileResponse;
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('initializeBibleData version gate', () => {
  it('skips the import when the flag is true and the stored hash matches the manifest sha256', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packVersionKey('RVR1960'), RVR_SHA);
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    await AsyncStorage.setItem(packVersionKey('WEB'), WEB_SHA);
    const fetchMock = installFetchMock({kind: 'ok', manifest: buildManifest()});

    await initializeBibleData();

    // Only the manifest itself was fetched — neither pack file was touched.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockInsertVerses).not.toHaveBeenCalled();
  });

  it('re-imports when the stored hash differs from the manifest, even though the flag is true', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packVersionKey('RVR1960'), RVR_SHA);
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    await AsyncStorage.setItem(
      packVersionKey('WEB'),
      'stale-hash-from-before-the-reingest',
    );
    const fetchMock = installFetchMock({
      kind: 'ok',
      manifest: buildManifest(RVR_SHA, WEB_SHA_NEW),
    });

    await initializeBibleData();

    // Manifest + only the WEB pack file (RVR1960 still matched, so skipped).
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockInsertVerses).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBe(WEB_SHA_NEW);
    // The flag importWebPack sets is untouched by the gate logic itself.
    expect(await AsyncStorage.getItem(packLoadedKey('WEB'))).toBe('true');
  });

  it('imports both packs on a fresh browser with nothing stored yet', async () => {
    const fetchMock = installFetchMock({kind: 'ok', manifest: buildManifest()});

    await initializeBibleData();

    expect(fetchMock).toHaveBeenCalledTimes(3); // manifest + 2 pack files
    expect(mockInsertVerses).toHaveBeenCalledTimes(2);
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(RVR_SHA);
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBe(WEB_SHA);
    expect(await AsyncStorage.getItem(packLoadedKey('RVR1960'))).toBe('true');
    expect(await AsyncStorage.getItem(packLoadedKey('WEB'))).toBe('true');
  });

  it('falls back to flag-only behavior when the manifest fetch rejects, without throwing', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true'); // should stay skipped
    // WEB has never been loaded — should still import despite the manifest
    // being unreachable.
    installFetchMock({kind: 'reject'});

    await expect(initializeBibleData()).resolves.toBeUndefined();

    expect(mockInsertVerses).toHaveBeenCalledTimes(1);
    // No manifest was ever readable, so no sha256 was available to store.
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBeNull();
    expect(await AsyncStorage.getItem(packLoadedKey('WEB'))).toBe('true');
  });

  it('falls back to flag-only behavior when the manifest responds non-200, without throwing', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    installFetchMock({kind: 'http-error'});

    await expect(initializeBibleData()).resolves.toBeUndefined();

    // Both flags were already true, and with no manifest there's nothing to
    // compare against — the original flag-only check skips both.
    expect(mockInsertVerses).not.toHaveBeenCalled();
  });
});
